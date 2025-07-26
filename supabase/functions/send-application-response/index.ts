import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { ApplicationResponseEmail } from '../_shared/email-templates/application-response.tsx';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-APPLICATION-RESPONSE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const { applicationId, decision, adminNotes, reviewerId } = await req.json();
    
    if (!applicationId || !decision) {
      throw new Error("Missing required fields: applicationId, decision");
    }

    logStep("Request data received", { applicationId, decision, adminNotes });

    // Get application details
    const { data: application, error: fetchError } = await supabaseAdmin
      .from('subcontractor_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      throw new Error(`Application not found: ${fetchError?.message}`);
    }

    // Update application status
    const { error: updateError } = await supabaseAdmin
      .from('subcontractor_applications')
      .update({
        status: decision,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes
      })
      .eq('id', applicationId);

    if (updateError) {
      throw new Error(`Failed to update application: ${updateError.message}`);
    }

    logStep("Application updated successfully");

    // Prepare email content based on decision
    const isApproved = decision === 'approved';
    const subject = isApproved 
      ? "🎉 Welcome to Bay Area Cleaning Pros - Application Approved!" 
      : "Thank you for your interest - Application Update";

    // Generate onboarding URL for approved applications
    const onboardingUrl = isApproved 
      ? `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/subcontractor-onboarding`
      : undefined;

    // Render the React email template
    const emailContent = await renderAsync(
      React.createElement(ApplicationResponseEmail, {
        applicantName: application.full_name,
        isApproved,
        adminNotes,
        onboardingUrl,
      })
    );

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Bay Area Cleaning Pros <notify@bayareacleaningpros.com>",
      to: [application.email],
      subject: subject,
      html: emailContent,
    });

    logStep("Email sent successfully", { emailId: emailResponse.data?.id });

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Application ${decision} email sent successfully`,
      emailId: emailResponse.data?.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in send-application-response", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});