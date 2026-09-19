"""WebSocket interview handler — voice-first, with live monitoring + integrity signals.

Message contract (client -> server):
  { type: "join", payload: { interviewId, candidateId?, invitationToken, practice?: bool } }
  { type: "answer", payload: { answer } }
  { type: "audio", payload: { audio: <base64 WAV> } }
  { type: "interrupt" }
  { type: "end" }
  { type: "proctoring", payload: { event, details?, severity? } }

Message contract (server -> client):
  { type: "connection", status: "connected" }
  { type: "welcome" | "question", payload: { text, audio?, skill, difficulty, question_number, total_questions } }
  { type: "transcription", payload: { text, confidence } }
  { type: "feedback", payload: { text } }
  { type: "complete", payload: { text, evaluation } }
  { type: "interrupt", payload: { text } }
  { type: "integrity", payload: { event, details, severity, count, timestamp } }
  { type: "error", payload: { message } }

Live monitor contract:
  A client may connect to /ws/monitor/{interviewId} (recruiter side). Every transcript
  event and integrity signal is broadcast to all monitor sockets for that interview.
"""
from __future__ import annotations

import asyncio
import base64
import json
import traceback
from collections import Counter, defaultdict
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ai.engine import InterviewBrain, InterviewState
from database import db

router = APIRouter()

active_sessions: dict[str, dict] = {}
# interview_id -> set of monitor WebSockets (recruiter live view)
monitor_sockets: dict[str, set] = defaultdict(set)
# interview_id -> aggregated integrity signal counts
integrity_log: dict[str, Counter] = defaultdict(Counter)

SEVERITY_WEIGHTS = {"low": 1, "medium": 3, "high": 8}

WELCOME_AUDIO_MAX_CHARS = 1000


async def _synthesize_voice(text: str, language: str) -> str | None:
    """Synthesize AI speech -> base64 WAV for the client. Returns None on failure/mock."""
    try:
        brain_tts = get_shared_tts()
        if brain_tts is None:
            return None
        audio = await brain_tts.synthesize(text[:WELCOME_AUDIO_MAX_CHARS], language)
        if audio:
            return base64.b64encode(audio).decode()
    except Exception:
        traceback.print_exc()
    return None


_tts_provider = None


def get_shared_tts():
    """Lazy shared TTS provider (None when unavailable/mock)."""
    global _tts_provider
    if _tts_provider is None:
        try:
            from providers import get_tts_provider
            from providers.tts.mock_provider import MockTTSProvider

            provider = get_tts_provider()
            if isinstance(provider, MockTTSProvider):
                _tts_provider = False  # mock — signal "no voice"
            else:
                _tts_provider = provider
        except Exception:
            _tts_provider = False
    return _tts_provider or None


# ---------------------------------------------------------------- helpers

def _fmt_ts() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _broadcast_monitor(interview_id: str, message: dict) -> None:
    """Send an event to every live monitor socket for this interview."""
    sockets = monitor_sockets.get(interview_id)
    if not sockets:
        return
    dead = []
    payload = json.dumps(message)
    for ws in list(sockets):
        try:
            await ws.send_text(payload)
        except Exception:
            dead.append(ws)
    for ws in dead:
        sockets.discard(ws)


async def _emit_integrity(session: dict, event: str, details: str, severity: str) -> dict:
    """Record an integrity signal, broadcast to monitors, return the summary payload."""
    interview_id = session["interview_id"]
    integrity_log[interview_id][event] += SEVERITY_WEIGHTS.get(severity, 1)
    session.setdefault("integrity", []).append(
        {"event": event, "details": details, "severity": severity, "timestamp": _fmt_ts()}
    )
    payload = {
        "event": event,
        "details": details,
        "severity": severity,
        "count": len(session["integrity"]),
        "integrity_score": _integrity_score(interview_id),
        "timestamp": _fmt_ts(),
    }
    await _broadcast_monitor(interview_id, {"type": "integrity", "payload": payload})
    return payload


def _integrity_score(interview_id: str) -> int:
    """0-100 integrity score; 100 = no suspicious signals."""
    penalty = min(80, integrity_log[interview_id].total() * 4)
    return max(20, 100 - penalty)


async def _set_recording_status(interview_id: str, status: str) -> None:
    try:
        db.update("interviews", {"recording_status": status}, "id = %s", (interview_id,))
    except Exception:
        pass


def _store_event(interview_id: str, event_type: str, payload: dict) -> None:
    try:
        db.insert("interview_events", {
            "interview_id": interview_id,
            "event_type": event_type,
            "payload": json.dumps(payload, default=str),
            "timestamp": _fmt_ts(),
        })
    except Exception:
        pass


def _parse_json(val) -> list | dict:
    if isinstance(val, str):
        try:
            return json.loads(val)
        except Exception:
            return []
    return val or []


# ---------------------------------------------------------------- ws: interview

