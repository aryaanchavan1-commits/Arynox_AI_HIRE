-- ARYNOX AI HIRE - Database Schema
-- Migration 001: Initial Schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- ENUMS
CREATE TYPE user_role AS ENUM ('candidate', 'recruiter', 'organization_admin', 'platform_admin');
CREATE TYPE work_mode AS ENUM ('remote', 'hybrid', 'onsite');
CREATE TYPE interview_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'expired');
CREATE TYPE interview_type AS ENUM ('technical', 'project_defense', 'hr', 'comprehensive');
CREATE TYPE interview_language AS ENUM ('en', 'hi', 'mr');
CREATE TYPE assessment_type AS ENUM ('mcq', 'short_answer', 'coding', 'project_task');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing');
CREATE TYPE document_status AS ENUM ('uploaded', 'processing', 'completed', 'failed');

-- USERS (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role user_role NOT NULL DEFAULT 'candidate',
  avatar_url TEXT,
  phone TEXT,
  language interview_language DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORGANIZATIONS
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  size TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORGANIZATION MEMBERS
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'recruiter',
  invited_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- JOBS
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  department TEXT,
  location TEXT,
  work_mode work_mode DEFAULT 'remote',
  experience TEXT,
  salary TEXT,
  description TEXT NOT NULL,
  required_skills TEXT[] DEFAULT '{}',
  preferred_skills TEXT[] DEFAULT '{}',
  tech_stack TEXT[] DEFAULT '{}',
  interview_language interview_language DEFAULT 'en',
  difficulty INTEGER DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  duration INTEGER DEFAULT 30,
  interview_rounds INTEGER DEFAULT 1,
  evaluation_criteria TEXT,
  company_knowledge TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CANDIDATES
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  title TEXT,
  skills TEXT[] DEFAULT '{}',
  experience TEXT,
  education TEXT,
  cv_text TEXT,
  cv_url TEXT,
  github_url TEXT,
  github_username TEXT,
  portfolio_url TEXT,
  availability TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- APPLICATIONS
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'applied',
  cover_letter TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, candidate_id)
);

-- INTERVIEWS
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  type interview_type DEFAULT 'comprehensive',
  language interview_language DEFAULT 'en',
  status interview_status DEFAULT 'scheduled',
  context JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INTERVIEW QUESTIONS
CREATE TABLE interview_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  skill TEXT,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  question_type TEXT,
  expected_concepts TEXT[] DEFAULT '{}',
  asked_at TIMESTAMPTZ DEFAULT NOW(),
  order_index INTEGER DEFAULT 0
);

-- INTERVIEW ANSWERS
CREATE TABLE interview_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES interview_questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  score NUMERIC(5,2),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ASSESSMENTS
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  duration INTEGER DEFAULT 60,
  questions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ASSESSMENT ANSWERS
CREATE TABLE assessment_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  answers JSONB DEFAULT '{}',
  score NUMERIC(5,2),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECTS
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  github_url TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  verified BOOLEAN DEFAULT FALSE,
  verification_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GITHUB ACCOUNTS
CREATE TABLE github_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  github_id TEXT NOT NULL,
  login TEXT NOT NULL,
  avatar_url TEXT,
  access_token TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW()
);

-- GITHUB REPOSITORIES
CREATE TABLE github_repositories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  github_account_id UUID NOT NULL REFERENCES github_accounts(id) ON DELETE CASCADE,
  repo_id TEXT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT,
  description TEXT,
  language TEXT,
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  analyzed BOOLEAN DEFAULT FALSE,
  analysis_data JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOCUMENTS (for RAG)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER,
  storage_path TEXT,
  status document_status DEFAULT 'uploaded',
  chunk_count INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOCUMENT CHUNKS (pgvector)
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INTEGER DEFAULT 0,
  embedding vector(384),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INTERVIEW REPORTS
