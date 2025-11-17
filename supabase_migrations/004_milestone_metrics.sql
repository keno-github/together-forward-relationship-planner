-- Migration 004: Add milestone metrics and goal type tracking
-- Purpose: Enable intelligent overview dashboard with progress tracking

-- Add new columns to milestones table
ALTER TABLE milestones
ADD COLUMN IF NOT EXISTS goal_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS milestone_metrics JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS target_date DATE,
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';

-- Create index for faster goal_type queries
CREATE INDEX IF NOT EXISTS idx_milestones_goal_type ON milestones(goal_type);
CREATE INDEX IF NOT EXISTS idx_milestones_target_date ON milestones(target_date);
CREATE INDEX IF NOT EXISTS idx_milestones_priority ON milestones(priority);

-- Add comments for documentation
COMMENT ON COLUMN milestones.goal_type IS 'Type of goal: wedding, home, travel, health, etc.';
COMMENT ON COLUMN milestones.milestone_metrics IS 'Auto-calculated metrics: progress %, health score, alerts, etc.';
COMMENT ON COLUMN milestones.target_date IS 'Target completion date for this milestone';
COMMENT ON COLUMN milestones.priority IS 'Priority level: low, medium, high, critical';

-- milestone_metrics JSONB structure:
-- {
--   "progress_percentage": 0-100,
--   "completion_percentage": 0-100,
--   "health_score": 0-100,
--   "budget_used_percentage": 0-100,
--   "tasks_completed": number,
--   "tasks_total": number,
--   "days_remaining": number,
--   "on_track": boolean,
--   "next_actions": [
--     {
--       "id": "uuid",
--       "title": "Task title",
--       "assignee": "partner1|partner2|both",
--       "due_date": "ISO date",
--       "priority": "critical|high|medium|low"
--     }
--   ],
--   "priority_checkpoints": [
--     {
--       "checkpoint": "Venue deposit due",
--       "date": "ISO date",
--       "critical": boolean,
--       "completed": boolean
--     }
--   ],
--   "couple_activity": {
--     "partner1_tasks": number,
--     "partner2_tasks": number,
--     "partner1_name": "string",
--     "partner2_name": "string",
--     "balance_score": 0-100
--   },
--   "alerts": [
--     {
--       "type": "budget|deadline|task|dependency",
--       "severity": "info|warning|critical",
--       "message": "Alert message",
--       "icon": "AlertTriangle|Clock|DollarSign"
--     }
--   ],
--   "last_calculated": "ISO timestamp"
-- }