@router.websocket("/ws/interview/{session_id}")
async def interview_ws(websocket: WebSocket, session_id: str):
    await websocket.accept()
    await websocket.send_json({"type": "connection", "status": "connected"})

    session: dict | None = None

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "payload": {"message": "Malformed message"}})
                continue

            msg_type = message.get("type", "")
            payload = message.get("payload", {}) or {}

            # ---------------- join ----------------
            if msg_type == "join":
                interview_id = payload.get("interviewId")
                candidate_id = payload.get("candidateId")
                invitation_token = payload.get("invitationToken", "")
                practice = bool(payload.get("practice"))

                if not practice and not (interview_id and invitation_token):
                    await websocket.send_json({"type": "error", "payload": {"message": "Missing interview id or invitation token"}})
                    continue

                if practice:
                    # Practice mode: no DB record, generic context, 5 questions
                    brain = InterviewBrain(
                        job_context={"title": "Practice Interview", "required_skills": ["Problem Solving", "Communication"]},
                        candidate_context={},
                        language=payload.get("language", "en"),
                        max_questions=5,
                    )
                    result = await brain.start()
                    result["audio"] = await _synthesize_voice(result.get("text", ""), brain.language)
                    session = {
                        "brain": brain,
                        "interview_id": None,
                        "candidate_id": None,
                        "practice": True,
                        "integrity": [],
                    }
                    active_sessions[session_id] = session
                    await websocket.send_json({"type": "welcome", "payload": result})
                    continue

                # Real interview: token-verified
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

                # Practice interviews: self-service test mode (5 questions, role from context)
                max_questions = 10
                practice = False
                ctx = _parse_json(interview.get("context"))
                if isinstance(ctx, dict) and ctx.get("practice"):
                    practice = True
                    max_questions = 5
                    job_context = {
                        "title": ctx.get("role", "Practice Interview"),
                        "required_skills": ["Problem Solving", "Communication", "Technical Fundamentals"],
                        "description": "A practice interview to help the candidate warm up.",
                        "tech_stack": [],
                    }

                brain = InterviewBrain(
                    job_context=job_context,
                    candidate_context=candidate_context,
                    language=interview.get("language", "en"),
                    max_questions=max_questions,
                )
                result = await brain.start()
                result["audio"] = await _synthesize_voice(result.get("text", ""), brain.language)

                session = {
                    "brain": brain,
                    "interview_id": interview_id,
                    "candidate_id": candidate_id,
                    "practice": practice,
                    "integrity": [],
                }
                active_sessions[session_id] = session
                integrity_log[interview_id].clear()
                await _set_recording_status(interview_id, "recording")
                await _broadcast_monitor(interview_id, {
                    "type": "monitor_status",
                    "payload": {"status": "in_progress", "started_at": _fmt_ts()},
                })

                await websocket.send_json({"type": "welcome", "payload": result})
                _store_event(interview_id, "question", {"text": result.get("text"), "skill": result.get("skill")})
                continue

            # All other messages need a session
            if session is None:
                await websocket.send_json({"type": "error", "payload": {"message": "No active session — join first"}})
                continue

            brain = session["brain"]
            interview_id = session["interview_id"]

            # ---------------- answer ----------------
            if msg_type == "answer":
                answer = payload.get("answer", "")
                if interview_id:
                    _store_event(interview_id, "answer", {"answer": answer, "question": brain.current_question})
                    await _broadcast_monitor(interview_id, {
                        "type": "monitor_transcript",
                        "payload": {"role": "candidate", "text": answer, "timestamp": _fmt_ts()},
                    })

                result = await brain.process_answer(answer)

                if result["type"] == "complete":
                    if interview_id:
                        db.update("interviews", {
                            "status": "completed",
                            "completed_at": _fmt_ts(),
                            "evaluation": json.dumps(result.get("evaluation", {})),
                            "recording_status": "recorded",
                            "integrity_score": _integrity_score(interview_id),
                        }, "id = %s", (interview_id,))
                        await _set_recording_status(interview_id, "recorded")
                        await _broadcast_monitor(interview_id, {
                            "type": "monitor_status",
                            "payload": {"status": "completed", "completed_at": _fmt_ts()},
                        })
                    await websocket.send_json({"type": "complete", "payload": result})
                    active_sessions.pop(session_id, None)
                else:
                    if result.get("feedback"):
                        await websocket.send_json({"type": "feedback", "payload": {"text": result["feedback"]}})
                    result["audio"] = await _synthesize_voice(result.get("text", ""), brain.language)
                    await websocket.send_json({"type": "question", "payload": result})
                    if interview_id:
                        _store_event(interview_id, "question", {"text": result.get("text"), "skill": result.get("skill")})
                        await _broadcast_monitor(interview_id, {
                            "type": "monitor_transcript",
                            "payload": {"role": "ai", "text": result.get("text", ""), "timestamp": _fmt_ts()},
                        })
                continue

            # ---------------- audio (voice answer) ----------------
            if msg_type == "audio":
                audio_b64 = payload.get("audio", "")
                if not audio_b64:
                    continue
                brain.set_listening()
                try:
                    audio_data = base64.b64decode(audio_b64)
                    transcription = await brain.transcribe_audio(audio_data)
                    text = transcription.get("text", "")
                    if not text:
                        await websocket.send_json({"type": "error", "payload": {"message": "Could not transcribe audio"}})
                        continue

                    await websocket.send_json({
                        "type": "transcription",
                        "payload": {"text": text, "confidence": transcription.get("confidence", 0)},
                    })

                    # Treat the transcript as the answer (same flow as typed answers)
                    if interview_id:
                        _store_event(interview_id, "answer", {"answer": text, "question": brain.current_question})
                        await _broadcast_monitor(interview_id, {
                            "type": "monitor_transcript",
                            "payload": {"role": "candidate", "text": text, "timestamp": _fmt_ts()},
                        })

                    result = await brain.process_answer(text)
                    if result["type"] == "complete":
                        if interview_id:
                            db.update("interviews", {
                                "status": "completed",
                                "completed_at": _fmt_ts(),
                                "evaluation": json.dumps(result.get("evaluation", {})),
                                "recording_status": "recorded",
                                "integrity_score": _integrity_score(interview_id),
                            }, "id = %s", (interview_id,))
                            await _broadcast_monitor(interview_id, {
                                "type": "monitor_status",
                                "payload": {"status": "completed", "completed_at": _fmt_ts()},
                            })
                        await websocket.send_json({"type": "complete", "payload": result})
                        active_sessions.pop(session_id, None)
                    else:
                        if result.get("feedback"):
                            await websocket.send_json({"type": "feedback", "payload": {"text": result["feedback"]}})
                        result["audio"] = await _synthesize_voice(result.get("text", ""), brain.language)
                        await websocket.send_json({"type": "question", "payload": result})
                        if interview_id:
                            _store_event(interview_id, "question", {"text": result.get("text"), "skill": result.get("skill")})
                            await _broadcast_monitor(interview_id, {
                                "type": "monitor_transcript",
                                "payload": {"role": "ai", "text": result.get("text", ""), "timestamp": _fmt_ts()},
                            })
                except Exception as e:
                    await websocket.send_json({"type": "error", "payload": {"message": f"Audio processing failed: {e}"}})
                continue

            # ---------------- interrupt ----------------
            if msg_type == "interrupt":
                if brain.state == InterviewState.SPEAKING:
                    result = await brain.on_interruption()
                    await websocket.send_json({"type": "interrupt", "payload": result})
                continue

            # ---------------- end ----------------
            if msg_type == "end":
                evaluation = brain._last_evaluation or await brain._generate_evaluation()
                if interview_id:
                    db.update("interviews", {
                        "status": "completed",
                        "completed_at": _fmt_ts(),
                        "evaluation": json.dumps(evaluation),
                        "recording_status": "recorded",
                        "integrity_score": _integrity_score(interview_id),
                    }, "id = %s", (interview_id,))
                    await _broadcast_monitor(interview_id, {
                        "type": "monitor_status",
                        "payload": {"status": "completed", "completed_at": _fmt_ts()},
                    })
                await websocket.send_json({"type": "complete", "payload": {"evaluation": evaluation}})
                active_sessions.pop(session_id, None)
                continue

            # ---------------- proctoring ----------------
            if msg_type == "proctoring":
                event = payload.get("event", "unknown")
                details = payload.get("details", "")
                severity = payload.get("severity", "low")
                if interview_id:
                    _store_event(interview_id, "proctoring", {"event": event, "details": details, "severity": severity})
                await _emit_integrity(session, event, details, severity)
                continue

            await websocket.send_json({"type": "error", "payload": {"message": f"Unknown message type: {msg_type}"}})

    except WebSocketDisconnect:
        active_sessions.pop(session_id, None)
    except Exception as e:
        traceback.print_exc()
        try:
            await websocket.send_json({"type": "error", "payload": {"message": "Internal server error"}})
        except Exception:
            pass
        active_sessions.pop(session_id, None)


