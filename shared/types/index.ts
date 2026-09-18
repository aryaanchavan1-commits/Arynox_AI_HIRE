export type UserRole = "candidate" | "recruiter" | "organization_admin" | "platform_admin";
export type WorkMode = "remote" | "hybrid" | "onsite";
export type InterviewStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "expired";
export type InterviewType = "technical" | "project_defense" | "hr" | "comprehensive";
export type InterviewLanguage = "en" | "hi" | "mr";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  language: InterviewLanguage;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website?: string;
  industry?: string;
  size?: string;
  created_at: string;
}

export interface Job {
  id: string;
  organization_id: string;
  title: string;
  department?: string;
  location?: string;
  work_mode: WorkMode;
  experience?: string;
  salary?: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  tech_stack: string[];
  interview_language: InterviewLanguage;
  difficulty: number;
  duration: number;
  interview_rounds: number;
  evaluation_criteria?: string;
  company_knowledge?: string;
  status: string;
  created_at: string;
}

export interface Candidate {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  phone?: string;
  title?: string;
  skills: string[];
  experience?: string;
  education?: string;
  cv_text?: string;
  github_url?: string;
  portfolio_url?: string;
  created_at: string;
}

export interface Interview {
  id: string;
  organization_id: string;
  candidate_id: string;
  job_id: string;
  type: InterviewType;
  language: InterviewLanguage;
  status: InterviewStatus;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  created_at: string;
  candidates?: { name: string; email: string };
  jobs?: { title: string };
}

export interface InterviewQuestion {
  id: string;
  interview_id: string;
  question: string;
  skill?: string;
  difficulty?: number;
  question_type?: string;
  expected_concepts: string[];
  asked_at: string;
  order_index: number;
}

export interface InterviewReport {
  id: string;
  interview_id: string;
  organization_id: string;
  candidate_summary?: string;
  technical_score?: number;
  communication_score?: number;
  problem_solving_score?: number;
  project_understanding_score?: number;
  overall_score?: number;
  evidence: string[];
  missing_concepts: string[];
  strengths: string[];
  improvements: string[];
  confidence?: number;
  summary?: string;
  proctoring_signals: any[];
  ai_disclaimer: string;
  created_at: string;
}

export interface BillingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
}
