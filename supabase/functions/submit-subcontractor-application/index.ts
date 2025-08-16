import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUBMIT-APPLICATION] ${step}${detailsStr}`);
};

const logError = (step: string, error: any, context?: any) => {
  console.error(`[SUBMIT-APPLICATION-ERROR] ${step}`, {
    error: error.message || error,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const requestBody = await req.json();
    logStep("Request body received", { keys: Object.keys(requestBody) });

    const {
      full_name,
      email,
      phone,
      address,
      city,
      state,
      zip_code,
      why_join_us,
      previous_cleaning_experience,
      availability,
      preferred_work_areas,
      emergency_contact_name,
      emergency_contact_phone,
      has_drivers_license,
      has_own_vehicle,
      reliable_transportation,
      can_lift_heavy_items,
      comfortable_with_chemicals,
      background_check_consent,
      brand_shirt_consent,
      subcontractor_agreement_consent
    } = requestBody;

    // Enhanced validation with detailed error reporting
    const requiredFields = {
      full_name,
      email,
      phone,
      why_join_us,
      availability,
      emergency_contact_name,
      emergency_contact_phone
    };

    logStep("Validating required fields", { fields: Object.keys(requiredFields) });

    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        const errorMsg = `Missing or empty required field: ${field}`;
        logError("Field validation failed", new Error(errorMsg), { field, value });
        throw new Error(errorMsg);
      }
    }

    // Validate mandatory requirements
    if (!has_drivers_license) {
      const errorMsg = "Driver's license is required for this position";
      logError("License requirement not met", new Error(errorMsg));
      throw new Error(errorMsg);
    }

    if (!has_own_vehicle) {
      const errorMsg = "Own vehicle is required for this position";
      logError("Vehicle requirement not met", new Error(errorMsg));
      throw new Error(errorMsg);
    }

    if (!background_check_consent || !brand_shirt_consent || !subcontractor_agreement_consent) {
      const errorMsg = "All consent agreements must be accepted";
      logError("Consent requirements not met", new Error(errorMsg), {
        background_check_consent,
        brand_shirt_consent,
        subcontractor_agreement_consent
      });
      throw new Error(errorMsg);
    }

    logStep("All validations passed");

    // Check if application already exists for this email
    logStep("Checking for existing applications", { email });
    const { data: existingApplication, error: existingError } = await supabaseClient
      .from("subcontractor_applications")
      .select("id, status")
      .eq("email", email)
      .maybeSingle();

    if (existingError) {
      logError("Database error checking existing applications", existingError, { email });
      throw new Error("Database error occurred while checking existing applications");
    }

    if (existingApplication) {
      if (existingApplication.status === "pending") {
        return new Response(
          JSON.stringify({ 
            error: "You already have a pending application. Please wait for review." 
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      } else if (existingApplication.status === "approved") {
        return new Response(
          JSON.stringify({ 
            error: "You already have an approved application. Please check your email for onboarding instructions." 
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
      // If rejected, allow new application
    }

    // Insert application
    const { data: application, error: insertError } = await supabaseClient
      .from("subcontractor_applications")
      .insert({
        full_name,
        email,
        phone,
        address,
        city,
        state,
        zip_code,
        why_join_us,
        previous_cleaning_experience,
        availability,
        preferred_work_areas,
        emergency_contact_name,
        emergency_contact_phone,
        has_drivers_license: has_drivers_license || false,
        has_own_vehicle: has_own_vehicle || false,
        reliable_transportation: reliable_transportation || false,
        can_lift_heavy_items: can_lift_heavy_items || false,
        comfortable_with_chemicals: comfortable_with_chemicals || false,
        background_check_consent: background_check_consent || false,
        brand_shirt_consent: brand_shirt_consent || false,
        subcontractor_agreement_consent: subcontractor_agreement_consent || false,
        status: "pending"
      })
      .select()
      .single();

    if (insertError) {
      logError("Database insertion failed", insertError, {
        email,
        full_name,
        phone,
        has_drivers_license,
        has_own_vehicle
      });
      throw new Error(`Failed to save application: ${insertError.message}`);
    }

    logStep("Application submitted successfully", { applicationId: application.id });

    // Send data to Zapier webhook
    const zapierWebhookUrl = "https://hooks.zapier.com/hooks/catch/5011258/u6vy7q9/";
    
    try {
      const zapierPayload = {
        timestamp: new Date().toISOString(),
        application_id: application.id,
        type: 'subcontractor_application_submitted',
        applicant_data: {
          full_name,
          email,
          phone,
          address,
          city,
          state,
          zip_code,
          availability,
          preferred_work_areas,
          has_drivers_license,
          has_own_vehicle,
          reliable_transportation,
          can_lift_heavy_items,
          comfortable_with_chemicals
        },
        source: 'bay_area_cleaning_pros'
      };

      logStep("Sending to Zapier webhook", { url: zapierWebhookUrl });

      const zapierResponse = await fetch(zapierWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(zapierPayload),
      });

      if (zapierResponse.ok) {
        logStep("Zapier webhook successful");
      } else {
        logStep("Zapier webhook failed", { 
          status: zapierResponse.status, 
          statusText: zapierResponse.statusText 
        });
      }
    } catch (zapierError) {
      logStep("Error sending to Zapier", { error: zapierError });
      // Don't fail the entire request if Zapier fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        application_id: application.id,
        message: "Application submitted successfully! We will review your application and get back to you within 24-48 hours."
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError("Application submission failed", error, {
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    
    // Return user-friendly error messages
    const userFriendlyMessage = errorMessage.includes('Missing required field') ? 
      'Please fill in all required fields' :
      errorMessage.includes('already have a pending application') ? 
      'You already have a pending application' :
      errorMessage.includes('already have an approved application') ? 
      'You already have an approved application' :
      errorMessage.includes('Driver\'s license is required') ? 
      'A valid driver\'s license is required for this position' :
      errorMessage.includes('Own vehicle is required') ? 
      'Having your own vehicle is required for this position' :
      errorMessage.includes('consent agreements must be accepted') ? 
      'Please accept all required agreements' :
      'Application submission failed. Please try again.';
    
    return new Response(
      JSON.stringify({ 
        error: userFriendlyMessage,
        details: errorMessage,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});