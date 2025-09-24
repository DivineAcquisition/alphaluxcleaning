import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingPayload {
  booking_id: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
  };
  service: {
    type: string;
    frequency: string;
    sqft_range: string;
    addons?: string[];
  };
  schedule: {
    date: string;
    time_window?: string;
    timezone: string;
  };
  pricing: {
    total: number;
    mrr_est?: number;
    arr_est?: number;
    currency: string;
  };
  source: string;
}

interface HCPConfig {
  api_key: string;
  base_url: string;
  enabled: boolean;
  test_mode: boolean;
}

serve(async (req) => {
  console.log("HCP sync function called with method:", req.method);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const payload: BookingPayload = await req.json();
    console.log("Processing booking sync:", payload.booking_id);

    // Get HCP configuration
    const hcpApiKey = Deno.env.get("HCP_API_KEY");
    if (!hcpApiKey) {
      throw new Error("HCP_API_KEY not configured");
    }

    const hcpConfig: HCPConfig = {
      api_key: hcpApiKey,
      base_url: "https://api.housecallpro.com/v1",
      enabled: true,
      test_mode: Deno.env.get("HCP_TEST_MODE") === "true"
    };

    if (!hcpConfig.enabled) {
      console.log("HCP integration disabled, skipping sync");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "HCP integration disabled" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if booking already synced
    const { data: existingLog } = await supabase
      .from('hcp_sync_log')
      .select('*')
      .eq('booking_id', payload.booking_id)
      .eq('status', 'success')
      .single();

    if (existingLog) {
      console.log("Booking already synced successfully:", payload.booking_id);
      return new Response(JSON.stringify({ 
        success: true,
        customerId: existingLog.hcp_customer_id,
        jobId: existingLog.hcp_job_id,
        message: "Already synced"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create or update sync log entry
    const { data: syncLog, error: logError } = await supabase
      .from('hcp_sync_log')
      .upsert({
        booking_id: payload.booking_id,
        status: 'pending',
        attempts: 1
      }, {
        onConflict: 'booking_id'
      })
      .select()
      .single();

    if (logError) {
      console.error("Failed to create sync log:", logError);
      throw new Error("Failed to create sync log");
    }

    let hcpCustomerId: string;
    let hcpJobId: string;

    if (hcpConfig.test_mode) {
      console.log("TEST MODE: Would sync booking to HCP:", payload);
      hcpCustomerId = `test_customer_${Date.now()}`;
      hcpJobId = `test_job_${Date.now()}`;
    } else {
      // Find or create customer
      hcpCustomerId = await findOrCreateCustomer(hcpConfig, payload);
      console.log("HCP Customer ID:", hcpCustomerId);

      // Create job
      hcpJobId = await createJob(hcpConfig, payload, hcpCustomerId);
      console.log("HCP Job ID:", hcpJobId);
    }

    // Update sync log with success
    await supabase
      .from('hcp_sync_log')
      .update({
        hcp_customer_id: hcpCustomerId,
        hcp_job_id: hcpJobId,
        status: 'success',
        updated_at: new Date().toISOString()
      })
      .eq('id', syncLog.id);

    // Update booking record with HCP IDs
    await supabase
      .from('bookings')
      .update({
        hcp_customer_id: hcpCustomerId,
        hcp_job_id: hcpJobId
      })
      .eq('id', payload.booking_id);

    console.log("Successfully synced booking to HCP");

    return new Response(JSON.stringify({
      success: true,
      customerId: hcpCustomerId,
      jobId: hcpJobId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("HCP sync error:", error);

    // Try to update sync log with error
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      const payload: BookingPayload = await req.json();
      
      await supabase
        .from('hcp_sync_log')
        .update({
          status: 'failed',
          last_error: error.message,
          attempts: 1,
          updated_at: new Date().toISOString()
        })
        .eq('booking_id', payload.booking_id);
    } catch (logError) {
      console.error("Failed to update error log:", logError);
    }

    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function findOrCreateCustomer(config: HCPConfig, payload: BookingPayload): Promise<string> {
  const headers = {
    'Authorization': `Bearer ${config.api_key}`,
    'Content-Type': 'application/json'
  };

  // Search for existing customer by email
  console.log("Searching for customer:", payload.customer.email);
  const searchUrl = `${config.base_url}/customers?email=${encodeURIComponent(payload.customer.email)}`;
  
  try {
    const searchResponse = await fetch(searchUrl, { 
      method: 'GET',
      headers 
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      if (searchData.customers && searchData.customers.length > 0) {
        console.log("Found existing customer:", searchData.customers[0].id);
        return searchData.customers[0].id;
      }
    }
  } catch (error) {
    console.log("Customer search failed, will create new:", error.message);
  }

  // Create new customer
  console.log("Creating new customer");
  const createCustomerData = {
    first_name: payload.customer.first_name,
    last_name: payload.customer.last_name,
    emails: [payload.customer.email],
    phones: [payload.customer.phone],
    address: {
      line1: payload.address.line1,
      line2: payload.address.line2 || "",
      city: payload.address.city,
      state: payload.address.state,
      postal_code: payload.address.postal_code
    },
    tags: ["AGP_UI", payload.address.state]
  };

  const createResponse = await fetch(`${config.base_url}/customers`, {
    method: 'POST',
    headers,
    body: JSON.stringify(createCustomerData)
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error("Customer creation failed:", createResponse.status, errorText);
    throw new Error(`Failed to create customer: ${createResponse.status} - ${errorText}`);
  }

  const createData = await createResponse.json();
  console.log("Created customer:", createData.customer.id);
  return createData.customer.id;
}

async function createJob(config: HCPConfig, payload: BookingPayload, customerId: string): Promise<string> {
  console.log("Creating job for customer:", customerId);
  
  const headers = {
    'Authorization': `Bearer ${config.api_key}`,
    'Content-Type': 'application/json'
  };

  // Build job title and notes
  const title = `${payload.service.type} Cleaning (${payload.service.frequency})`;
  const notes = [
    `Booking ID: ${payload.booking_id}`,
    `Source: ${payload.source}`,
    `Sq Ft: ${payload.service.sqft_range}`
  ];
  
  if (payload.service.addons?.length) {
    notes.push(`Addons: ${payload.service.addons.join(', ')}`);
  }
  
  if (payload.pricing.mrr_est) {
    notes.push(`MRR est: $${payload.pricing.mrr_est}`);
  }
  
  if (payload.pricing.arr_est) {
    notes.push(`ARR est: $${payload.pricing.arr_est}`);
  }

  // Calculate scheduled times
  const { start, end } = formatTimeWindow(
    payload.schedule.date, 
    payload.schedule.time_window || "09:00-17:00", 
    payload.schedule.timezone
  );

  const jobData = {
    customer_id: customerId,
    title: title,
    scheduled_start: start,
    scheduled_end: end,
    notes: notes.join('\n'),
    address_override: {
      line1: payload.address.line1,
      line2: payload.address.line2 || "",
      city: payload.address.city,
      state: payload.address.state,
      postal_code: payload.address.postal_code
    },
    line_items: [
      {
        name: `${payload.service.type} Cleaning`,
        quantity: 1,
        unit_price: payload.pricing.total
      }
    ],
    tags: ["AGP_UI", payload.address.state, payload.service.frequency]
  };

  const response = await fetch(`${config.base_url}/jobs`, {
    method: 'POST',
    headers,
    body: JSON.stringify(jobData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Job creation failed:", response.status, errorText);
    throw new Error(`Failed to create job: ${response.status} - ${errorText}`);
  }

  const responseData = await response.json();
  console.log("Created job:", responseData.job.id);
  return responseData.job.id;
}

function formatTimeWindow(date: string, timeWindow: string, timezone: string): { start: string; end: string } {
  const [startTime, endTime] = timeWindow.split('-');
  
  const startDate = new Date(`${date}T${startTime}:00`);
  const endDate = new Date(`${date}T${endTime}:00`);
  
  return {
    start: startDate.toISOString(),
    end: endDate.toISOString()
  };
}