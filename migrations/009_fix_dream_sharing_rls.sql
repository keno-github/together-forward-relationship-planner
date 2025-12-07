-- =====================================================
-- Migration 009: Fix Dream Sharing RLS Policies
-- =====================================================
-- Fixes:
-- 1. RLS policies that were too restrictive
-- 2. Access to auth.users email was failing in subquery
-- 3. Make policies more permissive for valid use cases
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Roadmap owners can view sharing" ON public.dream_sharing;
DROP POLICY IF EXISTS "Roadmap owners can insert sharing" ON public.dream_sharing;
DROP POLICY IF EXISTS "Roadmap owners can update sharing" ON public.dream_sharing;
DROP POLICY IF EXISTS "Roadmap owners can delete sharing" ON public.dream_sharing;

-- Create a helper function to get current user email
-- This avoids the subquery issue with auth.users
CREATE OR REPLACE FUNCTION get_current_user_email()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT email FROM auth.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- SELECT: Users can view shares where:
-- 1. They own the roadmap
-- 2. They are the partner
-- 3. They were invited (by email)
-- 4. The share code exists (for public lookup before accepting)
CREATE POLICY "Users can view dream sharing"
  ON public.dream_sharing FOR SELECT
  USING (
    -- Roadmap owner
    EXISTS (SELECT 1 FROM public.roadmaps WHERE id = roadmap_id AND user_id = auth.uid())
    -- Or they are the partner
    OR partner_id = auth.uid()
    -- Or they were invited by email
    OR invited_email = get_current_user_email()
  );

-- INSERT: Only roadmap owners can create shares
CREATE POLICY "Roadmap owners can create sharing"
  ON public.dream_sharing FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.roadmaps WHERE id = roadmap_id AND user_id = auth.uid())
  );

-- UPDATE: Owners can update their shares, invited users can accept
CREATE POLICY "Users can update dream sharing"
  ON public.dream_sharing FOR UPDATE
  USING (
    -- Roadmap owner
    EXISTS (SELECT 1 FROM public.roadmaps WHERE id = roadmap_id AND user_id = auth.uid())
    -- Or they are the partner
    OR partner_id = auth.uid()
    -- Or they were invited and are accepting
    OR invited_email = get_current_user_email()
  );

-- DELETE: Only roadmap owners can delete
CREATE POLICY "Roadmap owners can delete sharing"
  ON public.dream_sharing FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.roadmaps WHERE id = roadmap_id AND user_id = auth.uid())
  );

-- Also update the accept_dream_share function to be more robust
CREATE OR REPLACE FUNCTION accept_dream_share(p_share_code TEXT)
RETURNS TABLE(
  success BOOLEAN,
  roadmap_id UUID,
  roadmap_title TEXT,
  message TEXT
) AS $$
DECLARE
  v_share RECORD;
  v_user_email TEXT;
  v_current_user_id UUID;
