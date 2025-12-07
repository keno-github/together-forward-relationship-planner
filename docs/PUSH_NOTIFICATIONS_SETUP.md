# Push Notifications Setup Guide

This guide walks you through setting up push notifications for TwogetherForward.

## Overview

The push notification system consists of:
1. **Service Worker** (`public/sw.js`) - Handles push events in the browser
2. **VAPID Keys** - Authentication for Web Push
3. **Supabase Edge Function** - Sends push notifications to subscribed users
4. **Database Tables** - Stores subscriptions and queues notifications

---

## Step 1: VAPID Keys (Already Done)

Your VAPID keys have been generated and added to `.env`:

```
REACT_APP_VAPID_PUBLIC_KEY=BMUalTEkL2V2OGMCIc9YeYUb1SpJtsOrYMDY2Wa9vRMB_bJV70Z48ph5eNS7ntZnXBghjfezz7mt34Ff831gKCs
VAPID_PRIVATE_KEY=U5BSkVzBDQNbNjHNMqmBsGQUwRqtHtJzl0yqn4omhcI
```

---

## Step 2: Add Supabase Secrets

Go to your Supabase Dashboard and add these secrets:

1. Navigate to: **Project Settings** → **Edge Functions** → **Secrets**
2. Add the following secrets:

| Secret Name | Value |
|-------------|-------|
| `VAPID_PUBLIC_KEY` | `BMUalTEkL2V2OGMCIc9YeYUb1SpJtsOrYMDY2Wa9vRMB_bJV70Z48ph5eNS7ntZnXBghjfezz7mt34Ff831gKCs` |
| `VAPID_PRIVATE_KEY` | `U5BSkVzBDQNbNjHNMqmBsGQUwRqtHtJzl0yqn4omhcI` |
| `VAPID_SUBJECT` | `mailto:your-email@example.com` |

---

## Step 3: Run Database Migration

Run the migration to create the push notification queue:

```sql
-- Run in Supabase SQL Editor
-- Copy contents of: migrations/007_push_notification_trigger.sql
```

---

## Step 4: Deploy Edge Function

### Option A: Using Supabase CLI

1. Install Supabase CLI (if not installed):
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref djguquclcyhwqijnobcp
```

4. Deploy the Edge Function:
```bash
supabase functions deploy send-push
```

### Option B: Manual Deployment via Dashboard

1. Go to: **Edge Functions** in Supabase Dashboard
2. Click **New Function**
3. Name it `send-push`
4. Copy the contents of `supabase/functions/send-push/index.ts`
5. Click **Deploy**

---

## Step 5: Test Push Notifications

### Test from Browser Console:

```javascript
// 1. First, enable notifications
const { usePushNotifications } = await import('./hooks/usePushNotifications');

// 2. Or test the service worker directly
if ('serviceWorker' in navigator && 'PushManager' in window) {
  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification('Test Notification', {
    body: 'Push notifications are working!',
    icon: '/logo192.png'
  });
}
```

### Test Edge Function:

```bash
curl -X POST 'https://djguquclcyhwqijnobcp.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "USER_UUID_HERE",
    "notification": {
      "title": "Test Push",
      "body": "This is a test push notification",
      "type": "test"
    }
  }'
```

---

## How It Works

### Flow:
1. User enables push notifications in the app
2. Browser generates a push subscription (endpoint + keys)
3. Subscription is saved to `push_subscriptions` table
4. When a notification is created, it's added to `push_notification_queue`
5. Edge Function processes the queue and sends to Web Push API
6. Service Worker receives push and shows browser notification
7. User clicks notification → opens app to relevant page

### Database Tables:
- `push_subscriptions` - User's browser push endpoints
- `push_notification_queue` - Queue of notifications to send
- `notification_preferences` - User's notification settings

---

## Troubleshooting

### Push not working?

1. **Check browser support**: Push only works in HTTPS (or localhost)
2. **Check permissions**: User must grant notification permission
3. **Check subscription**: Verify subscription exists in `push_subscriptions`
4. **Check logs**: View Edge Function logs in Supabase Dashboard

### Common Errors:

| Error | Solution |
|-------|----------|
| "Push not supported" | Use a modern browser (Chrome, Firefox, Edge) |
| "Permission denied" | User blocked notifications - they need to enable in browser settings |
| "410 Gone" | Subscription expired - user needs to re-subscribe |
| "VAPID keys not configured" | Add secrets to Supabase Edge Functions |

---

## Production Checklist

- [ ] VAPID keys added to Supabase secrets
- [ ] Edge Function deployed
- [ ] Database migration run
- [ ] Service worker registered (check DevTools → Application)
- [ ] Test notification sent successfully
- [ ] VAPID_SUBJECT set to your actual email/URL

---

## Security Notes

- VAPID private key should NEVER be exposed to frontend
- Push subscriptions are user-specific (RLS enforced)
- Service worker only runs on HTTPS in production
- Edge Function requires authentication
