from __future__ import annotations
from typing import Any
from fastapi import Request, HTTPException
import config
from database import db


def _decode_jwt(token: str) -> dict[str, Any]:
    """Decode and verify a JWT using PyJWT. Raises HTTPException on failure."""
    try:
        import jwt  # PyJWT
    except ImportError:
        raise HTTPException(status_code=500, detail="Server missing PyJWT (pip install pyjwt)")

    try:
        payload: dict[str, Any] = jwt.decode(
            token,
            config.JWT_SECRET,
            algorithms=["HS256"],
            options={"require": ["exp", "sub"]},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload


async def get_current_user(request: Request) -> dict[str, Any]:
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    token = auth[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    # Local/demo mode: resolve to the seeded demo user
    if config.APP_MODE == "local":
        profile = db.fetchone("SELECT * FROM profiles LIMIT 1")
        if profile:
            member = db.fetchone(
                "SELECT * FROM organization_members WHERE user_id = %s LIMIT 1",
                (profile["id"],),
            )
            return {
                "id": profile["id"],
                "email": profile["email"],
                "role": profile.get("role", "recruiter"),
                "organizationId": member["organization_id"] if member else None,
            }

    # Production mode: verify a real JWT (HS256, signed with JWT_SECRET)
    payload = _decode_jwt(token)
    return {
        "id": payload.get("sub"),
        "email": payload.get("email", ""),
        "role": payload.get("role", "recruiter"),
        "organizationId": payload.get("organizationId"),
    }
