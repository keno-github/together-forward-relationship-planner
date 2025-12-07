-- =====================================================
-- Migration 006: Partner System & Notifications
-- =====================================================
-- Creates tables for:
-- 1. notifications - In-app notification storage
-- 2. push_subscriptions - Browser push tokens
-- 3. notification_preferences - User settings
-- 4. activity_feed - Timeline of partner actions
-- 5. dream_sharing - Per-dream access control
-- 6. nudges - Partner nudge tracking
-- =====================================================

-- =====================================================
-- 1. NOTIFICATIONS TABLE
-- =====================================================
-- Drop and recreate to ensure correct schema
DROP TABLE IF EXISTS public.notifications CASCADE;
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,

  -- Notification Content
  type TEXT NOT NULL CHECK (type IN (
    'task_created', 'task_completed', 'task_assigned',
    'dream_shared', 'dream_accepted', 'partner_joined', 'partner_left',
    'budget_updated', 'expense_added', 'expense_paid',
    'nudge_received', 'reminder', 'milestone_completed',
    'comment_added', 'mention', 'weekly_digest'
  )),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}', -- Additional context (task_id, actor_name, etc.)

  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  dismissed BOOLEAN DEFAULT FALSE,

  -- Source
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT, -- Cached for display even if actor deleted

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_roadmap
  ON public.notifications(roadmap_id);

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true); -- Notifications created by triggers/functions

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());


-- =====================================================
-- 2. PUSH SUBSCRIPTIONS TABLE
-- =====================================================
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Web Push subscription data
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,

  -- Device info
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('web', 'ios', 'android')),

  -- Status
  active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, endpoint)
);

-- RLS for push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own push subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own push subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own push subscriptions"
  ON public.push_subscriptions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own push subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (user_id = auth.uid());


-- =====================================================
-- 3. NOTIFICATION PREFERENCES TABLE
-- =====================================================
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- In-App Notifications
  in_app_enabled BOOLEAN DEFAULT TRUE,

  -- Push Notifications (by type)
  push_enabled BOOLEAN DEFAULT TRUE,
  push_task_assigned BOOLEAN DEFAULT TRUE,
  push_task_completed BOOLEAN DEFAULT TRUE,
  push_nudge BOOLEAN DEFAULT TRUE,
  push_partner_activity BOOLEAN DEFAULT TRUE,
  push_reminders BOOLEAN DEFAULT TRUE,

  -- Email Notifications
  email_enabled BOOLEAN DEFAULT TRUE,
  email_weekly_digest BOOLEAN DEFAULT TRUE,
  email_important_updates BOOLEAN DEFAULT TRUE,
  email_partner_joined BOOLEAN DEFAULT TRUE,

  -- Quiet Hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  timezone TEXT DEFAULT 'UTC',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON public.notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
  ON public.notification_preferences FOR UPDATE
  USING (user_id = auth.uid());

-- Auto-update updated_at
CREATE TRIGGER set_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


-- =====================================================
-- 4. ACTIVITY FEED TABLE
-- =====================================================
DROP TABLE IF EXISTS public.activity_feed CASCADE;
CREATE TABLE public.activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE CASCADE NOT NULL,

  -- Activity Info
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'task_created', 'task_completed', 'task_assigned', 'task_updated', 'task_deleted',
    'milestone_created', 'milestone_completed', 'milestone_updated',
    'expense_added', 'expense_paid', 'budget_set',
    'partner_joined', 'partner_left',
    'comment_added', 'nudge_sent',
    'dream_shared', 'dream_created'
  )),

  -- Context
  target_type TEXT CHECK (target_type IN ('task', 'milestone', 'expense', 'roadmap', 'partner')),
  target_id UUID,
  target_title TEXT,

  -- Additional data
  metadata JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for activity feed
CREATE INDEX IF NOT EXISTS idx_activity_roadmap_created
  ON public.activity_feed(roadmap_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_actor
  ON public.activity_feed(actor_id);

-- RLS for activity_feed (accessible by roadmap owner and partner)
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity for their roadmaps"
  ON public.activity_feed FOR SELECT
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert activity for their roadmaps"
  ON public.activity_feed FOR INSERT
  WITH CHECK (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );


-- =====================================================
-- 5. DREAM SHARING TABLE (Per-dream access control)
-- =====================================================
DROP TABLE IF EXISTS public.dream_sharing CASCADE;
CREATE TABLE public.dream_sharing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE CASCADE NOT NULL,

  -- Sharing Config
  share_code VARCHAR(8) UNIQUE, -- For link-based sharing (like assessment)
  share_link_enabled BOOLEAN DEFAULT FALSE,

  -- Partner Access
  partner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_level TEXT DEFAULT 'full' CHECK (access_level IN ('view', 'edit', 'full')),

  -- Invitation tracking
  invited_by UUID REFERENCES auth.users(id),
  invited_email TEXT,
  invitation_message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints: either partner_id (accepted) or invited_email (pending)
  UNIQUE(roadmap_id, partner_id),
  UNIQUE(roadmap_id, invited_email)
);

