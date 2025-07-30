import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ENHANCED-GHL-INTEGRATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Enhanced GHL Integration started");

    const GHL_PRIVATE_TOKEN = Deno.env.get("GHL_PRIVATE_INTEGRATION_TOKEN");
    const GHL_LOCATION_ID = Deno.env.get("GOHIGHLEVEL_LOCATION_ID");

    if (!GHL_PRIVATE_TOKEN || !GHL_LOCATION_ID) {
      throw new Error("GoHighLevel Private Integration credentials not configured");
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
      case 'create_enhanced_contact':
        result = await createEnhancedContact(params, GHL_PRIVATE_TOKEN, GHL_LOCATION_ID);
        break;
      case 'manage_pipeline':
        result = await managePipeline(params, GHL_PRIVATE_TOKEN, GHL_LOCATION_ID, supabase);
        break;
      case 'track_lead_score':
        result = await trackLeadScore(params, GHL_PRIVATE_TOKEN, supabase);
        break;
      case 'create_campaign_automation':
        result = await createCampaignAutomation(params, GHL_PRIVATE_TOKEN, GHL_LOCATION_ID);
        break;
      case 'send_sms':
        result = await sendSMS(params, GHL_PRIVATE_TOKEN, GHL_LOCATION_ID);
        break;
      case 'trigger_workflow':
        result = await triggerWorkflow(params, GHL_PRIVATE_TOKEN, GHL_LOCATION_ID);
        break;
      case 'get_analytics':
        result = await getGHLAnalytics(params, GHL_PRIVATE_TOKEN, GHL_LOCATION_ID);
        break;
      case 'manage_tags':
        result = await manageTags(params, GHL_PRIVATE_TOKEN);
        break;
      case 'schedule_followup':
        result = await scheduleFollowup(params, GHL_PRIVATE_TOKEN, GHL_LOCATION_ID);
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
    logStep("ERROR in enhanced-ghl-integration", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Enhanced contact creation with lead scoring and lifecycle management
async function createEnhancedContact(params: any, token: string, locationId: string) {
  const { 
    customerName, 
    customerEmail, 
    customerPhone, 
    serviceType, 
    estimatedValue,
    source,
    address,
    preferences 
  } = params;

  logStep("Creating enhanced contact", { customerEmail, serviceType, estimatedValue });

  const leadScore = calculateLeadScore({
    serviceType,
    estimatedValue,
    hasPhone: !!customerPhone,
    source
  });

  const customFields = [
    { key: "lead_score", field_value: leadScore.toString() },
    { key: "service_type", field_value: serviceType },
    { key: "estimated_value", field_value: estimatedValue?.toString() || "0" },
    { key: "acquisition_source", field_value: source || "website" },
    { key: "lifecycle_stage", field_value: "prospect" },
    { key: "last_interaction", field_value: new Date().toISOString() }
  ];

  if (preferences) {
    customFields.push({ key: "preferences", field_value: JSON.stringify(preferences) });
  }

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
      serviceType, 
      source || "website",
      `score-${leadScore >= 80 ? 'hot' : leadScore >= 60 ? 'warm' : 'cold'}`
    ],
    customFields
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

  const result = await response.json();
  logStep("Enhanced contact created", { contactId: result.contact?.id, leadScore });

  return { contactId: result.contact?.id, leadScore, lifecycleStage: "prospect" };
}

// Pipeline and opportunity management
async function managePipeline(params: any, token: string, locationId: string, supabase: any) {
  const { contactId, action, pipelineId, stageId, value, orderId } = params;

  logStep("Managing pipeline", { contactId, action, pipelineId, stageId });

  switch (action) {
    case 'create_opportunity':
      const opportunityData = {
        pipelineId,
        stageId,
        contactId,
        name: `Cleaning Service - ${new Date().toLocaleDateString()}`,
        monetaryValue: value || 0,
        assignedTo: null,
        notes: `Created from order ${orderId || 'N/A'}`
      };

      const createResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Version": "2021-07-28"
        },
        body: JSON.stringify(opportunityData)
      });

      const createResult = await createResponse.json();
      
      // Store opportunity ID in Supabase for tracking
      if (orderId && createResult.opportunity?.id) {
        await supabase
          .from('orders')
          .update({ ghl_opportunity_id: createResult.opportunity.id })
          .eq('id', orderId);
      }

      return createResult;

    case 'move_stage':
      const moveResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/${params.opportunityId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Version": "2021-07-28"
        },
        body: JSON.stringify({ stageId })
      });

      return await moveResponse.json();

    default:
      throw new Error(`Unsupported pipeline action: ${action}`);
  }
}

// Lead scoring system
async function trackLeadScore(params: any, token: string, supabase: any) {
  const { contactId, interactions } = params;

  let score = 0;
  const scoreFactors = [];

  // Base scoring
  if (interactions.emailOpened) {
    score += 10;
    scoreFactors.push("email_opened");
  }
  if (interactions.linkClicked) {
    score += 15;
    scoreFactors.push("link_clicked");
  }
  if (interactions.formSubmitted) {
    score += 25;
    scoreFactors.push("form_submitted");
  }
  if (interactions.phoneAnswered) {
    score += 30;
    scoreFactors.push("phone_answered");
  }

  // Update contact with new score
  const updateResponse = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    },
    body: JSON.stringify({
      customFields: [
        { key: "lead_score", field_value: score.toString() },
        { key: "score_factors", field_value: scoreFactors.join(',') },
        { key: "last_score_update", field_value: new Date().toISOString() }
      ]
    })
  });

  return { score, factors: scoreFactors };
}

