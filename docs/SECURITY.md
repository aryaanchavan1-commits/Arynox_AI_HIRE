# Security

## Authentication
- Supabase Auth with JWT tokens
- Server-side token validation
- Role-based access control

## Authorization
- Roles: candidate, recruiter, organization_admin, platform_admin
- Server validates all permissions
- Never trust frontend role claims

## Multi-Tenancy
- All data isolated by organization_id
- Supabase RLS policies
- Backend middleware validation

## Data Protection
- No secrets in frontend code
- No service role key in browser
- API keys only in server environment
- CORS restricted to allowed origins

## Input Validation
- Zod schema validation on all inputs
- File type and size validation
- Rate limiting on all endpoints

## Audit Logging
- All significant actions logged
- User, action, resource, timestamp
- IP address tracking
