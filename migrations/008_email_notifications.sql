-- Migration: 008_email_notifications.sql
-- Email notification system with queue, templates, and triggers
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. EMAIL QUEUE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL,
  template_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Index for queue processing
CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled
ON public.email_queue(status, scheduled_for)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_email_queue_recipient
ON public.email_queue(recipient_user_id);

-- ============================================
-- 2. EMAIL LOG TABLE (sent email history)
-- ============================================

CREATE TABLE IF NOT EXISTS public.email_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_id UUID REFERENCES public.email_queue(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL,
  subject TEXT,
  resend_id TEXT,
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_email_log_recipient
ON public.email_log(recipient_user_id);

CREATE INDEX IF NOT EXISTS idx_email_log_type
ON public.email_log(email_type);

-- ============================================
-- 3. ADD EMAIL PREFERENCES TO NOTIFICATION_PREFERENCES
-- ============================================

DO $$
BEGIN
  -- Add email preference columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'notification_preferences'
                 AND column_name = 'email_task_assigned') THEN
    ALTER TABLE public.notification_preferences
    ADD COLUMN email_task_assigned BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'notification_preferences'
                 AND column_name = 'email_task_completed') THEN
    ALTER TABLE public.notification_preferences
    ADD COLUMN email_task_completed BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'notification_preferences'
                 AND column_name = 'email_nudges') THEN
    ALTER TABLE public.notification_preferences
    ADD COLUMN email_nudges BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'notification_preferences'
                 AND column_name = 'email_partner_activity') THEN
    ALTER TABLE public.notification_preferences
    ADD COLUMN email_partner_activity BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- ============================================
-- 4. RLS POLICIES
-- ============================================

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own queued emails
DROP POLICY IF EXISTS "Users can view own email queue" ON public.email_queue;
CREATE POLICY "Users can view own email queue" ON public.email_queue
  FOR SELECT USING (auth.uid() = recipient_user_id);

-- Users can view their own email history
DROP POLICY IF EXISTS "Users can view own email log" ON public.email_log;
CREATE POLICY "Users can view own email log" ON public.email_log
  FOR SELECT USING (auth.uid() = recipient_user_id);