# ---------------------------------------------------------------- ws: live monitor

@router.websocket("/ws/monitor/{interview_id}")
async def monitor_ws(websocket: WebSocket, interview_id: str):
    """Recruiter live view: receives transcript + integrity events for a running interview."""
    await websocket.accept()
    monitor_sockets[interview_id].add(websocket)

    # Replay current state so late joiners see progress
    try:
        rows = db.fetchall(
            "SELECT event_type, payload, timestamp FROM interview_events WHERE interview_id = %s ORDER BY timestamp ASC",
            (interview_id,),
        )
        for r in rows:
            try:
                p = json.loads(r["payload"]) if isinstance(r["payload"], str) else (r["payload"] or {})
            except Exception:
                p = {}
            if r["event_type"] == "question":
                await websocket.send_json({"type": "monitor_transcript", "payload": {"role": "ai", "text": p.get("text", ""), "timestamp": r["timestamp"]}})
            elif r["event_type"] == "answer":
                await websocket.send_json({"type": "monitor_transcript", "payload": {"role": "candidate", "text": p.get("answer", ""), "timestamp": r["timestamp"]}})
    except Exception:
        traceback.print_exc()

    try:
        while True:
            # Keep alive; ignore client messages
            await websocket.receive_text()
    except WebSocketDisconnect:
        monitor_sockets[interview_id].discard(websocket)
        if not monitor_sockets[interview_id]:
            monitor_sockets.pop(interview_id, None)
