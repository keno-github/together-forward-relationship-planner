# Database Migrations

This folder contains SQL migration files for the TogetherForward database schema.

## Running Migrations

### Option 1: Supabase SQL Editor (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of the migration file
4. Execute the SQL

### Option 2: Command Line (if using Supabase CLI)
```bash
supabase db push
```

## Migration Files

### 001_initial_schema.sql
- Creates `roadmaps` table for storing couple journey roadmaps
- Creates `milestones` table for tracking progress
- Sets up Row Level Security (RLS) policies
- Creates indexes for performance

### 002_user_profiles.sql (if exists)
- Creates `user_profiles` table for extended user data
- Adds user preferences and settings

### 003_budget_tracking.sql
- Adds budget fields to `milestones` table
- Creates `expenses` table for financial tracking
- Creates `roadmap_budget_summary` view for aggregated stats
- Creates `expense_category_breakdown` view for analytics
- Sets up RLS policies for expenses
- Adds triggers for auto-updating expense status

## Migration Order

Run migrations in numerical order:
1. 001_initial_schema.sql
2. 002_user_profiles.sql (if exists)
3. 003_budget_tracking.sql

## Schema Overview

### Tables
- `roadmaps` - Journey roadmaps (Wedding, Home Buying, etc.)
- `milestones` - Individual goals/tasks within a roadmap
- `expenses` - Financial transactions and budget tracking

### Views
- `roadmap_budget_summary` - Aggregated budget statistics
- `expense_category_breakdown` - Expense totals by category

## Rollback

To rollback the budget tracking migration:
```sql
-- Drop views
DROP VIEW IF EXISTS expense_category_breakdown;
DROP VIEW IF EXISTS roadmap_budget_summary;

-- Drop trigger and function
DROP TRIGGER IF EXISTS expense_status_update ON expenses;
DROP FUNCTION IF EXISTS update_expense_status();

-- Drop table
DROP TABLE IF EXISTS expenses;

-- Remove columns from milestones
ALTER TABLE milestones
DROP COLUMN IF EXISTS budget_amount,
DROP COLUMN IF EXISTS budget_notes,
DROP COLUMN IF EXISTS category;
```
