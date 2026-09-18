"""Mock STT provider."""
from providers import STTProvider


class MockSTTProvider(STTProvider):
    async def transcribe(self, audio_data: bytes, language: str = "en") -> dict:
        return {
            "text": "[Mock STT - configure SARVAM_API_KEY for real transcription]",
            "confidence": 0.9,
            "language": language,
        }
