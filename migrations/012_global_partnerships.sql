-- Migration: 012_global_partnerships.sql
-- Description: Creates global partnerships table for formal couple relationships
--
-- This establishes a 1:1 partnership between two users that is independent
-- of individual dream sharing. Once a partnership is established, both
-- partners can see all of each other's dreams by default.
--
-- The dream_sharing table continues to exist for view-only sharing with
-- family/friends (non-partners).

-- =====================================================
-- CLEANUP (Safe to re-run)
-- =====================================================

-- Drop functions first (they may depend on table)
DROP FUNCTION IF EXISTS generate_partnership_code() CASCADE;
DROP FUNCTION IF EXISTS get_user_partnership(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_partnership_invite() CASCADE;
DROP FUNCTION IF EXISTS accept_partnership_invite(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS validate_partnership_code(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS cancel_partnership() CASCADE;
DROP FUNCTION IF EXISTS user_can_access_roadmap(UUID) CASCADE;
DROP FUNCTION IF EXISTS user_can_access_milestone(UUID) CASCADE;

-- Drop table (CASCADE removes indexes and policies)
DROP TABLE IF EXISTS public.partnerships CASCADE;

-- =====================================================
-- PARTNERSHIPS TABLE
-- =====================================================

CREATE TABLE public.partnerships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- The user who initiated the partnership invite
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- The user who received/accepted the invite (NULL until accepted)
  invitee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Unique invite code for establishing partnership
  invite_code VARCHAR(8) UNIQUE NOT NULL,

  -- Partnership status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'cancelled')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,  -- "Together Since" date
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent self-partnership
  CONSTRAINT check_not_self_partner CHECK (inviter_id != invitee_id)
);

-- Each user can only have ONE active/pending partnership as inviter
CREATE UNIQUE INDEX idx_partnerships_unique_inviter
  ON public.partnerships (inviter_id)
  WHERE status IN ('pending', 'active');

-- Each user can only be invitee in one ACTIVE partnership
CREATE UNIQUE INDEX idx_partnerships_unique_invitee
  ON public.partnerships (invitee_id)
  WHERE invitee_id IS NOT NULL AND status = 'active';

-- Index for status filtering (frequently queried)
CREATE INDEX idx_partnerships_status ON public.partnerships (status);

-- Index for fast invite code lookups
CREATE INDEX idx_partnerships_invite_code ON public.partnerships (invite_code);

-- Index for finding a user's partnership (as inviter or invitee)
CREATE INDEX idx_partnerships_users ON public.partnerships (inviter_id, invitee_id);

-- =====================================================
-- DREAM VISIBILITY CONTROL
-- =====================================================

-- Add visibility column to roadmaps for privacy control
ALTER TABLE public.roadmaps
  ADD COLUMN IF NOT EXISTS visible_to_partner BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.roadmaps.visible_to_partner IS
  'When FALSE, this dream is hidden from the partner (private mode)';

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Generate unique partnership invite code
CREATE OR REPLACE FUNCTION generate_partnership_code()
RETURNS VARCHAR(8)
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result VARCHAR(8) := '';
  i INTEGER;
  attempts INTEGER := 0;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;

    -- Check if code is unique
    IF NOT EXISTS (SELECT 1 FROM public.partnerships WHERE invite_code = result) THEN
      RETURN result;
    END IF;

    attempts := attempts + 1;
    IF attempts > 10 THEN
      RAISE EXCEPTION 'Could not generate unique partnership code';
    END IF;
  END LOOP;
END;
$$;

-- Get a user's active partnership
CREATE OR REPLACE FUNCTION get_user_partnership(user_id UUID)
RETURNS TABLE (
  partnership_id UUID,
  partner_id UUID,
  partner_email TEXT,
  partner_name TEXT,
  is_inviter BOOLEAN,
  together_since TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS partnership_id,
    CASE
      WHEN p.inviter_id = user_id THEN p.invitee_id
      ELSE p.inviter_id
    END AS partner_id,
    COALESCE(pr.email, u.email) AS partner_email,
    pr.full_name AS partner_name,
    (p.inviter_id = user_id) AS is_inviter,
    p.accepted_at AS together_since
  FROM public.partnerships p
  LEFT JOIN auth.users u ON u.id = CASE
    WHEN p.inviter_id = user_id THEN p.invitee_id
    ELSE p.inviter_id
  END
  LEFT JOIN public.profiles pr ON pr.id = CASE
    WHEN p.inviter_id = user_id THEN p.invitee_id
    ELSE p.inviter_id
  END
  WHERE (p.inviter_id = user_id OR p.invitee_id = user_id)
    AND p.status = 'active';
END;
$$;

-- Create a partnership invite
CREATE OR REPLACE FUNCTION create_partnership_invite()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_existing_partnership UUID;
  v_invite_code VARCHAR(8);
  v_partnership_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check if user already has an active partnership
  SELECT id INTO v_existing_partnership
  FROM public.partnerships
  WHERE (inviter_id = v_user_id OR invitee_id = v_user_id)
    AND status = 'active';

  IF v_existing_partnership IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'You already have an active partnership');
  END IF;

  -- Check if user has a pending invite they sent
  SELECT id, invite_code INTO v_partnership_id, v_invite_code
  FROM public.partnerships
  WHERE inviter_id = v_user_id AND status = 'pending';

  IF v_partnership_id IS NOT NULL THEN
    -- Return existing pending invite
    RETURN json_build_object(
      'success', true,
      'partnership_id', v_partnership_id,
      'invite_code', v_invite_code,
      'message', 'Existing invite returned'
    );
  END IF;

  -- Generate new invite code
  v_invite_code := generate_partnership_code();

  -- Create new partnership invite
  INSERT INTO public.partnerships (inviter_id, invite_code, status)
  VALUES (v_user_id, v_invite_code, 'pending')
  RETURNING id INTO v_partnership_id;

  RETURN json_build_object(
    'success', true,
    'partnership_id', v_partnership_id,
    'invite_code', v_invite_code,
    'message', 'Partnership invite created'
  );
END;
$$;

-- Accept a partnership invite
CREATE OR REPLACE FUNCTION accept_partnership_invite(p_invite_code VARCHAR(8))
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_partnership RECORD;
  v_existing_partnership UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Find the partnership invite
  SELECT * INTO v_partnership
  FROM public.partnerships
  WHERE UPPER(invite_code) = UPPER(p_invite_code);

  IF v_partnership IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid invite code');
  END IF;

  IF v_partnership.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'This invite is no longer valid');
  END IF;

  IF v_partnership.inviter_id = v_user_id THEN
    RETURN json_build_object('success', false, 'error', 'You cannot accept your own invite');
  END IF;

  -- Check if user already has an active partnership
  SELECT id INTO v_existing_partnership
  FROM public.partnerships
  WHERE (inviter_id = v_user_id OR invitee_id = v_user_id)
    AND status = 'active';

  IF v_existing_partnership IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'You already have an active partnership');
  END IF;

  -- Accept the partnership
  UPDATE public.partnerships
  SET
    invitee_id = v_user_id,
    status = 'active',
    accepted_at = NOW(),
    updated_at = NOW()
  WHERE id = v_partnership.id;

  -- Create notification for inviter
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    v_partnership.inviter_id,
    'partner_joined',
    'Partner Connected!',
    'Your partner has accepted your invite. You can now plan together!',
    json_build_object('partnership_id', v_partnership.id)
  );

  RETURN json_build_object(
    'success', true,
    'partnership_id', v_partnership.id,
    'partner_id', v_partnership.inviter_id,
    'message', 'Partnership established!'
  );