-- Indexes for dream_sharing
CREATE INDEX IF NOT EXISTS idx_dream_sharing_code
  ON public.dream_sharing(share_code) WHERE share_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dream_sharing_partner
  ON public.dream_sharing(partner_id);
CREATE INDEX IF NOT EXISTS idx_dream_sharing_email
  ON public.dream_sharing(invited_email);
CREATE INDEX IF NOT EXISTS idx_dream_sharing_status
  ON public.dream_sharing(status) WHERE status = 'pending';

-- RLS for dream_sharing
ALTER TABLE public.dream_sharing ENABLE ROW LEVEL SECURITY;

-- Roadmap owner can view/manage sharing
CREATE POLICY "Roadmap owners can view sharing"
  ON public.dream_sharing FOR SELECT
  USING (
    roadmap_id IN (SELECT id FROM public.roadmaps WHERE user_id = auth.uid())
    OR partner_id = auth.uid()
    OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Roadmap owners can insert sharing"
  ON public.dream_sharing FOR INSERT
  WITH CHECK (
    roadmap_id IN (SELECT id FROM public.roadmaps WHERE user_id = auth.uid())
  );

CREATE POLICY "Roadmap owners can update sharing"
  ON public.dream_sharing FOR UPDATE
  USING (
    roadmap_id IN (SELECT id FROM public.roadmaps WHERE user_id = auth.uid())
    OR partner_id = auth.uid()
    OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Roadmap owners can delete sharing"
  ON public.dream_sharing FOR DELETE
  USING (
    roadmap_id IN (SELECT id FROM public.roadmaps WHERE user_id = auth.uid())
  );

-- Auto-update updated_at
CREATE TRIGGER set_dream_sharing_updated_at
  BEFORE UPDATE ON public.dream_sharing
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


-- =====================================================
-- 6. NUDGES TABLE
-- =====================================================
DROP TABLE IF EXISTS public.nudges CASCADE;
CREATE TABLE public.nudges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Nudge Content
  message TEXT,
  nudge_type TEXT DEFAULT 'gentle' CHECK (nudge_type IN ('gentle', 'friendly', 'urgent')),

  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for nudges
CREATE INDEX IF NOT EXISTS idx_nudges_recipient_unread
  ON public.nudges(recipient_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_nudges_task
  ON public.nudges(task_id);

-- RLS for nudges
ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view nudges they sent or received"
  ON public.nudges FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can insert nudges"
  ON public.nudges FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Recipients can update nudges (mark as read)"
  ON public.nudges FOR UPDATE
  USING (recipient_id = auth.uid());


-- =====================================================
-- 7. COLUMN ADDITIONS TO EXISTING TABLES
-- =====================================================

-- Add assigned_to_user_id to tasks (for proper UUID reference)
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add paid_by_user_id to expenses
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS paid_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add paid_by_name for display (cached)
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS paid_by_name TEXT;


-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Function to generate share code (8 characters, alphanumeric)
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excludes confusing chars (I, O, 0, 1)
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create a dream sharing invite
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
BEGIN
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

-- Function to accept a dream share invite
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
BEGIN
  -- Get current user's email
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();

  -- Find the share invite
  SELECT ds.*, r.title as roadmap_title, r.id as rid
  INTO v_share
  FROM public.dream_sharing ds
  JOIN public.roadmaps r ON r.id = ds.roadmap_id
  WHERE ds.share_code = p_share_code
    AND ds.status = 'pending'
    AND (ds.expires_at IS NULL OR ds.expires_at > NOW());

  IF v_share IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 'Invalid or expired invite code';
    RETURN;
  END IF;

  -- Check if email matches (if specific email was invited)
  IF v_share.invited_email IS NOT NULL AND v_share.invited_email != v_user_email THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 'This invite was sent to a different email address';
    RETURN;
  END IF;

  -- Check if user is not the owner
  IF v_share.invited_by = auth.uid() THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 'You cannot accept your own invite';
    RETURN;
  END IF;

  -- Update the share record
  UPDATE public.dream_sharing
  SET
    partner_id = auth.uid(),
    status = 'accepted',
    accepted_at = NOW()
  WHERE id = v_share.id;

  -- Also update the roadmap's partner_id
  UPDATE public.roadmaps
  SET partner_id = auth.uid()
  WHERE id = v_share.rid;

  RETURN QUERY SELECT TRUE, v_share.rid, v_share.roadmap_title, 'Successfully joined the dream!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_roadmap_id UUID DEFAULT NULL,
  p_milestone_id UUID DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL,
  p_actor_name TEXT DEFAULT NULL,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, type, title, body, roadmap_id, milestone_id, actor_id, actor_name, data
  ) VALUES (
    p_user_id, p_type, p_title, p_body, p_roadmap_id, p_milestone_id, p_actor_id, p_actor_name, p_data
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.notifications
    WHERE user_id = auth.uid()
      AND read = FALSE
      AND dismissed = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET read = TRUE, read_at = NOW()
  WHERE user_id = auth.uid() AND read = FALSE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- 9. NOTIFICATION TRIGGERS
-- =====================================================

-- Drop existing triggers first
DROP TRIGGER IF EXISTS trigger_notify_task_assigned ON public.tasks;
DROP TRIGGER IF EXISTS trigger_notify_task_completed ON public.tasks;

-- Trigger: Notify partner when task is assigned to them
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_name TEXT;
  v_milestone_title TEXT;
BEGIN
  -- Only trigger if assigned_to_user_id changed and is not null
  IF NEW.assigned_to_user_id IS NOT NULL AND
     (OLD.assigned_to_user_id IS NULL OR OLD.assigned_to_user_id != NEW.assigned_to_user_id) THEN

    -- Get actor name
    SELECT COALESCE(raw_user_meta_data->>'full_name', email) INTO v_actor_name
    FROM auth.users WHERE id = auth.uid();

    -- Get milestone title
    SELECT m.title INTO v_milestone_title
    FROM public.milestones m WHERE m.id = NEW.milestone_id;

    -- Create notification for assignee
    PERFORM create_notification(
      NEW.assigned_to_user_id,
      'task_assigned',
      'New task assigned to you',
      format('%s assigned you: "%s"', v_actor_name, NEW.title),
      (SELECT roadmap_id FROM public.milestones WHERE id = NEW.milestone_id),
      NEW.milestone_id,
      auth.uid(),
      v_actor_name,
      jsonb_build_object('task_id', NEW.id, 'task_title', NEW.title)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_task_assigned
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assigned();

-- Trigger: Notify partner when task is completed
CREATE OR REPLACE FUNCTION notify_task_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_name TEXT;
  v_partner_id UUID;
  v_roadmap_id UUID;
BEGIN
  -- Only trigger if task was just completed
  IF NEW.completed = TRUE AND (OLD.completed IS NULL OR OLD.completed = FALSE) THEN

    -- Get actor name
    SELECT COALESCE(raw_user_meta_data->>'full_name', email) INTO v_actor_name
    FROM auth.users WHERE id = auth.uid();

    -- Get roadmap and partner
    SELECT m.roadmap_id INTO v_roadmap_id
    FROM public.milestones m WHERE m.id = NEW.milestone_id;

    SELECT CASE
      WHEN r.user_id = auth.uid() THEN r.partner_id
      ELSE r.user_id
    END INTO v_partner_id
    FROM public.roadmaps r WHERE r.id = v_roadmap_id;

    -- Notify partner if exists
    IF v_partner_id IS NOT NULL THEN
      PERFORM create_notification(
        v_partner_id,
        'task_completed',
        'Task completed!',
        format('%s completed: "%s"', v_actor_name, NEW.title),
        v_roadmap_id,
        NEW.milestone_id,
        auth.uid(),
        v_actor_name,
        jsonb_build_object('task_id', NEW.id, 'task_title', NEW.title)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_task_completed
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_completed();


-- =====================================================
-- 10. AUTO-CREATE NOTIFICATION PREFERENCES
-- =====================================================

-- When a new user signs up, create default notification preferences
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_create_notification_preferences'
  ) THEN
    CREATE TRIGGER trigger_create_notification_preferences
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION create_default_notification_preferences();
  END IF;
END;
$$;


-- =====================================================
-- Done! Summary:
-- - 6 new tables created
-- - RLS policies added for security
-- - Helper functions for share codes, notifications
-- - Triggers for automatic notifications
-- =====================================================
