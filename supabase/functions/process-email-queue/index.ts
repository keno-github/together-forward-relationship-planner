// Supabase Edge Function: process-email-queue
// Processes pending emails from the queue and sends via Resend
// Should be called by a cron job every few minutes

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get batch size from request or default
    const { batch_size = 50 } = await req.json().catch(() => ({}));

    // Get pending emails from queue
    const { data: emails, error: fetchError } = await supabase
      .rpc("get_pending_emails", { batch_size });

    if (fetchError) {
      throw fetchError;
    }

    if (!emails || emails.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "No pending emails" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${emails.length} emails`);

    const results = {
      processed: emails.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each email
    for (const email of emails) {
      try {
        // Call send-email function
        const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: email.recipient_email,
            type: email.email_type,
            data: email.template_data,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Mark as sent
          await supabase.rpc("mark_email_sent", {
            p_queue_id: email.id,
            p_resend_id: result.id,
          });
          results.sent++;
          console.log(`Email sent: ${email.email_type} to ${email.recipient_email}`);
        } else {
          // Mark as failed
          await supabase.rpc("mark_email_failed", {
            p_queue_id: email.id,
            p_error: result.error || "Unknown error",
          });
          results.failed++;
          results.errors.push(`${email.recipient_email}: ${result.error}`);
        }
      } catch (emailError) {
        // Mark as failed
        await supabase.rpc("mark_email_failed", {
          p_queue_id: email.id,
          p_error: emailError.message,
        });
        results.failed++;
        results.errors.push(`${email.recipient_email}: ${emailError.message}`);
      }
    }

    console.log(`Queue processed: ${results.sent} sent, ${results.failed} failed`);

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Process queue error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
