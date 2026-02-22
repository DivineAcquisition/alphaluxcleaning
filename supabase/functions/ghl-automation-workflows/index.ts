import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GHL-AUTOMATION-WORKFLOWS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Automation Workflows started");

    const GHL_PRIVATE_TOKEN = Deno.env.get("GHL_PRIVATE_INTEGRATION_TOKEN");
    const GHL_LOCATION_ID = Deno.env.get("GOHIGHLEVEL_LOCATION_ID");

    if (!GHL_PRIVATE_TOKEN || !GHL_LOCATION_ID) {
      throw new Error("GoHighLevel credentials not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { workflow, ...params } = await req.json();
    logStep("Workflow request received", { workflow, params });

    let result;

    switch (workflow) {
      case 'service_lifecycle':
        result = await executeServiceLifecycleWorkflow(params, GHL_PRIVATE_TOKEN, GHL_LOCATION_ID, supabase);
        break;
      case 'retention_campaign':
        result = await executeRetentionCampaign(params, GHL_PRIVATE_TOKEN, GHL_LOCATION_ID, supabase);
        break;
      case 'upselling_workflow':
        result = await executeUpsellingWorkflow(params, GHL_PRIVATE_TOKEN, GHL_LOCATION_ID, supabase);
        break;
      case 'review_management':
        result = await executeReviewManagement(params, GHL_PRIVATE_TOKEN, GHL_LOCATION_ID, supabase);
        break;
      case 'appointment_reminders':
        result = await executeAppointmentReminders(params, GHL_PRIVATE_TOKEN, GHL_LOCATION_ID, supabase);
        break;
      case 'customer_feedback':
        result = await executeCustomerFeedback(params, GHL_PRIVATE_TOKEN, GHL_LOCATION_ID, supabase);
        break;
      case 'referral_automation':
        result = await executeReferralAutomation(params, GHL_PRIVATE_TOKEN, GHL_LOCATION_ID, supabase);
        break;
      case 'no_show_followup':
        result = await executeNoShowFollowup(params, GHL_PRIVATE_TOKEN, GHL_LOCATION_ID, supabase);
        break;
      default:
        throw new Error(`Unsupported workflow: ${workflow}`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      workflow,
      result
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in automation workflows", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Service Lifecycle Automation
async function executeServiceLifecycleWorkflow(params: any, token: string, locationId: string, supabase: any) {
  const { stage, orderId, customerEmail, customerName, serviceDate, serviceType } = params;

  logStep("Executing service lifecycle workflow", { stage, orderId });

  const workflows = {
    'booking_confirmed': {
      actions: [
        { type: 'send_sms', message: `Hi ${customerName}! Your ${serviceType} is confirmed for ${serviceDate}. We're excited to make your space sparkle! 🧹✨` },
        { type: 'send_email', subject: 'Booking Confirmed', template: 'booking_confirmation' },
        { type: 'add_tag', tag: 'booking_confirmed' },
        { type: 'schedule_reminder', days: 1, message: 'Service reminder: Tomorrow is your cleaning day!' }
      ]
    },
    'service_started': {
      actions: [
        { type: 'send_sms', message: `Our team has arrived and started your ${serviceType}! Estimated completion in 2-3 hours.` },
        { type: 'add_tag', tag: 'service_in_progress' },
        { type: 'update_pipeline_stage', stage: 'in_progress' }
      ]
    },
    'service_completed': {
      actions: [
        { type: 'send_sms', message: `Your ${serviceType} is complete! Thank you for choosing AlphaLux Clean. How did we do?` },
        { type: 'send_email', subject: 'Service Complete - We Value Your Feedback', template: 'service_completion' },
        { type: 'add_tag', tag: 'service_completed' },
        { type: 'schedule_followup', hours: 24, action: 'request_review' },
        { type: 'schedule_followup', days: 7, action: 'upsell_opportunity' }
      ]
    },
    'payment_received': {
      actions: [
        { type: 'send_sms', message: 'Payment received! Thank you for your business. Book your next cleaning at 25% off!' },
        { type: 'add_tag', tag: 'payment_complete' },
        { type: 'trigger_workflow', workflow: 'loyalty_program' }
      ]
    }
  };

  const workflow = workflows[stage as keyof typeof workflows];
  if (!workflow) {
    throw new Error(`Unknown lifecycle stage: ${stage}`);
  }

  const results = [];
  
  for (const action of workflow.actions) {
    try {
      let result;
      
      switch (action.type) {
        case 'send_sms':
          result = await sendAutomatedSMS(customerEmail, action.message, token, locationId);
          break;
        case 'send_email':
          result = await sendAutomatedEmail(customerEmail, action.subject, action.template, token, locationId);
          break;
        case 'add_tag':
          result = await addAutomatedTag(customerEmail, action.tag, token);
          break;
        case 'schedule_reminder':
          result = await scheduleAutomatedReminder(customerEmail, action.days, action.message, token, locationId);
          break;
        case 'schedule_followup':
          result = await scheduleAutomatedFollowup(customerEmail, action, token, locationId);
          break;
        case 'trigger_workflow':
          result = await triggerAutomatedWorkflow(customerEmail, action.workflow, token, locationId);
          break;
        default:
          result = { skipped: true, reason: `Unsupported action: ${action.type}` };
      }
      
      results.push({ action: action.type, result });
    } catch (error) {
      results.push({ action: action.type, error: error.message });
    }
  }

  // Log workflow execution in database
  await supabase.from('workflow_executions').insert({
    order_id: orderId,
    workflow_type: 'service_lifecycle',
    stage: stage,
    actions_executed: results.length,
    success_count: results.filter(r => !r.error).length,
    execution_details: results
  });

  return { stage, actions_executed: results.length, results };
}

// Retention Campaign Automation
async function executeRetentionCampaign(params: any, token: string, locationId: string, supabase: any) {
  const { campaignType, customerEmail, customerName, lastServiceDate, lifetimeValue } = params;

  logStep("Executing retention campaign", { campaignType, customerEmail });

  const campaigns = {
    'inactive_30_days': {
      subject: 'We Miss You! Special Offer Inside',
      message: `Hi ${customerName}! It's been a while since your last cleaning. We'd love to welcome you back with 20% off your next service!`,
      offer: '20% off next service',
      urgency: '7 days'
    },
    'inactive_60_days': {
      subject: 'Come Back and Save 30%!',
      message: `${customerName}, we haven't seen you in 2 months! Here's 30% off to get your space sparkling again.`,
      offer: '30% off next service',
      urgency: '10 days'
    },
    'high_value_retention': {
      subject: 'VIP Customer - Exclusive Offer',
      message: `${customerName}, as one of our valued VIP customers, enjoy 25% off and priority booking!`,
      offer: '25% off + priority booking',
      urgency: '14 days'
    },
    'seasonal_comeback': {
      subject: 'Spring into Savings!',
      message: `${customerName}, spring is here! Time for a deep clean. Save 35% this month only.`,
      offer: '35% off spring cleaning',
      urgency: '30 days'
    }
  };

  const campaign = campaigns[campaignType as keyof typeof campaigns];
  if (!campaign) {
    throw new Error(`Unknown retention campaign: ${campaignType}`);
  }

  // Send multi-channel retention campaign
  const actions = [
    // Email with discount code
    {
      type: 'email',
      result: await sendRetentionEmail(customerEmail, campaign, token, locationId)
    },
    // SMS follow-up
    {
      type: 'sms',
      result: await sendRetentionSMS(customerEmail, campaign.message, token, locationId)
    },
    // Add retention tag
    {
      type: 'tag',
      result: await addRetentionTag(customerEmail, `retention_${campaignType}`, token)
    },
    // Create follow-up task
    {
      type: 'task',
      result: await createRetentionTask(customerEmail, campaign, token, locationId)
    }
  ];

  // Schedule follow-up based on campaign urgency
  setTimeout(async () => {
    await scheduleRetentionFollowup(customerEmail, campaignType, token, locationId);
  }, 3 * 24 * 60 * 60 * 1000); // 3 days later

  return { campaign: campaignType, actions };
}

// Upselling Workflow
async function executeUpsellingWorkflow(params: any, token: string, locationId: string, supabase: any) {
  const { customerEmail, customerName, serviceHistory, currentService, spendingTier } = params;

  logStep("Executing upselling workflow", { customerEmail, currentService });

  const upsellOpportunities = generateUpsellOpportunities(serviceHistory, currentService, spendingTier);

  const actions = [];
  
  for (const opportunity of upsellOpportunities) {
    // Send personalized upsell message
    const message = generateUpsellMessage(customerName, opportunity);
    
    actions.push({
      opportunity: opportunity.service,
      sms: await sendUpsellSMS(customerEmail, message, token, locationId),
      email: await sendUpsellEmail(customerEmail, opportunity, token, locationId),
      tag: await addUpsellTag(customerEmail, `upsell_${opportunity.service}`, token)
    });

    // Create opportunity in pipeline
    await createUpsellOpportunity(customerEmail, opportunity, token, locationId);
  }

  return { opportunities: upsellOpportunities.length, actions };
}

// Review Management
async function executeReviewManagement(params: any, token: string, locationId: string, supabase: any) {
  const { action, customerEmail, customerName, serviceDate, rating } = params;

  logStep("Executing review management", { action, customerEmail });

  switch (action) {
    case 'request_review':
      return await requestCustomerReview(customerEmail, customerName, serviceDate, token, locationId);
    
    case 'handle_positive_review':
      return await handlePositiveReview(customerEmail, rating, token, locationId);
    
    case 'handle_negative_review':
      return await handleNegativeReview(customerEmail, rating, token, locationId, supabase);
    
    case 'review_followup':
      return await followupReviewRequest(customerEmail, customerName, token, locationId);
    
    default:
      throw new Error(`Unknown review action: ${action}`);
  }
}

// Appointment Reminders
async function executeAppointmentReminders(params: any, token: string, locationId: string, supabase: any) {
  const { customerEmail, customerName, serviceDate, serviceTime, serviceType, reminderType } = params;

  const reminders = {
    '24_hour': {
      message: `Hi ${customerName}! Just a friendly reminder that your ${serviceType} is scheduled for tomorrow at ${serviceTime}. Our team is ready to make your space shine! 🏠✨`,
      urgency: 'medium'
    },
    '2_hour': {
      message: `${customerName}, your cleaning team will arrive in about 2 hours (${serviceTime}). Please ensure easy access to your property. See you soon! 🧹`,
      urgency: 'high'
    },
    '30_minute': {
      message: `We're on our way! Your cleaning team will arrive in 30 minutes. Thank you for choosing AlphaLux Clean! 🚗`,
      urgency: 'urgent'
    }
  };

  const reminder = reminders[reminderType as keyof typeof reminders];
  if (!reminder) {
    throw new Error(`Unknown reminder type: ${reminderType}`);
  }

  const result = await sendReminderMessage(customerEmail, reminder.message, reminder.urgency, token, locationId);
  
  // Log reminder in database
  await supabase.from('appointment_reminders').insert({
    customer_email: customerEmail,
    service_date: serviceDate,
    reminder_type: reminderType,
    sent_at: new Date().toISOString(),
    status: 'sent'
  });

  return result;
}

// Customer Feedback Automation
async function executeCustomerFeedback(params: any, token: string, locationId: string, supabase: any) {
  const { customerEmail, customerName, serviceDate, feedbackType } = params;

  const feedbackRequests = {
    'satisfaction_survey': {
      subject: 'How did we do? Quick 2-minute survey',
      message: `Hi ${customerName}! We hope you love your freshly cleaned space. Could you spare 2 minutes to tell us how we did?`,
      surveyLink: 'https://survey.alphaluxclean.com/satisfaction'
    },
    'improvement_feedback': {
      subject: 'Help us improve - Your input matters',
      message: `${customerName}, your feedback helps us improve. What can we do better for your next cleaning?`,
      surveyLink: 'https://survey.alphaluxclean.com/improvement'
    },
    'service_rating': {
      subject: 'Rate your cleaning experience',
      message: `${customerName}, please rate your cleaning experience from 1-5 stars. Your opinion matters to us!`,
      surveyLink: 'https://survey.alphaluxclean.com/rating'
    }
  };

  const feedback = feedbackRequests[feedbackType as keyof typeof feedbackRequests];
  if (!feedback) {
    throw new Error(`Unknown feedback type: ${feedbackType}`);
  }

  const result = await sendFeedbackRequest(customerEmail, feedback, token, locationId);
  
  // Schedule follow-up if no response in 3 days
  await scheduleCustomerFeedbackFollowup(customerEmail, feedbackType, token, locationId);

  return result;
}

// Referral Automation
async function executeReferralAutomation(params: any, token: string, locationId: string, supabase: any) {
  const { customerEmail, customerName, serviceCount, lastServiceRating } = params;

  // Only trigger referral requests for satisfied customers
  if (lastServiceRating >= 4 && serviceCount >= 2) {
    const referralMessage = `${customerName}, thanks for being an amazing customer! Refer a friend and you both get $25 off your next cleaning. Share the love! 💝`;
    
    const result = await sendReferralRequest(customerEmail, referralMessage, token, locationId);
    
    // Create referral tracking entry
    await supabase.from('referral_campaigns').insert({
      customer_email: customerEmail,
      campaign_type: 'friend_referral',
      sent_at: new Date().toISOString(),
      reward_amount: 25,
      status: 'sent'
    });

    return result;
  }

  return { skipped: true, reason: 'Customer not eligible for referral program' };
}

// No Show Follow-up
async function executeNoShowFollowup(params: any, token: string, locationId: string, supabase: any) {
  const { customerEmail, customerName, missedDate, rescheduleAttempts = 0 } = params;

  const followupMessages = [
    `Hi ${customerName}, we missed you today! No worries - things happen. Would you like to reschedule your cleaning?`,
    `${customerName}, we'd love to reschedule your cleaning service. Reply YES and we'll find a time that works better for you.`,
    `Last chance to reschedule, ${customerName}! We're here when you're ready. Just let us know! 📅`
  ];

  if (rescheduleAttempts < followupMessages.length) {
    const message = followupMessages[rescheduleAttempts];
    const result = await sendNoShowFollowup(customerEmail, message, token, locationId);
    
    // Log follow-up attempt
    await supabase.from('no_show_followups').insert({
      customer_email: customerEmail,
      missed_date: missedDate,
      attempt_number: rescheduleAttempts + 1,
      message_sent: message,
      sent_at: new Date().toISOString()
    });

    return result;
  }

  return { completed: true, reason: 'Max follow-up attempts reached' };
}

// Helper Functions
async function sendAutomatedSMS(customerEmail: string, message: string, token: string, locationId: string) {
  // Get contact ID from email
  const contactId = await getContactIdByEmail(customerEmail, token);
  
  const response = await fetch(`https://services.leadconnectorhq.com/conversations/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    },
    body: JSON.stringify({
      contactId: contactId,
      message: message,
      type: 'SMS'
    })
  });

  return await response.json();
}

async function sendAutomatedEmail(customerEmail: string, subject: string, template: string, token: string, locationId: string) {
  const contactId = await getContactIdByEmail(customerEmail, token);
  
  const emailTemplates = {
    'booking_confirmation': `Your cleaning service has been confirmed! We'll arrive on time and make your space sparkle.`,
    'service_completion': `Thank you for choosing AlphaLux Clean! We hope you love your clean space. Please rate our service!`
  };

  const emailBody = emailTemplates[template as keyof typeof emailTemplates] || 'Thank you for your business!';

  const response = await fetch(`https://services.leadconnectorhq.com/conversations/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    },
    body: JSON.stringify({
      contactId: contactId,
      subject: subject,
      message: emailBody,
      type: 'Email'
    })
  });

  return await response.json();
}

async function addAutomatedTag(customerEmail: string, tag: string, token: string) {
  const contactId = await getContactIdByEmail(customerEmail, token);
  
  const response = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/tags`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    },
    body: JSON.stringify({ tags: [tag] })
  });

  return await response.json();
}

async function getContactIdByEmail(email: string, token: string): Promise<string> {
  const response = await fetch(`https://services.leadconnectorhq.com/contacts/?email=${email}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    }
  });

  const data = await response.json();
  return data.contacts?.[0]?.id || null;
}

// Additional helper functions for specific workflows
function generateUpsellOpportunities(serviceHistory: any[], currentService: string, spendingTier: string) {
  const opportunities = [];
  
  if (currentService === 'standard_cleaning' && !serviceHistory.includes('deep_cleaning')) {
    opportunities.push({
      service: 'deep_cleaning',
      discount: 25,
      reason: 'Perfect time for a deep clean to maintain your space'
    });
  }
  
  if (spendingTier === 'high' && !serviceHistory.includes('window_cleaning')) {
    opportunities.push({
      service: 'window_cleaning',
      discount: 15,
      reason: 'Complete your clean with sparkling windows'
    });
  }

  return opportunities;
}

function generateUpsellMessage(customerName: string, opportunity: any): string {
  return `Hi ${customerName}! ${opportunity.reason}. Save ${opportunity.discount}% when you add ${opportunity.service.replace('_', ' ')} to your next booking!`;
}

// Export helper functions for other services
async function scheduleAutomatedReminder(customerEmail: string, days: number, message: string, token: string, locationId: string) {
  // Implementation for scheduling reminders
  return { scheduled: true, days, message };
}

async function scheduleAutomatedFollowup(customerEmail: string, action: any, token: string, locationId: string) {
  // Implementation for scheduling follow-ups
  return { scheduled: true, action };
}

async function triggerAutomatedWorkflow(customerEmail: string, workflow: string, token: string, locationId: string) {
  // Implementation for triggering other workflows
  return { triggered: true, workflow };
}

// Placeholder implementations for specific workflow functions
async function sendRetentionEmail(customerEmail: string, campaign: any, token: string, locationId: string) {
  return { sent: true, type: 'retention_email' };
}

async function sendRetentionSMS(customerEmail: string, message: string, token: string, locationId: string) {
  return { sent: true, type: 'retention_sms' };
}

async function addRetentionTag(customerEmail: string, tag: string, token: string) {
  return { added: true, tag };
}

async function createRetentionTask(customerEmail: string, campaign: any, token: string, locationId: string) {
  return { created: true, type: 'retention_task' };
}

async function scheduleRetentionFollowup(customerEmail: string, campaignType: string, token: string, locationId: string) {
  return { scheduled: true, type: 'retention_followup' };
}

async function sendUpsellSMS(customerEmail: string, message: string, token: string, locationId: string) {
  return sendAutomatedSMS(customerEmail, message, token, locationId);
}

async function sendUpsellEmail(customerEmail: string, opportunity: any, token: string, locationId: string) {
  const subject = `Special Offer: ${opportunity.discount}% off ${opportunity.service.replace('_', ' ')}`;
  return sendAutomatedEmail(customerEmail, subject, 'upsell_offer', token, locationId);
}

async function addUpsellTag(customerEmail: string, tag: string, token: string) {
  return addAutomatedTag(customerEmail, tag, token);
}

async function createUpsellOpportunity(customerEmail: string, opportunity: any, token: string, locationId: string) {
  return { created: true, opportunity };
}

async function requestCustomerReview(customerEmail: string, customerName: string, serviceDate: string, token: string, locationId: string) {
  const message = `Hi ${customerName}! Thanks for choosing us for your cleaning on ${serviceDate}. Could you take a moment to leave us a review? It really helps our small business! ⭐`;
  return sendAutomatedSMS(customerEmail, message, token, locationId);
}

async function handlePositiveReview(customerEmail: string, rating: number, token: string, locationId: string) {
  const message = `Thank you for the ${rating}-star review! We're thrilled you're happy with our service. Book again and save 10%!`;
  return sendAutomatedSMS(customerEmail, message, token, locationId);
}

async function handleNegativeReview(customerEmail: string, rating: number, token: string, locationId: string, supabase: any) {
  const message = `We're sorry your experience wasn't perfect. Our manager will contact you within 24 hours to make it right.`;
  
  // Create urgent task for manager follow-up
  await supabase.from('urgent_tasks').insert({
    customer_email: customerEmail,
    task_type: 'negative_review_followup',
    priority: 'urgent',
    rating: rating,
    created_at: new Date().toISOString()
  });

  return sendAutomatedSMS(customerEmail, message, token, locationId);
}

async function followupReviewRequest(customerEmail: string, customerName: string, token: string, locationId: string) {
  const message = `${customerName}, we'd still love to hear about your cleaning experience! Your feedback helps us improve. ⭐`;
  return sendAutomatedSMS(customerEmail, message, token, locationId);
}

async function sendReminderMessage(customerEmail: string, message: string, urgency: string, token: string, locationId: string) {
  return sendAutomatedSMS(customerEmail, message, token, locationId);
}

async function sendFeedbackRequest(customerEmail: string, feedback: any, token: string, locationId: string) {
  return sendAutomatedEmail(customerEmail, feedback.subject, 'feedback_request', token, locationId);
}

async function scheduleCustomerFeedbackFollowup(customerEmail: string, feedbackType: string, token: string, locationId: string) {
  return { scheduled: true, type: 'feedback_followup' };
}

async function sendReferralRequest(customerEmail: string, message: string, token: string, locationId: string) {
  return sendAutomatedSMS(customerEmail, message, token, locationId);
}

async function sendNoShowFollowup(customerEmail: string, message: string, token: string, locationId: string) {
  return sendAutomatedSMS(customerEmail, message, token, locationId);
}