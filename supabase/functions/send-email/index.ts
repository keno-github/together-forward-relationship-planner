// Supabase Edge Function: send-email
// Sends emails via Resend API with branded templates

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email sender addresses by type
const EMAIL_SENDERS = {
  notifications: "TwogetherForward <notifications@twogetherforward.com>",
  digest: "TwogetherForward Weekly <digest@twogetherforward.com>",
  team: "TwogetherForward Team <team@twogetherforward.com>",
};

// Email types and their configurations
const EMAIL_CONFIG: Record<string, { sender: keyof typeof EMAIL_SENDERS; subject: (data: any) => string }> = {
  partner_invite: {
    sender: "team",
    subject: (data) => `${data.inviter_name} invited you to join their dream on TwogetherForward`,
  },
  partner_joined: {
    sender: "team",
    subject: (data) => `${data.partner_name} joined your dream: ${data.dream_title}`,
  },
  assessment_invite: {
    sender: "team",
    subject: (data) => `${data.inviter_name} wants to take a relationship alignment test with you`,
  },
  welcome: {
    sender: "team",
    subject: () => "Welcome to TwogetherForward! Let's plan your future together",
  },
  task_assigned: {
    sender: "notifications",
    subject: (data) => `New task assigned: ${data.task_title}`,
  },
  task_completed: {
    sender: "notifications",
    subject: (data) => `Task completed: ${data.task_title}`,
  },
  nudge: {
    sender: "notifications",
    subject: (data) => `${data.sender_name} nudged you about: ${data.task_title}`,
  },
  weekly_digest: {
    sender: "digest",
    subject: (data) => `Your Week in Review: ${data.tasks_completed} tasks completed`,
  },
  overdue_reminder: {
    sender: "notifications",
    subject: (data) => `Reminder: ${data.overdue_count} task${data.overdue_count > 1 ? 's' : ''} overdue`,
  },
};

