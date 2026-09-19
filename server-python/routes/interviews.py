from __future__ import annotations
import json
import secrets
import traceback
from collections import Counter
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Request
from auth import get_current_user
from database import db
from routes.websocket import integrity_log

router = APIRouter(prefix="/api/interviews", tags=["interviews"])


def _generate_token() -> str:
    return secrets.token_hex(32)


@router.get("")
@router.get("/")
async def list_interviews(request: Request):
    try:
        user = await get_current_user(request)
        org_id = user.get("organizationId")
        interviews = db.query_interviews(org_id=org_id)
        return {"interviews": interviews}
    except Exception as e:
        return {"interviews": [], "error": str(e)}


@router.get("/validate-token/{token}")
async def validate_token(token: str):
    interview = db.query_interviews(filters={"invitation_token": token}, single=True)
    if not interview:
        raise HTTPException(status_code=404, detail="Invalid interview link")
    expires = interview.get("invitation_expires_at", "")
    if expires:
        if isinstance(expires, str):
            try:
                exp_dt = datetime.fromisoformat(expires.replace("Z", "+00:00"))
            except ValueError:
                raise HTTPException(status_code=404, detail="Invalid interview link")
        else:
            exp_dt = expires
        if exp_dt < datetime.now(timezone.utc):
            raise HTTPException(status_code=410, detail="This interview link has expired")
    if interview.get("status") == "completed":
        raise HTTPException(status_code=409, detail="This interview has already been completed")
    return {"valid": True, "interview": interview}


@router.post("/practice")
async def create_practice_interview(request: Request):
    """Create a self-service practice interview link.
    Anyone can start a mock interview (5 questions) — no recruiter needed.
    The link works exactly like a real interview link, opening the voice interview directly."""
    try:
        body = {}
        try:
            body = await request.json()
        except Exception:
            pass
        language = body.get("language", "en")
        if language not in ("en", "hi", "mr"):
            language = "en"
        role = (body.get("role") or "General Software Engineer")[:120]

        token = _generate_token()
        expires = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
        row = db.insert("interviews", {
            "candidate_id": None,
            "job_id": None,
            "language": language,
            "type": "practice",
            "organization_id": None,
            "status": "scheduled",
            "invitation_token": token,
            "invitation_expires_at": expires,
            "max_duration_minutes": 15,
            "context": json.dumps({"practice": True, "role": role}),
        })
        return {
            "interviewId": row["id"],
            "invitationToken": token,
            "practiceUrl": f"/interview/{token}",
            "language": language,
            "role": role,
        }
    except HTTPException:
        raise
    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to create practice interview")


@router.post("/join/{token}")
async def join_interview(token: str, request: Request):
    interview = db.fetchone("SELECT id, status, invitation_expires_at, candidate_id FROM interviews WHERE invitation_token = %s", (token,))
    if not interview:
        raise HTTPException(status_code=404, detail="Invalid interview link")
    expires = interview.get("invitation_expires_at", "")
    if expires:
        if isinstance(expires, str):
            try:
                exp_dt = datetime.fromisoformat(expires.replace("Z", "+00:00"))
            except ValueError:
                raise HTTPException(status_code=404, detail="Invalid interview link")
        else:
            exp_dt = expires
        if exp_dt < datetime.now(timezone.utc):
            raise HTTPException(status_code=410, detail="This interview link has expired")
    if interview.get("status") in ("completed", "in_progress"):
        raise HTTPException(status_code=409, detail="Interview already started or completed")
    db.update("interviews", {"status": "in_progress", "started_at": datetime.now(timezone.utc).isoformat()}, "id = %s", (interview["id"],))
    return {"interviewId": interview["id"], "candidateId": interview["candidate_id"]}


@router.get("/{interview_id}")
async def get_interview(interview_id: str):
    interview = db.query_interviews(filters={"id": interview_id}, single=True)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview


