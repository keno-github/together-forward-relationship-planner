-- =====================================================
-- MIGRATION 001: Fix RLS Policies
-- =====================================================
-- Date: 2025-11-14
-- Description: Fixes inconsistent DELETE policies and adds missing policies
-- Critical Issues Addressed:
--   - Milestones DELETE policy (allow partners)
--   - Tasks DELETE policy (allow partners)
--   - Achievements UPDATE/DELETE policies (missing)
--   - Roadmaps SELECT policy (validate shared_with array)
-- =====================================================

-- =====================================================
-- 1. Fix Milestones DELETE Policy
-- =====================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can delete milestones in their roadmaps" ON public.milestones;

-- Create new policy that allows both user_id and partner_id
CREATE POLICY "Users can delete milestones in their roadmaps"
  ON public.milestones FOR DELETE
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can delete milestones in their roadmaps" ON public.milestones IS
'Allows both roadmap owner and partner to delete milestones. Consistent with INSERT/UPDATE permissions.';

-- =====================================================
-- 2. Fix Tasks DELETE Policy
-- =====================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can delete tasks in their milestones" ON public.tasks;

-- Create new policy that allows both user_id and partner_id
CREATE POLICY "Users can delete tasks in their milestones"
  ON public.tasks FOR DELETE
  USING (
    milestone_id IN (
      SELECT m.id FROM public.milestones m
      JOIN public.roadmaps r ON m.roadmap_id = r.id
      WHERE r.user_id = auth.uid() OR r.partner_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can delete tasks in their milestones" ON public.tasks IS
'Allows both roadmap owner and partner to delete tasks. Consistent with INSERT/UPDATE permissions.';

-- =====================================================
-- 3. Add Achievements UPDATE Policy
-- =====================================================

CREATE POLICY "Users can update achievements in their roadmaps"
  ON public.achievements FOR UPDATE
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can update achievements in their roadmaps" ON public.achievements IS
'Allows both roadmap owner and partner to update achievements.';

-- =====================================================
-- 4. Add Achievements DELETE Policy
-- =====================================================

CREATE POLICY "Users can delete achievements in their roadmaps"
  ON public.achievements FOR DELETE
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can delete achievements in their roadmaps" ON public.achievements IS
'Allows both roadmap owner and partner to delete achievements.';

-- =====================================================
-- 5. Fix Roadmaps SELECT Policy (Add shared_with validation)
-- =====================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own roadmaps" ON public.roadmaps;

-- Create new policy that includes shared_with validation
CREATE POLICY "Users can view own roadmaps"
  ON public.roadmaps FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() = partner_id
    OR (
      -- Check if user's email is in the shared_with array
      SELECT email FROM auth.users WHERE id = auth.uid()
    ) = ANY(shared_with)
  );

COMMENT ON POLICY "Users can view own roadmaps" ON public.roadmaps IS
'Allows users to view roadmaps they own, are partnered with, or have been shared via email.';

-- =====================================================
-- 6. Add Conversation History UPDATE Policy (Optional)
-- =====================================================

CREATE POLICY "Users can update conversations in their roadmaps"
  ON public.conversation_history FOR UPDATE
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can update conversations in their roadmaps" ON public.conversation_history IS
'Allows editing of conversation history (e.g., for corrections or redactions).';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify policies are working correctly

-- Check all RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- Check which tables have RLS enabled
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================

-- To rollback this migration, run the original policies from supabase_schema.sql
-- Or run:
-- DROP POLICY IF EXISTS "policy_name" ON public.table_name;
-- Then re-create original policies

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 001: RLS Policy Fixes completed successfully';
  RAISE NOTICE 'Fixed DELETE policies for milestones and tasks';
  RAISE NOTICE 'Added UPDATE/DELETE policies for achievements';
  RAISE NOTICE 'Added shared_with validation to roadmaps SELECT policy';
END $$;
