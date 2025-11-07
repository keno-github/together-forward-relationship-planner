-- =====================================================
-- TOGETHERFORWARD SUPABASE DATABASE SCHEMA
-- =====================================================
-- Run this SQL in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste this → Run
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE (User profiles)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  partner_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. ROADMAPS TABLE (Main roadmap for each couple)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.roadmaps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT DEFAULT 'Our Journey Together',
  partner1_name TEXT,
  partner2_name TEXT,
  location TEXT,
  location_data JSONB, -- Store location details
  compatibility_score INTEGER,
  compatibility_data JSONB, -- Store full compatibility results
  xp_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shared_with TEXT[] DEFAULT '{}' -- Array of emails with access
);

-- Enable RLS
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;

-- Policies for roadmaps
CREATE POLICY "Users can view own roadmaps"
  ON public.roadmaps FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = partner_id);

CREATE POLICY "Users can create own roadmaps"
  ON public.roadmaps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own roadmaps"
  ON public.roadmaps FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = partner_id);

CREATE POLICY "Users can delete own roadmaps"
  ON public.roadmaps FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 3. MILESTONES TABLE (Goals/milestones in a roadmap)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- emoji or icon name
  color TEXT, -- Tailwind class or hex
  category TEXT, -- relationship, home, financial, travel
  estimated_cost NUMERIC DEFAULT 0,
  duration TEXT, -- e.g., "12-18 months"
  order_index INTEGER DEFAULT 0,
  ai_generated BOOLEAN DEFAULT FALSE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  deep_dive_data JSONB, -- Store all deep dive details
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- Policies for milestones
CREATE POLICY "Users can view milestones in their roadmaps"
  ON public.milestones FOR SELECT
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert milestones in their roadmaps"
  ON public.milestones FOR INSERT
  WITH CHECK (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update milestones in their roadmaps"
  ON public.milestones FOR UPDATE
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete milestones in their roadmaps"
  ON public.milestones FOR DELETE
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. TASKS TABLE (Tasks within milestones)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  order_index INTEGER DEFAULT 0,
  due_date DATE,
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policies for tasks
CREATE POLICY "Users can view tasks in their milestones"
  ON public.tasks FOR SELECT
  USING (
    milestone_id IN (
      SELECT m.id FROM public.milestones m
      JOIN public.roadmaps r ON m.roadmap_id = r.id
      WHERE r.user_id = auth.uid() OR r.partner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tasks in their milestones"
  ON public.tasks FOR INSERT
  WITH CHECK (
    milestone_id IN (
      SELECT m.id FROM public.milestones m
      JOIN public.roadmaps r ON m.roadmap_id = r.id
      WHERE r.user_id = auth.uid() OR r.partner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks in their milestones"
  ON public.tasks FOR UPDATE
  USING (
    milestone_id IN (
      SELECT m.id FROM public.milestones m
      JOIN public.roadmaps r ON m.roadmap_id = r.id
      WHERE r.user_id = auth.uid() OR r.partner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks in their milestones"
  ON public.tasks FOR DELETE
  USING (
    milestone_id IN (
      SELECT m.id FROM public.milestones m
      JOIN public.roadmaps r ON m.roadmap_id = r.id
      WHERE r.user_id = auth.uid()
    )
  );

-- =====================================================
-- 5. ACHIEVEMENTS TABLE (Gamification)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Policies for achievements
CREATE POLICY "Users can view achievements in their roadmaps"
  ON public.achievements FOR SELECT
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert achievements in their roadmaps"
  ON public.achievements FOR INSERT
  WITH CHECK (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

-- =====================================================
-- 6. CONVERSATION_HISTORY TABLE (Luna chat logs)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.conversation_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.conversation_history ENABLE ROW LEVEL SECURITY;

-- Policies for conversation history
CREATE POLICY "Users can view conversations in their roadmaps"
  ON public.conversation_history FOR SELECT
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert conversations in their roadmaps"
  ON public.conversation_history FOR INSERT
  WITH CHECK (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

-- =====================================================
-- 7. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_roadmaps
  BEFORE UPDATE ON public.roadmaps
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_milestones
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_tasks
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 8. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON public.roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_partner_id ON public.roadmaps(partner_id);
CREATE INDEX IF NOT EXISTS idx_milestones_roadmap_id ON public.milestones(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_tasks_milestone_id ON public.tasks(milestone_id);
CREATE INDEX IF NOT EXISTS idx_achievements_roadmap_id ON public.achievements(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_conversation_roadmap_id ON public.conversation_history(roadmap_id);

-- =====================================================
-- DONE! Your database is ready to use! 🎉
-- =====================================================
-- Next steps:
-- 1. Go to Authentication → Providers → Enable Email and Google
-- 2. Go to Storage → Create a bucket called "roadmap-files"
-- 3. Set bucket to public or create access policies
-- =====================================================