// Generate branded email HTML
function generateEmailHTML(type: string, data: any): string {
  const baseStyles = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #2D2926; margin: 0; padding: 0; background-color: #FDFCF8; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #F59E0B 0%, #EA580C 100%); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 600; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px; }
    .content { padding: 32px; }
    .card { background: #FAF7F2; border-radius: 12px; padding: 20px; margin: 16px 0; border: 1px solid #E8E2DA; }
    .button { display: inline-block; background: #2D2926; color: white !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .button-secondary { background: #F59E0B; }
    .footer { padding: 24px 32px; background: #FAF7F2; text-align: center; font-size: 12px; color: #6B5E54; border-top: 1px solid #E8E2DA; }
    .progress-bar { background: #E8E2DA; border-radius: 999px; height: 8px; overflow: hidden; }
    .progress-fill { background: linear-gradient(90deg, #F59E0B, #EA580C); height: 100%; border-radius: 999px; }
    .task-item { display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #E8E2DA; }
    .task-item:last-child { border-bottom: none; }
    .check { color: #22C55E; margin-right: 12px; font-size: 18px; }
    .arrow { color: #F59E0B; margin-right: 12px; font-size: 18px; }
    .warning { color: #EF4444; margin-right: 12px; font-size: 18px; }
    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 16px 0; }
    .stat { text-align: center; padding: 16px; background: #FAF7F2; border-radius: 8px; }
    .stat-value { font-size: 28px; font-weight: 700; color: #2D2926; }
    .stat-label { font-size: 12px; color: #6B5E54; text-transform: uppercase; letter-spacing: 0.5px; }
  `;

  switch (type) {
    case "partner_invite":
      return `
        <!DOCTYPE html>
        <html><head><style>${baseStyles}</style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1>You're Invited!</h1>
              <p>Someone special wants to plan the future with you</p>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p><strong>${data.inviter_name}</strong> has invited you to join their dream on TwogetherForward:</p>

              <div class="card">
                <h2 style="margin: 0 0 8px; color: #2D2926;">${data.dream_title}</h2>
                ${data.message ? `<p style="color: #6B5E54; margin: 0;">"${data.message}"</p>` : ''}
              </div>

              <p>TwogetherForward helps couples plan their dreams together – from weddings to homes to adventures.</p>

              <div style="text-align: center;">
                <a href="${data.invite_url}" class="button button-secondary">Accept Invitation</a>
              </div>

              <p style="font-size: 14px; color: #6B5E54;">Or use this code: <strong>${data.share_code}</strong></p>
            </div>
            <div class="footer">
              <p>TwogetherForward – Plan your future, together</p>
              <p>This invite expires in 7 days.</p>
            </div>
          </div>
        </body></html>
      `;

    case "partner_joined":
      return `
        <!DOCTYPE html>
        <html><head><style>${baseStyles}</style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Partner Joined!</h1>
              <p>Time to start planning together</p>
            </div>
            <div class="content">
              <p>Great news!</p>
              <p><strong>${data.partner_name}</strong> has accepted your invitation and joined your dream:</p>

              <div class="card">
                <h2 style="margin: 0; color: #2D2926;">${data.dream_title}</h2>
              </div>

              <p>You can now:</p>
              <ul>
                <li>Assign tasks to each other</li>
                <li>Track progress together</li>
                <li>Get notified of updates</li>
                <li>Nudge each other when needed</li>
              </ul>

              <div style="text-align: center;">
                <a href="${data.dream_url}" class="button">View Your Dream</a>
              </div>
            </div>
            <div class="footer">
              <p>TwogetherForward – Plan your future, together</p>
            </div>
          </div>
        </body></html>
      `;

    case "assessment_invite":
      return `
        <!DOCTYPE html>
        <html><head><style>${baseStyles}</style></head>
        <body>
          <div class="container">
            <div class="header" style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);">
              <h1>Alignment Test Invite</h1>
              <p>Discover where you align with your partner</p>
            </div>
            <div class="content">
              <p>Hi ${data.partner_name},</p>
              <p><strong>${data.inviter_name}</strong> wants to take a relationship alignment test with you on TwogetherForward!</p>

              <div class="card">
                <h2 style="margin: 0 0 8px; color: #2D2926;">What is the Alignment Test?</h2>
                <p style="color: #6B5E54; margin: 0;">Luna, our AI guide, will ask you both thoughtful questions about your priorities, values, and dreams. You'll discover where you're strongly aligned and where you might need to have a conversation.</p>
              </div>

              <ul style="color: #6B5E54;">
                <li>Takes about 15-20 minutes</li>
                <li>Complete it on your own device</li>
                <li>Get personalized insights together</li>
              </ul>

              <div style="text-align: center;">
                <a href="${data.invite_url}" class="button" style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);">Start the Test</a>
              </div>

              <p style="font-size: 14px; color: #6B5E54; text-align: center;">Or enter this code: <strong>${data.session_code}</strong></p>
            </div>
            <div class="footer">
              <p>TwogetherForward – Plan your future, together</p>
              <p>This session expires in 7 days.</p>
            </div>
          </div>
        </body></html>
      `;

    case "task_assigned":
      return `
        <!DOCTYPE html>
        <html><head><style>${baseStyles}</style></head>
        <body>
          <div class="container">
            <div class="header" style="padding: 24px;">
              <h1 style="font-size: 20px;">New Task Assigned</h1>
            </div>
            <div class="content">
              <p><strong>${data.assigner_name}</strong> assigned you a task:</p>

              <div class="card">
                <h3 style="margin: 0 0 8px; color: #2D2926;">${data.task_title}</h3>
                ${data.task_description ? `<p style="color: #6B5E54; margin: 0; font-size: 14px;">${data.task_description}</p>` : ''}
                ${data.due_date ? `<p style="color: #F59E0B; margin: 8px 0 0; font-size: 14px;">Due: ${data.due_date}</p>` : ''}
              </div>

              <div style="text-align: center;">
                <a href="${data.task_url}" class="button">View Task</a>
              </div>
            </div>
            <div class="footer">
              <p><a href="${data.unsubscribe_url}" style="color: #6B5E54;">Unsubscribe from task notifications</a></p>
            </div>
          </div>
        </body></html>
      `;

    case "nudge":
      return `
        <!DOCTYPE html>
        <html><head><style>${baseStyles}</style></head>
        <body>
          <div class="container">
            <div class="header" style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 24px;">
              <h1 style="font-size: 20px;">Friendly Nudge 👋</h1>
            </div>
            <div class="content">
              <p><strong>${data.sender_name}</strong> is checking in on you:</p>

              <div class="card">
                <h3 style="margin: 0 0 8px; color: #2D2926;">${data.task_title}</h3>
                ${data.message ? `<p style="color: #6B5E54; margin: 0; font-style: italic;">"${data.message}"</p>` : ''}
              </div>

              <div style="text-align: center;">
                <a href="${data.task_url}" class="button">Take Action</a>
              </div>
            </div>
            <div class="footer">
              <p><a href="${data.unsubscribe_url}" style="color: #6B5E54;">Unsubscribe from nudges</a></p>
            </div>
          </div>
        </body></html>
      `;

    case "weekly_digest":
      return generateWeeklyDigestHTML(data);

    default:
      return `
        <!DOCTYPE html>
        <html><head><style>${baseStyles}</style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TwogetherForward</h1>
            </div>
            <div class="content">
              ${data.body || '<p>You have a new notification.</p>'}
            </div>
            <div class="footer">
              <p>TwogetherForward – Plan your future, together</p>
            </div>
          </div>
        </body></html>
      `;
  }
}

// Generate weekly digest HTML
function generateWeeklyDigestHTML(data: any): string {
  const {
    partner1_name,
    partner2_name,
    tasks_completed = [],
    tasks_due = [],
    tasks_overdue = [],
    dreams = [],
    budget_spent = 0,
    budget_remaining = 0,
    budget_status = "on_track",
  } = data;

  const baseStyles = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #2D2926; margin: 0; padding: 0; background-color: #FDFCF8; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #F59E0B 0%, #EA580C 100%); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px; }
    .content { padding: 32px; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #6B5E54; margin-bottom: 16px; font-weight: 600; }
    .card { background: #FAF7F2; border-radius: 12px; padding: 20px; margin: 16px 0; border: 1px solid #E8E2DA; }
    .highlight-card { background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border: 1px solid #F59E0B; }
    .task-item { display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #E8E2DA; }
    .task-item:last-child { border-bottom: none; }
    .check { color: #22C55E; margin-right: 12px; }
    .arrow { color: #F59E0B; margin-right: 12px; }
    .warning { color: #EF4444; margin-right: 12px; }
    .progress-bar { background: #E8E2DA; border-radius: 999px; height: 8px; overflow: hidden; margin-top: 8px; }
    .progress-fill { background: linear-gradient(90deg, #F59E0B, #EA580C); height: 100%; border-radius: 999px; }
    .stat-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .button { display: inline-block; background: #2D2926; color: white !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { padding: 24px 32px; background: #FAF7F2; text-align: center; font-size: 12px; color: #6B5E54; border-top: 1px solid #E8E2DA; }
  `;

  const completedTasksHTML = tasks_completed.length > 0
    ? tasks_completed.map((task: any) => `
        <div class="task-item">
          <span class="check">✓</span>
          <span>${task.title}</span>
        </div>
      `).join('')
    : '<p style="color: #6B5E54;">No tasks completed this week. You\'ve got this!</p>';

  const dueTasksHTML = tasks_due.length > 0
    ? tasks_due.map((task: any) => `
        <div class="task-item">
          <span class="arrow">→</span>
          <span>${task.title} <span style="color: #6B5E54; font-size: 14px;">(Due ${task.due_date})</span></span>
        </div>
      `).join('')
    : '<p style="color: #6B5E54;">Nothing due next week. Enjoy the breather!</p>';

  const overdueHTML = tasks_overdue.length > 0
    ? `
      <div class="section">
        <div class="section-title">⚠️ Needs Attention</div>
        <div class="card" style="border-color: #FCA5A5; background: #FEF2F2;">
          ${tasks_overdue.map((task: any) => `
            <div class="task-item">
              <span class="warning">!</span>
              <span>${task.title}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `
    : '';

  const dreamsHTML = dreams.map((dream: any) => `
    <div class="card">
      <div class="stat-row">
        <strong>${dream.title}</strong>
        <span style="color: ${dream.progress_change >= 0 ? '#22C55E' : '#EF4444'};">
          ${dream.progress_change >= 0 ? '+' : ''}${dream.progress_change}%
        </span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${dream.progress}%;"></div>
      </div>
      <p style="font-size: 14px; color: #6B5E54; margin: 8px 0 0;">${dream.progress}% complete</p>
    </div>
  `).join('');

  const budgetStatusColor = budget_status === 'on_track' ? '#22C55E' : budget_status === 'warning' ? '#F59E0B' : '#EF4444';
  const budgetStatusText = budget_status === 'on_track' ? '✓ On Track' : budget_status === 'warning' ? '⚠️ Watch Spending' : '🚨 Over Budget';

  return `
    <!DOCTYPE html>
    <html><head><style>${baseStyles}</style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Week in Review</h1>
          <p>${partner1_name} & ${partner2_name}</p>
        </div>

        <div class="content">
          <!-- Celebration Section -->
          <div class="section">
            <div class="section-title">🎉 Tasks Completed This Week</div>
            <div class="card highlight-card">
              <p style="font-size: 24px; font-weight: 700; margin: 0 0 16px; color: #92400E;">
                ${tasks_completed.length} task${tasks_completed.length !== 1 ? 's' : ''} done!
              </p>
              ${completedTasksHTML}
            </div>
          </div>

          <!-- Upcoming Tasks -->
          <div class="section">
            <div class="section-title">📅 Coming Up Next Week</div>
            <div class="card">
              ${dueTasksHTML}
            </div>
          </div>

          ${overdueHTML}

          <!-- Progress Section -->
          ${dreams.length > 0 ? `
          <div class="section">
            <div class="section-title">📊 Dream Progress</div>
            ${dreamsHTML}
          </div>
          ` : ''}

          <!-- Budget Health -->
          <div class="section">
            <div class="section-title">💰 Budget Health</div>
            <div class="card">
              <div class="stat-row">
                <span>Spent this week</span>
                <strong>€${budget_spent.toLocaleString()}</strong>
              </div>
              <div class="stat-row">
                <span>Remaining</span>
                <strong>€${budget_remaining.toLocaleString()}</strong>
              </div>
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #E8E2DA;">
                <span style="color: ${budgetStatusColor}; font-weight: 600;">${budgetStatusText}</span>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${data.dashboard_url}" class="button">View Full Dashboard</a>
          </div>
        </div>

        <div class="footer">
          <p>TwogetherForward – Plan your future, together</p>
          <p style="margin-top: 16px;">
            <a href="${data.unsubscribe_url}" style="color: #6B5E54;">Unsubscribe from weekly digest</a>
          </p>
        </div>
      </div>
    </body></html>
  `;
}

// Generate plain text version
function generatePlainText(type: string, data: any): string {
  switch (type) {
    case "partner_invite":
      return `
${data.inviter_name} invited you to join their dream on TwogetherForward!

Dream: ${data.dream_title}
${data.message ? `Message: "${data.message}"` : ''}

Accept the invitation: ${data.invite_url}
Or use code: ${data.share_code}

This invite expires in 7 days.

--
TwogetherForward - Plan your future, together
      `.trim();

    case "assessment_invite":
      return `
Hi ${data.partner_name},

${data.inviter_name} wants to take a relationship alignment test with you on TwogetherForward!

What is the Alignment Test?
Luna, our AI guide, will ask you both thoughtful questions about your priorities, values, and dreams. You'll discover where you're strongly aligned and where you might need to have a conversation.

• Takes about 15-20 minutes
• Complete it on your own device
• Get personalized insights together

Start the test: ${data.invite_url}
Or enter this code: ${data.session_code}

This session expires in 7 days.

--
TwogetherForward - Plan your future, together
      `.trim();

    case "weekly_digest":
      return `
Your Week in Review - ${data.partner1_name} & ${data.partner2_name}

TASKS COMPLETED: ${data.tasks_completed?.length || 0}
${data.tasks_completed?.map((t: any) => `✓ ${t.title}`).join('\n') || 'None this week'}

COMING UP NEXT WEEK:
${data.tasks_due?.map((t: any) => `→ ${t.title} (Due ${t.due_date})`).join('\n') || 'Nothing scheduled'}

${data.tasks_overdue?.length > 0 ? `OVERDUE:\n${data.tasks_overdue.map((t: any) => `! ${t.title}`).join('\n')}` : ''}

BUDGET:
Spent this week: €${data.budget_spent?.toLocaleString() || 0}
Remaining: €${data.budget_remaining?.toLocaleString() || 0}

View dashboard: ${data.dashboard_url}

--
TwogetherForward - Plan your future, together
Unsubscribe: ${data.unsubscribe_url}
      `.trim();

    default:
      return data.body || "You have a new notification from TwogetherForward.";
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const { to, type, data } = await req.json();

    if (!to || !type) {
      throw new Error("Missing 'to' or 'type' in request body");
    }

    // Get email configuration
    const config = EMAIL_CONFIG[type];
    if (!config) {
      throw new Error(`Unknown email type: ${type}`);
    }

    const fromAddress = EMAIL_SENDERS[config.sender];
    const subject = config.subject(data);
    const html = generateEmailHTML(type, data);
    const text = generatePlainText(type, data);

    // Send via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        tags: [
          { name: "type", value: type },
        ],
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend error:", result);
      throw new Error(result.message || "Failed to send email");
    }

    console.log(`Email sent: ${type} to ${to}`, result);

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send email error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