@router.post("")
@router.post("/")
async def create_interview(request: Request):
    try:
        user = await get_current_user(request)
        body = await request.json()
        token = _generate_token()
        expires = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        row = db.insert("interviews", {
            "candidate_id": body["candidateId"],
            "job_id": body["jobId"],
            "language": body.get("language", "en"),
            "type": body.get("type", "comprehensive"),
            "max_duration_minutes": body.get("maxDurationMinutes", 60),
            "organization_id": user.get("organizationId"),
            "status": "scheduled",
            "invitation_token": token,
            "invitation_expires_at": expires,
        })
        result = db.query_interviews(filters={"id": row["id"]}, single=True)
        return result or row
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to create interview")


def _verify_invitation(interview_id: str, token: str | None) -> None:
    """Guard for candidate-facing endpoints: the caller must present the invitation token."""
    if not token:
        raise HTTPException(status_code=401, detail="Missing invitation token")
    row = db.fetchone(
        "SELECT id FROM interviews WHERE id = %s AND invitation_token = %s",
        (interview_id, token),
    )
    if not row:
        raise HTTPException(status_code=403, detail="Invalid interview or invitation token")


@router.post("/{interview_id}/answer")
async def submit_answer(interview_id: str, request: Request):
    try:
        body = await request.json()
        _verify_invitation(interview_id, body.get("invitationToken"))
        db.insert("interview_events", {
            "interview_id": interview_id,
            "event_type": "answer",
            "payload": json.dumps({"answer": body.get("answer"), "question": body.get("question"), "skill": body.get("skill")}),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        return {"received": True}
    except HTTPException:
        raise
    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to store answer")


@router.post("/{interview_id}/complete")
async def complete_interview(interview_id: str, request: Request):
    try:
        body = {}
        try:
            body = await request.json()
        except Exception:
            pass
        _verify_invitation(interview_id, body.get("invitationToken"))
        db.update("interviews", {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "evaluation": json.dumps(body.get("evaluation", {})),
        }, "id = %s", (interview_id,))
        return {"status": "completed"}
    except HTTPException:
        raise
    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to complete interview")


@router.get("/{interview_id}/live-status")
async def get_live_status(interview_id: str, request: Request = None):
    """Recruiter-facing: live/recorded status + integrity findings for one interview."""
    try:
        await get_current_user(request)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Authentication required")

    interview = db.fetchone(
        "SELECT id, status, recording_status, integrity_score, started_at, completed_at, evaluation FROM interviews WHERE id = %s",
        (interview_id,),
    )
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    if interview_id in integrity_log:
        counter: Counter = integrity_log[interview_id]
        integrity = {
            "signals": dict(counter),
            "total_weight": counter.total(),
            "score": max(20, 100 - min(80, counter.total() * 4)),
            "live": True,
        }
    else:
        # Interview not currently live — replay signals from stored events
        rows = db.fetchall(
            "SELECT payload FROM interview_events WHERE interview_id = %s AND event_type = 'proctoring'",
            (interview_id,),
        )
        counter = Counter()
        weights = {"low": 1, "medium": 3, "high": 8}
        for r in rows:
            try:
                p = json.loads(r["payload"]) if isinstance(r["payload"], str) else (r["payload"] or {})
                counter[p.get("event", "unknown")] += weights.get(p.get("severity", "low"), 1)
            except Exception:
                pass
        total = counter.total()
        integrity = {
            "signals": dict(counter),
            "total_weight": total,
            "score": max(20, 100 - min(80, total * 4)),
            "live": False,
        }

    return {
        "interview": interview,
        "integrity": integrity,
        "isLive": interview.get("status") == "in_progress",
    }


@router.get("/{interview_id}/events")
async def get_events(interview_id: str, token: str | None = None, request: Request = None):
    # Candidate access (invitation token) or recruiter access (auth)
    if token:
        _verify_invitation(interview_id, token)
    else:
        try:
            await get_current_user(request)
        except HTTPException:
            raise HTTPException(status_code=401, detail="Missing invitation token or auth")
    rows = db.fetchall("SELECT * FROM interview_events WHERE interview_id = %s ORDER BY timestamp ASC", (interview_id,))
    for r in rows:
        if "payload" in r and isinstance(r["payload"], str):
            try:
                r["payload"] = json.loads(r["payload"])
            except Exception:
                r["payload"] = {}
    return {"events": rows}
