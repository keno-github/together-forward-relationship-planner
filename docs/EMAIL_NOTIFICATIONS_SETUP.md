# Email Notifications Setup Guide

This guide walks you through setting up email notifications for TwogetherForward using Resend.

## Overview

The email system consists of:
- **send-email**: Core function that sends emails via Resend
- **process-email-queue**: Processes queued emails (runs every few minutes)
- **weekly-digest**: Sends weekly summaries (runs every Sunday 9 AM)
- **Database triggers**: Auto-queue emails on events (invites, tasks, nudges)

### Email Types

| Type | From Address | Trigger |
|------|--------------|---------|
| Partner Invite | team@twogetherforward.com | Dream shared with email |
| Partner Joined | team@twogetherforward.com | Partner accepts invite |
| Task Assigned | notifications@twogetherforward.com | Task assigned to partner |
| Nudge | notifications@twogetherforward.com | Partner sends nudge |
| Weekly Digest | digest@twogetherforward.com | Cron: Sunday 9 AM |

---

## Step 1: Set Up Resend Account

1. Go to [resend.com](https://resend.com) and create an account
2. Verify your domain: `twogetherforward.com`

### Domain Verification (DNS Records)

Add these records to your domain's DNS:

```
Type: TXT
Name: resend._domainkey
Value: (provided by Resend)

Type: MX
Name: send
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10
```

3. Wait for verification (usually 5-10 minutes)
4. Get your API key from Resend Dashboard

---

## Step 2: Add Supabase Secrets

Go to: **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `RESEND_API_KEY` | `re_xxxxxxxxxxxxx` (from Resend) |
| `APP_URL` | `https://twogetherforward.com` |

---

## Step 3: Run Database Migration

Go to: **Supabase Dashboard** → **SQL Editor**

Run the migration:
```sql
-- Copy and run: migrations/008_email_notifications.sql
```

This creates:
- `email_queue` table - Pending emails to send
- `email_log` table - History of sent emails
- Triggers for auto-queuing emails
- Functions for processing queue

---

## Step 4: Deploy Edge Functions

### Using Supabase CLI:

```bash
# Login and link project
supabase login
supabase link --project-ref djguquclcyhwqijnobcp

# Deploy all email functions
supabase functions deploy send-email
supabase functions deploy process-email-queue
supabase functions deploy weekly-digest
```

### Or via Dashboard:

1. Go to **Edge Functions** → **New Function**
2. Create each function:
   - `send-email` - from `supabase/functions/send-email/index.ts`
   - `process-email-queue` - from `supabase/functions/process-email-queue/index.ts`
   - `weekly-digest` - from `supabase/functions/weekly-digest/index.ts`

---

## Step 5: Set Up Cron Jobs

Use Supabase's pg_cron extension or an external service:

### Option A: pg_cron (Supabase)

```sql
-- Enable pg_cron (run in SQL Editor)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Process email queue every 2 minutes
SELECT cron.schedule(
  'process-emails',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://djguquclcyhwqijnobcp.supabase.co/functions/v1/process-email-queue',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Weekly digest every Sunday at 9 AM UTC
SELECT cron.schedule(
  'weekly-digest',
  '0 9 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://djguquclcyhwqijnobcp.supabase.co/functions/v1/weekly-digest',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

### Option B: External Cron (cron-job.org, GitHub Actions)

Create a scheduled task that calls:
- `POST /functions/v1/process-email-queue` - Every 2-5 minutes
- `POST /functions/v1/weekly-digest` - Sundays at 9 AM

---

## Step 6: Test Email Sending

### Test send-email function:

```bash
curl -X POST 'https://djguquclcyhwqijnobcp.supabase.co/functions/v1/send-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "your-email@example.com",
    "type": "partner_invite",
    "data": {
      "inviter_name": "Test User",
      "dream_title": "Dream Wedding",
      "share_code": "TEST123",
      "invite_url": "https://twogetherforward.com/invite/TEST123"
    }
  }'
```

### Test weekly digest:

```bash
curl -X POST 'https://djguquclcyhwqijnobcp.supabase.co/functions/v1/weekly-digest' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

---

## Email Templates Preview

### Partner Invite
- **From**: team@twogetherforward.com
- **Subject**: "Sarah invited you to join their dream on TwogetherForward"
- **Style**: Branded, warm gradient header, prominent CTA button

### Weekly Digest
- **From**: digest@twogetherforward.com
- **Subject**: "Your Week in Review: 8 tasks completed"
- **Sections**:
  - 🎉 Tasks Completed (celebrate wins)
  - 📅 Coming Up Next Week
  - ⚠️ Needs Attention (overdue)
  - 📊 Dream Progress (visual bars)
  - 💰 Budget Health

### Task Assigned / Nudge
- **From**: notifications@twogetherforward.com
- **Style**: Clean, minimal header, quick action button
- **Footer**: Unsubscribe link

---

## User Preferences

Users can control email notifications in Settings:

| Preference | Default | Description |
|------------|---------|-------------|
| `email_enabled` | true | Master toggle for all emails |
| `email_weekly_digest` | true | Weekly summary emails |
| `email_task_assigned` | true | When assigned a task |
| `email_task_completed` | true | When partner completes task |
| `email_nudges` | true | When partner nudges you |
| `email_partner_activity` | true | Partner activity updates |

---

## Troubleshooting

### Emails not sending?

1. **Check Resend Dashboard** for delivery status
2. **Check email_queue table** for pending/failed status
3. **Check email_log table** for errors
4. **Verify secrets** are set in Edge Functions

### Common Errors:

| Error | Solution |
|-------|----------|
| "RESEND_API_KEY not configured" | Add secret in Supabase |
| "Domain not verified" | Complete DNS verification in Resend |
| "Rate limited" | Resend free tier: 100/day, 3000/month |
| "Invalid recipient" | Check email format |

### View Queue Status:

```sql
-- Pending emails
SELECT * FROM email_queue WHERE status = 'pending' ORDER BY created_at;

-- Failed emails
SELECT * FROM email_queue WHERE status = 'failed';

-- Recent sent emails
SELECT * FROM email_log WHERE status = 'sent' ORDER BY sent_at DESC LIMIT 20;
```

---

## Production Checklist

- [ ] Resend account created
- [ ] Domain verified (twogetherforward.com)
- [ ] RESEND_API_KEY added to Supabase secrets
- [ ] APP_URL secret set
- [ ] Database migration run (008_email_notifications.sql)
- [ ] Edge Functions deployed (send-email, process-email-queue, weekly-digest)
- [ ] Cron jobs set up (queue processor, weekly digest)
- [ ] Test emails sent successfully
- [ ] Unsubscribe links working

---

## Cost Estimation

**Resend Pricing:**
- Free: 100 emails/day, 3000/month
- Pro ($20/mo): 50,000 emails/month

**Expected Usage (100 active users):**
- Partner invites: ~50/month
- Task assignments: ~200/month
- Nudges: ~100/month
- Weekly digests: ~400/month (100 users × 4 weeks)
- **Total: ~750 emails/month** (fits in free tier)
