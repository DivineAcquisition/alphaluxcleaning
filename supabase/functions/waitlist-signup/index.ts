import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      first_name,
      email,
      phone,
      zip_code,
      home_size,
      preferred_contact,
      ready_timeline,
      notes,
    } = await req.json();

    console.log("Waitlist signup request:", { email, first_name });

    // Validate required fields
    if (!email || !first_name) {
      return new Response(
        JSON.stringify({ error: "Email and first name are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if email already exists
    const { data: existingLead } = await supabaseClient
      .from("waitlist_leads")
      .select("id, email")
      .eq("email", email)
      .single();

    if (existingLead) {
      // Update existing lead
      const { error: updateError } = await supabaseClient
        .from("waitlist_leads")
        .update({
          first_name,
          phone,
          zip_code,
          home_size,
          preferred_contact,
          ready_timeline,
          notes,
          status: "active",
        })
        .eq("email", email);

      if (updateError) throw updateError;

      console.log("Updated existing waitlist lead:", email);
    } else {
      // Insert new lead
      const { error: insertError } = await supabaseClient
        .from("waitlist_leads")
        .insert({
          first_name,
          email,
          phone,
          zip_code,
          home_size,
          preferred_contact,
          ready_timeline,
          notes,
          source: "waitlist_page",
        });

      if (insertError) throw insertError;

      console.log("Created new waitlist lead:", email);
    }

    // Send confirmation email
    try {
      const { error: emailError } = await supabaseClient.functions.invoke(
        "send-email-system",
        {
          body: {
            to: email,
            template: "waitlist_confirmation",
            data: {
              firstName: first_name,
              promoCode: "DEEPCLEAN60",
              promoAmount: 60,
              bookingUrl: `https://fc9bf4c2-5143-4270-83ec-c7de4b1ed612.lovableproject.com/book/zip?promo=DEEPCLEAN60&source=waitlist&lock_service=deep`,
            },
          },
        }
      );

      if (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the request if email fails
      } else {
        console.log("Confirmation email sent to:", email);
      }
    } catch (emailError) {
      console.error("Email error (non-fatal):", emailError);
    }

    // Track analytics event
    try {
      await supabaseClient.from("attribution_events").insert({
        event: "WAITLIST_SIGNUP",
        payload: {
          email,
          first_name,
          zip_code,
          home_size,
          preferred_contact,
          ready_timeline,
          source: "waitlist_page",
        },
      });
    } catch (analyticsError) {
      console.error("Analytics error (non-fatal):", analyticsError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully joined waitlist",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Waitlist signup error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
