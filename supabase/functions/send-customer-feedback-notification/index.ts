import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { CustomerFeedbackNotification } from '../_shared/email-templates/customer-feedback-notification.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FeedbackNotificationRequest {
  assignmentId: string;
  rating: number;
  feedback?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assignmentId, rating, feedback }: FeedbackNotificationRequest = await req.json();

    console.log('Sending customer feedback notification:', { assignmentId, rating });

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get assignment with related data
    const { data: assignment, error: assignmentError } = await supabase
      .from('subcontractor_job_assignments')
      .select(`
        *,
        subcontractor:subcontractors(full_name, email),
        booking:bookings(customer_name, service_date, service_address, service_type)
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      console.error('Error fetching assignment:', assignmentError);
      throw new Error('Assignment not found');
    }

    if (!assignment.subcontractor || !assignment.booking) {
      throw new Error('Missing subcontractor or booking data');
    }

    // Render email using React Email
    const emailHtml = await renderAsync(
      React.createElement(CustomerFeedbackNotification, {
        subcontractorName: assignment.subcontractor.full_name,
        customerName: assignment.booking.customer_name,
        serviceDate: new Date(assignment.booking.service_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        serviceAddress: assignment.booking.service_address,
        rating: rating,
        feedback: feedback,
        dashboardUrl: `${supabaseUrl.replace('.supabase.co', '')}.com/subcontractor-portal`,
      })
    );

    // Send email
    const emailResponse = await resend.emails.send({
      from: "AlphaLux Cleaning <noreply@info.alphaluxclean.com>",
      to: [assignment.subcontractor.email],
      subject: `Customer Feedback Received - ${rating} stars from ${assignment.booking.customer_name}`,
      html: emailHtml,
    });

    console.log('Email sent successfully:', emailResponse);

    // Create notification record
    const { error: notificationError } = await supabase
      .from('subcontractor_notifications')
      .insert({
        subcontractor_id: assignment.subcontractor_id,
        title: 'Customer Feedback Received',
        message: `You received ${rating}/5 stars from ${assignment.booking.customer_name}${feedback ? ' with comments' : ''}`,
        type: 'feedback'
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      message: 'Customer feedback notification sent successfully' 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-customer-feedback-notification function:", error);
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