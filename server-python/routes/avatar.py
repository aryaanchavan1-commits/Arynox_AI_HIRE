"""D-ID Avatar API routes — proxies D-ID calls so API key stays server-side."""
from __future__ import annotations
import traceback
from fastapi import APIRouter, Request
from auth import get_current_user
import config

router = APIRouter(prefix="/api/avatar", tags=["avatar"])


@router.get("/status")
async def avatar_status():
    did_key = getattr(config, "DID_API_KEY", "")
    tavus_key = config.TAVUS_API_KEY

    if did_key:
        return {"available": True, "provider": "d-id", "mockMode": False}
    if tavus_key:
        return {"available": True, "provider": "tavus", "mockMode": False}

    return {"available": False, "provider": "local", "mockMode": True}


@router.post("/talk")
async def create_talk(request: Request):
    """Create a D-ID talk video from text. Returns video URL when done."""
    did_key = getattr(config, "DID_API_KEY", "")
    if not did_key:
        return {"status": "mock", "mockMode": True, "error": "D-ID API key not configured"}

    try:
        body = await request.json()
        text = body.get("text", "")
        language = body.get("language", "en")

        if not text:
            return {"error": "Text is required"}

        from providers.avatar.did_provider import DIDAvatarProvider
        provider = DIDAvatarProvider()
        provider._api_key = did_key

        result = await provider.create_and_wait(text, language=language)
        await provider.close()

        if result.get("status") == "done":
            return {
                "status": "done",
                "videoUrl": result.get("result_url"),
                "id": result.get("id"),
            }
        else:
            return {"status": result.get("status", "error"), "error": result.get("error", "Unknown error")}

    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "error": str(e)}


@router.post("/stream/init")
async def init_stream(request: Request):
    """Initialize a D-ID WebRTC stream."""
    did_key = getattr(config, "DID_API_KEY", "")
    if not did_key:
        return {"error": "D-ID API key not configured"}

    try:
        body = await request.json()
        source_url = body.get("source_url")

        from providers.avatar.did_provider import DIDAvatarProvider
        provider = DIDAvatarProvider()
        provider._api_key = did_key

        result = await provider.create_stream(source_url)
        await provider.close()

        return {
            "session_id": result.get("session_id"),
            "id": result.get("id"),
            "jsep": result.get("jsep"),
            "ice_servers": result.get("ice_servers"),
        }

    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


@router.post("/stream/{stream_id}/send")
async def send_to_stream(stream_id: str, request: Request):
    """Send text to an active D-ID stream."""
    did_key = getattr(config, "DID_API_KEY", "")
    if not did_key:
        return {"error": "D-ID API key not configured"}

    try:
        body = await request.json()
        text = body.get("text", "")
        language = body.get("language", "en")

        from providers.avatar.did_provider import DIDAvatarProvider
        provider = DIDAvatarProvider()
        provider._api_key = did_key

        result = await provider.send_to_stream(stream_id, text, language)
        await provider.close()

        return result

    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}
