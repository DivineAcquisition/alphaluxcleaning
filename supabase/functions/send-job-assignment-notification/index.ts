import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { JobAssignmentNotification } from '../_shared/email-templates/job-assignment-notification.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JobAssignmentRequest {
  subcontractorId: string;
  bookingId: string;
  assignmentId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subcontractorId, bookingId, assignmentId }: JobAssignmentRequest = await req.json();

    console.log('Sending job assignment notification:', { subcontractorId, bookingId, assignmentId });

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get subcontractor details
    const { data: subcontractor, error: subError } = await supabase
      .from('subcontractors')
      .select('full_name, email, split_tier')
      .eq('id', subcontractorId)
      .single();

    if (subError || !subcontractor) {
      console.error('Error fetching subcontractor:', subError);
      throw new Error('Subcontractor not found');
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Error fetching booking:', bookingError);
      throw new Error('Booking not found');
    }

    // Get order details for payment amount
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('amount')
      .eq('id', booking.order_id)
      .single();

    // Calculate split amount based on tier
    const getSplitPercentage = (tier: string) => {
      switch (tier) {
        case 'starter': return 60;
        case 'professional': return 70;
        case 'premium': return 80;
        default: return 60;
      }
    };

    const splitPercentage = getSplitPercentage(subcontractor.split_tier);
    const totalAmount = order?.amount || 0;
    const splitAmount = Math.round((totalAmount * splitPercentage) / 100);

    // Format deadline (24 hours from now)
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 24);
    const acceptDeadline = deadline.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Render email using React Email
    const emailHtml = await renderAsync(
      React.createElement(JobAssignmentNotification, {
        subcontractorName: subcontractor.full_name,
        customerName: booking.customer_name,
        serviceAddress: booking.service_address,
        serviceDate: new Date(booking.service_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        serviceTime: booking.service_time,
        serviceType: booking.service_type || 'Standard Cleaning',
        specialInstructions: booking.special_instructions,
        paymentAmount: `$${(totalAmount / 100).toFixed(2)}`,
        splitAmount: `$${(splitAmount / 100).toFixed(2)}`,
        dashboardUrl: `${supabaseUrl.replace('.supabase.co', '')}.com/subcontractor-portal`,
        acceptDeadline: acceptDeadline,
      })
    );

    // Send email
    const emailResponse = await resend.emails.send({
      from: "AlphaLux Cleaning <noreply@info.alphaluxclean.com>",
      to: [subcontractor.email],
      subject: `New Job Assignment - ${booking.customer_name} on ${new Date(booking.service_date).toLocaleDateString()}`,
      html: emailHtml,
    });

    console.log('Email sent successfully:', emailResponse);

    // Create notification record
    const { error: notificationError } = await supabase
      .from('subcontractor_notifications')
      .insert({
        subcontractor_id: subcontractorId,
        title: 'New Job Assignment',
        message: `You have been assigned a cleaning job for ${booking.customer_name} on ${new Date(booking.service_date).toLocaleDateString()}`,
        type: 'job_assignment'
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      message: 'Job assignment notification sent successfully' 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-job-assignment-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);