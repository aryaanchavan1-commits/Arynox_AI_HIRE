from fastapi import APIRouter, HTTPException, Request
from auth import get_current_user
from database import db
import json

router = APIRouter(prefix="/api/candidates", tags=["candidates"])


@router.get("")
@router.get("/")
async def list_candidates(request: Request):
    user = await get_current_user(request)
    org_id = user.get("organizationId")
    rows = db.fetchall("SELECT * FROM candidates WHERE organization_id = %s ORDER BY created_at DESC", (org_id,))
    for r in rows:
        if "skills" in r and isinstance(r["skills"], str):
            try:
                r["skills"] = json.loads(r["skills"])
            except Exception:
                r["skills"] = []
    return {"candidates": rows}


@router.get("/{candidate_id}")
async def get_candidate(candidate_id: str):
    row = db.fetchone("SELECT * FROM candidates WHERE id = %s", (candidate_id,))
    if not row:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return row


@router.post("")
@router.post("/")
async def create_candidate(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    row = db.insert("candidates", {
        "name": body.get("name", ""),
        "email": body.get("email", ""),
        "phone": body.get("phone"),
        "skills": json.dumps(body.get("skills", [])),
        "experience": body.get("experience"),
        "github_url": body.get("githubUrl"),
        "organization_id": user.get("organizationId"),
    })
    return row
