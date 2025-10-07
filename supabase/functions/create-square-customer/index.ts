import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("SQUARE_ACCESS_TOKEN");
    
    if (!accessToken) {
      throw new Error("Square access token not configured");
    }

    const {
      email,
      name,
      phone,
      cardId, // Card ID from Square Web SDK
    } = await req.json();

    console.log("Creating/retrieving Square customer:", email);

    // Search for existing customer
    const searchResponse = await fetch(
      "https://connect.squareup.com/v2/customers/search",
      {
        method: "POST",
        headers: {
          "Square-Version": "2024-01-18",
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: {
            filter: {
              email_address: {
                exact: email,
              },
            },
          },
        }),
      }
    );

    const searchData = await searchResponse.json();
    
    let customer;

    if (searchData.customers && searchData.customers.length > 0) {
      customer = searchData.customers[0];
      console.log("Found existing customer:", customer.id);

      // Update customer info
      const updateResponse = await fetch(
        `https://connect.squareup.com/v2/customers/${customer.id}`,
        {
          method: "PUT",
          headers: {
            "Square-Version": "2024-01-18",
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            given_name: name?.split(" ")[0] || "",
            family_name: name?.split(" ").slice(1).join(" ") || "",
            phone_number: phone || undefined,
          }),
        }
      );

      const updateData = await updateResponse.json();
      customer = updateData.customer || customer;
    } else {
      // Create new customer
      console.log("Creating new customer");
      const createResponse = await fetch(
        "https://connect.squareup.com/v2/customers",
        {
          method: "POST",
          headers: {
            "Square-Version": "2024-01-18",
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            given_name: name?.split(" ")[0] || "",
            family_name: name?.split(" ").slice(1).join(" ") || "",
            email_address: email,
            phone_number: phone || undefined,
          }),
        }
      );

      const createData = await createResponse.json();
      customer = createData.customer;
    }

    // Attach card to customer if provided
    if (cardId) {
      console.log("Attaching card to customer");
      await fetch(
        "https://connect.squareup.com/v2/cards",
        {
          method: "POST",
          headers: {
            "Square-Version": "2024-01-18",
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idempotency_key: crypto.randomUUID(),
            source_id: cardId,
            card: {
              customer_id: customer.id,
            },
          }),
        }
      );
    }

    // Update Supabase customers table
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    await supabase
      .from("customers")
      .update({ square_customer_id: customer.id })
      .eq("email", email);

    return new Response(
      JSON.stringify({
        success: true,
        squareCustomerId: customer.id,
        customerId: email,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error creating Square customer:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
