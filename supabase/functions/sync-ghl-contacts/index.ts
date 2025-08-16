import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[SYNC-GHL-CONTACTS] ${step}`, details ? JSON.stringify(details, null, 2) : '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const GHL_API_KEY = Deno.env.get("GOHIGHLEVEL_API_KEY");
    const GHL_LOCATION_ID = Deno.env.get("GOHIGHLEVEL_LOCATION_ID");

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      throw new Error("GoHighLevel API credentials not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { action, ...params } = await req.json();
    logStep("Request received", { action, params });

    let result;

    switch (action) {
      case 'create_booking_contact':
        result = await createBookingContact(params, GHL_API_KEY, GHL_LOCATION_ID, supabase);
        break;
      case 'sync_contacts':
        result = await syncGHLContacts(params, GHL_API_KEY, GHL_LOCATION_ID, supabase);
        break;
      case 'get_live_contacts':
        result = await getLiveContacts(params, supabase);
        break;
      case 'update_pipeline_stage':
        result = await updatePipelineStage(params, GHL_API_KEY, supabase);
        break;
      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      action,
      result
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in sync-ghl-contacts", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Create GHL contact from booking and store in database
async function createBookingContact(params: any, token: string, locationId: string, supabase: any) {
  const { 
    customerName, 
    customerEmail, 
    customerPhone, 
    serviceType, 
    scheduledDate,
    scheduledTime,
    address,
    orderId,
    estimatedValue
  } = params;

  logStep("Creating booking contact", { customerEmail, serviceType, orderId });

  // Calculate lead score
  const leadScore = calculateLeadScore({
    serviceType,
    estimatedValue: estimatedValue || 150,
    hasPhone: !!customerPhone,
    source: 'website'
  });

  // Create contact in GHL
  const contactData = {
    firstName: customerName?.split(' ')[0] || '',
    lastName: customerName?.split(' ').slice(1).join(' ') || '',
    name: customerName,
    email: customerEmail,
    phone: customerPhone,
    address1: address?.street,
    city: address?.city,
    state: address?.state,
    postalCode: address?.zipCode,
    locationId: locationId,
    tags: [
      "cleaning-customer", 
      serviceType?.toLowerCase() || "general-cleaning",
      "new-booking",
      `score-${leadScore >= 80 ? 'hot' : leadScore >= 60 ? 'warm' : 'cold'}`
    ],
    customFields: [
      { key: "lead_score", field_value: leadScore.toString() },
      { key: "service_type", field_value: serviceType },
      { key: "scheduled_date", field_value: scheduledDate },
      { key: "scheduled_time", field_value: scheduledTime },
      { key: "estimated_value", field_value: (estimatedValue || 150).toString() },
      { key: "order_id", field_value: orderId },
      { key: "lifecycle_stage", field_value: "customer" },
      { key: "last_interaction", field_value: new Date().toISOString() }
    ]
  };

  const response = await fetch(`https://services.leadconnectorhq.com/contacts/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    },
    body: JSON.stringify(contactData)
  });

  const ghlResult = await response.json();
  logStep("GHL contact created", { contactId: ghlResult.contact?.id });

  // Store in Supabase
  if (ghlResult.contact?.id) {
    const { data: dbContact, error } = await supabase
      .from('ghl_contacts')
      .insert({
        contact_id: ghlResult.contact.id,
        order_id: orderId,
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone,
        lead_score: leadScore,
        ghl_data: ghlResult.contact,
        last_synced_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      logStep("Database storage error", error);
    } else {
      logStep("Contact stored in database", { id: dbContact.id });
    }
  }

  return { 
    contactId: ghlResult.contact?.id,
    leadScore,
    lifecycleStage: "customer",
    dbStored: !ghlResult.contact?.id ? false : true
  };
}

// Sync contacts from GHL to display in admin
async function syncGHLContacts(params: any, token: string, locationId: string, supabase: any) {
  const { limit = 50, offset = 0 } = params;

  logStep("Syncing GHL contacts", { limit, offset });

  // Fetch contacts from GHL
  const response = await fetch(`https://services.leadconnectorhq.com/contacts/?locationId=${locationId}&limit=${limit}&offset=${offset}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    }
  });

  const ghlData = await response.json();
  logStep("Fetched GHL contacts", { count: ghlData.contacts?.length || 0 });

  // Update database with fresh data
  const updatedContacts = [];
  if (ghlData.contacts) {
    for (const contact of ghlData.contacts) {
      const { data: updated, error } = await supabase
        .from('ghl_contacts')
        .upsert({
          contact_id: contact.id,
          customer_email: contact.email,
          customer_name: contact.name,
          customer_phone: contact.phone,
          ghl_data: contact,
          last_synced_at: new Date().toISOString()
        }, {
          onConflict: 'contact_id'
        })
        .select()
        .single();

      if (!error && updated) {
        updatedContacts.push(updated);
      }
    }
  }

  return {
    synced: updatedContacts.length,
    total: ghlData.meta?.total || 0,
    contacts: updatedContacts
  };
}

// Get live contacts for admin display
async function getLiveContacts(params: any, supabase: any) {
  const { limit = 20, search = '', filter = 'all' } = params;

  logStep("Getting live contacts", { limit, search, filter });

  let query = supabase
    .from('ghl_contacts')
    .select(`
      *,
      orders:order_id (
        id,
        status,
        amount,
        service_details,
        scheduled_date
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (search) {
    query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`);
  }

  if (filter !== 'all') {
    if (filter === 'hot') {
      query = query.gte('lead_score', 80);
    } else if (filter === 'warm') {
      query = query.gte('lead_score', 60).lt('lead_score', 80);
    } else if (filter === 'cold') {
      query = query.lt('lead_score', 60);
    }
  }

  const { data: contacts, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch contacts: ${error.message}`);
  }

  logStep("Retrieved live contacts", { count: contacts?.length || 0 });

  return {
    contacts: contacts || [],
    total: contacts?.length || 0
  };
}

// Update pipeline stage in GHL
async function updatePipelineStage(params: any, token: string, supabase: any) {
  const { contactId, opportunityId, stageId, notes } = params;

  logStep("Updating pipeline stage", { contactId, opportunityId, stageId });

  if (opportunityId && stageId) {
    const response = await fetch(`https://services.leadconnectorhq.com/opportunities/${opportunityId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28"
      },
      body: JSON.stringify({ 
        stageId,
        notes: notes || `Stage updated: ${new Date().toISOString()}`
      })
    });

    const result = await response.json();
    
    // Update database record
    const { error } = await supabase
      .from('ghl_contacts')
      .update({
        stage_id: stageId,
        last_synced_at: new Date().toISOString()
      })
      .eq('contact_id', contactId);

    if (error) {
      logStep("Database update error", error);
    }

    return result;
  }

  throw new Error("Missing opportunityId or stageId");
}

// Helper function to calculate lead score
function calculateLeadScore(factors: any): number {
  let score = 50; // Base score

  // Service type scoring
  if (factors.serviceType?.toLowerCase().includes('deep')) score += 20;
  if (factors.serviceType?.toLowerCase().includes('move')) score += 15;
  if (factors.serviceType?.toLowerCase().includes('recurring')) score += 25;

  // Value scoring
  if (factors.estimatedValue > 200) score += 20;
  else if (factors.estimatedValue > 100) score += 10;

  // Contact quality
  if (factors.hasPhone) score += 10;

  // Source quality
  if (factors.source === 'referral') score += 15;
  else if (factors.source === 'google_ads') score += 10;

  return Math.min(100, Math.max(0, score));
}