import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GHL-ADVANCED-PIPELINE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("GHL Advanced Pipeline started");

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
    logStep("Pipeline action requested", { action });

    let result;

    switch (action) {
      case 'create_booking_pipeline':
        result = await createBookingPipeline(params, GHL_PRIVATE_TOKEN, GHL_LOCATION_ID, supabase);
        break;
      case 'move_to_stage':
        result = await moveToStage(params, GHL_PRIVATE_TOKEN, supabase);
        break;
      case 'track_customer_journey':
        result = await trackCustomerJourney(params, GHL_PRIVATE_TOKEN, supabase);
        break;
      case 'automation_trigger':
        result = await automationTrigger(params, GHL_PRIVATE_TOKEN, GHL_LOCATION_ID, supabase);
        break;
      case 'get_pipeline_analytics':
        result = await getPipelineAnalytics(params, GHL_PRIVATE_TOKEN, GHL_LOCATION_ID);
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
    logStep("ERROR in ghl-advanced-pipeline", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Create comprehensive booking pipeline
async function createBookingPipeline(params: any, token: string, locationId: string, supabase: any) {
  const { orderId, contactId, customerEmail, serviceType, amount } = params;

  logStep("Creating booking pipeline", { orderId, contactId, serviceType });

  // Get order details from Supabase
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Create opportunity in GHL
  const opportunityData = {
    pipelineId: await getCleaningPipelineId(token, locationId),
    stageId: await getStageId(token, locationId, 'lead'),
    contactId: contactId,
    name: `${serviceType} - ${order.customer_name}`,
    monetaryValue: amount || order.amount / 100, // Convert cents to dollars
    assignedTo: null,
    notes: `Order ID: ${orderId}\nService: ${serviceType}\nScheduled: ${order.scheduled_date} ${order.scheduled_time}`,
    customFields: [
      { key: "order_id", field_value: orderId },
      { key: "service_type", field_value: serviceType },
      { key: "booking_source", field_value: order.source || "website" },
      { key: "customer_ltv", field_value: await calculateCustomerLTV(customerEmail, supabase) }
    ]
  };

  const oppResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    },
    body: JSON.stringify(opportunityData)
  });

  const opportunityResult = await oppResponse.json();
  
  // Update order with opportunity ID
  await supabase
    .from('orders')
    .update({ 
      ghl_opportunity_id: opportunityResult.opportunity?.id,
      pipeline_stage: 'lead'
    })
    .eq('id', orderId);

  // Trigger initial automation sequence
  await triggerWelcomeSequence(contactId, serviceType, token, locationId);

  return {
    opportunityId: opportunityResult.opportunity?.id,
    pipelineStage: 'lead',
    automationTriggered: true
  };
}

// Move opportunity through pipeline stages
async function moveToStage(params: any, token: string, supabase: any) {
  const { orderId, newStage, reason } = params;

  logStep("Moving to stage", { orderId, newStage });

  // Get order with opportunity ID
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (!order?.ghl_opportunity_id) {
    throw new Error(`No opportunity found for order ${orderId}`);
  }

  const stageId = await getStageId(token, process.env.GOHIGHLEVEL_LOCATION_ID!, newStage);

  // Update opportunity stage in GHL
  const updateResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/${order.ghl_opportunity_id}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    },
    body: JSON.stringify({ 
      stageId: stageId,
      notes: `Stage moved to ${newStage}. Reason: ${reason || 'Automated'}`
    })
  });

  // Update order stage in Supabase
  await supabase
    .from('orders')
    .update({ 
      pipeline_stage: newStage,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  // Log the stage change
  await supabase
    .from('service_modifications')
    .insert({
      order_id: orderId,
      modification_type: 'pipeline_stage_change',
      old_value: { stage: order.pipeline_stage },
      new_value: { stage: newStage },
      reason: reason || 'Automated pipeline progression'
    });

  // Trigger stage-specific automations
  await handleStageAutomations(newStage, order, token, process.env.GOHIGHLEVEL_LOCATION_ID!);

  return { newStage, opportunityId: order.ghl_opportunity_id };
}

// Track complete customer journey
async function trackCustomerJourney(params: any, token: string, supabase: any) {
  const { customerEmail, action, metadata } = params;

  logStep("Tracking customer journey", { customerEmail, action });

  // Get customer's contact ID from GHL
  const contactResponse = await fetch(`https://services.leadconnectorhq.com/contacts/search?email=${customerEmail}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    }
  });

  const contacts = await contactResponse.json();
  const contact = contacts.contacts?.[0];

  if (!contact) {
    throw new Error(`Contact not found for email: ${customerEmail}`);
  }

  // Update contact with journey tracking
  const journeyData = {
    action: action,
    timestamp: new Date().toISOString(),
    metadata: metadata || {}
  };

  // Get existing journey data
  const existingJourney = contact.customFields?.find((f: any) => f.key === 'customer_journey')?.field_value;
  const journeyHistory = existingJourney ? JSON.parse(existingJourney) : [];
  journeyHistory.push(journeyData);

  // Update contact with new journey data
  await fetch(`https://services.leadconnectorhq.com/contacts/${contact.id}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    },
    body: JSON.stringify({
      customFields: [
        { key: "customer_journey", field_value: JSON.stringify(journeyHistory) },
        { key: "last_interaction", field_value: new Date().toISOString() }
      ]
    })
  });

  // Update lead score based on action
  const scoreUpdate = calculateActionScore(action);
  if (scoreUpdate !== 0) {
    await updateLeadScore(contact.id, scoreUpdate, token);
  }

  return { journeyUpdated: true, scoreUpdate, totalInteractions: journeyHistory.length };
}

