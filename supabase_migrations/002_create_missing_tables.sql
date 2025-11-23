-- =====================================================
-- MIGRATION 002: Create Missing Tables
-- =====================================================
-- Date: 2025-11-14
-- Description: Creates expenses and partnerships tables
-- Critical Issues Addressed:
--   - Expenses table (referenced in code but missing)
--   - Partnerships table (for invite/accept flow)
-- =====================================================

-- =====================================================
-- 1. EXPENSES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE CASCADE NOT NULL,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,

  -- Expense Details
  title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 200),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  category TEXT CHECK (length(category) <= 100),

  -- Status and Dates
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  due_date DATE,
  paid_date DATE,
  expense_date DATE DEFAULT CURRENT_DATE,

  -- Optional
  description TEXT CHECK (length(description) <= 1000),
  receipt_url TEXT,
  payment_method TEXT CHECK (length(payment_method) <= 50),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.expenses IS 'Tracks expenses for roadmap milestones and overall budget management';

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Expenses
CREATE POLICY "Users can view expenses in their roadmaps"
  ON public.expenses FOR SELECT
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert expenses in their roadmaps"
  ON public.expenses FOR INSERT
  WITH CHECK (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
    AND user_id = auth.uid() -- Ensure user_id matches authenticated user
  );

CREATE POLICY "Users can update expenses in their roadmaps"
  ON public.expenses FOR UPDATE
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete expenses in their roadmaps"
  ON public.expenses FOR DELETE
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

-- Indexes for performance (drop first to ensure clean creation)
DROP INDEX IF EXISTS idx_expenses_roadmap_id;
DROP INDEX IF EXISTS idx_expenses_milestone_id;
DROP INDEX IF EXISTS idx_expenses_user_id;
DROP INDEX IF EXISTS idx_expenses_status;
DROP INDEX IF EXISTS idx_expenses_due_date;
DROP INDEX IF EXISTS idx_expenses_roadmap_status;

CREATE INDEX idx_expenses_roadmap_id ON public.expenses(roadmap_id);
CREATE INDEX idx_expenses_milestone_id ON public.expenses(milestone_id);
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_status ON public.expenses(status);
CREATE INDEX idx_expenses_due_date ON public.expenses(due_date);
CREATE INDEX idx_expenses_roadmap_status ON public.expenses(roadmap_id, status);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at_expenses ON public.expenses;
CREATE TRIGGER set_updated_at_expenses
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 2. PARTNERSHIPS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.partnerships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE CASCADE NOT NULL,

  -- Invitation Details
  inviter_id UUID REFERENCES auth.users(id) NOT NULL, -- Who sent the invite
  partner_email TEXT NOT NULL CHECK (partner_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  partner_id UUID REFERENCES auth.users(id), -- Set when partner accepts

  -- Status Tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'), -- Invites expire in 7 days

  -- Optional Message
  invitation_message TEXT CHECK (length(invitation_message) <= 500),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(roadmap_id, partner_email), -- Can't invite same email twice for same roadmap
  CHECK (inviter_id != partner_id) -- Can't partner with yourself
);

-- Add comment
COMMENT ON TABLE public.partnerships IS 'Manages partner invitations and acceptance flow for roadmaps';

-- Enable RLS
ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Partnerships
CREATE POLICY "Users can view invitations they sent"
  ON public.partnerships FOR SELECT
  USING (inviter_id = auth.uid());

CREATE POLICY "Users can view invitations sent to them"
  ON public.partnerships FOR SELECT
  USING (
    partner_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR partner_id = auth.uid()
  );

CREATE POLICY "Users can view partnerships for their roadmaps"
  ON public.partnerships FOR SELECT
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create invitations for their roadmaps"
  ON public.partnerships FOR INSERT
  WITH CHECK (
    inviter_id = auth.uid()
    AND roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update invitations they received"
  ON public.partnerships FOR UPDATE
  USING (
    partner_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR inviter_id = auth.uid()
  );

CREATE POLICY "Users can cancel invitations they sent"
  ON public.partnerships FOR DELETE
  USING (inviter_id = auth.uid());

-- Indexes for performance (drop first to ensure clean creation)
DROP INDEX IF EXISTS idx_partnerships_roadmap_id;
DROP INDEX IF EXISTS idx_partnerships_inviter_id;
DROP INDEX IF EXISTS idx_partnerships_partner_id;
DROP INDEX IF EXISTS idx_partnerships_partner_email;
DROP INDEX IF EXISTS idx_partnerships_status;
DROP INDEX IF EXISTS idx_partnerships_expires_at;

CREATE INDEX idx_partnerships_roadmap_id ON public.partnerships(roadmap_id);
CREATE INDEX idx_partnerships_inviter_id ON public.partnerships(inviter_id);
CREATE INDEX idx_partnerships_partner_id ON public.partnerships(partner_id);
CREATE INDEX idx_partnerships_partner_email ON public.partnerships(partner_email);
CREATE INDEX idx_partnerships_status ON public.partnerships(status);
CREATE INDEX idx_partnerships_expires_at ON public.partnerships(expires_at);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at_partnerships ON public.partnerships;
CREATE TRIGGER set_updated_at_partnerships
  BEFORE UPDATE ON public.partnerships
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 3. HELPER FUNCTIONS
-- =====================================================

-- Function to accept partnership invitation
CREATE OR REPLACE FUNCTION public.accept_partnership(invitation_id UUID)
RETURNS JSONB AS $$
DECLARE
  partnership_record RECORD;
  roadmap_record RECORD;
  result JSONB;
BEGIN
  -- Get the partnership invitation
  SELECT * INTO partnership_record
  FROM public.partnerships
  WHERE id = invitation_id
    AND partner_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Update partnership status
  UPDATE public.partnerships
  SET
    status = 'accepted',
    partner_id = auth.uid(),
    responded_at = NOW()
  WHERE id = invitation_id;

  -- Update roadmap with partner_id
  UPDATE public.roadmaps
  SET partner_id = auth.uid()
  WHERE id = partnership_record.roadmap_id;

  -- Get updated roadmap
  SELECT * INTO roadmap_record
  FROM public.roadmaps
  WHERE id = partnership_record.roadmap_id;

  RETURN jsonb_build_object(
    'success', true,
    'roadmap_id', roadmap_record.id,
    'roadmap_title', roadmap_record.title
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.accept_partnership(UUID) IS
'Accepts a partnership invitation and updates the roadmap with partner_id';

-- Function to decline partnership invitation
CREATE OR REPLACE FUNCTION public.decline_partnership(invitation_id UUID)
RETURNS JSONB AS $$
DECLARE
  partnership_record RECORD;
BEGIN
  -- Get the partnership invitation
  SELECT * INTO partnership_record
  FROM public.partnerships
  WHERE id = invitation_id
    AND partner_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid invitation');
  END IF;

  -- Update partnership status
  UPDATE public.partnerships
  SET
    status = 'declined',
    responded_at = NOW()
  WHERE id = invitation_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.decline_partnership(UUID) IS
'Declines a partnership invitation';

-- Function to check for expired invitations (can be run as a cron job)
CREATE OR REPLACE FUNCTION public.cleanup_expired_partnerships()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.partnerships
  SET status = 'cancelled'
  WHERE status = 'pending'
    AND expires_at < NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;

  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_expired_partnerships() IS
'Marks expired pending invitations as cancelled. Run periodically via cron.';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 002: Missing Tables completed successfully';
  RAISE NOTICE 'Created expenses table with RLS policies and indexes';
  RAISE NOTICE 'Created partnerships table with invite/accept flow';
  RAISE NOTICE 'Added helper functions for partnership management';
END $$;
