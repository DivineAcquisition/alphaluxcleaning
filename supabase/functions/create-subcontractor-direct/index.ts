
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateSubcontractorRequest {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  ssn: string;
  tier_level: number;
}

// Hash SSN for secure storage
async function hashSSN(ssn: string): Promise<{ hash: string; last4: string }> {
  const cleanSSN = ssn.replace(/\D/g, ''); // Remove non-digits
  const last4 = cleanSSN.slice(-4);
  
  // Create a salted hash (using a simple approach for demo)
  const encoder = new TextEncoder();
  const data = encoder.encode(cleanSSN + "SALT_ALPHALUX_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { hash, last4 };
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBCONTRACTOR-DIRECT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Use service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const requestData: CreateSubcontractorRequest = await req.json();
    logStep("Request data received", { email: requestData.email, name: requestData.full_name });

    // Validate required fields
    const requiredFields = ['full_name', 'email', 'phone', 'address', 'city', 'state', 'zip_code', 'ssn', 'tier_level'];
    for (const field of requiredFields) {
      if (!requestData[field as keyof CreateSubcontractorRequest]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Get tier configuration
    const { data: tierConfig, error: tierError } = await supabaseAdmin
      .from('tier_system_config')
      .select('*')
      .eq('tier_level', requestData.tier_level)
      .single();

    if (tierError || !tierConfig) {
      throw new Error(`Invalid tier level: ${requestData.tier_level}`);
    }

    logStep("Tier config retrieved", { tier: requestData.tier_level, hourlyRate: tierConfig.hourly_rate });

    // Hash SSN for secure storage
    const { hash: ssnHash, last4: ssnLast4 } = await hashSSN(requestData.ssn);
    logStep("SSN processed securely");

    // Create subcontractor record
    const { data: subcontractor, error: subError } = await supabaseAdmin
      .from('subcontractors')
      .insert({
        full_name: requestData.full_name,
        email: requestData.email,
        phone: requestData.phone,
        address: requestData.address,
        city: requestData.city,
        state: requestData.state,
        zip_code: requestData.zip_code,
        tier_level: requestData.tier_level,
        split_tier: requestData.tier_level.toString(), // Add split_tier field
        hourly_rate: tierConfig.hourly_rate,
        monthly_fee: tierConfig.monthly_fee,
        is_available: true,
        rating: 5.0,
        completed_jobs_count: 0,
        review_count: 0,
        subscription_status: 'active'
      })
      .select()
      .single();

    if (subError) {
      logStep("Error creating subcontractor", { error: subError });
      throw new Error(`Failed to create subcontractor: ${subError.message}`);
    }

    logStep("Subcontractor created", { id: subcontractor.id });

    // Store sensitive data securely
    const { error: sensitiveError } = await supabaseAdmin
      .from('subcontractor_sensitive')
      .insert({
        subcontractor_id: subcontractor.id,
        ssn_last4: ssnLast4,
        ssn_hash: ssnHash
      });

    if (sensitiveError) {
      logStep("Error storing sensitive data", { error: sensitiveError });
      // Try to clean up the subcontractor record
      await supabaseAdmin.from('subcontractors').delete().eq('id', subcontractor.id);
      throw new Error(`Failed to store sensitive information: ${sensitiveError.message}`);
    }

    logStep("Sensitive data stored securely");

    // Send onboarding email via Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const onboardingEmail = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Welcome to AlphaLux Clean</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Our Team!</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #2c3e50; margin-top: 0;">Hello ${requestData.full_name}!</h2>
            
            <p>Congratulations! You've been added to our AlphaLux Clean network as a <strong>${tierConfig.tier_name}</strong> subcontractor.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <h3 style="margin-top: 0; color: #2c3e50;">Your Benefits Package:</h3>
                <ul style="margin: 0; padding-left: 20px;">
                    <li><strong>Hourly Rate:</strong> $${tierConfig.hourly_rate}/hour</li>
                    <li><strong>Monthly Fee:</strong> $${tierConfig.monthly_fee}/month</li>
                    <li><strong>Tier Level:</strong> ${tierConfig.tier_name} (Tier ${requestData.tier_level})</li>
                </ul>
            </div>
            
            <h3 style="color: #2c3e50;">Next Steps:</h3>
            <ol style="padding-left: 20px;">
                <li><strong>Access Your Dashboard:</strong> Visit our subcontractor portal to complete your profile</li>
                <li><strong>Complete Onboarding:</strong> Fill out any remaining forms and upload required documents</li>
                <li><strong>Start Accepting Jobs:</strong> Browse and accept available cleaning assignments</li>
                <li><strong>Track Earnings:</strong> Monitor your performance and earnings through your dashboard</li>
            </ol>
            
            <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #1e40af;">🔐 Account Security</h4>
                <p style="margin-bottom: 0;">You'll receive separate login credentials soon. Keep them secure and never share your account access with others.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://cleaners.alphaluxclean.com" style="background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Access Subcontractor Portal</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p><strong>Questions?</strong> Reply to this email or contact our support team.</p>
            
            <p style="margin-bottom: 0;">
                Welcome to the team!<br>
                <strong>AlphaLux Clean</strong>
            </p>
        </div>
    </body>
    </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "AlphaLuxClean <noreply@info.alphaluxcleaning.com>",
      to: [requestData.email],
      subject: `Welcome to AlphaLux Clean - ${tierConfig.tier_name} Subcontractor`,
      html: onboardingEmail,
    });

    logStep("Onboarding email sent", { emailId: emailResponse.data?.id });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Subcontractor created successfully and onboarding email sent",
      subcontractor_id: subcontractor.id,
      tier_info: {
        tier_name: tierConfig.tier_name,
        hourly_rate: tierConfig.hourly_rate,
        monthly_fee: tierConfig.monthly_fee
      },
      email_sent: !!emailResponse.data?.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-subcontractor-direct", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