// Handle complex automation triggers
async function automationTrigger(params: any, token: string, locationId: string, supabase: any) {
  const { triggerType, orderId, contactId, data } = params;

  logStep("Automation trigger", { triggerType, orderId });

  switch (triggerType) {
    case 'service_completed':
      return await handleServiceCompletedAutomation(orderId, contactId, token, locationId, supabase);
    
    case 'payment_failed':
      return await handlePaymentFailedAutomation(orderId, contactId, token, locationId, supabase);
    
    case 'customer_satisfaction':
      return await handleSatisfactionAutomation(orderId, contactId, data.rating, token, locationId, supabase);
    
    case 'retention_risk':
      return await handleRetentionRiskAutomation(contactId, data, token, locationId, supabase);
    
    default:
      throw new Error(`Unknown trigger type: ${triggerType}`);
  }
}

// Get pipeline analytics
async function getPipelineAnalytics(params: any, token: string, locationId: string) {
  const { dateRange, pipelineId } = params;

  const analyticsData = await fetch(`https://services.leadconnectorhq.com/opportunities/pipelines/${pipelineId}/analytics?startDate=${dateRange.start}&endDate=${dateRange.end}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    }
  });

  return await analyticsData.json();
}

// Helper functions
async function getCleaningPipelineId(token: string, locationId: string): Promise<string> {
  // This would fetch the actual pipeline ID for cleaning services
  // For now, return a placeholder
  return "default_pipeline_id";
}

async function getStageId(token: string, locationId: string, stageName: string): Promise<string> {
  const stageMap = {
    'lead': 'stage_lead_id',
    'qualified': 'stage_qualified_id', 
    'scheduled': 'stage_scheduled_id',
    'in_progress': 'stage_in_progress_id',
    'completed': 'stage_completed_id',
    'follow_up': 'stage_follow_up_id'
  };

  return stageMap[stageName as keyof typeof stageMap] || 'stage_lead_id';
}

async function calculateCustomerLTV(email: string, supabase: any): Promise<string> {
  const { data: orders } = await supabase
    .from('orders')
    .select('amount, created_at')
    .eq('customer_email', email)
    .eq('status', 'completed');

  const totalValue = orders?.reduce((sum: number, order: any) => sum + order.amount, 0) || 0;
  return (totalValue / 100).toString(); // Convert cents to dollars
}

async function triggerWelcomeSequence(contactId: string, serviceType: string, token: string, locationId: string) {
  // Trigger welcome email sequence
  const workflowData = {
    contactId: contactId,
    workflowId: 'welcome_sequence_id', // This would be configured in GHL
    data: { serviceType }
  };

  await fetch(`https://services.leadconnectorhq.com/workflows/trigger`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    },
    body: JSON.stringify(workflowData)
  });
}

async function handleStageAutomations(stage: string, order: any, token: string, locationId: string) {
  const automations = {
    'qualified': async () => {
      // Send booking confirmation
      await sendStageEmail(order.ghl_contact_id, 'booking_confirmation', token);
    },
    'scheduled': async () => {
      // Schedule reminder sequence
      await scheduleReminders(order.ghl_contact_id, order.scheduled_date, token, locationId);
    },
    'completed': async () => {
      // Trigger satisfaction survey and follow-up
      await triggerSatisfactionSurvey(order.ghl_contact_id, token, locationId);
    }
  };

  const automation = automations[stage as keyof typeof automations];
  if (automation) {
    await automation();
  }
}

