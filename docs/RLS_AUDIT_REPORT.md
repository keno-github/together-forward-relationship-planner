# Supabase Row Level Security (RLS) Audit Report

**Date**: 2025-11-14
**Auditor**: Claude Code
**Scope**: TogetherForward Database Schema v1.0

---

## Executive Summary

**Overall Security Rating**: ⚠️ **Medium** (Needs Improvement)

The current RLS implementation provides basic security but has several gaps that need to be addressed before production deployment:

- ✅ **Strengths**: All tables have RLS enabled, basic policies in place
- ⚠️ **Warnings**: Inconsistent deletion policies, unused `shared_with` array
- ❌ **Critical**: No validation for `shared_with` array, missing expense table policies

---

## Detailed Findings

### 1. Profiles Table ✅ **SECURE**

**Status**: Good

**Current Policies**:
- Users can view own profile ✅
- Users can update own profile ✅
- Users can insert own profile ✅

**Issues**: None

**Recommendations**: Consider adding policy to view partner profiles

---

### 2. Roadmaps Table ⚠️ **NEEDS IMPROVEMENT**

**Status**: Mostly secure, with gaps

**Current Policies**:
- SELECT: `user_id = auth.uid()` OR `partner_id = auth.uid()` ✅
- INSERT: `user_id = auth.uid()` ✅
- UPDATE: `user_id = auth.uid()` OR `partner_id = auth.uid()` ✅
- DELETE: `user_id = auth.uid()` only ✅

**Issues**:

1. ⚠️ **Unused `shared_with` Array** (MEDIUM SEVERITY)
   - Column exists (line 57 in schema) but not validated in policies
   - Anyone with user_id or partner_id can access, ignoring email-based sharing
   - **Risk**: Feature not functional, potential security gap if implemented incorrectly

2. ⚠️ **No Validation for Partner Relationship** (MEDIUM SEVERITY)
   - Any user can set `partner_id` to any other user's ID
   - No consent/invitation mechanism
   - **Risk**: User A could add User B as partner without B's consent

**Recommendations**:

1. Create `partnerships` table for invite/accept flow
2. Add policy to validate `shared_with` array contains user's email
3. Add function to validate partner_id relationship

**SQL Fix**:

```sql
-- Add policy for email-based sharing
CREATE POLICY "Users can view roadmaps shared with them via email"
  ON public.roadmaps FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() = partner_id
    OR auth.email() = ANY(shared_with)
  );
```

---

### 3. Milestones Table ❌ **SECURITY GAP**

**Status**: Inconsistent permissions

**Current Policies**:
- SELECT: Checks if roadmap belongs to user or partner ✅
- INSERT: Checks if roadmap belongs to user or partner ✅
- UPDATE: Checks if roadmap belongs to user or partner ✅
- DELETE: **Only checks user_id, not partner_id** ❌

**Issues**:

1. ❌ **Inconsistent DELETE Policy** (HIGH SEVERITY)
   - Partner can update milestones but not delete them
   - Inconsistent with INSERT/UPDATE permissions
   - **Risk**: Confusing UX, potential for orphaned data

**Recommendations**:

Allow partner to delete as well, OR restrict both from deleting:

```sql
-- Option 1: Allow partner to delete (recommended)
CREATE OR REPLACE POLICY "Users can delete milestones in their roadmaps"
  ON public.milestones FOR DELETE
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

-- Option 2: Restrict deletion (only creator)
-- Keep current policy but add soft delete instead
ALTER TABLE public.milestones ADD COLUMN deleted_at TIMESTAMPTZ;
```

---

### 4. Tasks Table ❌ **SECURITY GAP**

**Status**: Same issue as milestones

**Current Policies**:
- SELECT, INSERT, UPDATE: Proper partner access ✅
- DELETE: **Only user_id can delete** ❌

**Issues**:

1. ❌ **Inconsistent DELETE Policy** (HIGH SEVERITY)
   - Same issue as milestones
   - Partner can create and update tasks but not delete

**Recommendations**:

```sql
CREATE OR REPLACE POLICY "Users can delete tasks in their milestones"
  ON public.tasks FOR DELETE
  USING (
    milestone_id IN (
      SELECT m.id FROM public.milestones m
      JOIN public.roadmaps r ON m.roadmap_id = r.id
      WHERE r.user_id = auth.uid() OR r.partner_id = auth.uid()
    )
  );
```

---

### 5. Achievements Table ⚠️ **INCOMPLETE**

**Status**: Missing DELETE policy

**Current Policies**:
- SELECT: Proper ✅
- INSERT: Proper ✅
- UPDATE: **Missing** ❌
- DELETE: **Missing** ❌

**Recommendations**:

```sql
CREATE POLICY "Users can update achievements in their roadmaps"
  ON public.achievements FOR UPDATE
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete achievements in their roadmaps"
  ON public.achievements FOR DELETE
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );
```

---

### 6. Conversation History Table ⚠️ **INCOMPLETE**

**Status**: Missing UPDATE and DELETE policies

**Current Policies**:
- SELECT: Proper ✅
- INSERT: Proper ✅
- UPDATE: **Missing** ⚠️
- DELETE: **Missing** ⚠️

**Recommendations**:

Conversations should probably be append-only (no update/delete), but if needed:

