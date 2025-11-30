-- =====================================================
-- ALIGNMENT ASSESSMENT TABLES
-- Migration: 005_assessment_tables.sql
-- Description: Tables for Luna-powered compatibility assessment
-- =====================================================

-- 1. Assessment Sessions - Tracks each assessment attempt
CREATE TABLE IF NOT EXISTS public.assessment_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_code VARCHAR(8) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  partner1_name TEXT NOT NULL,
  partner2_name TEXT NOT NULL,
  partner1_email TEXT,
  partner2_email TEXT,
  mode VARCHAR(20) DEFAULT 'together', -- 'together' or 'separate'
  status VARCHAR(30) DEFAULT 'prescreening',
  -- Statuses: prescreening, generating_questions, partner1_answering, partner2_answering,
  --           partner1_complete, partner2_complete, analyzing, completed
  current_partner INTEGER DEFAULT 1,
  assessment_version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  completed_at TIMESTAMPTZ
);

-- 2. Pre-screening Responses - Context for question generation
CREATE TABLE IF NOT EXISTS public.prescreening_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  partner_number INTEGER NOT NULL CHECK (partner_number IN (1, 2)),
  has_children BOOLEAN DEFAULT FALSE,
  wants_children VARCHAR(50), -- 'yes_soon', 'yes_later', 'maybe', 'no'
  owns_home BOOLEAN DEFAULT FALSE,
  is_married BOOLEAN DEFAULT FALSE,
  living_situation VARCHAR(50), -- 'together', 'separate', 'long_distance'
  relationship_length VARCHAR(50), -- 'under_1_year', '1_3_years', '3_5_years', '5_plus_years'
  age_range VARCHAR(30), -- '18_25', '26_35', '36_45', '46_plus'
  additional_context TEXT, -- Any other context they share
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, partner_number)
);

-- 3. Session Questions - Luna-generated questions for each session
CREATE TABLE IF NOT EXISTS public.session_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'financial', 'timeline', 'parenting', 'lifestyle', etc.
  importance VARCHAR(20) NOT NULL DEFAULT 'NORMAL', -- 'CRITICAL', 'IMPORTANT', 'NORMAL', 'NICE_TO_HAVE'
  importance_weight DECIMAL(3,2) DEFAULT 1.0, -- 1.5, 1.2, 1.0, 0.7
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- [{"value": "...", "label": "...", "weight": 1}]
  is_conversational BOOLEAN DEFAULT FALSE,
  follow_up_for UUID REFERENCES public.session_questions(id), -- If this is a follow-up question
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Assessment Responses - Answers from both partners
CREATE TABLE IF NOT EXISTS public.assessment_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.session_questions(id) ON DELETE CASCADE,
  partner_number INTEGER NOT NULL CHECK (partner_number IN (1, 2)),
  answer_value TEXT NOT NULL, -- Selected option value or free text
  answer_weight INTEGER, -- Weight of selected option (NULL for free text)
  is_free_text BOOLEAN DEFAULT FALSE,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, question_id, partner_number)
);

-- 5. Conversational Responses - For open-ended follow-up discussions
CREATE TABLE IF NOT EXISTS public.conversational_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  partner_number INTEGER NOT NULL CHECK (partner_number IN (1, 2)),
  topic VARCHAR(100) NOT NULL, -- The misalignment topic being discussed
  luna_question TEXT NOT NULL, -- Luna's follow-up question
  partner_response TEXT NOT NULL, -- Partner's free-text response
  response_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Assessment Results - Luna's AI-generated analysis
