-- =====================================================
-- ADD ROADMAP PHASE LINKING AND ASSIGNMENT TO TASKS
-- =====================================================
-- Run this SQL in your Supabase SQL Editor
-- This migration adds:
-- 1. roadmap_phase_index - links tasks to specific roadmap phases
-- 2. assigned_to - assigns tasks to specific partners
-- 3. priority - task priority (low, medium, high)
-- =====================================================

-- Add new columns to tasks table
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS roadmap_phase_index INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS assigned_to TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));

-- Add comment for clarity
COMMENT ON COLUMN public.tasks.roadmap_phase_index IS
'Index of the roadmap phase this task belongs to (from milestone.deep_dive_data.roadmapPhases array). NULL means task is not linked to a specific phase.';

COMMENT ON COLUMN public.tasks.assigned_to IS
'Name of the partner this task is assigned to. NULL means assigned to both partners.';

COMMENT ON COLUMN public.tasks.priority IS
'Priority level of the task: low, medium, or high';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_roadmap_phase ON public.tasks(milestone_id, roadmap_phase_index);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);

-- Migration complete
SELECT 'Migration completed: tasks table now supports roadmap phase linking and partner assignment' AS status;