BEGIN
  -- Get current user info
  v_current_user_id := auth.uid();
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_current_user_id;

  -- Find the share invite (case insensitive code match)
  SELECT ds.*, r.title as rtitle, r.id as rid, r.user_id as owner_id
  INTO v_share
  FROM public.dream_sharing ds
  JOIN public.roadmaps r ON r.id = ds.roadmap_id
  WHERE UPPER(ds.share_code) = UPPER(p_share_code)
    AND ds.status = 'pending'
    AND (ds.expires_at IS NULL OR ds.expires_at > NOW());

  IF v_share IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 'Invalid or expired invite code'::TEXT;
    RETURN;
  END IF;

  -- Check if user is not the owner
  IF v_share.owner_id = v_current_user_id THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 'You cannot accept your own invite'::TEXT;
    RETURN;
  END IF;

  -- Check if email matches (if specific email was invited)
  IF v_share.invited_email IS NOT NULL AND LOWER(v_share.invited_email) != LOWER(v_user_email) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 'This invite was sent to a different email address'::TEXT;
    RETURN;
  END IF;

  -- Check if roadmap already has a different partner
  IF EXISTS (
    SELECT 1 FROM public.roadmaps
    WHERE id = v_share.rid
      AND partner_id IS NOT NULL
      AND partner_id != v_current_user_id
  ) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 'This dream already has a partner'::TEXT;
    RETURN;
  END IF;

  -- Update the share record
  UPDATE public.dream_sharing
  SET
    partner_id = v_current_user_id,
    status = 'accepted',
    accepted_at = NOW()
  WHERE id = v_share.id;

  -- Update the roadmap's partner_id
  UPDATE public.roadmaps
  SET partner_id = v_current_user_id
  WHERE id = v_share.rid;

  -- Create a notification for the roadmap owner
  PERFORM create_notification(
    v_share.owner_id,
    'partner_joined',
    'Your partner joined!',
    format('%s accepted your invite to "%s"', COALESCE(v_user_email, 'Your partner'), v_share.rtitle),
    v_share.rid,
    NULL,
    v_current_user_id,
    v_user_email,
    jsonb_build_object('roadmap_id', v_share.rid, 'roadmap_title', v_share.rtitle)
  );

  RETURN QUERY SELECT TRUE, v_share.rid, v_share.rtitle, 'Successfully joined the dream!'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the create_dream_share_invite to handle duplicates better
CREATE OR REPLACE FUNCTION create_dream_share_invite(
  p_roadmap_id UUID,
  p_invited_email TEXT DEFAULT NULL,
  p_message TEXT DEFAULT NULL
)
RETURNS TABLE(share_code TEXT, share_id UUID) AS $$
DECLARE
  v_share_code TEXT;
  v_share_id UUID;
  v_attempts INTEGER := 0;
  v_existing_share RECORD;
BEGIN
  -- Check if there's already a pending invite for this email/roadmap
  IF p_invited_email IS NOT NULL THEN
    SELECT id, dream_sharing.share_code INTO v_existing_share
    FROM public.dream_sharing
    WHERE roadmap_id = p_roadmap_id
      AND LOWER(invited_email) = LOWER(p_invited_email)
      AND status = 'pending';

    IF v_existing_share.id IS NOT NULL THEN
      -- Return existing share instead of creating duplicate
      RETURN QUERY SELECT v_existing_share.share_code, v_existing_share.id;
      RETURN;
    END IF;
  END IF;

  -- Check if there's already a link-only pending share (no email)
  IF p_invited_email IS NULL THEN
    SELECT id, dream_sharing.share_code INTO v_existing_share
    FROM public.dream_sharing
    WHERE roadmap_id = p_roadmap_id
      AND invited_email IS NULL
      AND status = 'pending'
      AND expires_at > NOW();

    IF v_existing_share.id IS NOT NULL THEN
      -- Return existing share code
      RETURN QUERY SELECT v_existing_share.share_code, v_existing_share.id;
      RETURN;
    END IF;
  END IF;

  -- Generate unique share code
  LOOP
    v_share_code := generate_share_code();
    v_attempts := v_attempts + 1;

    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM public.dream_sharing WHERE dream_sharing.share_code = v_share_code) THEN
      EXIT;
    END IF;

    -- Prevent infinite loop
    IF v_attempts > 10 THEN
      RAISE EXCEPTION 'Could not generate unique share code';
    END IF;
  END LOOP;

  -- Insert the sharing record
  INSERT INTO public.dream_sharing (
    roadmap_id,
    share_code,
    share_link_enabled,
    invited_by,
    invited_email,
    invitation_message,
    status
  ) VALUES (
    p_roadmap_id,
    v_share_code,
    TRUE,
    auth.uid(),
    p_invited_email,
    p_message,
    'pending'
  )
  RETURNING id INTO v_share_id;

  RETURN QUERY SELECT v_share_code, v_share_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Done! Run this migration in your Supabase SQL Editor
-- =====================================================
