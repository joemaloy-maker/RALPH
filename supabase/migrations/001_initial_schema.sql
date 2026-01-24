-- RALPH Initial Schema
-- Run this in Supabase SQL Editor

-- Athletes table
CREATE TABLE athletes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  onboarding_answers jsonb,
  motivation_metadata jsonb,
  telegram_chat_id text,
  created_at timestamp with time zone DEFAULT now()
);

-- Plans table
CREATE TABLE plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athletes(id) ON DELETE CASCADE,
  version integer DEFAULT 1,
  macro_plan jsonb,
  weeks jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Sessions table
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES plans(id) ON DELETE CASCADE,
  date date,
  session_type text,
  prescribed jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'modified', 'skipped')),
  rpe text,
  cue_feedback text,
  notes text,
  completed_at timestamp with time zone
);

-- Prompt history table
CREATE TABLE prompt_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athletes(id) ON DELETE CASCADE,
  prompt_text text,
  feedback_summary jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_plans_athlete_id ON plans(athlete_id);
CREATE INDEX idx_sessions_plan_id ON sessions(plan_id);
CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_prompt_history_athlete_id ON prompt_history(athlete_id);
