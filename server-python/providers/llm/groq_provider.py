"""Groq LLM provider for production mode."""
from __future__ import annotations
import httpx
from providers import LLMProvider
import config

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


class GroqLLMProvider(LLMProvider):
    def __init__(self):
        self._api_key = config.GROQ_API_KEY
        self._model = "llama-3.3-70b-versatile"

    async def generate(self, messages: list[dict], temperature: float = 0.7, max_tokens: int = 1024) -> str:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                GROQ_API_URL,
                headers={"Authorization": f"Bearer {self._api_key}", "Content-Type": "application/json"},
                json={"model": self._model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens},
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    async def generate_stream(self, messages: list[dict], temperature: float = 0.7, max_tokens: int = 1024):
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream(
                "POST",
                GROQ_API_URL,
                headers={"Authorization": f"Bearer {self._api_key}", "Content-Type": "application/json"},
                json={"model": self._model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens, "stream": True},
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if line.startswith("data: ") and line != "data: [DONE]":
                        import json
                        chunk = json.loads(line[6:])
                        delta = chunk.get("choices", [{}])[0].get("delta", {})
                        if "content" in delta:
                            yield delta["content"]
