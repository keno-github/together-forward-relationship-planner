# Apply Target Date Migration

## Issue
The `target_date` column doesn't exist in the milestones table yet. We need to apply migration `004_milestone_metrics.sql`.

## Quick Method: Supabase SQL Editor (RECOMMENDED)

### Step 1: Open Supabase SQL Editor
1. Go to: https://app.supabase.com/project/djguquclcyhwqijnobcp/sql/new
2. Or navigate to: **Supabase Dashboard → Your Project → SQL Editor → New Query**

### Step 2: Copy and Run This SQL

Copy this entire SQL block and paste it into the Supabase SQL Editor:

```sql
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

-- Show success message
SELECT 'Migration 004 completed successfully! Target date column added.' AS status;
```

### Step 3: Run the Migration
1. Click the **"Run"** button (or press Ctrl+Enter)
2. You should see: **"Migration 004 completed successfully! Target date column added."**

### Step 4: Verify the Migration

Run this query to confirm the columns were added:

```sql
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'milestones'
  AND column_name IN ('target_date', 'goal_type', 'milestone_metrics', 'priority')
ORDER BY column_name;
```

Expected result:
| column_name | data_type | column_default |
|-------------|-----------|----------------|
| goal_type | character varying | NULL |
| milestone_metrics | jsonb | '{}'::jsonb |
| priority | character varying | 'medium' |
| target_date | date | NULL |

### Step 5: Test in the App

Once the migration is applied, you can test the target date feature:

1. **Refresh your app** at http://localhost:3000
2. **Navigate to any Milestone**
3. **Click the "Target Date" button** in the header (next to the progress indicator)
4. **Select a date** from the date picker
5. **Click the checkmark** to save
6. **Verify:**
   - Date is saved and displayed as "Dec 25, 2025" format
   - Timeline in Overview tab shows actual days/weeks/months
   - Health score updates based on progress vs. time
   - Browser console shows: "✅ Target date saved: 2025-12-25"

## Troubleshooting

**If you see errors when saving the date:**
- Check browser console for errors
- Verify migration ran successfully with the verification query
- Check Supabase logs: Dashboard → Logs → Database

**If the column still doesn't exist:**
- Make sure you're connected to the correct Supabase project
- Refresh the Supabase dashboard
- Re-run the verification query above

**If you see "Failed to save target date":**
- Check browser network tab for API errors
- Verify your Supabase RLS (Row Level Security) policies allow updates
- Make sure you're logged in to the app

## Test the Database Connection

You can also run this test script to verify everything works:

```bash
node test-target-date.js
```

This will:
- ✅ Verify the target_date column exists
- ✅ Test saving a target date
- ✅ Verify the date persists in the database
- ✅ Test the target_date index

## Migration Status Checklist

- [ ] Supabase SQL Editor opened
- [ ] Migration SQL pasted and executed
- [ ] Success message appeared
- [ ] Verification query shows 4 new columns
- [ ] App refreshed
- [ ] Target date button appears in milestone header
- [ ] Date can be selected and saved
- [ ] Timeline shows actual days/weeks/months
- [ ] Health score updates properly
- [ ] Test script passes all tests

Once all checkboxes are complete, the target date feature is fully working! 🎉

## What This Migration Adds

This migration enhances the milestones table with:

1. **target_date** - Target completion date (used for timeline and health calculations)
2. **goal_type** - Type of goal (wedding, home, travel, etc.)
3. **milestone_metrics** - JSONB field for storing calculated metrics
4. **priority** - Priority level (low, medium, high, critical)

All of these work together to power the new intelligent overview dashboard with:
- Smart health score calculation
- Realistic timeline display
- Luna's context-aware insights
- Progress tracking
