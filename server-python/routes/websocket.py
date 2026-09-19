"""WebSocket interview handler with interruption support."""
from __future__ import annotations
import json
import traceback
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from database import db
from ai.engine import InterviewBrain, InterviewState

router = APIRouter()
active_sessions: dict[str, dict] = {}


@router.websocket("/ws/interview/{session_id}")
async def interview_ws(websocket: WebSocket, session_id: str):
    await websocket.accept()
    await websocket.send_json({"type": "connection", "status": "connected"})

    brain: InterviewBrain | None = None

    try:
        while True:
            raw = await websocket.receive_text()
            message = json.loads(raw)
            msg_type = message.get("type", "")
            payload = message.get("payload", {})

            if msg_type == "join":
                interview_id = payload.get("interviewId")
                candidate_id = payload.get("candidateId")
                invitation_token = payload.get("invitationToken", "")

                if not invitation_token:
                    await websocket.send_json({"type": "error", "payload": {"message": "Missing invitation token"}})
                    continue

                interview = db.fetchone(
                    """SELECT i.*, j.title AS job_title, j.required_skills AS job_required_skills,
                              j.description AS job_description, j.tech_stack AS job_tech_stack,
                              c.name AS candidate_name, c.email AS candidate_email,
                              c.skills AS candidate_skills, c.experience AS candidate_experience
                       FROM interviews i
                       LEFT JOIN jobs j ON j.id = i.job_id
                       LEFT JOIN candidates c ON c.id = i.candidate_id
                       WHERE i.id = %s AND i.invitation_token = %s""",
                    (interview_id, invitation_token),
                )

                if not interview:
                    await websocket.send_json({"type": "error", "payload": {"message": "Invalid interview or invitation token"}})
                    continue

                # Reject expired links
                expires = interview.get("invitation_expires_at")
                if expires:
                    try:
                        exp_dt = datetime.fromisoformat(str(expires).replace("Z", "+00:00"))
                        if exp_dt < datetime.now(timezone.utc):
                            await websocket.send_json({"type": "error", "payload": {"message": "This interview link has expired"}})
                            continue
                    except ValueError:
                        pass

                job_context = {}
                if interview.get("job_title"):
                    job_context = {
                        "title": interview["job_title"],
                        "required_skills": _parse_json(interview.get("job_required_skills")),
                        "description": interview.get("job_description", ""),
                        "tech_stack": _parse_json(interview.get("job_tech_stack")),
                    }

                candidate_context = {}
                if interview.get("candidate_name"):
                    candidate_context = {
                        "name": interview["candidate_name"],
                        "skills": _parse_json(interview.get("candidate_skills")),
                        "experience": interview.get("candidate_experience", ""),
                    }

                brain = InterviewBrain(
                    job_context=job_context,
                    candidate_context=candidate_context,
                    language=interview.get("language", "en"),
                    max_questions=10,
                )

                # Start interview — get greeting
                result = await brain.start()
                await websocket.send_json({"type": "welcome", "payload": result})

                _store_event(interview_id, "question", result)

                active_sessions[session_id] = {
                    "brain": brain,
                    "interview_id": interview_id,
                    "candidate_id": candidate_id,
                }

            elif msg_type in ("answer", "audio", "interrupt", "end") and not active_sessions.get(session_id):
                # All interaction messages require a verified (joined) session
                await websocket.send_json({"type": "error", "payload": {"message": "No active session"}})
                continue

            elif msg_type == "answer":
                session = active_sessions.get(session_id)
                brain = session["brain"]
                answer = payload.get("answer", "")

                # Store answer event
                _store_event(session["interview_id"], "answer", {
                    "answer": answer,
                    "question": brain.current_question,
                })

                # Process answer and get next question
                result = await brain.process_answer(answer)

                if result["type"] == "complete":
                    # Store completion
                    db.update("interviews", {
                        "status": "completed",
                        "completed_at": datetime.now(timezone.utc).isoformat(),
                        "evaluation": json.dumps(result.get("evaluation", {})),
                    }, "id = %s", (session["interview_id"],))

                    await websocket.send_json({"type": "complete", "payload": result})
                    active_sessions.pop(session_id, None)
                else:
                    await websocket.send_json({"type": "question", "payload": result})
                    _store_event(session["interview_id"], "question", result)

            elif msg_type == "audio":
                # Candidate sent audio — transcribe via STT
                session = active_sessions.get(session_id)
                if not session:
                    continue

                brain = session["brain"]
                brain.set_listening()

                audio_b64 = payload.get("audio", "")
                if audio_b64:
                    import base64
                    audio_data = base64.b64decode(audio_b64)
                    try:
                        transcription = await brain.transcribe_audio(audio_data)
                        text = transcription.get("text", "")
                        if text:
                            # Mock STT returns a placeholder — still treat it as the
                            # candidate's answer so the interview can proceed in mock mode.
                            await websocket.send_json({
                                "type": "transcription",
                                "payload": {"text": text, "confidence": transcription.get("confidence", 0)},
                            })
                            # Auto-process the answer
                            result = await brain.process_answer(text)
                            if result["type"] == "complete":
                                db.update("interviews", {
                                    "status": "completed",
                                    "completed_at": datetime.now(timezone.utc).isoformat(),
                                    "evaluation": json.dumps(result.get("evaluation", {})),
                                }, "id = %s", (session["interview_id"],))
                                await websocket.send_json({"type": "complete", "payload": result})
                                active_sessions.pop(session_id, None)
                            else:
                                await websocket.send_json({"type": "question", "payload": result})
                                _store_event(session["interview_id"], "question", result)
                    except Exception as e:
                        await websocket.send_json({"type": "error", "payload": {"message": f"STT failed: {str(e)}"}})

            elif msg_type == "interrupt":
                session = active_sessions.get(session_id)
                if session and session["brain"].state == InterviewState.SPEAKING:
                    result = await session["brain"].on_interruption()
                    await websocket.send_json({"type": "interrupt", "payload": result})

            elif msg_type == "end":
                session = active_sessions.get(session_id)
                if session:
                    brain = session["brain"]
                    # Reuse the evaluation generated at completion; only generate if missing
                    evaluation = brain._last_evaluation or await brain._generate_evaluation()
                    db.update("interviews", {
                        "status": "completed",
                        "completed_at": datetime.now(timezone.utc).isoformat(),
                        "evaluation": json.dumps(evaluation),
                    }, "id = %s", (session["interview_id"],))
                    await websocket.send_json({"type": "complete", "payload": {"evaluation": evaluation}})
                    active_sessions.pop(session_id, None)

            elif msg_type == "proctoring":
                session = active_sessions.get(session_id)
                if session:
                    _store_event(session["interview_id"], "proctoring", {
                        "event": payload.get("event"),
                        "details": payload.get("details"),
                    })

    except WebSocketDisconnect:
        active_sessions.pop(session_id, None)
    except Exception as e:
        traceback.print_exc()
        try:
            await websocket.send_json({"type": "error", "payload": {"message": str(e)}})
        except Exception:
            pass
        active_sessions.pop(session_id, None)


def _parse_json(val) -> list | dict:
    if isinstance(val, str):
        try:
            return json.loads(val)
        except Exception:
            return []
    return val or []


def _store_event(interview_id: str, event_type: str, payload: dict):
    try:
        db.insert("interview_events", {
            "interview_id": interview_id,
            "event_type": event_type,
            "payload": json.dumps(payload),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
    except Exception:
        pass
