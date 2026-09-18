from __future__ import annotations
from typing import Any
from fastapi import Request, HTTPException
import config
from database import db


async def get_current_user(request: Request) -> dict[str, Any]:
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    if config.APP_MODE == "local":
        profile = db.fetchone("SELECT * FROM profiles LIMIT 1")
        if profile:
            member = db.fetchone("SELECT * FROM organization_members WHERE user_id = %s LIMIT 1", (profile["id"],))
            return {
                "id": profile["id"],
                "email": profile["email"],
                "role": profile.get("role", "recruiter"),
                "organizationId": member["organization_id"] if member else None,
            }

    raise HTTPException(status_code=401, detail="Invalid token")
