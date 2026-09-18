from __future__ import annotations
import secrets
import json
import traceback
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Request
from auth import get_current_user
from database import db

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
        return {"error": "Invalid interview link"}
    expires = interview.get("invitation_expires_at", "")
    if expires:
        if isinstance(expires, str):
            exp_dt = datetime.fromisoformat(expires.replace("Z", "+00:00"))
        else:
            exp_dt = expires
        if exp_dt < datetime.now(timezone.utc):
            return {"error": "This interview link has expired"}
    if interview.get("status") == "completed":
        return {"error": "This interview has already been completed"}
    return {"valid": True, "interview": interview}


@router.post("/join/{token}")
async def join_interview(token: str, request: Request):
    interview = db.fetchone("SELECT id, status, invitation_expires_at, candidate_id FROM interviews WHERE invitation_token = %s", (token,))
    if not interview:
        return {"error": "Invalid interview link"}
    expires = interview.get("invitation_expires_at", "")
    if expires:
        if isinstance(expires, str):
            exp_dt = datetime.fromisoformat(expires.replace("Z", "+00:00"))
        else:
            exp_dt = expires
        if exp_dt < datetime.now(timezone.utc):
            return {"error": "This interview link has expired"}
    if interview.get("status") in ("completed", "in_progress"):
        return {"error": "Interview already started or completed"}
    db.update("interviews", {"status": "in_progress", "started_at": datetime.now(timezone.utc).isoformat()}, "id = %s", (interview["id"],))
    return {"interviewId": interview["id"], "candidateId": interview["candidate_id"]}


@router.get("/{interview_id}")
async def get_interview(interview_id: str):
    interview = db.query_interviews(filters={"id": interview_id}, single=True)
    if not interview:
        return {"error": "Interview not found"}
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
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


@router.post("/{interview_id}/answer")
async def submit_answer(interview_id: str, request: Request):
    try:
        body = await request.json()
        db.insert("interview_events", {
            "interview_id": interview_id,
            "event_type": "answer",
            "payload": json.dumps({"answer": body.get("answer"), "question": body.get("question"), "skill": body.get("skill")}),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        return {"received": True}
    except Exception as e:
        return {"error": str(e)}


@router.post("/{interview_id}/complete")
async def complete_interview(interview_id: str, request: Request):
    try:
        body = {}
        try:
            body = await request.json()
        except Exception:
            pass
        db.update("interviews", {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "evaluation": json.dumps(body.get("evaluation", {})),
        }, "id = %s", (interview_id,))
        return {"status": "completed"}
    except Exception as e:
        return {"error": str(e)}


@router.get("/{interview_id}/events")
async def get_events(interview_id: str):
    rows = db.fetchall("SELECT * FROM interview_events WHERE interview_id = %s ORDER BY timestamp ASC", (interview_id,))
    for r in rows:
        if "payload" in r and isinstance(r["payload"], str):
            try:
                r["payload"] = json.loads(r["payload"])
            except Exception:
                r["payload"] = {}
    return {"events": rows}