END;
$$;

-- Validate a partnership invite code (for pre-accept checking)
CREATE OR REPLACE FUNCTION validate_partnership_code(p_invite_code VARCHAR(8))
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_partnership RECORD;
BEGIN
  -- Find the partnership invite (case-insensitive)
  SELECT id, status, inviter_id INTO v_partnership
  FROM public.partnerships
  WHERE UPPER(invite_code) = UPPER(p_invite_code);

  IF v_partnership IS NULL THEN
    RETURN json_build_object('valid', false, 'reason', 'Invalid invite code');
  END IF;

  IF v_partnership.status != 'pending' THEN
    RETURN json_build_object('valid', false, 'reason', 'This invite is no longer valid');
  END IF;

  -- Don't expose inviter_id for privacy - just confirm it's valid
  RETURN json_build_object('valid', true);
END;
$$;

-- Cancel a partnership (either partner can do this)
CREATE OR REPLACE FUNCTION cancel_partnership()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_partnership RECORD;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Find user's partnership
  SELECT * INTO v_partnership
  FROM public.partnerships
  WHERE (inviter_id = v_user_id OR invitee_id = v_user_id)
    AND status IN ('pending', 'active');

  IF v_partnership IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No active partnership found');
  END IF;

  -- Cancel the partnership
  UPDATE public.partnerships
  SET
    status = 'cancelled',
    updated_at = NOW()
  WHERE id = v_partnership.id;

  RETURN json_build_object(
    'success', true,
    'message', 'Partnership cancelled'
  );
