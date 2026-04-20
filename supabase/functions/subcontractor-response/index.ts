import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResponseRequest {
  token: string;
  action: 'accept' | 'decline';
  declineReason?: string;
  estimatedArrivalMinutes?: number;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === "GET") {
    // Handle token-based responses from email/SMS links
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const action = url.searchParams.get('action');
    
    if (!token || !action) {
      return new Response("Invalid request", { status: 400 });
    }

    return await handleResponse({ token, action } as ResponseRequest, req);
  }

  if (req.method === "POST") {
    const requestData: ResponseRequest = await req.json();
    return await handleResponse(requestData, req);
  }

  return new Response("Method not allowed", { status: 405 });
};

async function handleResponse(data: ResponseRequest, req: Request) {
  try {
    const { token, action, declineReason, estimatedArrivalMinutes, notes } = data;
    
    console.log('Processing subcontractor response:', { token, action });

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Validate token and get assignment
    const { data: tokenData, error: tokenError } = await supabase
      .from('job_assignment_tokens')
      .select(`
        *,
        subcontractor_job_assignments (
          *,
          bookings (*),
          subcontractors (*)
        )
      `)
      .eq('token', token)
      .eq('action', action)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        generateResponsePage('Error', 'This link is invalid or has expired. Please contact your dispatcher.', 'error'),
        { 
          status: 400,
          headers: { "Content-Type": "text/html", ...corsHeaders }
        }
      );
    }

    const assignment = tokenData.subcontractor_job_assignments;
    const booking = assignment.bookings;
    const subcontractor = assignment.subcontractors;

    // Mark token as used
    await supabase
      .from('job_assignment_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    // Update assignment status
    const newStatus = action === 'accept' ? 'accepted' : 'declined';
    const updateData: any = {
      status: newStatus,
      response_time: new Date().toISOString()
    };

    if (action === 'accept') {
      updateData.accepted_at = new Date().toISOString();
    }

    await supabase
      .from('subcontractor_job_assignments')
      .update(updateData)
      .eq('id', assignment.id);

    // Record the response
    await supabase
      .from('subcontractor_responses')
      .insert({
        assignment_id: assignment.id,
        subcontractor_id: assignment.subcontractor_id,
        response_type: action,
        decline_reason: declineReason,
        estimated_arrival_minutes: estimatedArrivalMinutes,
        notes,
        ip_address: getClientIP(req),
        user_agent: req.headers.get('user-agent')
      });

    // Update job tracking
    await supabase
      .from('job_tracking')
      .upsert({
        assignment_id: assignment.id,
        subcontractor_id: assignment.subcontractor_id,
        status: newStatus,
        estimated_duration_minutes: estimatedArrivalMinutes
      });

    // Handle acceptance
    if (action === 'accept') {
      // Send confirmation SMS/email
      await sendAcceptanceConfirmation(supabase, assignment, booking, subcontractor);
      
      // Notify customer
      await notifyCustomer(supabase, booking, subcontractor, 'accepted');

      return new Response(
        generateResponsePage(
          'Job Accepted! 🎉',
          `Thank you for accepting the job for ${booking.customer_name} on ${new Date(booking.service_date).toLocaleDateString()}. You will receive further details shortly.`,
          'success'
        ),
        { 
          status: 200,
          headers: { "Content-Type": "text/html", ...corsHeaders }
        }
      );
    }

    // Handle decline
    if (action === 'decline') {
      // Trigger reassignment logic
      await handleJobReassignment(supabase, assignment.booking_id, assignment.id);
      
      return new Response(
        generateResponsePage(
          'Job Declined',
          'Thank you for your response. The job will be reassigned to another cleaner.',
          'info'
        ),
        { 
          status: 200,
          headers: { "Content-Type": "text/html", ...corsHeaders }
        }
      );
    }

  } catch (error: any) {
    console.error("Error processing response:", error);
    return new Response(
      generateResponsePage('Error', 'Something went wrong. Please try again or contact support.', 'error'),
      { 
        status: 500,
        headers: { "Content-Type": "text/html", ...corsHeaders }
      }
    );
  }
}

async function sendAcceptanceConfirmation(supabase: any, assignment: any, booking: any, subcontractor: any) {
  await supabase.functions.invoke('send-sms-notification', {
    body: {
      phone: subcontractor.phone,
      message: `Job confirmed! ${booking.customer_name} at ${booking.service_address} on ${new Date(booking.service_date).toLocaleDateString()} at ${booking.service_time}. Customer: ${booking.customer_phone || 'Contact admin for number'}`,
      templateKey: 'job_accepted_confirmation'
    }
  });
}

async function notifyCustomer(supabase: any, booking: any, subcontractor: any, status: string) {
  await supabase
    .from('order_status_updates')
    .insert({
      order_id: booking.order_id,
      subcontractor_id: subcontractor.id,
      status_message: `Your cleaner ${subcontractor.full_name} has ${status} the job and will arrive as scheduled.`,
      is_customer_visible: true
    });
}

async function handleJobReassignment(supabase: any, bookingId: string, declinedAssignmentId: string) {
  console.log('Handling job reassignment for booking:', bookingId);
  
  // Mark other assignments for this booking as declined if this was the primary
  await supabase
    .from('subcontractor_job_assignments')
    .update({ status: 'needs_reassignment' })
    .eq('booking_id', bookingId)
    .neq('id', declinedAssignmentId);

  // Trigger smart reassignment (would implement algorithm here)
  try {
    await supabase.functions.invoke('smart-job-assignment', {
      body: { 
        bookingId,
        reason: 'declined',
        excludeAssignmentIds: [declinedAssignmentId]
      }
    });
  } catch (error) {
    console.error('Auto-reassignment failed:', error);
  }
}

function generateResponsePage(title: string, message: string, type: 'success' | 'error' | 'info'): string {
  const color = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6';
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - AlphaLux Cleaning</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          text-align: center;
          max-width: 500px;
          width: 100%;
        }
        .icon {
          font-size: 48px;
          margin-bottom: 20px;
        }
        h1 {
          color: ${color};
          margin-bottom: 16px;
        }
        p {
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .footer {
          font-size: 14px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">${icon}</div>
        <h1>${title}</h1>
        <p>${message}</p>
        <div class="footer">
          AlphaLux Cleaning<br>
          Questions? Contact us at support@alphaluxcleaning.com
        </div>
      </div>
    </body>
    </html>
  `;
}

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

serve(handler);