"""D-ID Live Avatar Provider — creates real talking head videos."""
from __future__ import annotations
import httpx
import asyncio
import base64
from typing import Optional
import config

DID_API_BASE = "https://api.d-id.com"

# Default professional headshot for the interviewer avatar
DEFAULT_SOURCE_URL = "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg"


class DIDAvatarProvider:
    def __init__(self):
        self._api_key = config.DID_API_KEY if hasattr(config, "DID_API_KEY") else ""
        self._source_url = DEFAULT_SOURCE_URL
        self._client: Optional[httpx.AsyncClient] = None

    def _headers(self) -> dict:
        return {
            "Authorization": f"Basic {self._api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=60)
        return self._client

    async def create_talk(self, text: str, voice_id: str = "en-US-JennyNeural", language: str = "en") -> dict:
        """Create a talk video from text. Returns {id, status}."""
        # Language to voice mapping
        voice_map = {
            "en": "en-US-JennyNeural",
            "hi": "hi-IN-SwaraNeural",
            "mr": "mr-IN-AarohiNeural",
        }
        voice = voice_map.get(language, voice_id)

        client = await self._get_client()
        payload = {
            "source_url": self._source_url,
            "script": {
                "type": "text",
                "input": text,
                "provider": {
                    "type": "microsoft",
                    "voice_id": voice,
                },
            },
            "config": {
                "stitch": True,
            },
        }

        resp = await client.post(f"{DID_API_BASE}/talks", json=payload, headers=self._headers())
        resp.raise_for_status()
        return resp.json()

    async def get_talk(self, talk_id: str) -> dict:
        """Get talk status and result URL."""
        client = await self._get_client()
        resp = await client.get(f"{DID_API_BASE}/talks/{talk_id}", headers=self._headers())
        resp.raise_for_status()
        return resp.json()

    async def wait_for_talk(self, talk_id: str, timeout: float = 30) -> dict:
        """Poll until talk is done or error."""
        import time
        start = time.time()
        while time.time() - start < timeout:
            result = await self.get_talk(talk_id)
            status = result.get("status", "")
            if status == "done":
                return result
            elif status in ("error", "rejected"):
                return result
            await asyncio.sleep(1)
        return {"status": "timeout", "id": talk_id}

    async def create_and_wait(self, text: str, language: str = "en") -> dict:
        """Create a talk and wait for completion. Returns full result."""
        try:
            created = await self.create_talk(text, language=language)
            talk_id = created.get("id")
            if not talk_id:
                return {"status": "error", "error": "No talk ID returned"}
            return await self.wait_for_talk(talk_id)
        except httpx.HTTPStatusError as e:
            return {"status": "error", "error": f"D-ID API error: {e.response.status_code}"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    async def create_stream(self, source_url: str = None) -> dict:
        """Create a WebRTC streaming session (for realtime mode)."""
        client = await self._get_client()
        payload = {
            "source_url": source_url or self._source_url,
            "stream_warmup": True,
            "session_timeout": 180,
        }
        resp = await client.post(f"{DID_API_BASE}/talks/streams", json=payload, headers=self._headers())
        resp.raise_for_status()
        return resp.json()

    async def send_to_stream(self, stream_id: str, text: str, language: str = "en") -> dict:
        """Send text to an active stream."""
        voice_map = {
            "en": "en-US-JennyNeural",
            "hi": "hi-IN-SwaraNeural",
            "mr": "mr-IN-AarohiNeural",
        }
        client = await self._get_client()
        payload = {
            "script": {
                "type": "text",
                "input": text,
                "provider": {
                    "type": "microsoft",
                    "voice_id": voice_map.get(language, "en-US-JennyNeural"),
                },
            },
        }
        resp = await client.post(
            f"{DID_API_BASE}/talks/streams/{stream_id}",
            json=payload,
            headers=self._headers(),
        )
        resp.raise_for_status()
        return resp.json()

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()
