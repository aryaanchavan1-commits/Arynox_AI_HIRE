"""Sarvam AI STT provider for Indian languages."""
from __future__ import annotations
import httpx
from providers import STTProvider
import config

SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"


class SarvamSTTProvider(STTProvider):
    def __init__(self):
        self._api_key = config.SARVAM_API_KEY

    async def transcribe(self, audio_data: bytes, language: str = "en") -> dict:
        lang_map = {"hi": "hi-IN", "mr": "mr-IN", "en": "en-IN"}
        sarvam_lang = lang_map.get(language, "en-IN")

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                SARVAM_STT_URL,
                headers={"Authorization": f"Bearer {self._api_key}"},
                files={"audio": ("audio.wav", audio_data, "audio/wav")},
                data={"language_code": sarvam_lang},
            )
            resp.raise_for_status()
            data = resp.json()
            return {
                "text": data.get("transcript", ""),
                "confidence": data.get("confidence", 0.0),
                "language": language,
            }
