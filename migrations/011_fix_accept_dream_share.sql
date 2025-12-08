-- =====================================================
-- Migration 011: Fix Accept Dream Share Function
-- =====================================================
-- Fixes:
-- 1. Handle notification creation errors gracefully
-- 2. Don't fail the entire accept if notification fails
-- =====================================================

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

  IF v_current_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 'User not authenticated'::TEXT;
    RETURN;
  END IF;

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

  -- Try to create a notification, but don't fail if it doesn't work
  BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    -- Log but don't fail - notification is nice-to-have
    RAISE NOTICE 'Failed to create notification: %', SQLERRM;
  END;

  RETURN QUERY SELECT TRUE, v_share.rid, v_share.rtitle, 'Successfully joined the dream!'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Done! Run this migration in your Supabase SQL Editor
-- =====================================================