-- Function to calculate milestone metrics
CREATE OR REPLACE FUNCTION calculate_milestone_metrics(milestone_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  total_tasks INT;
  completed_tasks INT;
  budget_spent DECIMAL;
  budget_total DECIMAL;
  days_until_target INT;
  milestone_record RECORD;
  progress_pct INT;
  budget_pct INT;
  health_score INT;
  partner1 VARCHAR;
  partner2 VARCHAR;
  partner1_task_count INT;
  partner2_task_count INT;
BEGIN
  -- Get milestone data
  SELECT * INTO milestone_record
  FROM milestones
  WHERE id = milestone_uuid;

  -- Get task statistics (if tasks table exists)
  SELECT
    COALESCE(COUNT(*), 0),
    COALESCE(COUNT(*) FILTER (WHERE completed = true), 0)
  INTO total_tasks, completed_tasks
  FROM tasks
  WHERE milestone_id = milestone_uuid;

  -- Get budget statistics (if expenses table exists)
  SELECT
    COALESCE(milestone_record.budget_amount, 0),
    COALESCE(SUM(amount), 0)
  INTO budget_total, budget_spent
  FROM expenses
  WHERE milestone_id = milestone_uuid;

  -- Calculate days remaining
  IF milestone_record.target_date IS NOT NULL THEN
    days_until_target := milestone_record.target_date - CURRENT_DATE;
  ELSE
    days_until_target := NULL;
  END IF;

  -- Calculate progress percentage
  IF total_tasks > 0 THEN
    progress_pct := ROUND((completed_tasks::DECIMAL / total_tasks) * 100);
  ELSE
    progress_pct := 0;
  END IF;

  -- Calculate budget percentage
  IF budget_total > 0 THEN
    budget_pct := ROUND((budget_spent / budget_total) * 100);
  ELSE
    budget_pct := 0;
  END IF;

  -- Calculate health score (composite metric)
  -- Factors: progress, budget adherence, timeline adherence
  health_score := 100;

  -- Penalize if behind on tasks
  IF progress_pct < 50 AND days_until_target IS NOT NULL AND days_until_target < 30 THEN
    health_score := health_score - 20;
  END IF;

  -- Penalize if over budget
  IF budget_pct > 100 THEN
    health_score := health_score - 30;
  ELSIF budget_pct > 90 THEN
    health_score := health_score - 10;
  END IF;

  -- Penalize if overdue
  IF days_until_target IS NOT NULL AND days_until_target < 0 THEN
    health_score := health_score - 40;
  END IF;

  -- Get partner activity from roadmap
  SELECT partner1_name, partner2_name
  INTO partner1, partner2
  FROM roadmaps
  WHERE id = milestone_record.roadmap_id;

  -- Count tasks per partner (if assigned_to column exists)
  SELECT
    COALESCE(COUNT(*) FILTER (WHERE assigned_to = partner1), 0),
    COALESCE(COUNT(*) FILTER (WHERE assigned_to = partner2), 0)
  INTO partner1_task_count, partner2_task_count
  FROM tasks
  WHERE milestone_id = milestone_uuid;

  -- Build result JSON
  result := jsonb_build_object(
    'progress_percentage', GREATEST(0, LEAST(100, progress_pct)),
    'completion_percentage', GREATEST(0, LEAST(100, progress_pct)),
    'health_score', GREATEST(0, LEAST(100, health_score)),
    'budget_used_percentage', budget_pct,
    'tasks_completed', completed_tasks,
    'tasks_total', total_tasks,
    'days_remaining', days_until_target,
    'on_track', (health_score >= 70),
    'couple_activity', jsonb_build_object(
      'partner1_tasks', partner1_task_count,
      'partner2_tasks', partner2_task_count,
      'partner1_name', COALESCE(partner1, 'Partner 1'),
      'partner2_name', COALESCE(partner2, 'Partner 2'),
      'balance_score', CASE
        WHEN (partner1_task_count + partner2_task_count) = 0 THEN 100
        ELSE 100 - ABS(partner1_task_count - partner2_task_count) * 10
      END
    ),
    'last_calculated', to_json(NOW())::text
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update milestone metrics (trigger)
CREATE OR REPLACE FUNCTION auto_update_milestone_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update metrics when task is completed or budget changes
  UPDATE milestones
  SET milestone_metrics = calculate_milestone_metrics(NEW.milestone_id)
  WHERE id = NEW.milestone_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers (only if tables exist)
DO $$
BEGIN
  -- Trigger for tasks table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    DROP TRIGGER IF EXISTS trigger_update_metrics_on_task ON tasks;
    CREATE TRIGGER trigger_update_metrics_on_task
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_milestone_metrics();
  END IF;

  -- Trigger for expenses table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') THEN
    DROP TRIGGER IF EXISTS trigger_update_metrics_on_expense ON expenses;
    CREATE TRIGGER trigger_update_metrics_on_expense
    AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_milestone_metrics();
  END IF;
END $$;

-- Migrate existing milestones to have default goal_type
UPDATE milestones
SET goal_type = CASE
  WHEN LOWER(title) LIKE '%wedding%' OR LOWER(title) LIKE '%marry%' THEN 'wedding'
  WHEN LOWER(title) LIKE '%engaged%' OR LOWER(title) LIKE '%engagement%' THEN 'engagement'
  WHEN LOWER(title) LIKE '%home%' OR LOWER(title) LIKE '%house%' OR LOWER(title) LIKE '%buy%' THEN 'home'
  WHEN LOWER(title) LIKE '%baby%' OR LOWER(title) LIKE '%family%' OR LOWER(title) LIKE '%parent%' THEN 'baby'
  WHEN LOWER(title) LIKE '%travel%' OR LOWER(title) LIKE '%vacation%' OR LOWER(title) LIKE '%trip%' THEN 'travel'
  WHEN LOWER(title) LIKE '%move%' OR LOWER(title) LIKE '%relocat%' THEN 'relocation'
  WHEN LOWER(title) LIKE '%education%' OR LOWER(title) LIKE '%degree%' OR LOWER(title) LIKE '%study%' THEN 'education'
  WHEN LOWER(title) LIKE '%business%' OR LOWER(title) LIKE '%startup%' THEN 'business'
  WHEN LOWER(title) LIKE '%save%' OR LOWER(title) LIKE '%saving%' OR LOWER(title) LIKE '%emergency%' THEN 'emergency_fund'
  WHEN LOWER(title) LIKE '%health%' OR LOWER(title) LIKE '%fitness%' OR LOWER(title) LIKE '%exercise%' THEN 'health'
  ELSE 'other'
END
WHERE goal_type IS NULL;

-- Calculate initial metrics for existing milestones
UPDATE milestones
SET milestone_metrics = calculate_milestone_metrics(id)
WHERE milestone_metrics = '{}'::jsonb OR milestone_metrics IS NULL;

-- Grant permissions (adjust role names as needed)
-- GRANT SELECT, UPDATE ON milestones TO authenticated;
-- GRANT EXECUTE ON FUNCTION calculate_milestone_metrics TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 004 completed successfully';
  RAISE NOTICE '   - Added goal_type, milestone_metrics, target_date, priority columns';
  RAISE NOTICE '   - Created calculate_milestone_metrics() function';
  RAISE NOTICE '   - Created auto-update triggers';
  RAISE NOTICE '   - Migrated existing milestones with default goal_types';
  RAISE NOTICE '   - Calculated initial metrics for all milestones';
END $$;
