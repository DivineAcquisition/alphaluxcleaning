import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

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

    const logoUrl = "https://kqoezqzogleaaupjzxch.supabase.co/storage/v1/object/public/images/b837eb94-c4b1-4de1-9ab0-ac2606e98209.png";
    
    const emailContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 25%, #C084FC 50%, #D8B4FE 75%, #E9D5FF 100%); min-height: 100vh;">
          <div style="max-width: 600px; margin: 40px auto; background: rgba(255, 255, 255, 0.95); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(139, 92, 246, 0.3);">
            
            <!-- Header with Logo -->
            <div style="background: linear-gradient(135deg, #8B5CF6, #A855F7); padding: 40px 30px; text-align: center;">
              <div style="display: inline-block; padding: 15px; background: rgba(255, 255, 255, 0.1); border-radius: 15px; backdrop-filter: blur(10px);">
                <img src="${logoUrl}" alt="Bay Area Cleaning Pros" style="height: 60px; width: auto;">
              </div>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <h1 style="color: #374151; margin: 0 0 20px 0; font-size: 28px; font-weight: 700; text-align: center;">
                ${isApproved ? '🎉 Congratulations!' : 'Application Update'}
              </h1>
              
              <div style="background: ${isApproved ? 'linear-gradient(135deg, #D1FAE5, #A7F3D0)' : 'linear-gradient(135deg, #FEF3C7, #FDE68A)'}; padding: 25px; border-radius: 15px; margin-bottom: 30px; border-left: 5px solid ${isApproved ? '#10B981' : '#F59E0B'};">
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                  Dear ${application.full_name},
                </p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 15px 0 0 0;">
                  ${isApproved 
                    ? 'We are excited to inform you that your application to join Bay Area Cleaning Pros as a subcontractor has been <strong>APPROVED</strong>! 🎊'
                    : 'Thank you for your interest in joining Bay Area Cleaning Pros. After careful review, we have decided not to move forward with your application at this time.'
                  }
                </p>
              </div>

              ${isApproved ? `
                <div style="background: linear-gradient(135deg, #EDE9FE, #DDD6FE); padding: 25px; border-radius: 15px; margin-bottom: 30px;">
                  <h3 style="color: #7C3AED; margin: 0 0 15px 0; font-size: 20px;">Next Steps:</h3>
                  <ul style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0; padding-left: 20px;">
                    <li>Complete your onboarding process</li>
                    <li>Receive your branded uniform shirt</li>
                    <li>Start accepting cleaning jobs in your area</li>
                    <li>Begin earning with our partnership program</li>
                  </ul>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://kqoezqzogleaaupjzxch.supabase.co/subcontractor-onboarding" 
                     style="display: inline-block; background: linear-gradient(135deg, #8B5CF6, #A855F7); color: white; text-decoration: none; padding: 15px 30px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3); transition: all 0.3s ease;">
                    🚀 Start Onboarding Process
                  </a>
                </div>
              ` : `
                <div style="background: linear-gradient(135deg, #FEF3C7, #FDE68A); padding: 25px; border-radius: 15px; margin-bottom: 30px;">
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                    We appreciate the time you took to apply and encourage you to consider applying again in the future as opportunities arise.
                  </p>
                  ${adminNotes ? `
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 15px 0 0 0;">
                      <strong>Additional Notes:</strong> ${adminNotes}
                    </p>
                  ` : ''}
                </div>
              `}

              <!-- Contact Information -->
              <div style="background: linear-gradient(135deg, #F3F4F6, #E5E7EB); padding: 25px; border-radius: 15px; text-align: center;">
                <p style="color: #6B7280; font-size: 14px; line-height: 1.5; margin: 0;">
                  If you have any questions, please don't hesitate to contact us.<br>
                  <strong>Bay Area Cleaning Pros Team</strong><br>
                  📧 info@bayareacleaningpros.com | 📞 (555) 123-4567
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: linear-gradient(135deg, #374151, #4B5563); padding: 20px 30px; text-align: center;">
              <p style="color: #D1D5DB; font-size: 12px; margin: 0;">
                © 2024 Bay Area Cleaning Pros. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

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