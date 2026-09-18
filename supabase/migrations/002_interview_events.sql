-- ARYNOX AI HIRE - Database Schema
-- Migration 002: Interview Events + Invitation Tokens

-- Add invitation token columns to interviews
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS invitation_token TEXT UNIQUE;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMPTZ;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS max_duration_minutes INTEGER DEFAULT 60;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS evaluation JSONB DEFAULT '{}';

-- Interview Events (transcript, proctoring, voice)
CREATE TABLE IF NOT EXISTS interview_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interview_events_interview ON interview_events(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_events_type ON interview_events(event_type);
CREATE INDEX IF NOT EXISTS idx_interviews_token ON interviews(invitation_token);

-- RLS
ALTER TABLE interview_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view interview events" ON interview_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM interviews
    JOIN organization_members ON organization_members.organization_id = interviews.organization_id
    WHERE interviews.id = interview_events.interview_id
    AND organization_members.user_id = auth.uid()
  )
);
