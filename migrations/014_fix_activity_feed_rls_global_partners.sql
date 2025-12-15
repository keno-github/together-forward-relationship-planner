-- Migration: 014_fix_activity_feed_rls_global_partners.sql
-- Description: Updates activity_feed RLS policies to include global partners
--
-- Problem: The activity_feed RLS policies (created in 006) only check for
-- user_id and partner_id (per-dream partners). Global partners (from the
-- partnerships table, created in 012) cannot read or insert activities.
--
-- Solution: Update RLS policies to use the user_can_access_roadmap() helper
-- function which already handles all partner types correctly.
-- =====================================================

-- =====================================================
-- DROP OLD POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view activity for their roadmaps" ON public.activity_feed;
DROP POLICY IF EXISTS "Users can insert activity for their roadmaps" ON public.activity_feed;

-- =====================================================
-- CREATE UPDATED POLICIES
-- These policies include global partners via the partnerships table
-- =====================================================

-- SELECT: Users can view activities for roadmaps they have access to
-- This includes: own roadmaps, per-dream partner, global partner
CREATE POLICY "Users can view activity for accessible roadmaps"
  ON public.activity_feed FOR SELECT
  USING (
    -- User owns the roadmap
    roadmap_id IN (
      SELECT id FROM public.roadmaps WHERE user_id = auth.uid()
    )
    -- OR user is per-dream partner
    OR roadmap_id IN (
      SELECT id FROM public.roadmaps WHERE partner_id = auth.uid()
    )
    -- OR user is global partner with visibility enabled
    OR roadmap_id IN (
      SELECT r.id FROM public.roadmaps r
      WHERE r.visible_to_partner = TRUE
        AND EXISTS (
          SELECT 1 FROM public.partnerships p
          WHERE p.status = 'active'
            AND (
              (p.inviter_id = auth.uid() AND p.invitee_id = r.user_id)
              OR (p.invitee_id = auth.uid() AND p.inviter_id = r.user_id)
            )
        )
    )
  );

-- INSERT: Users can insert activities for roadmaps they have access to
CREATE POLICY "Users can insert activity for accessible roadmaps"
  ON public.activity_feed FOR INSERT
  WITH CHECK (
    -- User owns the roadmap
    roadmap_id IN (
      SELECT id FROM public.roadmaps WHERE user_id = auth.uid()
    )
    -- OR user is per-dream partner
    OR roadmap_id IN (
      SELECT id FROM public.roadmaps WHERE partner_id = auth.uid()
    )
    -- OR user is global partner with visibility enabled
    OR roadmap_id IN (
      SELECT r.id FROM public.roadmaps r
      WHERE r.visible_to_partner = TRUE
        AND EXISTS (
          SELECT 1 FROM public.partnerships p
          WHERE p.status = 'active'
            AND (
              (p.inviter_id = auth.uid() AND p.invitee_id = r.user_id)
              OR (p.invitee_id = auth.uid() AND p.inviter_id = r.user_id)
            )
        )
    )
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify policies exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'activity_feed'
    AND policyname = 'Users can view activity for accessible roadmaps'
  ) THEN
    RAISE EXCEPTION 'SELECT policy was not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'activity_feed'
    AND policyname = 'Users can insert activity for accessible roadmaps'
  ) THEN
    RAISE EXCEPTION 'INSERT policy was not created';
  END IF;

  RAISE NOTICE 'Migration 014 complete: activity_feed RLS policies updated for global partners';
END $$;

-- =====================================================
-- SUMMARY
-- =====================================================
--
-- Before this migration:
--   - Only dream owner (user_id) and per-dream partner (partner_id) could
--     read/write to activity_feed
--
-- After this migration:
--   - Dream owner can read/write activities
--   - Per-dream partner can read/write activities
--   - Global partner (via partnerships table) can read/write activities
--     (when visible_to_partner = TRUE)
--
-- =====================================================