CREATE TABLE interview_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  candidate_summary TEXT,
  technical_score NUMERIC(5,2),
  communication_score NUMERIC(5,2),
  problem_solving_score NUMERIC(5,2),
  project_understanding_score NUMERIC(5,2),
  overall_score NUMERIC(5,2),
  evidence TEXT[] DEFAULT '{}',
  missing_concepts TEXT[] DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  improvements TEXT[] DEFAULT '{}',
  confidence NUMERIC(3,2),
  summary TEXT,
  proctoring_signals JSONB DEFAULT '[]',
  ai_disclaimer TEXT DEFAULT 'AI-generated assessment. Human review required.',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROCTORING EVENTS
CREATE TABLE proctoring_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INTEGER,
  confidence NUMERIC(3,2),
  metadata JSONB DEFAULT '{}'
);

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',
  status subscription_status DEFAULT 'active',
  razorpay_subscription_id TEXT,
  razorpay_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- USAGE RECORDS
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  tokens INTEGER DEFAULT 0,
  minutes INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_jobs_org ON jobs(organization_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_candidates_org ON candidates(organization_id);
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_candidate ON applications(candidate_id);
CREATE INDEX idx_interviews_org ON interviews(organization_id);
CREATE INDEX idx_interviews_candidate ON interviews(candidate_id);
CREATE INDEX idx_interviews_job ON interviews(job_id);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_interview_questions_interview ON interview_questions(interview_id);
CREATE INDEX idx_interview_answers_interview ON interview_answers(interview_id);
CREATE INDEX idx_assessments_org ON assessments(organization_id);
CREATE INDEX idx_assessment_answers_assessment ON assessment_answers(assessment_id);
CREATE INDEX idx_projects_candidate ON projects(candidate_id);
CREATE INDEX idx_github_accounts_candidate ON github_accounts(candidate_id);
CREATE INDEX idx_github_repos_account ON github_repositories(github_account_id);
CREATE INDEX idx_documents_org ON documents(organization_id);
CREATE INDEX idx_document_chunks_document ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_interview_reports_interview ON interview_reports(interview_id);
CREATE INDEX idx_interview_reports_org ON interview_reports(organization_id);
CREATE INDEX idx_proctoring_events_interview ON proctoring_events(interview_id);
CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_usage_records_org ON usage_records(organization_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);

-- ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE proctoring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Members can view org" ON organizations FOR SELECT USING (
  EXISTS (SELECT 1 FROM organization_members WHERE organization_id = organizations.id AND user_id = auth.uid())
);

CREATE POLICY "Members can view org members" ON organization_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM organization_members WHERE organization_id = organization_members.organization_id AND user_id = auth.uid())
);

CREATE POLICY "Org members can view jobs" ON jobs FOR SELECT USING (
  EXISTS (SELECT 1 FROM organization_members WHERE organization_id = jobs.organization_id AND user_id = auth.uid())
);
CREATE POLICY "Recruiters can manage jobs" ON jobs FOR ALL USING (
  EXISTS (SELECT 1 FROM organization_members WHERE organization_id = jobs.organization_id AND user_id = auth.uid() AND role IN ('recruiter', 'organization_admin'))
);

CREATE POLICY "Org members can view candidates" ON candidates FOR SELECT USING (
  EXISTS (SELECT 1 FROM organization_members WHERE organization_id = candidates.organization_id AND user_id = auth.uid())
);

CREATE POLICY "Org members can view interviews" ON interviews FOR SELECT USING (
  EXISTS (SELECT 1 FROM organization_members WHERE organization_id = interviews.organization_id AND user_id = auth.uid())
);

CREATE POLICY "Org members can view assessments" ON assessments FOR SELECT USING (
  EXISTS (SELECT 1 FROM organization_members WHERE organization_id = assessments.organization_id AND user_id = auth.uid())
);

CREATE POLICY "Org members can view documents" ON documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM organization_members WHERE organization_id = documents.organization_id AND user_id = auth.uid())
);

CREATE POLICY "Org members can view reports" ON interview_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM organization_members WHERE organization_id = interview_reports.organization_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Org members can view usage" ON usage_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM organization_members WHERE organization_id = usage_records.organization_id AND user_id = auth.uid())
);