END;
$$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;

-- Users can see partnerships they're part of
-- Note: Code validation is done via RPC with SECURITY DEFINER, not direct table access
CREATE POLICY "Users can view own partnerships"
  ON public.partnerships FOR SELECT
  USING (
    auth.uid() = inviter_id
    OR auth.uid() = invitee_id
  );

-- Only the inviter can insert (via RPC)
CREATE POLICY "Users can create partnership invites"
  ON public.partnerships FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

-- Users can update partnerships they're part of
CREATE POLICY "Users can update own partnerships"
  ON public.partnerships FOR UPDATE
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- =====================================================
-- UPDATE ROADMAPS RLS FOR PARTNER ACCESS
-- =====================================================

-- Drop existing select policy if it exists
DROP POLICY IF EXISTS "Users can view own roadmaps" ON public.roadmaps;
DROP POLICY IF EXISTS "Users can view own or partner roadmaps" ON public.roadmaps;

-- Create new policy that includes partner access via partnerships table
CREATE POLICY "Users can view own or partner roadmaps"
  ON public.roadmaps FOR SELECT
  USING (
    -- User owns the roadmap
    auth.uid() = user_id
    -- OR user is partner via dream_sharing (existing per-dream sharing)
    OR auth.uid() = partner_id
    -- OR user is global partner AND dream is visible to partner
    OR (
      visible_to_partner = TRUE
      AND EXISTS (
        SELECT 1 FROM public.partnerships p
        WHERE p.status = 'active'
          AND (
            (p.inviter_id = auth.uid() AND p.invitee_id = roadmaps.user_id)
            OR (p.invitee_id = auth.uid() AND p.inviter_id = roadmaps.user_id)
          )
      )
    )
  );

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update own roadmaps" ON public.roadmaps;
DROP POLICY IF EXISTS "Users can update own or partner roadmaps" ON public.roadmaps;

-- Partners can edit each other's dreams (if visible_to_partner = true)
CREATE POLICY "Users can update own or partner roadmaps"
  ON public.roadmaps FOR UPDATE
  USING (
    -- User owns the roadmap
    auth.uid() = user_id
    -- OR user is partner via dream_sharing (existing per-dream sharing)
    OR auth.uid() = partner_id
    -- OR user is global partner AND dream is visible to partner
    OR (
      visible_to_partner = TRUE
      AND EXISTS (
        SELECT 1 FROM public.partnerships p
        WHERE p.status = 'active'
          AND (
            (p.inviter_id = auth.uid() AND p.invitee_id = roadmaps.user_id)
            OR (p.invitee_id = auth.uid() AND p.inviter_id = roadmaps.user_id)
          )
      )
    )
  );

-- =====================================================
-- UPDATE MILESTONES RLS FOR PARTNER ACCESS
-- =====================================================

