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

    // Validate required fields
    const requiredFields = {
      full_name,
      email,
      phone,
      why_join_us,
      availability,
      emergency_contact_name,
      emergency_contact_phone
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Check if application already exists for this email
    const { data: existingApplication } = await supabaseClient
      .from("subcontractor_applications")
      .select("id, status")
      .eq("email", email)
      .single();

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
      logStep("Error inserting application", insertError);
      throw insertError;
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
    logStep("ERROR in submit-application", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});