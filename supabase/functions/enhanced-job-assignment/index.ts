import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EnhancedAssignmentRequest {
  subcontractorIds: string[];
  bookingId: string;
  priority: 'normal' | 'high' | 'urgent';
  assignmentNotes?: string;
  notificationMethods: ('email' | 'sms')[];
  requiredResponseTime?: number; // minutes
  isAutoReassign?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      subcontractorIds,
      bookingId,
      priority = 'normal',
      assignmentNotes,
      notificationMethods = ['email'],
      requiredResponseTime = 120, // 2 hours default
      isAutoReassign = false
    }: EnhancedAssignmentRequest = await req.json();

    console.log('Enhanced job assignment request:', {
      subcontractorIds,
      bookingId,
      priority,
      notificationMethods
    });

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Get subcontractors details
    const { data: subcontractors, error: subError } = await supabase
      .from('subcontractors')
      .select('*')
      .in('id', subcontractorIds);

    if (subError || !subcontractors?.length) {
      throw new Error('Subcontractors not found');
    }

    // Create job assignments for each subcontractor
    const assignmentPromises = subcontractorIds.map(subcontractorId => 
      supabase
        .from('subcontractor_job_assignments')
        .insert({
          booking_id: bookingId,
          subcontractor_id: subcontractorId,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
          subcontractor_notes: assignmentNotes,
          priority,
          response_deadline: new Date(Date.now() + requiredResponseTime * 60000).toISOString()
        })
        .select()
        .single()
    );

    const assignmentResults = await Promise.all(assignmentPromises);
    const assignments = assignmentResults.map(result => result.data);

    // Generate secure tokens for each assignment
    const tokenPromises = assignments.map(assignment => 
      generateAssignmentTokens(supabase, assignment.id)
    );
    
    const tokenResults = await Promise.all(tokenPromises);

    // Send notifications based on priority and methods
    const notificationPromises = assignments.map((assignment, index) => {
      const subcontractor = subcontractors.find(s => s.id === assignment.subcontractor_id);
      const tokens = tokenResults[index];
      
      return sendNotifications({
        assignment,
        booking,
        subcontractor,
        tokens,
        methods: notificationMethods,
        priority,
        supabase
      });
    });

    await Promise.allSettled(notificationPromises);

    // Create job tracking entries
    const trackingPromises = assignments.map(assignment =>
      supabase
        .from('job_tracking')
        .insert({
          assignment_id: assignment.id,
          subcontractor_id: assignment.subcontractor_id,
          status: 'assigned'
        })
    );

    await Promise.allSettled(trackingPromises);

    // Update booking with primary assigned employee
    await supabase
      .from('bookings')
      .update({ assigned_employee_id: subcontractorIds[0] })
      .eq('id', bookingId);

    return new Response(JSON.stringify({
      success: true,
      assignmentIds: assignments.map(a => a.id),
      message: `Successfully assigned job to ${subcontractorIds.length} subcontractor(s)`,
      notificationsSent: notificationMethods.length * subcontractorIds.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in enhanced-job-assignment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

// Generate secure HMAC tokens for accept/decline actions
async function generateAssignmentTokens(supabase: any, assignmentId: string) {
  const acceptToken = generateSecureToken();
  const declineToken = generateSecureToken();
  
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48); // 48 hours to respond

  await supabase
    .from('job_assignment_tokens')
    .insert([
      {
        assignment_id: assignmentId,
        token: acceptToken,
        action: 'accept',
        expires_at: expiresAt.toISOString()
      },
      {
        assignment_id: assignmentId,
        token: declineToken,
        action: 'decline', 
        expires_at: expiresAt.toISOString()
      }
    ]);

  return { acceptToken, declineToken };
}

// Send multi-channel notifications
async function sendNotifications({
  assignment,
  booking,
  subcontractor,
  tokens,
  methods,
  priority,
  supabase
}: {
  assignment: any;
  booking: any;
  subcontractor: any;
  tokens: { acceptToken: string; declineToken: string };
  methods: string[];
  priority: string;
  supabase: any;
}) {
  const baseUrl = `https://yltvknkqnzdeiqckqjha.supabase.co/functions/v1`;
  const acceptUrl = `${baseUrl}/subcontractor-response?token=${tokens.acceptToken}&action=accept`;
  const declineUrl = `${baseUrl}/subcontractor-response?token=${tokens.declineToken}&action=decline`;

  // Send email notification
  if (methods.includes('email')) {
    await sendEmailNotification({
      subcontractor,
      booking,
      acceptUrl,
      declineUrl,
      priority,
      assignment
    });
  }

  // Send SMS notification
  if (methods.includes('sms')) {
    await sendSMSNotification({
      subcontractor,
      booking,
      acceptUrl,
      priority,
      supabase
    });
  }

  // Log communication
  await supabase
    .from('communication_logs')
    .insert({
      recipient_id: subcontractor.id,
      communication_type: methods.join(','),
      subject: `${priority.toUpperCase()} Job Assignment`,
      message_content: `Job assignment for ${booking.customer_name}`,
      delivery_status: 'sent'
    });
}

async function sendEmailNotification({
  subcontractor,
  booking,
  acceptUrl,
  declineUrl,
  priority,
  assignment
}: any) {
  const priorityEmoji = priority === 'urgent' ? '🚨 ' : priority === 'high' ? '⚡ ' : '';
  const subject = `${priorityEmoji}New Job Assignment - ${booking.customer_name}`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${priority === 'urgent' ? '#fee2e2' : priority === 'high' ? '#fef3c7' : '#f0f9ff'}; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: ${priority === 'urgent' ? '#dc2626' : priority === 'high' ? '#d97706' : '#0369a1'}; margin: 0;">
          ${priorityEmoji}Job Assignment
        </h2>
        <p style="margin: 5px 0 0 0;">Priority: <strong>${priority.toUpperCase()}</strong></p>
      </div>

      <h3>Hi ${subcontractor.full_name},</h3>
      
      <p>You have been assigned a new cleaning job. Please review the details and respond within 2 hours.</p>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0;">Job Details:</h4>
        <p><strong>Customer:</strong> ${booking.customer_name}</p>
        <p><strong>Address:</strong> ${booking.service_address}</p>
        <p><strong>Date:</strong> ${new Date(booking.service_date).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${booking.service_time}</p>
        <p><strong>Phone:</strong> ${booking.customer_phone || 'Not provided'}</p>
        ${booking.special_instructions ? `<p><strong>Special Instructions:</strong> ${booking.special_instructions}</p>` : ''}
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${acceptUrl}" style="background: #22c55e; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-right: 10px; display: inline-block;">
          ✅ Accept Job
        </a>
        <a href="${declineUrl}" style="background: #ef4444; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
          ❌ Decline Job
        </a>
      </div>

      <p style="color: #64748b; font-size: 14px;">
        Please respond within 2 hours. If you don't respond, the job may be reassigned to another cleaner.
      </p>
    </div>
  `;

  await resend.emails.send({
    from: "AlphaLuxClean <noreply@info.alphaluxcleaning.com>",
    to: [subcontractor.email],
    subject,
    html: emailHtml,
  });
}

async function sendSMSNotification({
  subcontractor,
  booking,
  acceptUrl,
  priority,
  supabase
}: any) {
  const priorityEmoji = priority === 'urgent' ? '🚨 ' : priority === 'high' ? '⚡ ' : '';
  
  const message = `${priorityEmoji}NEW JOB: ${booking.customer_name} at ${booking.service_address} on ${new Date(booking.service_date).toLocaleDateString()} at ${booking.service_time}. Please respond within 2 hours: ${acceptUrl}`;

  // Call SMS function (would integrate with Twilio/GHL)
  try {
    await supabase.functions.invoke('send-sms-notification', {
      body: {
        phone: subcontractor.phone,
        message,
        priority
      }
    });
  } catch (error) {
    console.error('SMS send error:', error);
  }
}

function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

serve(handler);