from fastapi import APIRouter

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.get("/status")
async def voice_status():
    return {
        "stt": {"provider": "sarvam", "available": False, "mockMode": True},
        "tts": {"provider": "sarvam", "available": False, "mockMode": True},
        "languages": ["en", "hi", "mr"],
    }


@router.post("/stt")
async def speech_to_text():
    return {
        "mockMode": True,
        "text": "[Mock STT - Sarvam API key not configured]",
        "confidence": 0.9,
        "language": "en",
    }


@router.post("/tts")
async def text_to_speech():
    return {
        "mockMode": True,
        "message": "Sarvam TTS mock mode",
        "audio": None,
        "format": "audio/wav",
    }
