# Roadmap-Task Integration Implementation

## Overview
This implementation adds comprehensive roadmap-task integration with couple sync functionality to the TogetherForward app.

## Architecture

### Hierarchy
```
MILESTONE (Global Goal)
  └── ROADMAP PHASES (Journey steps to achieve milestone)
       └── TASKS (Actionable items for each phase)
```

### Example
```
Milestone: "Get Married"
  ├── Phase 1: "Financial Preparation"
  │    ├── Task: "Open joint savings account" (assigned to: Partner 1)
  │    └── Task: "Create wedding budget spreadsheet" (assigned to: Partner 2)
  ├── Phase 2: "Venue Search"
  │    ├── Task: "Research 10 potential venues" (assigned to: Both)
  │    └── Task: "Visit top 3 venues" (assigned to: Both)
  └── Phase 3: "Guest Planning"
       └── Task: "Create guest list" (assigned to: Partner 1)
```

## Database Changes

### Migration File
**Location:** `migrations/add_task_roadmap_phase_columns.sql`

**New Columns Added to `tasks` Table:**
1. `roadmap_phase_index` (INTEGER) - Links task to specific phase index
2. `assigned_to` (TEXT) - Partner assignment (Partner 1, Partner 2, or NULL for both)
3. `priority` (TEXT) - Task priority (low, medium, high)

### To Apply Migration
Run the SQL file in your Supabase SQL Editor:
```sql
-- Located at: migrations/add_task_roadmap_phase_columns.sql
```

## Features Implemented

### 1. Phase-Specific Task Creation
- Users can add tasks directly to any roadmap phase
- Click "Add Task to This Phase" button in expanded phase view
- Tasks are automatically linked to the correct phase index

### 2. Partner Assignment
- Each task can be assigned to:
  - Partner 1
  - Partner 2
  - Both partners (default)
- Assigned partner name is stored in `assigned_to` field
- Future: Tasks can be filtered by logged-in partner

### 3. Task Priority
- Three priority levels: Low, Medium, High
- Visual indicators with color coding:
  - 🔴 High
  - 🟡 Medium
  - 🟢 Low

### 4. Progress Tracking
- Phase progress calculated from completed tasks in that phase
- Overall milestone progress = average of all phase progress
- Visual progress bars on each phase

## Components Modified

### 1. RoadmapTreeView.js
**New Features:**
- "Add Task" button in each phase
- Inline task creation form
- Partner assignment dropdown
- Priority selection
- Real-time task reload after creation

**Key Functions:**
- `handleAddTaskClick(phaseIndex)` - Opens add task form for specific phase
- `handleSaveTask(phaseIndex)` - Creates task linked to phase
- `onTasksUpdated` callback - Reloads tasks after changes

### 2. MilestoneDetailPage.js
**Changes:**
- Added `getTasksByMilestone` import
- Implemented `loadTasks()` function to fetch tasks from database
- Pass `onTasksUpdated={loadTasks}` to RoadmapTreeView
- Fixed TaskManager to reload tasks instead of full page refresh

### 3. supabaseService.js
**New Functions:**
```javascript
// Get tasks for specific phase
getTasksByPhase(milestoneId, phaseIndex)

// Get tasks assigned to specific partner
getTasksByPartner(milestoneId, partnerName)

// Create task linked to phase
createPhaseTask(taskData, phaseIndex)

// Get phase completion stats
getPhaseProgress(milestoneId, phaseIndex)
```

## How Tasks Link to Phases

### Method 1: Explicit Phase Link (Primary)
Tasks with `roadmap_phase_index` set are directly linked:
```javascript
task.roadmap_phase_index = 2  // Linked to phase at index 2
```

### Method 2: Keyword Matching (Fallback)
Tasks without `roadmap_phase_index` are matched by keywords:
```javascript
// Phase: "Venue Search"
// Task: "Research wedding venues" → Matches "venue"
```

## Couple Sync Architecture

### Current Implementation
- Tasks have `assigned_to` field storing partner name
- Partner names come from `userContext.partner1` and `userContext.partner2`
- Tasks with NULL `assigned_to` are shared (visible to both)

### Future Enhancement: Partner Filtering
To filter tasks by logged-in partner, add this to any component:

