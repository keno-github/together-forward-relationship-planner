// Supabase Edge Function: weekly-digest
// Sends weekly summary emails to all users
// Triggered by cron: Every Sunday at 9 AM UTC

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DigestData {
  user_id: string;
  email: string;
  partner1_name: string;
  partner2_name: string;
  tasks_completed: Array<{ title: string }>;
  tasks_due: Array<{ title: string; due_date: string }>;
  tasks_overdue: Array<{ title: string }>;
  dreams: Array<{ title: string; progress: number; progress_change: number }>;
  budget_spent: number;
  budget_remaining: number;
  budget_status: string;
  dashboard_url: string;
  unsubscribe_url: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const appUrl = Deno.env.get("APP_URL") || "https://twogetherforward.com";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users with email digest enabled
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        notification_preferences!inner(email_weekly_digest, email_enabled)
      `)
      .eq("notification_preferences.email_weekly_digest", true)
      .eq("notification_preferences.email_enabled", true);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    console.log(`Processing weekly digest for ${users?.length || 0} users`);

    const results = {
      total: users?.length || 0,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Calculate date range for this week
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const user of users || []) {
      try {
        // Get user's roadmaps
        const { data: roadmaps } = await supabase
          .from("roadmaps")
          .select("id, title, partner1_name, partner2_name, xp_points")
          .eq("user_id", user.id);

        if (!roadmaps || roadmaps.length === 0) {
          console.log(`Skipping user ${user.id} - no roadmaps`);
          continue;
        }

        const roadmapIds = roadmaps.map((r) => r.id);

        // Get milestones for progress calculation
        const { data: milestones } = await supabase
          .from("milestones")
          .select("id, roadmap_id, title, milestone_metrics, budget_amount")
          .in("roadmap_id", roadmapIds);

        // Get tasks completed this week
        const { data: completedTasks } = await supabase
          .from("tasks")
          .select("id, title, completed_at, milestone_id")
          .in("milestone_id", milestones?.map((m) => m.id) || [])
          .eq("completed", true)
          .gte("completed_at", weekAgo.toISOString())
          .lte("completed_at", now.toISOString());

        // Get tasks due next week
        const { data: dueTasks } = await supabase
          .from("tasks")
          .select("id, title, due_date, milestone_id")
          .in("milestone_id", milestones?.map((m) => m.id) || [])
          .eq("completed", false)
          .gte("due_date", now.toISOString())
          .lte("due_date", nextWeek.toISOString())
          .order("due_date", { ascending: true });

        // Get overdue tasks
        const { data: overdueTasks } = await supabase
          .from("tasks")
          .select("id, title, due_date, milestone_id")
          .in("milestone_id", milestones?.map((m) => m.id) || [])
          .eq("completed", false)
          .lt("due_date", now.toISOString());

        // Get expenses this week
        const { data: expenses } = await supabase
          .from("expenses")
          .select("amount")
          .in("roadmap_id", roadmapIds)
          .gte("created_at", weekAgo.toISOString());

        const budgetSpent = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

        // Calculate total budget remaining
        const totalBudget = milestones?.reduce((sum, m) => sum + (m.budget_amount || 0), 0) || 0;
        const { data: allExpenses } = await supabase
          .from("expenses")
          .select("amount")
          .in("roadmap_id", roadmapIds);
        const totalSpent = allExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
        const budgetRemaining = totalBudget - totalSpent;

        // Calculate budget status
        const budgetPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
        const budgetStatus = budgetPercent > 100 ? "over_budget" : budgetPercent > 80 ? "warning" : "on_track";

        // Calculate dream progress
        const dreams = roadmaps.map((roadmap) => {
          const roadmapMilestones = milestones?.filter((m) => m.roadmap_id === roadmap.id) || [];
          const avgProgress = roadmapMilestones.length > 0
            ? roadmapMilestones.reduce((sum, m) => sum + (m.milestone_metrics?.progress_percentage || 0), 0) / roadmapMilestones.length
            : 0;

          return {
            title: roadmap.title,
            progress: Math.round(avgProgress),
            progress_change: Math.round(Math.random() * 10), // TODO: Calculate actual change from last week
          };
        });

        // Prepare digest data
        const digestData: DigestData = {
          user_id: user.id,
          email: user.email,
          partner1_name: roadmaps[0]?.partner1_name || "Partner 1",
          partner2_name: roadmaps[0]?.partner2_name || "Partner 2",
          tasks_completed: completedTasks?.map((t) => ({ title: t.title })) || [],
          tasks_due: dueTasks?.map((t) => ({
            title: t.title,
            due_date: new Date(t.due_date).toLocaleDateString("en-US", { weekday: "short" }),
          })) || [],
          tasks_overdue: overdueTasks?.map((t) => ({ title: t.title })) || [],
          dreams,
          budget_spent: budgetSpent,
          budget_remaining: budgetRemaining,
          budget_status: budgetStatus,
          dashboard_url: `${appUrl}/dashboard`,
          unsubscribe_url: `${appUrl}/settings?tab=notifications`,
        };

        // Skip if no activity
        if (
          digestData.tasks_completed.length === 0 &&
          digestData.tasks_due.length === 0 &&
          digestData.tasks_overdue.length === 0
        ) {
          console.log(`Skipping user ${user.id} - no activity`);
          continue;
        }

        // Call send-email function
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: user.email,
            type: "weekly_digest",
            data: digestData,
          }),
        });

        if (emailResponse.ok) {
          results.sent++;
          console.log(`Digest sent to ${user.email}`);
        } else {
          results.failed++;
          const errorData = await emailResponse.json();
          results.errors.push(`${user.email}: ${errorData.error}`);
        }
      } catch (userError) {
        results.failed++;
        results.errors.push(`${user.id}: ${userError.message}`);
        console.error(`Error processing user ${user.id}:`, userError);
      }
    }

    // Log summary
    console.log(`Weekly digest complete: ${results.sent} sent, ${results.failed} failed`);

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Weekly digest error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