async function handleServiceCompletedAutomation(orderId: string, contactId: string, token: string, locationId: string, supabase: any) {
  // Send thank you message
  await sendStageEmail(contactId, 'service_completed_thanks', token);
  
  // Schedule follow-up for review request (24 hours later)
  const followUpDate = new Date();
  followUpDate.setDate(followUpDate.getDate() + 1);
  
  await scheduleFollowUpEmail(contactId, 'review_request', followUpDate, token, locationId);
  
  // Check if customer is eligible for loyalty program
  const { data: orderCount } = await supabase
    .from('orders')
    .select('count')
    .eq('customer_email', (await getContactEmail(contactId, token)))
    .eq('status', 'completed');

  if (orderCount && orderCount[0]?.count >= 3) {
    await triggerLoyaltyProgram(contactId, token, locationId);
  }

  return { automationTriggered: true, loyaltyEligible: orderCount?.[0]?.count >= 3 };
}

async function handlePaymentFailedAutomation(orderId: string, contactId: string, token: string, locationId: string, supabase: any) {
  // Send payment reminder
  await sendStageEmail(contactId, 'payment_failed', token);
  
  // Schedule follow-up reminders
  const reminder1 = new Date();
  reminder1.setDate(reminder1.getDate() + 1);
  
  const reminder2 = new Date();
  reminder2.setDate(reminder2.getDate() + 3);
  
  await scheduleFollowUpEmail(contactId, 'payment_reminder_1', reminder1, token, locationId);
  await scheduleFollowUpEmail(contactId, 'payment_reminder_2', reminder2, token, locationId);

  return { paymentRemindersScheduled: true };
}

async function handleSatisfactionAutomation(orderId: string, contactId: string, rating: number, token: string, locationId: string, supabase: any) {
  if (rating >= 4) {
    // High satisfaction - ask for review and referral
    await sendStageEmail(contactId, 'high_satisfaction_review_request', token);
    await sendStageEmail(contactId, 'referral_request', token);
  } else if (rating <= 2) {
    // Low satisfaction - trigger service recovery
    await sendStageEmail(contactId, 'service_recovery', token);
    // Create task for manager follow-up
    await createFollowUpTask(contactId, 'Service Recovery Required', token, locationId);
  }

  return { satisfactionHandled: true, rating };
}

async function handleRetentionRiskAutomation(contactId: string, data: any, token: string, locationId: string, supabase: any) {
  // Send retention offer
  await sendStageEmail(contactId, 'retention_offer', token);
  
  // Schedule personal outreach
  await createFollowUpTask(contactId, 'Retention Risk - Personal Outreach Required', token, locationId);

  return { retentionCampaignTriggered: true };
}

// Utility functions
async function sendStageEmail(contactId: string, emailType: string, token: string) {
  // This would send pre-configured email templates
  logStep("Sending stage email", { contactId, emailType });
}

async function scheduleReminders(contactId: string, serviceDate: string, token: string, locationId: string) {
  // Schedule reminder sequence
  logStep("Scheduling reminders", { contactId, serviceDate });
}

async function triggerSatisfactionSurvey(contactId: string, token: string, locationId: string) {
  // Trigger satisfaction survey workflow
  logStep("Triggering satisfaction survey", { contactId });
}

async function scheduleFollowUpEmail(contactId: string, emailType: string, date: Date, token: string, locationId: string) {
  logStep("Scheduling follow-up email", { contactId, emailType, date });
}

async function triggerLoyaltyProgram(contactId: string, token: string, locationId: string) {
  logStep("Triggering loyalty program", { contactId });
}

async function getContactEmail(contactId: string, token: string): Promise<string> {
  const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    }
  });
  
  const contact = await response.json();
  return contact.contact?.email || '';
}

async function createFollowUpTask(contactId: string, taskDescription: string, token: string, locationId: string) {
  const taskData = {
    title: taskDescription,
    contactId: contactId,
    dueDate: new Date().toISOString(),
    completed: false
  };

  await fetch(`https://services.leadconnectorhq.com/tasks/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    },
    body: JSON.stringify(taskData)
  });
}

function calculateActionScore(action: string): number {
  const scoreMap = {
    'email_opened': 5,
    'link_clicked': 10,
    'form_submitted': 15,
    'phone_answered': 20,
    'appointment_scheduled': 25,
    'service_completed': 30,
    'referral_made': 35
  };

  return scoreMap[action as keyof typeof scoreMap] || 0;
}

async function updateLeadScore(contactId: string, scoreUpdate: number, token: string) {
  // Get current score and update it
  const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    }
  });
  
  const contact = await response.json();
  const currentScore = parseInt(contact.contact?.customFields?.find((f: any) => f.key === 'lead_score')?.field_value || '50');
  const newScore = Math.min(100, Math.max(0, currentScore + scoreUpdate));

  await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    },
    body: JSON.stringify({
      customFields: [
        { key: "lead_score", field_value: newScore.toString() }
      ]
    })
  });
}