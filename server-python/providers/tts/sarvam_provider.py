"""Sarvam AI TTS provider."""
from __future__ import annotations
import httpx
from providers import TTSProvider
import config

SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"


class SarvamTTSProvider(TTSProvider):
    def __init__(self):
        self._api_key = config.SARVAM_API_KEY

    async def synthesize(self, text: str, language: str = "en") -> bytes:
        lang_map = {"hi": "hi-IN", "mr": "mr-IN", "en": "en-IN"}
        sarvam_lang = lang_map.get(language, "en-IN")

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                SARVAM_TTS_URL,
                headers={"Authorization": f"Bearer {self._api_key}", "Content-Type": "application/json"},
                json={"input": text, "language_code": sarvam_lang, "model": "bulbul:v1"},
            )
            resp.raise_for_status()
            data = resp.json()
            import base64
            audio_b64 = data.get("audio", "")
            return base64.b64decode(audio_b64) if audio_b64 else b""

    async def synthesize_stream(self, text: str, language: str = "en"):
        audio = await self.synthesize(text, language)
        yield audio