-- Service role can do everything (for Edge Functions)
DROP POLICY IF EXISTS "Service role full access to email_queue" ON public.email_queue;
CREATE POLICY "Service role full access to email_queue" ON public.email_queue
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access to email_log" ON public.email_log;
CREATE POLICY "Service role full access to email_log" ON public.email_log
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function to queue an email
CREATE OR REPLACE FUNCTION public.queue_email(
  p_recipient_email TEXT,
  p_recipient_user_id UUID,
  p_email_type TEXT,
  p_template_data JSONB,
  p_scheduled_for TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email_id UUID;
  v_email_enabled BOOLEAN;
  v_type_enabled BOOLEAN;
BEGIN
  -- Check if user has emails enabled
  IF p_recipient_user_id IS NOT NULL THEN
    SELECT
      COALESCE(np.email_enabled, TRUE),
      CASE p_email_type
        WHEN 'task_assigned' THEN COALESCE(np.email_task_assigned, TRUE)
        WHEN 'task_completed' THEN COALESCE(np.email_task_completed, TRUE)
        WHEN 'nudge' THEN COALESCE(np.email_nudges, TRUE)
        WHEN 'partner_activity' THEN COALESCE(np.email_partner_activity, TRUE)
        WHEN 'weekly_digest' THEN COALESCE(np.email_weekly_digest, TRUE)
        ELSE TRUE
      END
    INTO v_email_enabled, v_type_enabled
    FROM public.notification_preferences np
    WHERE np.user_id = p_recipient_user_id;

    -- Default to enabled if no preferences exist
    v_email_enabled := COALESCE(v_email_enabled, TRUE);
    v_type_enabled := COALESCE(v_type_enabled, TRUE);

    -- Don't queue if disabled
    IF NOT v_email_enabled OR NOT v_type_enabled THEN
      RETURN NULL;
    END IF;
  END IF;

  -- Insert into queue
  INSERT INTO public.email_queue (
    recipient_email,
    recipient_user_id,
    email_type,
    template_data,
    scheduled_for
  ) VALUES (
    p_recipient_email,
    p_recipient_user_id,
    p_email_type,
    p_template_data,
    p_scheduled_for
  )
  RETURNING id INTO v_email_id;

  RETURN v_email_id;
END;
$$;

-- Function to get pending emails for processing
CREATE OR REPLACE FUNCTION public.get_pending_emails(batch_size INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  recipient_email TEXT,
  recipient_user_id UUID,
  email_type TEXT,
  template_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.email_queue eq
  SET
    status = 'processing',
    processed_at = NOW()
  WHERE eq.id IN (
    SELECT eq2.id
    FROM public.email_queue eq2
    WHERE eq2.status = 'pending'
      AND eq2.scheduled_for <= NOW()
      AND eq2.retry_count < eq2.max_retries
    ORDER BY eq2.scheduled_for
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING
    eq.id,
    eq.recipient_email,
    eq.recipient_user_id,
    eq.email_type,
    eq.template_data;
END;
$$;

-- Function to mark email as sent
CREATE OR REPLACE FUNCTION public.mark_email_sent(
  p_queue_id UUID,
  p_resend_id TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email RECORD;
BEGIN
  -- Get email details
  SELECT * INTO v_email
  FROM public.email_queue
  WHERE id = p_queue_id;

  IF v_email IS NULL THEN
    RETURN;
  END IF;

  -- Update queue status
  UPDATE public.email_queue
  SET status = 'sent', processed_at = NOW()
  WHERE id = p_queue_id;

  -- Log the sent email
  INSERT INTO public.email_log (
    queue_id,
    recipient_email,
    recipient_user_id,
    email_type,
    resend_id,
    status,
    metadata
  ) VALUES (
    p_queue_id,
    v_email.recipient_email,
    v_email.recipient_user_id,
    v_email.email_type,
    p_resend_id,
    'sent',
    v_email.template_data
  );
END;
$$;

-- Function to mark email as failed
CREATE OR REPLACE FUNCTION public.mark_email_failed(
  p_queue_id UUID,
  p_error TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.email_queue
  SET
    status = CASE
      WHEN retry_count + 1 >= max_retries THEN 'failed'
      ELSE 'pending'
    END,
    retry_count = retry_count + 1,
    error_message = p_error,
    scheduled_for = CASE
      WHEN retry_count + 1 >= max_retries THEN scheduled_for
      ELSE NOW() + INTERVAL '5 minutes' * (retry_count + 1)
    END
  WHERE id = p_queue_id;
END;
$$;

-- ============================================
-- 6. EMAIL TRIGGER FUNCTIONS
-- ============================================

-- Trigger function for partner invite emails
CREATE OR REPLACE FUNCTION public.trigger_partner_invite_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_roadmap RECORD;
  v_inviter RECORD;
BEGIN
  -- Only process new pending invites with email
  IF NEW.invited_email IS NULL OR NEW.status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- Get roadmap details
  SELECT r.*, p.full_name as owner_name, p.email as owner_email
  INTO v_roadmap
  FROM public.roadmaps r
  LEFT JOIN public.profiles p ON p.id = r.user_id
  WHERE r.id = NEW.roadmap_id;

  IF v_roadmap IS NULL THEN
    RETURN NEW;
  END IF;

  -- Queue the invite email
  PERFORM public.queue_email(
    NEW.invited_email,
    NULL,
    'partner_invite',
    jsonb_build_object(
      'inviter_name', COALESCE(v_roadmap.owner_name, 'Your partner'),
      'inviter_email', v_roadmap.owner_email,
      'dream_title', v_roadmap.title,
      'share_code', NEW.share_code,
      'invite_url', 'https://twogetherforward.com/invite/' || NEW.share_code
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger for partner invites
DROP TRIGGER IF EXISTS on_dream_sharing_invite ON public.dream_sharing;
CREATE TRIGGER on_dream_sharing_invite
  AFTER INSERT ON public.dream_sharing
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_partner_invite_email();

-- Trigger function for partner joined notification
CREATE OR REPLACE FUNCTION public.trigger_partner_joined_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_roadmap RECORD;
  v_partner RECORD;
BEGIN
  -- Only process when status changes to accepted
  IF NEW.status != 'accepted' OR OLD.status = 'accepted' THEN
    RETURN NEW;
  END IF;

  -- Get roadmap and owner
  SELECT r.*, p.full_name as owner_name, p.email as owner_email
  INTO v_roadmap
  FROM public.roadmaps r
  LEFT JOIN public.profiles p ON p.id = r.user_id
  WHERE r.id = NEW.roadmap_id;

  -- Get partner details
  SELECT full_name, email
  INTO v_partner
  FROM public.profiles
  WHERE id = NEW.partner_id;

  IF v_roadmap IS NULL OR v_partner IS NULL THEN
    RETURN NEW;
  END IF;

  -- Queue email to roadmap owner
  PERFORM public.queue_email(
    v_roadmap.owner_email,
    v_roadmap.user_id,
    'partner_joined',
    jsonb_build_object(
      'partner_name', COALESCE(v_partner.full_name, 'Your partner'),
      'dream_title', v_roadmap.title,
      'dashboard_url', 'https://twogetherforward.com/dashboard'
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger for partner joined
DROP TRIGGER IF EXISTS on_partner_joined ON public.dream_sharing;
CREATE TRIGGER on_partner_joined
  AFTER UPDATE ON public.dream_sharing
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_partner_joined_email();

-- Trigger function for task assigned emails
CREATE OR REPLACE FUNCTION public.trigger_task_assigned_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignee RECORD;
  v_assigner RECORD;
  v_milestone RECORD;
  v_roadmap RECORD;
BEGIN
  -- Check if this is meaningful - assigned_to_user_id must be set
  IF NEW.assigned_to_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- For UPDATE, only proceed if assignment actually changed
  IF TG_OP = 'UPDATE' AND OLD.assigned_to_user_id IS NOT DISTINCT FROM NEW.assigned_to_user_id THEN
    RETURN NEW;
  END IF;

  -- Get assignee details
  SELECT id, full_name, email
  INTO v_assignee
  FROM public.profiles
  WHERE id = NEW.assigned_to_user_id;

  IF v_assignee IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get milestone and roadmap info
  SELECT m.*, r.title as roadmap_title, r.user_id as roadmap_owner_id
  INTO v_milestone
  FROM public.milestones m
  JOIN public.roadmaps r ON r.id = m.roadmap_id
  WHERE m.id = NEW.milestone_id;

  -- Get assigner name (current user or roadmap owner)
  SELECT full_name INTO v_assigner
  FROM public.profiles
  WHERE id = COALESCE(auth.uid(), v_milestone.roadmap_owner_id);

  -- Queue the email
  PERFORM public.queue_email(
    v_assignee.email,
    v_assignee.id,
    'task_assigned',
    jsonb_build_object(
      'assignee_name', COALESCE(v_assignee.full_name, 'there'),
      'assigner_name', COALESCE(v_assigner.full_name, 'Your partner'),
      'task_title', NEW.title,
      'task_description', NEW.description,
      'due_date', NEW.due_date,
      'milestone_title', v_milestone.title,
      'dream_title', v_milestone.roadmap_title,
      'task_url', 'https://twogetherforward.com/dashboard'
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger for task assignment
DROP TRIGGER IF EXISTS on_task_assigned ON public.tasks;
CREATE TRIGGER on_task_assigned
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  WHEN (NEW.assigned_to_user_id IS NOT NULL)
  EXECUTE FUNCTION public.trigger_task_assigned_email();

-- Trigger function for nudge emails
CREATE OR REPLACE FUNCTION public.trigger_nudge_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recipient RECORD;
  v_sender RECORD;
  v_task RECORD;
BEGIN
  -- Get recipient details
  SELECT id, full_name, email
  INTO v_recipient
  FROM public.profiles
  WHERE id = NEW.recipient_id;

  -- Get sender details
  SELECT full_name
  INTO v_sender
  FROM public.profiles
  WHERE id = NEW.sender_id;

  -- Get task details
  SELECT t.*, m.title as milestone_title, r.title as roadmap_title
  INTO v_task
  FROM public.tasks t
  JOIN public.milestones m ON m.id = t.milestone_id
  JOIN public.roadmaps r ON r.id = m.roadmap_id
  WHERE t.id = NEW.task_id;

  IF v_recipient IS NULL OR v_task IS NULL THEN
    RETURN NEW;
  END IF;

  -- Queue the nudge email
  PERFORM public.queue_email(
    v_recipient.email,
    v_recipient.id,
    'nudge',
    jsonb_build_object(
      'recipient_name', COALESCE(v_recipient.full_name, 'there'),
      'sender_name', COALESCE(v_sender.full_name, 'Your partner'),
      'task_title', v_task.title,
      'nudge_message', NEW.message,
      'dream_title', v_task.roadmap_title,
      'task_url', 'https://twogetherforward.com/dashboard'
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger for nudges
DROP TRIGGER IF EXISTS on_nudge_created ON public.nudges;
CREATE TRIGGER on_nudge_created
  AFTER INSERT ON public.nudges
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_nudge_email();

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.email_queue TO authenticated;
GRANT SELECT ON public.email_log TO authenticated;

GRANT EXECUTE ON FUNCTION public.queue_email TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_emails TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_email_sent TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_email_failed TO service_role;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next steps:
-- 1. Set RESEND_API_KEY in Supabase Edge Function secrets
-- 2. Set APP_URL secret (e.g., https://twogetherforward.com)
-- 3. Deploy Edge Functions: send-email, process-email-queue, weekly-digest
-- 4. Set up cron jobs for queue processing and weekly digest
