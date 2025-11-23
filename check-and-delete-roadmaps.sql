-- Script to check and delete roadmaps for user newuser@mail.com
-- Run this in your Supabase SQL Editor

-- Step 1: See all roadmaps for this user with their milestone counts
SELECT
    u.email,
    r.id as roadmap_id,
    r.title as roadmap_title,
    r.created_at,
    (SELECT COUNT(*) FROM milestones m WHERE m.roadmap_id = r.id) as milestone_count
FROM
    auth.users u
    JOIN roadmaps r ON r.user_id = u.id
WHERE
    u.email = 'newuser@mail.com'
ORDER BY
    r.created_at DESC;

-- Step 2: Find roadmaps with only "Engagement Celebration" milestone
SELECT
    r.id as roadmap_id,
    r.title as roadmap_title,
    m.title as milestone_title
FROM
    auth.users u
    JOIN roadmaps r ON r.user_id = u.id
    LEFT JOIN milestones m ON m.roadmap_id = r.id
WHERE
    u.email = 'newuser@mail.com'
    AND (m.title IS NULL OR m.title = 'Engagement Celebration')
ORDER BY
    r.created_at DESC;

-- Step 3: Delete empty roadmaps (roadmaps with no milestones)
-- CAUTION: Uncomment only after verifying the SELECT query results!

/*
DELETE FROM roadmaps
WHERE id IN (
    SELECT r.id
    FROM auth.users u
    JOIN roadmaps r ON r.user_id = u.id
    LEFT JOIN milestones m ON m.roadmap_id = r.id
    WHERE u.email = 'newuser@mail.com'
    GROUP BY r.id
    HAVING COUNT(m.id) = 0
);
*/

-- Step 4: OR keep only the roadmap that has "Engagement Celebration"
-- and delete all others
-- CAUTION: Uncomment only after verifying!

/*
DELETE FROM roadmaps
WHERE id IN (
    SELECT r.id
    FROM auth.users u
    JOIN roadmaps r ON r.user_id = u.id
    WHERE u.email = 'newuser@mail.com'
    AND r.id NOT IN (
        SELECT DISTINCT m.roadmap_id
        FROM milestones m
        WHERE m.title = 'Engagement Celebration'
    )
);
*/

-- Step 5: Verify - should show only 1 roadmap
SELECT
    u.email,
    r.title as roadmap_title,
    (SELECT COUNT(*) FROM milestones m WHERE m.roadmap_id = r.id) as milestone_count
FROM
    auth.users u
    JOIN roadmaps r ON r.user_id = u.id
WHERE
    u.email = 'newuser@mail.com';
