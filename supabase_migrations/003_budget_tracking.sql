-- Budget Tracking Schema Migration
-- Adds budget and expense tracking capabilities to the application

-- 1. Add budget fields to milestones table
ALTER TABLE milestones
ADD COLUMN IF NOT EXISTS budget_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_notes TEXT,
ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- 2. Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Expense details
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  category VARCHAR(50),

  -- Payment tracking
  expense_date DATE NOT NULL,
  due_date DATE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  paid_date DATE,

  -- Additional info
  payment_method VARCHAR(50),
  receipt_url TEXT,
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_milestone ON expenses(milestone_id);
CREATE INDEX IF NOT EXISTS idx_expenses_roadmap ON expenses(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_milestones_category ON milestones(category);

-- 4. Add RLS policies for expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Users can view expenses for their own roadmaps
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert expenses for their own roadmaps
CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own expenses
CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own expenses
CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Create function to auto-update expense status based on due date
CREATE OR REPLACE FUNCTION update_expense_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-mark as overdue if due_date is past and status is still pending
  IF NEW.status = 'pending' AND NEW.due_date IS NOT NULL AND NEW.due_date < CURRENT_DATE THEN
    NEW.status := 'overdue';
  END IF;

  -- Update paid_date when status changes to paid
  IF NEW.status = 'paid' AND OLD.status != 'paid' AND NEW.paid_date IS NULL THEN
    NEW.paid_date := CURRENT_DATE;
  END IF;

  -- Update updated_at timestamp
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for expense status updates
DROP TRIGGER IF EXISTS expense_status_update ON expenses;
CREATE TRIGGER expense_status_update
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_status();

-- 7. Create view for budget summary by roadmap
CREATE OR REPLACE VIEW roadmap_budget_summary AS
SELECT
  r.id as roadmap_id,
  r.user_id,
  -- Milestone stats
  COUNT(DISTINCT m.id) as total_milestones,
  COUNT(DISTINCT CASE WHEN m.completed THEN m.id END) as completed_milestones,
  -- Budget totals
  COALESCE(SUM(m.budget_amount), 0) as total_budget,
  -- Expense totals
  COALESCE(SUM(e.amount), 0) as total_expenses,
  COALESCE(SUM(CASE WHEN e.status = 'paid' THEN e.amount ELSE 0 END), 0) as total_paid,
  COALESCE(SUM(CASE WHEN e.status = 'pending' THEN e.amount ELSE 0 END), 0) as total_pending,
  COALESCE(SUM(CASE WHEN e.status = 'overdue' THEN e.amount ELSE 0 END), 0) as total_overdue,
  -- Calculations
  COALESCE(SUM(m.budget_amount), 0) - COALESCE(SUM(e.amount), 0) as remaining_budget,
  CASE
    WHEN COALESCE(SUM(m.budget_amount), 0) > 0
    THEN (COALESCE(SUM(e.amount), 0) / SUM(m.budget_amount)) * 100
    ELSE 0
  END as budget_used_percentage,
  CASE
    WHEN COALESCE(SUM(e.amount), 0) > 0
    THEN (COALESCE(SUM(CASE WHEN e.status = 'paid' THEN e.amount ELSE 0 END), 0) / SUM(e.amount)) * 100
    ELSE 0
  END as payment_completion_percentage
FROM roadmaps r
LEFT JOIN milestones m ON m.roadmap_id = r.id
LEFT JOIN expenses e ON e.roadmap_id = r.id
GROUP BY r.id, r.user_id;

-- 8. Create view for expense breakdown by category
CREATE OR REPLACE VIEW expense_category_breakdown AS
SELECT
  e.roadmap_id,
  e.user_id,
  COALESCE(e.category, 'Uncategorized') as category,
  COUNT(*) as expense_count,
  SUM(e.amount) as total_amount,
  SUM(CASE WHEN e.status = 'paid' THEN e.amount ELSE 0 END) as paid_amount,
  SUM(CASE WHEN e.status = 'pending' THEN e.amount ELSE 0 END) as pending_amount,
  SUM(CASE WHEN e.status = 'overdue' THEN e.amount ELSE 0 END) as overdue_amount
FROM expenses e
GROUP BY e.roadmap_id, e.user_id, e.category;

-- 9. Grant permissions on views
GRANT SELECT ON roadmap_budget_summary TO authenticated;
GRANT SELECT ON expense_category_breakdown TO authenticated;

-- 10. Add RLS to views
ALTER VIEW roadmap_budget_summary SET (security_barrier = true);
ALTER VIEW expense_category_breakdown SET (security_barrier = true);

-- 11. Add helpful comments
COMMENT ON TABLE expenses IS 'Stores expense and payment tracking for milestones';
COMMENT ON COLUMN expenses.status IS 'pending: not yet paid, paid: fully paid, overdue: past due date, cancelled: expense cancelled';
COMMENT ON VIEW roadmap_budget_summary IS 'Aggregated budget and expense statistics per roadmap';
COMMENT ON VIEW expense_category_breakdown IS 'Expense totals broken down by category per roadmap';
