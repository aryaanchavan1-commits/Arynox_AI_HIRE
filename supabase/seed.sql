-- Seed data for local development

-- Insert demo organization
INSERT INTO organizations (id, name, slug, description) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Arynox Technologies', 'arynox', 'AI-Powered Hiring Platform');

-- Insert demo jobs
INSERT INTO jobs (id, organization_id, title, department, location, work_mode, description, required_skills, interview_language) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Senior React Developer', 'Engineering', 'Pune', 'hybrid', 'We are looking for a senior React developer with 5+ years of experience.', ARRAY['React', 'TypeScript', 'Node.js', 'CSS'], 'en'),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'ML Engineer', 'AI/ML', 'Mumbai', 'remote', 'Join our AI team to build production ML systems.', ARRAY['Python', 'TensorFlow', 'PyTorch', 'MLOps'], 'en'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Backend Developer', 'Engineering', 'Nagpur', 'onsite', 'Build scalable backend services with Node.js and PostgreSQL.', ARRAY['Node.js', 'PostgreSQL', 'Docker', 'Redis'], 'hi');
