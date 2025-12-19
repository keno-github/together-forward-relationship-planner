-- ============================================================================
-- Migration 016: Fix Activity Actor Names
-- ============================================================================
-- Problem: Activities show "Someone" instead of the actual user's name
-- Root causes:
--   1. Profiles created without full_name populated
--   2. Activity logging falls back to "Someone" when profile lookup fails
--   3. No backfill for historical activities
--
-- Solution:
--   1. Backfill actor_name from profiles where currently "Someone"
--   2. Add trigger to auto-update activity actor_name when profile changes
--   3. Ensure profiles always have a display name
-- ============================================================================

-- ============================================================================
-- STEP 1: Backfill existing activities with proper actor names
-- ============================================================================

-- Update activities where actor_name is 'Someone' but we have a profile
UPDATE activity_feed af
SET actor_name = COALESCE(
  p.display_name,
  p.full_name,
  SPLIT_PART(p.email, '@', 1),  -- Use email prefix as fallback
  'Someone'
)
FROM profiles p
WHERE af.actor_id = p.id
  AND (af.actor_name = 'Someone' OR af.actor_name IS NULL)
  AND (
    p.display_name IS NOT NULL
    OR p.full_name IS NOT NULL
    OR p.email IS NOT NULL
  );

-- Log how many were updated
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % activity records with proper actor names', updated_count;
END $$;

-- ============================================================================
-- STEP 2: Add display_name column to profiles if not exists
-- ============================================================================

-- Add display_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN display_name TEXT;
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Backfill display_name from full_name or email for existing profiles
-- ============================================================================

UPDATE profiles
SET display_name = COALESCE(
  full_name,
  SPLIT_PART(email, '@', 1)
)
WHERE display_name IS NULL
  AND (full_name IS NOT NULL OR email IS NOT NULL);

-- ============================================================================
-- STEP 4: Create function to get user display name
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_display_name(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  result TEXT;
BEGIN
  SELECT COALESCE(
    display_name,
    full_name,
    SPLIT_PART(email, '@', 1),
    'Someone'
  ) INTO result
  FROM profiles
  WHERE id = user_id;

  RETURN COALESCE(result, 'Someone');
END;
$$;

-- ============================================================================
-- STEP 5: Create trigger to auto-update activity actor_name when profile changes
-- ============================================================================

-- Function to update activity_feed when profile name changes
CREATE OR REPLACE FUNCTION update_activity_actor_names()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only update if name fields actually changed
  IF (
    OLD.display_name IS DISTINCT FROM NEW.display_name OR
    OLD.full_name IS DISTINCT FROM NEW.full_name
  ) THEN
    UPDATE activity_feed
    SET actor_name = COALESCE(
      NEW.display_name,
      NEW.full_name,
      SPLIT_PART(NEW.email, '@', 1),
      'Someone'
    )
    WHERE actor_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS trigger_update_activity_actor_names ON profiles;

CREATE TRIGGER trigger_update_activity_actor_names
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_actor_names();

-- ============================================================================
-- STEP 6: Create index for faster actor lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_activity_feed_actor_id
ON activity_feed(actor_id);

CREATE INDEX IF NOT EXISTS idx_profiles_display_name
ON profiles(display_name)
WHERE display_name IS NOT NULL;

-- ============================================================================
-- VERIFICATION QUERY (run manually to check results)
-- ============================================================================
-- SELECT
--   af.actor_name,
--   p.display_name,
--   p.full_name,
--   p.email,
--   COUNT(*) as count
-- FROM activity_feed af
-- LEFT JOIN profiles p ON af.actor_id = p.id
-- GROUP BY af.actor_name, p.display_name, p.full_name, p.email
-- ORDER BY count DESC;
