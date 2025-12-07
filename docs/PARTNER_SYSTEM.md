# Partner System Documentation

Complete guide to the partner collaboration features in TwogetherForward.

## Overview

The Partner System enables couples to:
- Share specific dreams with their partner
- Assign tasks to each other
- Send nudge reminders
- Track progress per partner
- Split and track expenses

---

## Architecture

### Database Schema

```
roadmaps
├── user_id (owner)
├── partner_id (joined partner)
├── partner1_name
└── partner2_name

dream_sharing
├── roadmap_id
├── partner_id
├── share_code (8 chars)
├── invited_email
├── status (pending/accepted/declined)
└── access_level (view/edit/full)

tasks
├── assigned_to (partner name - display)
├── assigned_to_user_id (UUID - for notifications)
└── completed_by

nudges
├── task_id
├── sender_id
├── recipient_id
├── message
├── nudge_type (gentle/friendly/urgent)
└── read

expenses
├── paid_by_name
└── paid_by_user_id
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| ShareDreamModal | `src/Components/Sharing/` | Invite partners via email/code |
| AcceptInvitePage | `src/Components/Partner/` | `/invite/:code` route |
| NudgeButton | `src/Components/Tasks/` | Send task reminders |
| PartnerProgress | `src/Components/Partner/` | Per-partner stats |
| TaskManager | `src/Components/` | Task assignment UI |
| ExpenseTracker | `src/Components/` | Expense paid-by tracking |

---

## Sharing a Dream

### Via Email

```javascript
import { ShareDreamModal } from './Components/Sharing';

<ShareDreamModal
  isOpen={showShare}
  onClose={() => setShowShare(false)}
  roadmap={roadmap}
/>
```

The modal allows:
1. Entering partner's email
2. Adding an optional message
3. Generating a shareable link/code

### Via Share Code

Partners can also accept invites using a share code at:
```
https://twogetherforward.com/invite/ABC12345
```

---

## Task Assignment

### Assigning to a Partner

```javascript
<TaskManager
  milestone={milestone}
  userContext={userContext}
  currentUserId={currentUserId}
  partnerInfo={{
    user_id: roadmap.user_id,
    partner_id: roadmap.partner_id,
    partner1_name: roadmap.partner1_name,
    partner2_name: roadmap.partner2_name
  }}
/>
```

When a task is assigned:
1. `assigned_to` stores the partner's display name
2. `assigned_to_user_id` stores their UUID
3. Database trigger creates a notification
4. Email is queued (if enabled)

---

## Nudge System

### Sending a Nudge

```javascript
import { NudgeButton } from './Components/Tasks';

<NudgeButton
  task={task}
  recipientId={task.assigned_to_user_id}
  recipientName={task.assigned_to}
  onNudgeSent={() => console.log('Nudged!')}
/>
```

### Nudge Types

| Type | Color | Use Case |
|------|-------|----------|
| Gentle | Green | Soft reminder |
| Friendly | Amber | Warm encouragement |
| Urgent | Red | Time-sensitive |

### Service Function

```javascript
import { sendNudge } from './services/supabaseService';

await sendNudge(
  taskId,
  recipientUserId,
  'Hey, can we tackle this today?',
  'friendly' // gentle | friendly | urgent
);
```

---

## Partner Progress Tracking

```javascript
import { PartnerProgress } from './Components/Partner';

<PartnerProgress
  tasks={tasks}
  partnerInfo={partnerInfo}
  userContext={userContext}
/>
```

### Features

- Per-partner completion percentage
- Completed/remaining task counts
- Overdue task warnings
- Contribution comparison bar
- "Who's leading" indicator

---

## Expense Tracking

### Paid-By Field

```javascript
<ExpenseTracker
  milestone={milestone}
  roadmapId={roadmapId}
  partnerInfo={partnerInfo}
  currentUserId={currentUserId}
  userContext={userContext}
/>
```

Each expense can track:
- `paid_by_name` - Display name
- `paid_by_user_id` - UUID for queries

---

## Notifications

### Automatic Triggers

| Event | Notification Type |
|-------|------------------|
| Task assigned | `task_assigned` |
| Task completed | `task_completed` |
| Nudge received | `nudge_received` |
| Partner joined | `partner_joined` |

### Using Notifications Hook

```javascript
import { useNotifications } from './hooks/useNotifications';

const {
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead
} = useNotifications();
```

---

## Activity Feed

```javascript
import { useActivityFeed } from './hooks/useActivityFeed';

const { activities, loading } = useActivityFeed(roadmapId);
```

### Activity Types

- `task_created`
- `task_completed`
- `expense_added`
- `nudge_sent`
- `partner_joined`

---

## Real-time Updates

### Subscription Management

```javascript
import { subscribe, unsubscribe } from './utils/subscriptionManager';

// Subscribe with deduplication
const sub = subscribe('my-channel', () =>
  supabase.channel('my-channel').on(...).subscribe()
);

// Cleanup
unsubscribe('my-channel');
```

### Automatic Cleanup

Subscriptions are automatically cleaned up on:
- Component unmount (via useEffect cleanup)
- User sign out (via AuthContext)

---

## Testing

### Running Tests

```bash
npm test -- --testPathPattern=partner
```

### Test Files

- `__tests__/partner/NudgeButton.test.js`
- `__tests__/partner/PartnerProgress.test.js`
- `__tests__/utils/subscriptionManager.test.js`

---

## Email Notifications

See [EMAIL_NOTIFICATIONS_SETUP.md](./EMAIL_NOTIFICATIONS_SETUP.md) for:
- Resend configuration
- Email templates
- Cron job setup

---

## Push Notifications

See [PUSH_NOTIFICATIONS_SETUP.md](./PUSH_NOTIFICATIONS_SETUP.md) for:
- Service worker setup
- VAPID key configuration
- Permission flow

---

## Mobile Considerations

### Responsive Hooks

```javascript
import { useResponsive } from './hooks/useResponsive';

const { isMobile, isTablet, isDesktop } = useResponsive();
```

### Platform Utils

```javascript
import { isWeb, isMobileBrowser, haptics } from './utils/platform';

// Haptic feedback on mobile
haptics.impact('light');
```

---

## Security

### Row Level Security (RLS)

All partner operations are protected by RLS:
- Users can only see their own roadmaps or ones shared with them
- Nudges can only be sent between partners on shared roadmaps
- Notifications are private to recipients

### Validation

- Share codes expire after 7 days
- Partner invites require valid email or authenticated user
- Task assignment validates partner relationship

---

## Troubleshooting

### Partner Not Showing

1. Check `dream_sharing` status is 'accepted'
2. Verify `partner_id` is set on roadmap
3. Check RLS policies allow access

### Nudges Not Sending

1. Verify `assigned_to_user_id` is set (not just `assigned_to`)
2. Check recipient has notifications enabled
3. Review `nudges` table for errors

### Notifications Not Appearing

1. Check `notification_preferences` table
2. Verify Realtime subscription is active
3. Check browser console for WebSocket errors

---

## API Reference

### Partner Service Functions

```javascript
// Share a dream
createDreamShareInvite(roadmapId, invitedEmail, message, accessLevel)

// Accept invite
acceptDreamShare(shareCode)

// Get partner info
getPartnerInfo(roadmapId)

// Send nudge
sendNudge(taskId, recipientId, message, nudgeType)

// Get unread nudges
getUnreadNudges()

// Mark nudge as read
markNudgeRead(nudgeId)
```

---

## Future Enhancements

- [ ] Partner chat/messaging
- [ ] Shared calendar view
- [ ] Budget split calculator
- [ ] Partner availability status
- [ ] React Native app support
