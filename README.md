# ARYNOX AI HIRE

**AI-Powered Technical Hiring & Project Verification**

Evaluate technical candidates with AI interviews, live voice interaction, 3D AI interviewer avatar, GitHub project verification, company-specific RAG, and multilingual support.

## Features

- AI Technical Interviews (adaptive, multilingual)
- Photorealistic AI Interviewer Avatar (Tavus)
- Live 3D AI Interviewer Avatar fallback (Three.js, lip sync)
- Multilingual Voice with Sarvam AI (English, Hindi, Marathi, 22+ Indic languages)
- Technical Assessments (MCQ, coding, project-based)
- GitHub Project Verification
- CV Analysis & Document RAG
- English / हिन्दी / मराठी interviews
- Privacy-Aware Proctoring Signals
- Candidate Skill Profiles
- Recruiter Dashboard & Analytics
- AI-Generated Reports
- Multi-Tenant SaaS with Razorpay Billing

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion, Three.js, React Three Fiber |
| Backend | Node.js, Fastify, TypeScript |
| Database | Supabase (PostgreSQL, pgvector, RLS) |
| AI (LLM) | Groq (primary), OpenAI, Anthropic, Mock provider |
| Voice | Sarvam AI (STT/TTS) - 22+ Indian languages |
| Avatar | Tavus (photorealistic video) + Three.js 3D fallback |
| Payments | Razorpay |
| Auth | Supabase Auth (Email, Google, GitHub) |

## Quick Start (Windows)

### 1. Setup

```bash
# Double-click setup.bat or run:
setup.bat
```

### 2. Configure

Edit `.env` and add your API keys:

```env
GROQ_API_KEY=your-groq-key
STT_API_KEY=your-sarvam-key
TTS_API_KEY=your-sarvam-key
TAVUS_API_KEY=your-tavus-key
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run

```bash
# Double-click run.bat or run:
run.bat
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Health: http://localhost:8000/health

### 4. Stop

```bash
stop.bat
```

## Mock Mode

Without API keys, the application runs in **LOCAL MOCK MODE** with simulated AI responses, STT/TTS, embeddings, and GitHub data. The UI clearly shows mock mode status.

- **Sarvam AI** provides real voice for English, Hindi, Marathi, and 22+ Indian languages
- **Tavus** provides photorealistic AI video avatar (falls back to 3D avatar if unavailable)
- **Groq** provides real LLM responses for interview questions

## Project Structure

```
arynox-ai-hire/
├── run.bat / setup.bat / stop.bat
├── frontend/          # Next.js app
│   ├── src/app/       # Pages and routes
│   ├── src/components/# UI components
│   └── src/lib/       # Utilities
├── server/            # Fastify backend
│   └── src/
│       ├── routes/    # API routes
│       ├── ai/        # AI providers & engine
│       ├── database/  # Supabase client
│       └── middleware/ # Auth, tenant isolation
├── supabase/          # Database migrations
└── docs/              # Documentation
```

## API Keys

| Key | Purpose | Required |
|-----|---------|----------|
| GROQ_API_KEY | AI interviews (LLM) | For real AI (mock works without) |
| STT_API_KEY | Sarvam AI speech-to-text | For voice input (mock works without) |
| TTS_API_KEY | Sarvam AI text-to-speech | For AI voice output (mock works without) |
| TAVUS_API_KEY | Tavus photorealistic avatar | For video avatar (3D fallback works without) |
| SUPABASE_URL | Database | For real DB (mock works without) |
| GITHUB_CLIENT_ID | GitHub OAuth | Optional |
| RAZORPAY_KEY_ID | Billing | Optional |
| OPENAI_API_KEY | Alternative AI | Optional |
| ANTHROPIC_API_KEY | Alternative AI | Optional |

## License

Proprietary - Arynox Technologies
