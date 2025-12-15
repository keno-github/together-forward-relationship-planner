-- Budget Pockets Migration
-- Adds server-side enforcement for budget pocket overfunding prevention
-- This is a HARD BUSINESS RULE - pockets cannot exceed their target amounts

-- 1. Add budget_pockets JSONB column to milestones table
-- Structure: { "pocket_name": { "target": 600 }, "other_pocket": { "target": 800 } }
ALTER TABLE milestones
ADD COLUMN IF NOT EXISTS budget_pockets JSONB DEFAULT '{}';

-- 2. Create function to validate expense against pocket target
-- Returns: { allowed: true/false, remaining: number, message: string }
CREATE OR REPLACE FUNCTION validate_pocket_contribution(
  p_milestone_id UUID,
  p_category VARCHAR(50),
  p_amount DECIMAL(10,2)
)
RETURNS JSONB AS $$
DECLARE
  v_pocket_target DECIMAL(10,2);
  v_current_total DECIMAL(10,2);
  v_remaining DECIMAL(10,2);
  v_pockets JSONB;
BEGIN
  -- Get pocket definitions for this milestone
  SELECT budget_pockets INTO v_pockets
  FROM milestones
  WHERE id = p_milestone_id;

  -- If no pockets defined, allow the contribution (backward compatibility)
  IF v_pockets IS NULL OR v_pockets = '{}'::jsonb THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', NULL,
      'message', 'No pocket constraints defined'
    );
  END IF;

  -- Get target for this specific pocket
  v_pocket_target := (v_pockets -> p_category ->> 'target')::DECIMAL(10,2);

  -- If pocket not defined, allow (might be 'Other' category)
  IF v_pocket_target IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', NULL,
      'message', 'Pocket not in constraints'
    );
  END IF;

  -- Calculate current total contributions to this pocket
  SELECT COALESCE(SUM(amount), 0) INTO v_current_total
  FROM expenses
  WHERE milestone_id = p_milestone_id
    AND category = p_category
    AND status != 'cancelled';

  -- Calculate remaining capacity
  v_remaining := v_pocket_target - v_current_total;

  -- Check if contribution would exceed target
  IF p_amount > v_remaining THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', v_remaining,
      'message', format('Contribution of $%s would exceed pocket target. Only $%s remaining.', p_amount, v_remaining)
    );
  END IF;

  -- Contribution is allowed
  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', v_remaining - p_amount,
    'message', 'OK'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create function to get pocket status for a milestone
-- Returns full status of all pockets including contributions and remaining
CREATE OR REPLACE FUNCTION get_pocket_status(p_milestone_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_pockets JSONB;
  v_result JSONB := '{}'::jsonb;
  v_pocket_name TEXT;
  v_pocket_target DECIMAL(10,2);
  v_contributed DECIMAL(10,2);
BEGIN
  -- Get pocket definitions
  SELECT budget_pockets INTO v_pockets
  FROM milestones
  WHERE id = p_milestone_id;

  IF v_pockets IS NULL OR v_pockets = '{}'::jsonb THEN
    RETURN '{}'::jsonb;
  END IF;

  -- Loop through each pocket and calculate status
  FOR v_pocket_name IN SELECT jsonb_object_keys(v_pockets)
  LOOP
    v_pocket_target := (v_pockets -> v_pocket_name ->> 'target')::DECIMAL(10,2);

    -- Get total contributions for this pocket
    SELECT COALESCE(SUM(amount), 0) INTO v_contributed
    FROM expenses
    WHERE milestone_id = p_milestone_id
      AND category = v_pocket_name
      AND status != 'cancelled';

    -- Build status object for this pocket
    v_result := v_result || jsonb_build_object(
      v_pocket_name, jsonb_build_object(
        'target', v_pocket_target,
        'contributed', v_contributed,
        'remaining', GREATEST(v_pocket_target - v_contributed, 0),
        'isFunded', v_contributed >= v_pocket_target,
        'percentFunded', CASE
          WHEN v_pocket_target > 0 THEN ROUND((v_contributed / v_pocket_target) * 100, 1)
          ELSE 0
        END
      )
    );
  END LOOP;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger to enforce pocket limits on expense insert/update
CREATE OR REPLACE FUNCTION enforce_pocket_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_validation JSONB;
BEGIN
  -- Skip validation for cancelled expenses
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  -- Validate the contribution
  v_validation := validate_pocket_contribution(NEW.milestone_id, NEW.category, NEW.amount);

  -- If not allowed, raise exception
  IF NOT (v_validation ->> 'allowed')::boolean THEN
    RAISE EXCEPTION 'Pocket overfunding prevented: %', v_validation ->> 'message';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT
DROP TRIGGER IF EXISTS check_pocket_limit_insert ON expenses;
CREATE TRIGGER check_pocket_limit_insert
  BEFORE INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION enforce_pocket_limit();

-- Create trigger for UPDATE (only when amount or category changes)
DROP TRIGGER IF EXISTS check_pocket_limit_update ON expenses;
CREATE TRIGGER check_pocket_limit_update
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  WHEN (OLD.amount IS DISTINCT FROM NEW.amount OR OLD.category IS DISTINCT FROM NEW.category)
  EXECUTE FUNCTION enforce_pocket_limit();

-- 5. Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION validate_pocket_contribution(UUID, VARCHAR, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pocket_status(UUID) TO authenticated;

-- 6. Add index for faster pocket contribution queries
CREATE INDEX IF NOT EXISTS idx_expenses_milestone_category
  ON expenses(milestone_id, category)
  WHERE status != 'cancelled';

-- 7. Add helpful comments
COMMENT ON COLUMN milestones.budget_pockets IS 'JSON object defining budget pocket targets: { "pocket_name": { "target": 600 } }';
COMMENT ON FUNCTION validate_pocket_contribution IS 'Validates if a contribution amount is allowed for a specific pocket without exceeding target';
COMMENT ON FUNCTION get_pocket_status IS 'Returns current status of all budget pockets including contributions and remaining amounts';