// Campaign automation
async function createCampaignAutomation(params: any, token: string, locationId: string) {
  const { campaignType, contactId, serviceType, triggerDate } = params;

  logStep("Creating campaign automation", { campaignType, contactId });

  const campaigns = {
    'service_reminder': {
      name: 'Service Reminder Sequence',
      triggers: ['7_days_before', '1_day_before', '2_hours_before']
    },
    'upsell_sequence': {
      name: 'Upsell Deep Cleaning',
      triggers: ['after_3rd_service', 'seasonal_promotion']
    },
    'retention_campaign': {
      name: 'Win-Back Campaign',
      triggers: ['45_days_no_service', '90_days_no_service']
    },
    'referral_request': {
      name: 'Referral Request',
      triggers: ['after_service_completion', 'high_satisfaction_score']
    }
  };

  const campaign = campaigns[campaignType as keyof typeof campaigns];
  if (!campaign) {
    throw new Error(`Unknown campaign type: ${campaignType}`);
  }

  // Create workflow automation (this would be a simplified version)
  const workflowData = {
    name: campaign.name,
    locationId: locationId,
    trigger: {
      type: 'date_based',
      date: triggerDate || new Date().toISOString()
    },
    actions: [
      {
        type: 'send_email',
        subject: `${campaign.name} - ${serviceType}`,
        body: generateEmailContent(campaignType, serviceType)
      },
      {
        type: 'add_tag',
        tag: `campaign_${campaignType}`
      }
    ]
  };

  // Note: This is a simplified implementation
  // In reality, you'd use GHL's workflow API endpoints
  logStep("Campaign automation configured", { campaignType, contactId });

  return { campaignId: `camp_${Date.now()}`, triggers: campaign.triggers };
}

// SMS communication
async function sendSMS(params: any, token: string, locationId: string) {
  const { contactId, message, messageType } = params;

  const smsData = {
    contactId: contactId,
    message: message,
    type: messageType || 'text'
  };

  const response = await fetch(`https://services.leadconnectorhq.com/conversations/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    },
    body: JSON.stringify(smsData)
  });

  const result = await response.json();
  logStep("SMS sent", { contactId, messageId: result.id });

  return result;
}

// Workflow triggers
async function triggerWorkflow(params: any, token: string, locationId: string) {
  const { workflowId, contactId, data } = params;

  const triggerData = {
    contactId: contactId,
    data: data || {}
  };

  const response = await fetch(`https://services.leadconnectorhq.com/workflows/${workflowId}/trigger`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    },
    body: JSON.stringify(triggerData)
  });

  return await response.json();
}

// Analytics and reporting
async function getGHLAnalytics(params: any, token: string, locationId: string) {
  const { reportType, startDate, endDate } = params;

  const analyticsEndpoints = {
    'contacts': `/analytics/contacts?locationId=${locationId}&startDate=${startDate}&endDate=${endDate}`,
    'opportunities': `/analytics/opportunities?locationId=${locationId}&startDate=${startDate}&endDate=${endDate}`,
    'campaigns': `/analytics/campaigns?locationId=${locationId}&startDate=${startDate}&endDate=${endDate}`
  };

  const endpoint = analyticsEndpoints[reportType as keyof typeof analyticsEndpoints];
  if (!endpoint) {
    throw new Error(`Unknown report type: ${reportType}`);
  }

  const response = await fetch(`https://services.leadconnectorhq.com${endpoint}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    }
  });

  return await response.json();
}

// Tag management
async function manageTags(params: any, token: string) {
  const { contactId, action, tags } = params;

  const tagData = {
    tags: Array.isArray(tags) ? tags : [tags]
  };

  const method = action === 'add' ? 'POST' : 'DELETE';
  const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/tags`, {
    method: method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    },
    body: JSON.stringify(tagData)
  });

  return await response.json();
}

// Follow-up scheduling
async function scheduleFollowup(params: any, token: string, locationId: string) {
  const { contactId, followupType, scheduledDate, notes } = params;

  const taskData = {
    title: `Follow-up: ${followupType}`,
    body: notes || '',
    contactId: contactId,
    dueDate: scheduledDate,
    completed: false
  };

  const response = await fetch(`https://services.leadconnectorhq.com/tasks/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    },
    body: JSON.stringify(taskData)
  });

  return await response.json();
}

// Helper functions
function calculateLeadScore(factors: any): number {
  let score = 50; // Base score

  // Service type scoring
  if (factors.serviceType?.includes('deep')) score += 20;
  if (factors.serviceType?.includes('move')) score += 15;
  if (factors.serviceType?.includes('recurring')) score += 25;

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

function generateEmailContent(campaignType: string, serviceType: string): string {
  const templates = {
    'service_reminder': `Your ${serviceType} is scheduled soon! We're excited to make your space sparkle.`,
    'upsell_sequence': `Ready for a deeper clean? Upgrade to our premium deep cleaning service.`,
    'retention_campaign': `We miss you! Come back and enjoy 20% off your next cleaning.`,
    'referral_request': `Love our service? Refer a friend and you both save $25!`
  };

  return templates[campaignType as keyof typeof templates] || 'Thank you for choosing our cleaning service!';
}