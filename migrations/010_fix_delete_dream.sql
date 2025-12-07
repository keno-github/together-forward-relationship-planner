-- =====================================================
-- Migration 010: Fix Delete Dream Functionality
-- =====================================================
-- Fixes:
-- 1. Allow partner to delete roadmap (not just owner)
-- 2. Ensure proper cascade deletion
-- 3. Clean up related records
-- =====================================================

-- Drop existing delete policy for roadmaps
DROP POLICY IF EXISTS "Users can delete own roadmaps" ON public.roadmaps;

-- Create new policy that allows both owner AND partner to delete
CREATE POLICY "Users can delete own or partnered roadmaps"
  ON public.roadmaps FOR DELETE
  USING (
    auth.uid() = user_id
    OR auth.uid() = partner_id
  );

-- Ensure dream_sharing records are cleaned up when roadmap is deleted
-- (should already cascade, but let's make sure)
ALTER TABLE public.dream_sharing
  DROP CONSTRAINT IF EXISTS dream_sharing_roadmap_id_fkey;

ALTER TABLE public.dream_sharing
  ADD CONSTRAINT dream_sharing_roadmap_id_fkey
  FOREIGN KEY (roadmap_id)
  REFERENCES public.roadmaps(id)
  ON DELETE CASCADE;

-- Ensure activity_feed records are cleaned up
ALTER TABLE public.activity_feed
  DROP CONSTRAINT IF EXISTS activity_feed_roadmap_id_fkey;

ALTER TABLE public.activity_feed
  ADD CONSTRAINT activity_feed_roadmap_id_fkey
  FOREIGN KEY (roadmap_id)
  REFERENCES public.roadmaps(id)
  ON DELETE CASCADE;

-- Ensure nudges are cleaned up when tasks are deleted
-- (tasks cascade from milestones, milestones cascade from roadmaps)
ALTER TABLE public.nudges
  DROP CONSTRAINT IF EXISTS nudges_task_id_fkey;

ALTER TABLE public.nudges
  ADD CONSTRAINT nudges_task_id_fkey
  FOREIGN KEY (task_id)
  REFERENCES public.tasks(id)
  ON DELETE CASCADE;

-- Ensure notifications related to roadmap are cleaned up
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_roadmap_id_fkey;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_roadmap_id_fkey
  FOREIGN KEY (roadmap_id)
  REFERENCES public.roadmaps(id)
  ON DELETE CASCADE;

-- =====================================================
-- Summary of CASCADE chain when roadmap is deleted:
--
-- roadmaps (DELETE)
--   ├── milestones (CASCADE)
--   │     ├── tasks (CASCADE)
--   │     │     └── nudges (CASCADE)
--   │     └── expenses (SET NULL on milestone_id)
--   ├── expenses (CASCADE on roadmap_id)
--   ├── dream_sharing (CASCADE)
--   ├── activity_feed (CASCADE)
--   └── notifications (CASCADE)
-- =====================================================
