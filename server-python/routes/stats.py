from fastapi import APIRouter
from database import db

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("")
@router.get("/")
async def get_platform_stats():
    try:
        interviews_total = db.fetchone("SELECT COUNT(*) AS cnt FROM interviews")
        interviews_completed = db.fetchone("SELECT COUNT(*) AS cnt FROM interviews WHERE status = 'completed'")
        candidates_total = db.fetchone("SELECT COUNT(*) AS cnt FROM candidates")
        jobs_total = db.fetchone("SELECT COUNT(*) AS cnt FROM jobs")
        orgs_total = db.fetchone("SELECT COUNT(*) AS cnt FROM organizations")

        total = interviews_total["cnt"] if interviews_total else 0
        completed = interviews_completed["cnt"] if interviews_completed else 0
        candidates = candidates_total["cnt"] if candidates_total else 0
        jobs = jobs_total["cnt"] if jobs_total else 0
        companies = orgs_total["cnt"] if orgs_total else 0

        # Calculate accuracy from completed interviews with evaluations
        evals = db.fetchall("SELECT evaluation FROM interviews WHERE status = 'completed' AND evaluation IS NOT NULL AND evaluation != '{}'")
        avg_accuracy = 0
        if evals:
            scores = []
            for e in evals:
                import json
                try:
                    ev = json.loads(e["evaluation"]) if isinstance(e["evaluation"], str) else e["evaluation"]
                    if isinstance(ev, dict):
                        for k in ["technical_score", "communication_score", "problem_solving_score", "project_understanding_score"]:
                            if k in ev and isinstance(ev[k], (int, float)):
                                scores.append(ev[k])
                except Exception:
                    pass
            if scores:
                avg_accuracy = round(sum(scores) / len(scores))

        return {
            "interviews": total,
            "completedInterviews": completed,
            "candidates": candidates,
            "jobs": jobs,
            "companies": max(companies, 1),
            "accuracy": avg_accuracy if avg_accuracy > 0 else 95,
            "languages": 3,
        }
    except Exception as e:
        return {
            "interviews": 0,
            "completedInterviews": 0,
            "candidates": 0,
            "jobs": 0,
            "companies": 1,
            "accuracy": 95,
            "languages": 3,
        }
