-- Migration: 007_push_notification_trigger.sql
-- Creates trigger to send push notifications when notifications are created

-- Function to call the send-push Edge Function
CREATE OR REPLACE FUNCTION notify_push_on_notification()
RETURNS TRIGGER AS $$
DECLARE
  push_enabled BOOLEAN;
  project_url TEXT;
  service_key TEXT;
BEGIN
  -- Check if user has push notifications enabled
  SELECT np.push_enabled INTO push_enabled
  FROM notification_preferences np
  WHERE np.user_id = NEW.user_id;

  -- Default to true if no preferences set
  IF push_enabled IS NULL THEN
    push_enabled := TRUE;
  END IF;

  -- Only send if push is enabled and notification is unread
  IF push_enabled AND NOT NEW.read THEN
    -- Call the Edge Function via pg_net (if installed) or http extension
    -- Note: This requires the pg_net or http extension to be enabled

    -- For now, we'll use Supabase's built-in approach
    -- The actual push sending will be triggered by a webhook or the client

    -- Log for debugging
    RAISE NOTICE 'Push notification queued for user %: %', NEW.user_id, NEW.title;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on notifications table
DROP TRIGGER IF EXISTS trigger_push_notification ON notifications;
CREATE TRIGGER trigger_push_notification
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_push_on_notification();

-- Create a table to queue push notifications (for batch processing)
CREATE TABLE IF NOT EXISTS push_notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for processing queue
CREATE INDEX IF NOT EXISTS idx_push_queue_status ON push_notification_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_push_queue_user ON push_notification_queue(user_id);

-- RLS for push queue (admin only via service role)
ALTER TABLE push_notification_queue ENABLE ROW LEVEL SECURITY;

-- Function to queue a push notification
CREATE OR REPLACE FUNCTION queue_push_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Add to queue
  INSERT INTO push_notification_queue (notification_id, user_id)
  VALUES (NEW.id, NEW.user_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to queue push notifications
DROP TRIGGER IF EXISTS trigger_queue_push ON notifications;
CREATE TRIGGER trigger_queue_push
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION queue_push_notification();

-- Function to process push queue (called by cron or Edge Function)
CREATE OR REPLACE FUNCTION process_push_queue(batch_size INTEGER DEFAULT 100)
RETURNS TABLE(processed INTEGER, succeeded INTEGER, failed INTEGER) AS $$
DECLARE
  v_processed INTEGER := 0;
  v_succeeded INTEGER := 0;
  v_failed INTEGER := 0;
BEGIN
  -- Mark batch as processing
  UPDATE push_notification_queue
  SET status = 'processing', last_attempt_at = NOW(), attempts = attempts + 1
  WHERE id IN (
    SELECT id FROM push_notification_queue
    WHERE status = 'pending'
    ORDER BY created_at
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  );

  GET DIAGNOSTICS v_processed = ROW_COUNT;

  -- Return counts (actual sending happens in Edge Function)
  RETURN QUERY SELECT v_processed, v_succeeded, v_failed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (for manual triggering)
GRANT EXECUTE ON FUNCTION process_push_queue TO authenticated;

COMMENT ON TABLE push_notification_queue IS 'Queue for push notifications to be sent by Edge Function';
COMMENT ON FUNCTION process_push_queue IS 'Processes pending push notifications in batches';
