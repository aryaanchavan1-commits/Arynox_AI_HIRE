"""Sarvam AI TTS provider."""
from __future__ import annotations
import httpx
import base64
from providers import TTSProvider
import config

SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"
SARVAM_TTS_MAX_CHARS = 1000  # API hard limit per request

# Available Sarvam AI voices per language
SARVAM_VOICES = {
    "en": [
        {"id": "shubh", "name": "Shubh", "gender": "male"},
        {"id": "aditya", "name": "Aditya", "gender": "male"},
        {"id": "ritu", "name": "Ritu", "gender": "female"},
        {"id": "priya", "name": "Priya", "gender": "female"},
        {"id": "neha", "name": "Neha", "gender": "female"},
        {"id": "rahul", "name": "Rahul", "gender": "male"},
        {"id": "pooja", "name": "Pooja", "gender": "female"},
        {"id": "rohan", "name": "Rohan", "gender": "male"},
        {"id": "simran", "name": "Simran", "gender": "female"},
        {"id": "kavya", "name": "Kavya", "gender": "female"},
    ],
    "hi": [
        {"id": "shubh", "name": "Shubh", "gender": "male"},
        {"id": "aditya", "name": "Aditya", "gender": "male"},
        {"id": "ritu", "name": "Ritu", "gender": "female"},
        {"id": "priya", "name": "Priya", "gender": "female"},
        {"id": "neha", "name": "Neha", "gender": "female"},
        {"id": "rahul", "name": "Rahul", "gender": "male"},
    ],
    "mr": [
        {"id": "shubh", "name": "Shubh", "gender": "male"},
        {"id": "aditya", "name": "Aditya", "gender": "male"},
        {"id": "priya", "name": "Priya", "gender": "female"},
    ],
}


class SarvamTTSProvider(TTSProvider):
    def __init__(self):
        self._api_key = config.SARVAM_API_KEY

    @staticmethod
    def _clip_text(text: str, limit: int = SARVAM_TTS_MAX_CHARS) -> str:
        """Clip text to the API limit, preferring a sentence boundary."""
        if len(text) <= limit:
            return text
        clipped = text[:limit]
        # Try to end on a sentence/phrase boundary so speech doesn't cut mid-word
        for sep in (". ", "! ", "? ", "। ", "\n", "; ", ", "):
            idx = clipped.rfind(sep)
            if idx > limit * 0.5:
                return clipped[: idx + 1]
        return clipped

    async def synthesize(self, text: str, language: str = "en", speaker: str = "shubh") -> bytes:
        lang_map = {"hi": "hi-IN", "mr": "mr-IN", "en": "en-IN"}
        sarvam_lang = lang_map.get(language, "en-IN")

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                SARVAM_TTS_URL,
                headers={"api-subscription-key": self._api_key, "Content-Type": "application/json"},
                json={
                    "text": self._clip_text(text),
                    "language_code": sarvam_lang,
                    "speaker": speaker,
                    "model": "bulbul:v3",
                    "speech_sample_rate": 24000,
                    "output_audio_codec": "wav",
                },
            )
            resp.raise_for_status()
            data = resp.json()
            # Sarvam returns "audios" (array of base64 strings)
            audios = data.get("audios", [])
            if audios:
                return base64.b64decode(audios[0])
            return b""

    async def synthesize_stream(self, text: str, language: str = "en", speaker: str = "shubh"):
        audio = await self.synthesize(text, language, speaker=speaker)
        yield audio
