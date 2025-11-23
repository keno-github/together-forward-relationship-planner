-- ================================================
-- Clear Test Data from Together Forward Database
-- ================================================
--
-- This script removes all test roadmaps created during development
-- CASCADE will automatically delete related milestones and tasks
--
-- IMPORTANT: Review the SELECT queries first to verify what will be deleted!
-- ================================================

-- Step 1: VIEW test roadmaps that will be deleted
-- Run this first to see what you're about to delete
SELECT
  r.id as roadmap_id,
  r.title,
  r.partner1_name,
  r.partner2_name,
  r.created_at,
  COUNT(DISTINCT m.id) as milestone_count,
  COUNT(t.id) as task_count
FROM roadmaps r
LEFT JOIN milestones m ON m.roadmap_id = r.id
LEFT JOIN tasks t ON t.milestone_id = m.id
WHERE
  -- Test data identifiers
  r.partner1_name IN ('Keno', 'Brenda', 'Partner 1', 'Partner 2')
  OR r.partner2_name IN ('Keno', 'Brenda', 'Partner 1', 'Partner 2')
  OR r.title LIKE '%Test%'
  OR r.title LIKE '%Our Journey Together%'
GROUP BY r.id, r.title, r.partner1_name, r.partner2_name, r.created_at
ORDER BY r.created_at DESC;

-- ================================================
-- Step 2: DELETE test roadmaps (UNCOMMENT TO EXECUTE)
-- ================================================
--
-- CAUTION: This is IRREVERSIBLE!
-- Review the SELECT results above before uncommenting this DELETE
--
-- DELETE FROM roadmaps
-- WHERE
--   partner1_name IN ('Keno', 'Brenda', 'Partner 1', 'Partner 2')
--   OR partner2_name IN ('Keno', 'Brenda', 'Partner 1', 'Partner 2')
--   OR title LIKE '%Test%'
--   OR title LIKE '%Our Journey Together%';

-- ================================================
-- Alternative: Delete ALL roadmaps (NUCLEAR OPTION)
-- ================================================
--
-- USE THIS ONLY FOR COMPLETE FRESH START
-- This deletes EVERYTHING from all tables
--
-- UNCOMMENT ONLY IF YOU WANT TO DELETE ALL DATA:
--
-- DELETE FROM tasks;
-- DELETE FROM milestones;
-- DELETE FROM roadmaps;

-- ================================================
-- Step 3: Verify deletion (run after DELETE)
-- ================================================

-- Check remaining roadmaps
SELECT COUNT(*) as remaining_roadmaps FROM roadmaps;

-- Check remaining milestones
SELECT COUNT(*) as remaining_milestones FROM milestones;

-- Check remaining tasks
SELECT COUNT(*) as remaining_tasks FROM tasks;

-- ================================================
-- Usage Instructions:
-- ================================================
--
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Paste this file
-- 3. Run Step 1 (SELECT) to preview what will be deleted
-- 4. If satisfied, uncomment Step 2 (DELETE) and run it
-- 5. Run Step 3 to verify deletion
-- 6. Refresh Together Forward app and test with fresh Luna conversation
--
-- ================================================
