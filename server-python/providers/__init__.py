"""Provider base classes and factory."""
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any, Optional
import config


class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, messages: list[dict], temperature: float = 0.7, max_tokens: int = 1024) -> str:
        ...

    @abstractmethod
    async def generate_stream(self, messages: list[dict], temperature: float = 0.7, max_tokens: int = 1024):
        ...


class STTProvider(ABC):
    @abstractmethod
    async def transcribe(self, audio_data: bytes, language: str = "en") -> dict:
        """Returns {"text": str, "confidence": float, "language": str}"""
        ...


class TTSProvider(ABC):
    @abstractmethod
    async def synthesize(self, text: str, language: str = "en", speaker: str = "shubh") -> bytes:
        """Returns audio bytes (WAV/PCM)."""
        ...

    @abstractmethod
    async def synthesize_stream(self, text: str, language: str = "en", speaker: str = "shubh"):
        """Yields audio chunks."""
        ...


class AvatarProvider(ABC):
    @abstractmethod
    async def initialize(self, config: dict) -> bool:
        ...

    @abstractmethod
    async def connect(self) -> bool:
        ...

    @abstractmethod
    async def send_audio(self, audio_data: bytes) -> bool:
        ...

    @abstractmethod
    async def send_text(self, text: str) -> bool:
        ...

    @abstractmethod
    async def interrupt(self) -> bool:
        ...

    @abstractmethod
    async def set_state(self, state: str) -> bool:
        ...

    @abstractmethod
    async def disconnect(self) -> bool:
        ...


def get_llm_provider() -> LLMProvider:
    if config.LLM_PROVIDER == "groq" and config.GROQ_API_KEY:
        from providers.llm.groq_provider import GroqLLMProvider
        return GroqLLMProvider()
    from providers.llm.mock_provider import MockLLMProvider
    return MockLLMProvider()


def get_stt_provider() -> STTProvider:
    if config.STT_PROVIDER == "sarvam" and config.SARVAM_API_KEY:
        from providers.stt.sarvam_provider import SarvamSTTProvider
        return SarvamSTTProvider()
    from providers.stt.mock_provider import MockSTTProvider
    return MockSTTProvider()


def get_tts_provider() -> TTSProvider:
    if config.TTS_PROVIDER == "sarvam" and config.SARVAM_API_KEY:
        from providers.tts.sarvam_provider import SarvamTTSProvider
        return SarvamTTSProvider()
    from providers.tts.mock_provider import MockTTSProvider
    return MockTTSProvider()
