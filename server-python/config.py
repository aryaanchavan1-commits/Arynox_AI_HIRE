import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
project_root = Path(__file__).resolve().parent.parent
load_dotenv(project_root / ".env")

APP_MODE = os.getenv("APP_MODE", "local").strip()
PORT = int(os.getenv("PORT", "8000"))
NEXT_PUBLIC_APP_URL = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")

# LLM
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq") if GROQ_API_KEY else "mock"

# STT
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", os.getenv("STT_API_KEY", ""))
STT_PROVIDER = os.getenv("STT_PROVIDER", "sarvam") if SARVAM_API_KEY else "mock"

# TTS
TTS_PROVIDER = os.getenv("TTS_PROVIDER", "sarvam") if SARVAM_API_KEY else "mock"

# Avatar
AVATAR_PROVIDER = os.getenv("AVATAR_PROVIDER", "local")
DID_API_KEY = os.getenv("DID_API_KEY", "")
TAVUS_API_KEY = os.getenv("TAVUS_API_KEY", "")
TAVUS_DEFAULT_FACE_ID = os.getenv("TAVUS_DEFAULT_FACE_ID", "")

# Auth
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-production")

# LiveKit
LIVEKIT_URL = os.getenv("LIVEKIT_URL", "")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "")

# NOTE: APP_MODE=local no longer forces the mock LLM. If GROQ_API_KEY is set the real
# provider is used; the mock LLM is only a fallback when no key is configured.
# The UI reads mockMode from /health to display provider status.
