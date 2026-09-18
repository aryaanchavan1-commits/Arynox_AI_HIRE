# Architecture

## System Overview

ARYNOX AI HIRE uses a monorepo architecture with three main packages:

### Frontend (Next.js)
- Server-side rendering with App Router
- React Query for data fetching
- Zustand for client state
- Three.js/React Three Fiber for 3D avatar
- WebSocket for real-time interview communication

### Backend (Fastify)
- RESTful API with OpenAPI documentation
- WebSocket server for interview sessions
- AI provider abstraction layer
- Voice pipeline (STT/TTS providers)
- File upload processing (CV, documents)

### Database (Supabase)
- PostgreSQL with pgvector for embeddings
- Row Level Security for multi-tenancy
- Auth with email/password, Google, GitHub
- Storage for files and documents

## Data Flow

### Interview Flow
1. Recruiter creates job and interview
2. Candidate receives invitation
3. Candidate completes consent and system check
4. WebSocket connection established
5. AI interview engine generates questions
6. Candidate responds via voice (STT) or text
7. AI evaluates and generates follow-up
8. TTS converts response to speech
9. 3D avatar animates with lip sync
10. Proctoring signals collected throughout
11. Final evaluation and report generated

### Multi-Tenancy
- All data scoped to organization_id
- RLS policies enforce isolation
- Backend validates organization membership
- No cross-tenant data access possible

## Security

- JWT-based authentication
- Server-side role validation
- Organization-scoped data access
- Input validation with Zod
- Rate limiting
- CORS configuration
- No secrets in frontend code
