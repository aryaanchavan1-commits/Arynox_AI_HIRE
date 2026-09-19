"""Mock TTS provider."""
from providers import TTSProvider


class MockTTSProvider(TTSProvider):
    async def synthesize(self, text: str, language: str = "en", speaker: str = "shubh") -> bytes:
        return b""

    async def synthesize_stream(self, text: str, language: str = "en", speaker: str = "shubh"):
        yield b""