CREATE TABLE IF NOT EXISTS public.assessment_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.assessment_sessions(id) ON DELETE CASCADE UNIQUE,
  alignment_score INTEGER NOT NULL CHECK (alignment_score >= 0 AND alignment_score <= 100),
  category_scores JSONB NOT NULL, -- {"financial": 85, "timeline": 72, ...}
  luna_analysis TEXT NOT NULL, -- Luna's comprehensive relationship insight
  strong_alignments JSONB, -- [{question, answer, insight}]
  misalignments JSONB, -- [{question, p1Answer, p2Answer, severity, insight}]
  discussion_prompts JSONB, -- ["prompt1", "prompt2"]
  recommended_goals JSONB, -- Goal recommendations based on assessment
  questions_asked INTEGER NOT NULL,
  analysis_model VARCHAR(50), -- Which AI model generated this
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_code ON public.assessment_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_user ON public.assessment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_status ON public.assessment_sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_questions_session ON public.session_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_session ON public.assessment_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_question ON public.assessment_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_prescreening_session ON public.prescreening_responses(session_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescreening_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversational_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

-- Assessment Sessions policies (allow anonymous access via session_code)
CREATE POLICY "Anyone can create assessment sessions"
  ON public.assessment_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view assessment sessions"
  ON public.assessment_sessions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update assessment sessions"
  ON public.assessment_sessions FOR UPDATE
  USING (true);

-- Pre-screening policies
CREATE POLICY "Anyone can insert prescreening"
  ON public.prescreening_responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view prescreening"
  ON public.prescreening_responses FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update prescreening"
  ON public.prescreening_responses FOR UPDATE
  USING (true);

-- Session Questions policies
CREATE POLICY "Anyone can insert session questions"
  ON public.session_questions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view session questions"
  ON public.session_questions FOR SELECT
  USING (true);

-- Assessment Responses policies
CREATE POLICY "Anyone can insert responses"
  ON public.assessment_responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view responses"
  ON public.assessment_responses FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update responses"
  ON public.assessment_responses FOR UPDATE
  USING (true);

-- Conversational Responses policies
CREATE POLICY "Anyone can insert conversational responses"
  ON public.conversational_responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view conversational responses"
  ON public.conversational_responses FOR SELECT
  USING (true);

-- Assessment Results policies
CREATE POLICY "Anyone can insert results"
  ON public.assessment_results FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view results"
  ON public.assessment_results FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update results"
  ON public.assessment_results FOR UPDATE
  USING (true);

-- =====================================================
-- ENABLE REALTIME FOR LIVE SYNC
-- =====================================================
-- Note: Run these in Supabase dashboard if they fail here
DO $$
BEGIN
  -- Check if tables are already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'assessment_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.assessment_sessions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'assessment_responses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.assessment_responses;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Ignore errors - may need manual setup in Supabase dashboard
  RAISE NOTICE 'Realtime setup may need manual configuration in Supabase dashboard';
END $$;

-- =====================================================
-- HELPER FUNCTION: Generate Session Code
-- =====================================================
CREATE OR REPLACE FUNCTION generate_session_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Auto-generate session code on insert
-- =====================================================
CREATE OR REPLACE FUNCTION set_session_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.session_code IS NULL OR NEW.session_code = '' THEN
    NEW.session_code := generate_session_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_session_code ON public.assessment_sessions;
CREATE TRIGGER trigger_set_session_code
  BEFORE INSERT ON public.assessment_sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_session_code();

-- =====================================================
-- VIEW: Assessment Summary (for dashboard/history)
-- =====================================================
CREATE OR REPLACE VIEW public.assessment_summary AS
SELECT
  s.id,
  s.session_code,
  s.user_id,
  s.partner1_name,
  s.partner2_name,
  s.mode,
  s.status,
  s.created_at,
  s.completed_at,
  r.alignment_score,
  r.category_scores,
  (SELECT COUNT(*) FROM public.session_questions WHERE session_id = s.id) as questions_count,
  (SELECT COUNT(*) FROM public.assessment_responses WHERE session_id = s.id) as responses_count
FROM public.assessment_sessions s
LEFT JOIN public.assessment_results r ON s.id = r.session_id
ORDER BY s.created_at DESC;