-- Helper function to check if user has access to a roadmap (owner, per-dream partner, or global partner)
CREATE OR REPLACE FUNCTION user_can_access_roadmap(p_roadmap_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.roadmaps r
    WHERE r.id = p_roadmap_id
      AND (
        r.user_id = auth.uid()
        OR r.partner_id = auth.uid()
        OR (
          r.visible_to_partner = TRUE
          AND EXISTS (
            SELECT 1 FROM public.partnerships p
            WHERE p.status = 'active'
              AND (
                (p.inviter_id = auth.uid() AND p.invitee_id = r.user_id)
                OR (p.invitee_id = auth.uid() AND p.inviter_id = r.user_id)
              )
          )
        )
      )
  );
$$;

-- Drop and recreate milestones policies
DROP POLICY IF EXISTS "Users can view milestones in their roadmaps" ON public.milestones;
DROP POLICY IF EXISTS "Users can insert milestones in their roadmaps" ON public.milestones;
DROP POLICY IF EXISTS "Users can update milestones in their roadmaps" ON public.milestones;
DROP POLICY IF EXISTS "Users can delete milestones in their roadmaps" ON public.milestones;

CREATE POLICY "Users can view milestones in their roadmaps"
  ON public.milestones FOR SELECT
  USING (user_can_access_roadmap(roadmap_id));

CREATE POLICY "Users can insert milestones in their roadmaps"
  ON public.milestones FOR INSERT
  WITH CHECK (user_can_access_roadmap(roadmap_id));

CREATE POLICY "Users can update milestones in their roadmaps"
  ON public.milestones FOR UPDATE
  USING (user_can_access_roadmap(roadmap_id));

CREATE POLICY "Users can delete milestones in their roadmaps"
  ON public.milestones FOR DELETE
  USING (user_can_access_roadmap(roadmap_id));

-- =====================================================
-- UPDATE TASKS RLS FOR PARTNER ACCESS
-- =====================================================

-- Helper function to check if user has access to a milestone's roadmap
CREATE OR REPLACE FUNCTION user_can_access_milestone(p_milestone_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.milestones m
    JOIN public.roadmaps r ON m.roadmap_id = r.id
    WHERE m.id = p_milestone_id
      AND (
        r.user_id = auth.uid()
        OR r.partner_id = auth.uid()
        OR (
          r.visible_to_partner = TRUE
          AND EXISTS (
            SELECT 1 FROM public.partnerships p
            WHERE p.status = 'active'
              AND (
                (p.inviter_id = auth.uid() AND p.invitee_id = r.user_id)
                OR (p.invitee_id = auth.uid() AND p.inviter_id = r.user_id)
              )
          )
        )
      )
  );
$$;

-- Drop and recreate tasks policies
DROP POLICY IF EXISTS "Users can view tasks in their milestones" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert tasks in their milestones" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks in their milestones" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their milestones" ON public.tasks;

CREATE POLICY "Users can view tasks in their milestones"
  ON public.tasks FOR SELECT
  USING (user_can_access_milestone(milestone_id));

CREATE POLICY "Users can insert tasks in their milestones"
  ON public.tasks FOR INSERT
  WITH CHECK (user_can_access_milestone(milestone_id));

CREATE POLICY "Users can update tasks in their milestones"
  ON public.tasks FOR UPDATE
  USING (user_can_access_milestone(milestone_id));

CREATE POLICY "Users can delete tasks in their milestones"
  ON public.tasks FOR DELETE
  USING (user_can_access_milestone(milestone_id));

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION user_can_access_roadmap(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_can_access_milestone(UUID) TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.partnerships TO authenticated;
GRANT EXECUTE ON FUNCTION generate_partnership_code() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_partnership(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_partnership_invite() TO authenticated;
GRANT EXECUTE ON FUNCTION accept_partnership_invite(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_partnership_code(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_partnership() TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.partnerships IS
  'Global partnership relationships between couples. One-to-one, formal relationship that grants mutual dream visibility.';

COMMENT ON FUNCTION create_partnership_invite() IS
  'Creates a partnership invite code. Returns existing pending invite if one exists.';

COMMENT ON FUNCTION accept_partnership_invite(VARCHAR) IS
  'Accepts a partnership invite using the invite code. Establishes the formal partnership.';

COMMENT ON FUNCTION get_user_partnership(UUID) IS
  'Returns the active partnership for a user, including partner details.';