```sql
CREATE POLICY "Users can update conversations in their roadmaps"
  ON public.conversation_history FOR UPDATE
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

-- Consider adding soft delete or archive instead of hard delete
```

---

### 7. Missing Tables ❌ **CRITICAL**

The following tables are referenced in code but don't have schemas:

1. **`expenses` Table** - Referenced in `supabaseService.js`
   - Functions like `getExpensesByRoadmap` will fail
   - **Priority**: HIGH

2. **`partnerships` Table** - For invitation flow
   - Needed for secure partner linking
   - **Priority**: HIGH

3. **`notifications` Table** - For nudge system
   - **Priority**: MEDIUM (Phase 3)

---

## Performance Issues

### Missing Indexes

**Current Indexes** (Lines 325-330):
- ✅ Basic indexes on foreign keys exist

**Missing Indexes**:

```sql
-- Composite indexes for common queries
CREATE INDEX idx_tasks_milestone_completed ON tasks(milestone_id, completed);
CREATE INDEX idx_milestones_roadmap_order ON milestones(roadmap_id, order_index);
CREATE INDEX idx_milestones_completed ON milestones(completed);

-- Needed when expenses table is created
CREATE INDEX idx_expenses_roadmap_status ON expenses(roadmap_id, status);
CREATE INDEX idx_expenses_due_date ON expenses(due_date);
```

---

## Security Best Practices Violations

### 1. No Audit Trail ⚠️

**Issue**: No tracking of who modified what and when

**Recommendation**:

```sql
-- Add to all tables
ALTER TABLE public.roadmaps ADD COLUMN created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.roadmaps ADD COLUMN updated_by UUID REFERENCES auth.users(id);

-- Create audit log table
CREATE TABLE audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  table_name TEXT,
  record_id UUID,
  action TEXT, -- INSERT, UPDATE, DELETE
  user_id UUID REFERENCES auth.users(id),
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. No Soft Deletes ⚠️

**Issue**: Hard deletes make data unrecoverable

**Recommendation**: Add `deleted_at` column to important tables

```sql
ALTER TABLE public.milestones ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE public.tasks ADD COLUMN deleted_at TIMESTAMPTZ;

-- Update policies to filter out deleted records
-- Example:
CREATE OR REPLACE POLICY "Users can view milestones in their roadmaps"
  ON public.milestones FOR SELECT
  USING (
    deleted_at IS NULL
    AND roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );
```

### 3. No Rate Limiting ⚠️

**Issue**: No protection against abuse (spam creation of roadmaps/tasks)

**Recommendation**: Implement application-level rate limiting

---

## Priority Action Items

### Critical (Fix Before Production)

1. ✅ Create `expenses` table with RLS policies
2. ✅ Create `partnerships` table for secure invitations
3. ✅ Fix DELETE policies for milestones and tasks (allow partners)
4. ✅ Add UPDATE/DELETE policies for achievements
5. ✅ Validate `shared_with` array in roadmaps policies

### High (Fix Soon)

6. ⏳ Add soft deletes to milestones and tasks
7. ⏳ Add composite indexes for performance
8. ⏳ Implement audit logging
9. ⏳ Add validation for partner_id relationship

### Medium (Post-Launch)

10. ⏳ Create notification, activity_feed, presence tables
11. ⏳ Implement rate limiting
12. ⏳ Add more granular permissions (read-only partners, etc.)

---

## Testing Recommendations

Before deploying RLS changes, test these scenarios:

1. **User A creates roadmap, adds User B as partner**
   - ✅ User B can view roadmap
   - ✅ User B can create/update/delete milestones
   - ✅ User B can create/update/delete tasks

2. **User A shares roadmap via email with User C (not registered)**
   - ✅ User C can sign up and access roadmap
   - ❌ Currently not working (shared_with not validated)

3. **Unauthorized access**
   - ❌ User D cannot access User A's roadmap
   - ❌ User D cannot modify User A's data

4. **Partner removal**
   - ✅ When partner_id set to NULL, partner loses access
   - ✅ Data remains intact

---

## Conclusion

The current RLS implementation provides a foundation but requires immediate fixes for:

1. Inconsistent DELETE policies
2. Missing expense table
3. Unused shared_with validation
4. Missing partnerships table

**Estimated Time to Fix Critical Issues**: 2-3 hours
**Risk Level if Not Fixed**: **HIGH** (Data security and feature functionality compromised)

---

## Appendix: RLS Policy Template

For future tables, use this template:

```sql
-- Enable RLS
ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

-- SELECT: Allow owners and partners
CREATE POLICY "Users can view their own records"
  ON public.your_table FOR SELECT
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

-- INSERT: Allow owners and partners
CREATE POLICY "Users can insert records"
  ON public.your_table FOR INSERT
  WITH CHECK (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

-- UPDATE: Allow owners and partners
CREATE POLICY "Users can update records"
  ON public.your_table FOR UPDATE
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );

-- DELETE: Allow owners and partners (or just owners if sensitive)
CREATE POLICY "Users can delete records"
  ON public.your_table FOR DELETE
  USING (
    roadmap_id IN (
      SELECT id FROM public.roadmaps
      WHERE user_id = auth.uid() OR partner_id = auth.uid()
    )
  );
```

---

**Report Generated**: 2025-11-14
**Next Review**: After implementing fixes
