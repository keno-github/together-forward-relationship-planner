-- =====================================================
-- DASHBOARD SUMMARY RPC FUNCTION
-- =====================================================
-- Run this SQL in your Supabase SQL Editor
--
-- This function provides a single-query solution for the dashboard,
-- replacing 22+ individual API calls with one optimized query.
--
-- Features:
-- - Pre-computed metrics (progress, health, task counts)
-- - Pagination support
-- - Single round-trip to database
-- - Uses existing indexes for performance
-- =====================================================

-- Drop existing function if exists (for updates)
DROP FUNCTION IF EXISTS get_dashboard_summary(UUID, INTEGER, INTEGER);

-- Create the dashboard summary function
CREATE OR REPLACE FUNCTION get_dashboard_summary(
  user_uuid UUID,
  page_num INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 20
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  offset_val INTEGER;
BEGIN
  -- Calculate offset for pagination
  offset_val := (page_num - 1) * page_size;

  SELECT json_build_object(
    'dreams', (
      SELECT COALESCE(json_agg(dream_data), '[]'::json)
      FROM (
        SELECT
          r.id,
          r.title,
          r.partner1_name,
          r.partner2_name,
          r.location,
          r.created_at,
          r.updated_at,
          COALESCE(r.budget_amount, 0) as budget_amount,
          r.target_date,
          COALESCE(r.xp_points, 0) as xp_points,

          -- Milestone counts (count roadmap phases from deep_dive_data)
          COALESCE(milestone_stats.total_milestones, 0) as total_milestones,
          COALESCE(milestone_stats.completed_milestones, 0) as completed_milestones,

          -- Task counts
          COALESCE(task_stats.total_tasks, 0) as total_tasks,
          COALESCE(task_stats.completed_tasks, 0) as completed_tasks,
          COALESCE(task_stats.overdue_tasks, 0) as overdue_tasks,

          -- Budget spent (sum of expenses)
          COALESCE(expense_stats.budget_spent, 0) as budget_spent,

          -- Calculate progress percentage
          CASE
            WHEN COALESCE(task_stats.total_tasks, 0) = 0 THEN 0
            ELSE ROUND((COALESCE(task_stats.completed_tasks, 0)::NUMERIC / task_stats.total_tasks::NUMERIC) * 100)
          END as progress_percentage,

          -- Calculate health score (based on overdue tasks and progress)
          CASE
            WHEN COALESCE(task_stats.total_tasks, 0) = 0 THEN 50
            WHEN COALESCE(task_stats.overdue_tasks, 0) > 5 THEN 25
            WHEN COALESCE(task_stats.overdue_tasks, 0) > 2 THEN 50
            WHEN COALESCE(task_stats.overdue_tasks, 0) > 0 THEN 70
            ELSE 85
          END as health_score,

          -- Next upcoming task (most urgent incomplete task)
          next_task.next_task_data as next_task

        FROM roadmaps r

        -- Milestone statistics subquery
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*)::INTEGER as total_milestones,
            COUNT(*) FILTER (WHERE m.completed = true)::INTEGER as completed_milestones
          FROM milestones m
          WHERE m.roadmap_id = r.id
        ) milestone_stats ON true

        -- Task statistics subquery (across all milestones)
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*)::INTEGER as total_tasks,
            COUNT(*) FILTER (WHERE t.completed = true)::INTEGER as completed_tasks,
            COUNT(*) FILTER (
              WHERE t.completed = false
              AND t.due_date IS NOT NULL
              AND t.due_date < CURRENT_DATE
            )::INTEGER as overdue_tasks
          FROM tasks t
          INNER JOIN milestones m ON t.milestone_id = m.id
          WHERE m.roadmap_id = r.id
            AND (t.deleted IS NULL OR t.deleted = false)
        ) task_stats ON true

        -- Expense statistics subquery
        LEFT JOIN LATERAL (
          SELECT COALESCE(SUM(e.amount), 0)::NUMERIC as budget_spent
          FROM expenses e
          WHERE e.roadmap_id = r.id
        ) expense_stats ON true

        -- Next task subquery (get the most urgent incomplete task)
        LEFT JOIN LATERAL (
          SELECT json_build_object(
            'id', next_t.id,
            'title', next_t.title,
            'due_date', next_t.due_date,
            'priority', next_t.priority,
            'milestone_title', next_m.title
          ) as next_task_data
          FROM tasks next_t
          INNER JOIN milestones next_m ON next_t.milestone_id = next_m.id
          WHERE next_m.roadmap_id = r.id
            AND next_t.completed = false
            AND (next_t.deleted IS NULL OR next_t.deleted = false)
          ORDER BY
            CASE WHEN next_t.due_date IS NULL THEN 1 ELSE 0 END,
            next_t.due_date ASC,
            CASE next_t.priority
              WHEN 'high' THEN 1
              WHEN 'medium' THEN 2
              WHEN 'low' THEN 3
              ELSE 4
            END
          LIMIT 1
        ) next_task ON true

        WHERE r.user_id = user_uuid OR r.partner_id = user_uuid
        ORDER BY r.updated_at DESC
        LIMIT page_size
        OFFSET offset_val
      ) dream_data
    ),
    'pagination', json_build_object(
      'page', page_num,
      'page_size', page_size,
      'total_count', (
        SELECT COUNT(*)::INTEGER
        FROM roadmaps
        WHERE user_id = user_uuid OR partner_id = user_uuid
      ),
      'total_pages', CEIL((
        SELECT COUNT(*)::NUMERIC
        FROM roadmaps
        WHERE user_id = user_uuid OR partner_id = user_uuid
      ) / page_size::NUMERIC)::INTEGER
    ),
    'stats', json_build_object(
      'total_xp', (
        SELECT COALESCE(SUM(xp_points), 0)::INTEGER
        FROM roadmaps
        WHERE user_id = user_uuid OR partner_id = user_uuid
      ),
      'active_dreams', (
        SELECT COUNT(*)::INTEGER
        FROM roadmaps
        WHERE user_id = user_uuid OR partner_id = user_uuid
      )
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_summary(UUID, INTEGER, INTEGER) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_dashboard_summary IS
'Returns dashboard summary data with pre-computed metrics for all dreams.
Replaces 22+ individual API calls with a single optimized query.
Supports pagination via page_num and page_size parameters.';

-- =====================================================
-- TEST THE FUNCTION (optional - run manually)
-- =====================================================
-- To test, replace YOUR_USER_ID with an actual user UUID:
-- SELECT get_dashboard_summary('YOUR_USER_ID'::uuid, 1, 10);

SELECT 'Migration complete: get_dashboard_summary function created' AS status;
