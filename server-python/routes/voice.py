"""Voice routes — STT and TTS endpoints."""
from __future__ import annotations
import base64
from fastapi import APIRouter, HTTPException, Request
from providers import get_stt_provider, get_tts_provider
import config

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.get("/status")
async def voice_status():
    has_sarvam = bool(config.SARVAM_API_KEY)
    return {
        "stt": {"provider": "sarvam", "available": has_sarvam, "mockMode": not has_sarvam},
        "tts": {"provider": "sarvam", "available": has_sarvam, "mockMode": not has_sarvam},
        "languages": ["en", "hi", "mr"],
    }


@router.get("/voices")
async def list_voices():
    from providers.tts.sarvam_provider import SARVAM_VOICES
    return {"voices": SARVAM_VOICES}


@router.post("/stt")
async def speech_to_text(request: Request):
    try:
        body = await request.json()
        audio_b64 = body.get("audio", "")
        language = body.get("language", "en")

        if not audio_b64:
            raise HTTPException(status_code=400, detail="No audio provided")

        audio_data = base64.b64decode(audio_b64)
        stt = get_stt_provider()
        result = await stt.transcribe(audio_data, language)
        return result
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Speech-to-text failed")


@router.post("/tts")
async def text_to_speech(request: Request):
    try:
        body = await request.json()
        text = body.get("text", "")
        language = body.get("language", "en")
        speaker = body.get("speaker", "shubh")

        if not text:
            raise HTTPException(status_code=400, detail="No text provided")

        tts = get_tts_provider()
        audio = await tts.synthesize(text, language, speaker=speaker)
        if audio:
            return {
                "audio": base64.b64encode(audio).decode(),
                "format": "audio/wav",
                "mockMode": False,
            }
        raise HTTPException(status_code=502, detail="TTS returned empty audio")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Text-to-speech failed")
