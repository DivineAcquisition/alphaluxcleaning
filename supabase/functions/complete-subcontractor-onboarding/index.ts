import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email template for subcontractor welcome
const SubcontractorWelcomeEmail = ({ 
  fullName, 
  email, 
  tempPassword, 
  dashboardUrl, 
  tierName, 
  hourlyRate, 
  monthlyFee 
}: {
  fullName: string;
  email: string;
  tempPassword: string;
  dashboardUrl: string;
  tierName: string;
  hourlyRate: number;
  monthlyFee: number;
}) => React.createElement(
  'html',
  {},
  React.createElement(
    'body',
    { style: { fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333' } },
    React.createElement(
      'div',
      { style: { maxWidth: '600px', margin: '0 auto', padding: '20px' } },
      React.createElement(
        'h1',
        { style: { color: '#2563eb', borderBottom: '2px solid #2563eb', paddingBottom: '10px' } },
        'Welcome to Bay Area Cleaning Professionals!'
      ),
      React.createElement(
        'p',
        {},
        `Hi ${fullName},`
      ),
      React.createElement(
        'p',
        {},
        'Congratulations! Your application has been approved and your subcontractor account is now active.'
      ),
      React.createElement(
        'div',
        { style: { backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', margin: '20px 0' } },
        React.createElement(
          'h3',
          { style: { color: '#1e40af', marginTop: '0' } },
          'Your Account Details:'
        ),
        React.createElement('p', {}, `🎯 Tier Level: ${tierName}`),
        React.createElement('p', {}, `💰 Hourly Rate: $${hourlyRate}/hour`),
        React.createElement('p', {}, `📅 Monthly Fee: $${monthlyFee}/month`),
        React.createElement('p', {}, `✉️ Login Email: ${email}`),
        React.createElement('p', {}, `🔑 Temporary Password: ${tempPassword}`)
      ),
      React.createElement(
        'div',
        { style: { backgroundColor: '#fef3c7', padding: '15px', borderRadius: '6px', margin: '20px 0' } },
        React.createElement(
          'p',
          { style: { margin: '0', fontWeight: 'bold' } },
          '⚠️ Important: Please change your password immediately after logging in for security.'
        )
      ),
      React.createElement(
        'p',
        {},
        'Next Steps:'
      ),
      React.createElement(
        'ol',
        {},
        React.createElement('li', {}, 'Click the button below to access your dashboard'),
        React.createElement('li', {}, 'Change your temporary password'),
        React.createElement('li', {}, 'Complete your profile setup'),
        React.createElement('li', {}, 'Review available job assignments')
      ),
      React.createElement(
        'div',
        { style: { textAlign: 'center', margin: '30px 0' } },
        React.createElement(
          'a',
          {
            href: dashboardUrl,
            style: {
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '12px 24px',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: 'bold'
            }
          },
          'Access Your Dashboard'
        )
      ),
      React.createElement(
        'p',
        { style: { fontSize: '14px', color: '#666' } },
        'If you have any questions, please contact our support team.'
      ),
      React.createElement(
        'p',
        { style: { fontSize: '14px', color: '#666' } },
        'Best regards,',
        React.createElement('br'),
        'Bay Area Cleaning Professionals Team'
      )
    )
  )
);

interface CompleteOnboardingRequest {
  token?: string;
  selected_tier: string;
  profile_data: {
    profile_image_url: string;
    biography: string;
  };
  banking_data: {
    legal_name: string;
    date_of_birth: string;
    ssn: string;
    account_number: string;
    routing_number: string;
    background_check_consent: boolean;
    background_check_copy_consent: boolean;
  };
  application_data: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const { token, selected_tier, profile_data, banking_data, application_data }: CompleteOnboardingRequest = await req.json();

    if (!selected_tier || !application_data) {
      return new Response(
        JSON.stringify({ error: "Missing required onboarding data" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let applicationId = application_data.id;

    // If token provided, validate it
    if (token) {
      const { data: tokenValidation, error: tokenError } = await supabaseAdmin
        .rpc('validate_onboarding_token', { p_token: token });

      if (tokenError || !tokenValidation?.valid) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired onboarding token" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      applicationId = tokenValidation.application_data.id;
    }

    console.log(`Starting onboarding completion for application: ${applicationId}`);

    // 1. Get the approved application
    const { data: application, error: appError } = await supabaseAdmin
      .from('subcontractor_applications')
      .select('*')
      .eq('id', applicationId)
      .eq('status', 'approved')
      .single();

    if (appError || !application) {
      console.error('Application not found or not approved:', appError);
      return new Response(
        JSON.stringify({ error: "Application not found or not approved" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 2. Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);

    // 3. Create auth user account
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: application.email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: application.full_name,
        phone: application.phone,
        role: 'subcontractor'
      }
    });

    if (authError) {
      console.error('Failed to create auth user:', authError);
      return new Response(
        JSON.stringify({ error: "Failed to create user account: " + authError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Created auth user: ${authUser.user.id}`);

    // 4. Get tier configuration based on selected tier
    const tierMapping = {
      "tier_1": 1,
      "tier_2": 2, 
      "tier_3": 3
    };

    const tierLevel = tierMapping[selected_tier as keyof typeof tierMapping] || 2;
    
    const { data: tierConfig, error: tierError } = await supabaseAdmin
      .from('tier_system_config')
      .select('*')
      .eq('tier_level', tierLevel)
      .single();

    if (tierError || !tierConfig) {
      console.error('Failed to get tier config:', tierError);
      // Fallback to default values based on tier level
      const fallbackConfig = {
        1: { tier_level: 1, tier_name: "Standard", hourly_rate: 16.00, monthly_fee: 25.00 },
        2: { tier_level: 2, tier_name: "Professional", hourly_rate: 18.00, monthly_fee: 50.00 },
        3: { tier_level: 3, tier_name: "Elite", hourly_rate: 21.00, monthly_fee: 65.00 }
      };
      tierConfig = fallbackConfig[tierLevel as keyof typeof fallbackConfig] || fallbackConfig[2];
    }

    // 5. Create subcontractor record
    const { data: subcontractor, error: subError } = await supabaseAdmin
      .from('subcontractors')
      .insert({
        user_id: authUser.user.id,
        full_name: application.full_name,
        email: application.email,
        phone: application.phone,
        address: application.address || '',
        city: application.city || '',
        state: application.state || 'CA',
        zip_code: application.zip_code || '',
        is_available: true,
        tier_level: tierConfig.tier_level,
        hourly_rate: tierConfig.hourly_rate,
        monthly_fee: tierConfig.monthly_fee,
        rating: 5.0,
        review_count: 0,
        completed_jobs_count: 0,
        subscription_status: 'active',
        split_tier: 'Professional'
      })
      .select()
      .single();

    if (subError) {
      console.error('Failed to create subcontractor:', subError);
      // Clean up auth user if subcontractor creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return new Response(
        JSON.stringify({ error: "Failed to create subcontractor profile: " + subError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Created subcontractor: ${subcontractor.id}`);

    // 6. Update application status to completed
    const { error: updateError } = await supabaseAdmin
      .from('subcontractor_applications')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        admin_notes: `Onboarding completed on ${new Date().toISOString()}. User ID: ${authUser.user.id}`
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Failed to update application status:', updateError);
    }

    // 7. Send welcome email
    try {
      const dashboardUrl = `${Deno.env.get("SUPABASE_URL")?.replace('/rest/v1', '')}/subcontractor-dashboard` || "https://app.bayareacleaningpros.com/subcontractor-dashboard";
      
      const emailHtml = await renderAsync(
        React.createElement(SubcontractorWelcomeEmail, {
          fullName: application.full_name,
          email: application.email,
          tempPassword,
          dashboardUrl,
          tierName: tierConfig.tier_name,
          hourlyRate: tierConfig.hourly_rate,
          monthlyFee: tierConfig.monthly_fee
        })
      );

      const { error: emailError } = await resend.emails.send({
        from: "Bay Area Cleaning Pros <onboarding@resend.dev>",
        to: [application.email],
        subject: "Welcome to Bay Area Cleaning Professionals - Account Activated!",
        html: emailHtml,
      });

      if (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the entire process for email issues
      } else {
        console.log(`Welcome email sent to: ${application.email}`);
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
    }

    // 8. Log the tier change for tracking
    const { error: tierLogError } = await supabaseAdmin
      .from('tier_change_history')
      .insert({
        subcontractor_id: subcontractor.id,
        old_tier: null,
        new_tier: tierConfig.tier_level,
        change_reason: 'Initial onboarding - assigned Professional tier',
        automatic: false
      });

    if (tierLogError) {
      console.error('Failed to log tier change:', tierLogError);
    }

    console.log(`Onboarding completed successfully for: ${application.full_name}`);

    // Create response based on tier selection
    const response = {
      success: true,
      message: "Subcontractor onboarding completed successfully",
      subcontractor: {
        id: subcontractor.id,
        full_name: subcontractor.full_name,
        email: subcontractor.email,
        tier_level: subcontractor.tier_level,
        hourly_rate: subcontractor.hourly_rate
      },
      show_welcome_popup: true,
      redirect_to_dashboard: selected_tier === "60_40"
    };

    // All tiers redirect to dashboard for now
    // In the future, paid tiers can redirect to Stripe checkout
    response.redirect_to_dashboard = true;

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Onboarding completion error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);