```javascript
const currentUser = getUserProfile(); // Get logged-in user

const myTasks = tasks.filter(task =>
  !task.assigned_to || // Tasks assigned to both
  task.assigned_to === currentUser.name // Tasks assigned to me
);
```

### Example Use Case
When **Partner A** logs in:
- See tasks assigned to "Partner A"
- See tasks assigned to "Both"
- **Don't** see tasks only assigned to "Partner B"

## User Flow

### Adding a Task to a Roadmap Phase

1. Navigate to Milestone Detail Page
2. Click "Roadmap" tab
3. Expand the desired phase (e.g., "Venue Search")
4. Click "Add Task to This Phase"
5. Fill in:
   - Task title (required)
   - Description (optional)
   - Assign to: Partner 1 / Partner 2 / Both
   - Priority: Low / Medium / High
6. Click "Save Task"
7. Task appears in the phase immediately
8. Progress bar updates automatically

### Completing a Task

1. Navigate to "Tasks" tab OR expand phase in "Roadmap" tab
2. Click checkbox next to task
3. Task is marked complete
4. Progress bars update across all views

## Progress Calculation

### Phase Progress
```javascript
const phaseProgress = (completedTasks / totalTasks) * 100
```

### Roadmap Progress
```javascript
const roadmapProgress = average(allPhaseProgresses)
```

### Milestone Completion
Milestone is complete when ALL roadmap phases are at 100%

## Testing the Implementation

### Step 1: Apply Database Migration
```sql
-- Run migrations/add_task_roadmap_phase_columns.sql in Supabase
```

### Step 2: Create a Test Milestone
1. Create a new milestone (e.g., "Plan Wedding")
2. Let Luna generate the roadmap phases
3. Navigate to the milestone detail page

### Step 3: Add Tasks to Phases
1. Go to "Roadmap" tab
2. Expand "Phase 1"
3. Click "Add Task to This Phase"
4. Create a test task assigned to Partner 1
5. Repeat for Phase 2 with task assigned to Partner 2
6. Repeat for Phase 3 with task assigned to Both

### Step 4: Test Progress Tracking
1. Mark some tasks as complete in "Tasks" tab
2. Return to "Roadmap" tab
3. Verify phase progress bars update correctly
4. Check overall milestone progress in header

### Step 5: Test Couple Sync (Future)
1. Log in as Partner 1
2. Filter tasks to show only "My Tasks"
3. Verify only Partner 1's tasks and "Both" tasks appear
4. Log in as Partner 2
5. Verify only Partner 2's tasks appear

## Known Issues & Future Enhancements

### To Implement Next

1. **Partner Task Filtering**
   - Add toggle in TaskManager: "Show All Tasks" vs "My Tasks"
   - Filter by `assigned_to` field

2. **Task Notifications**
   - Notify partner when task is assigned to them
   - Email/push notifications for due dates

3. **Drag & Drop Tasks**
   - Allow moving tasks between phases
   - Reorder tasks within a phase

4. **Bulk Task Operations**
   - Select multiple tasks
   - Bulk assign to partner
   - Bulk change priority

5. **Task Dependencies**
   - Link tasks (e.g., "Book venue" must complete before "Send invitations")
   - Visual dependency tree

## Code References

### Key Files Modified
- `src/Components/RoadmapTreeView.js` - Main roadmap view with task creation
- `src/Components/MilestoneDetailPage.js` - Parent container managing tasks
- `src/services/supabaseService.js` - Database operations for tasks
- `migrations/add_task_roadmap_phase_columns.sql` - Database schema changes

### Important Functions
- `createPhaseTask()` in supabaseService.js:328
- `handleSaveTask()` in RoadmapTreeView.js:127
- `loadTasks()` in MilestoneDetailPage.js:62

## Summary

This implementation provides:
✅ Direct task creation within roadmap phases
✅ Partner-specific task assignment
✅ Task priority levels
✅ Real-time progress tracking
✅ Couple sync foundation (database schema ready)
✅ Automatic phase linking for all tasks

Next steps:
🔲 Apply database migration
🔲 Implement partner filtering UI
🔲 Add task notifications
🔲 Test with real couple users
