-- Script to check and delete milestones for user with email newuser@mail.com
-- Run this in your Supabase SQL Editor

-- Step 1: Find the user and their milestones
SELECT
    u.email,
    u.id as user_id,
    r.id as roadmap_id,
    r.title as roadmap_title,
    m.id as milestone_id,
    m.title as milestone_title,
    m.budget_amount
FROM
    auth.users u
    LEFT JOIN roadmaps r ON r.user_id = u.id
    LEFT JOIN milestones m ON m.roadmap_id = r.id
WHERE
    u.email = 'newuser@mail.com'
ORDER BY
    r.created_at DESC, m.order_index ASC;

-- Step 2: Count milestones for this user
SELECT
    u.email,
    COUNT(m.id) as total_milestones
FROM
    auth.users u
    LEFT JOIN roadmaps r ON r.user_id = u.id
    LEFT JOIN milestones m ON m.roadmap_id = r.id
WHERE
    u.email = 'newuser@mail.com'
GROUP BY
    u.email;

-- Step 3: Delete all milestones EXCEPT "Engagement Celebration" and "James and Anna"
-- CAUTION: Uncomment the lines below only after verifying the SELECT query results above!

/*
DELETE FROM milestones
WHERE id IN (
    SELECT m.id
    FROM auth.users u
    JOIN roadmaps r ON r.user_id = u.id
    JOIN milestones m ON m.roadmap_id = r.id
    WHERE u.email = 'newuser@mail.com'
    AND m.title NOT IN ('Engagement Celebration', 'James and Anna')
);

-- Verify the deletion
SELECT
    u.email,
    m.title as remaining_milestone
FROM
    auth.users u
    JOIN roadmaps r ON r.user_id = u.id
    JOIN milestones m ON m.roadmap_id = r.id
WHERE
    u.email = 'newuser@mail.com'
ORDER BY
    m.order_index ASC;
*/
