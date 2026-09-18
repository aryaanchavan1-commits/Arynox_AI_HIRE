from fastapi import APIRouter, Request
from auth import get_current_user
from database import db

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("")
@router.get("/")
async def list_jobs(request: Request):
    user = await get_current_user(request)
    org_id = user.get("organizationId")
    rows = db.fetchall("SELECT * FROM jobs WHERE organization_id = %s ORDER BY created_at DESC", (org_id,))
    for r in rows:
        for f in ["required_skills", "preferred_skills", "tech_stack"]:
            if f in r and isinstance(r[f], str):
                try:
                    import json
                    r[f] = json.loads(r[f])
                except Exception:
                    r[f] = []
    return {"jobs": rows}


@router.get("/{job_id}")
async def get_job(job_id: str):
    row = db.fetchone("SELECT * FROM jobs WHERE id = %s", (job_id,))
    if not row:
        return {"error": "Job not found"}
    return row
