# API Reference

Base URL: `http://localhost:8000`

## Authentication

All `/api/*` routes require a Bearer token:
```
Authorization: Bearer <jwt-token>
```

## Endpoints

### Health
- `GET /health` - Server health check (no auth)

### Jobs
- `GET /api/jobs` - List jobs
- `POST /api/jobs` - Create job
- `GET /api/jobs/:id` - Get job
- `PATCH /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Candidates
- `GET /api/candidates` - List candidates
- `POST /api/candidates` - Create candidate
- `GET /api/candidates/:id` - Get candidate

### Interviews
- `GET /api/interviews` - List interviews
- `POST /api/interviews` - Create interview
- `GET /api/interviews/:id` - Get interview
- `POST /api/interviews/:id/start` - Start interview
- `POST /api/interviews/:id/answer` - Submit answer
- `POST /api/interviews/:id/complete` - Complete interview

### Assessments
- `GET /api/assessments` - List assessments
- `POST /api/assessments` - Create assessment

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `POST /api/projects/:id/verify` - Verify project

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents` - Upload document

### GitHub
- `POST /api/github/connect` - Connect GitHub
- `GET /api/github/repositories` - List repositories

### RAG
- `POST /api/rag/search` - Search documents

### Reports
- `GET /api/reports/:id` - Get report

### Billing
- `GET /api/billing/plans` - List plans
- `POST /api/billing/checkout` - Create checkout

### Usage
- `GET /api/usage` - Get usage stats
