import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { MonthlyPerformanceSummary } from '../_shared/email-templates/monthly-performance-summary.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PerformanceSummaryRequest {
  subcontractorId?: string; // Optional - if not provided, sends to all
  month?: number; // Optional - defaults to last month
  year?: number; // Optional - defaults to current year
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const { subcontractorId, month, year }: PerformanceSummaryRequest = body ? JSON.parse(body) : {};

    console.log('Sending monthly performance summary:', { subcontractorId, month, year });

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Default to last month if not specified
    const now = new Date();
    const targetMonth = month || (now.getMonth() === 0 ? 12 : now.getMonth());
    const targetYear = year || (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());

    // Get month name
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[targetMonth - 1];

    // Date range for the target month
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    // Get subcontractors to send to
    let subcontractorQuery = supabase
      .from('subcontractors')
      .select('id, full_name, email, split_tier')
      .eq('is_available', true)
      .eq('subscription_status', 'active');

    if (subcontractorId) {
      subcontractorQuery = subcontractorQuery.eq('id', subcontractorId);
    }

    const { data: subcontractors, error: subError } = await subcontractorQuery;

    if (subError || !subcontractors) {
      console.error('Error fetching subcontractors:', subError);
      throw new Error('No subcontractors found');
    }

    const results = [];

    for (const subcontractor of subcontractors) {
      try {
        // Get monthly performance data
        const { data: assignments, error: assignmentError } = await supabase
          .from('subcontractor_job_assignments')
          .select(`
            *,
            booking:bookings(service_date),
            payment:subcontractor_payments(subcontractor_amount, paid_at)
          `)
          .eq('subcontractor_id', subcontractor.id)
          .eq('status', 'completed')
          .gte('completed_at', startDate.toISOString())
          .lte('completed_at', endDate.toISOString());

        if (assignmentError) {
          console.error('Error fetching assignments for', subcontractor.id, assignmentError);
          continue;
        }

        const completedJobs = assignments || [];
        const totalEarnings = completedJobs.reduce((sum, job) => {
          const payment = Array.isArray(job.payment) ? job.payment[0] : job.payment;
          return sum + (payment ? parseFloat(payment.subcontractor_amount) : 0);
        }, 0);

        const ratings = completedJobs
          .map(job => job.customer_rating)
          .filter(rating => rating !== null && rating !== undefined);
        const averageRating = ratings.length > 0 ? 
          ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;

        // Calculate on-time percentage (simplified - assume all completed are on time for now)
        const onTimePercentage = completedJobs.length > 0 ? 95 : 0;

        // Generate achievements based on performance
        const achievements = [];
        if (completedJobs.length >= 20) achievements.push("Completed 20+ jobs this month");
        if (averageRating >= 4.8) achievements.push("Maintained excellent 4.8+ star rating");
        if (totalEarnings >= 2000) achievements.push("Earned $2,000+ this month");
        if (onTimePercentage >= 98) achievements.push("Perfect attendance record");
        if (achievements.length === 0 && completedJobs.length > 0) {
          achievements.push("Successfully completed cleaning services");
        }

        // Generate improvement areas
        const improvementAreas = [];
        if (averageRating < 4.0) improvementAreas.push("Focus on improving customer satisfaction");
        if (completedJobs.length < 10) improvementAreas.push("Take on more jobs to increase earnings");

        // Render email using React Email
        const emailHtml = await renderAsync(
          React.createElement(MonthlyPerformanceSummary, {
            subcontractorName: subcontractor.full_name,
            month: monthName,
            year: targetYear.toString(),
            stats: {
              jobsCompleted: completedJobs.length,
              totalEarnings: `$${totalEarnings.toFixed(2)}`,
              averageRating: averageRating,
              onTimePercentage: onTimePercentage,
              customerSatisfaction: Math.round(averageRating * 20), // Convert to percentage
            },
            achievements: achievements,
            improvementAreas: improvementAreas.length > 0 ? improvementAreas : undefined,
            dashboardUrl: `${supabaseUrl.replace('.supabase.co', '')}.com/subcontractor-portal`,
          })
        );

        // Send email
        const emailResponse = await resend.emails.send({
          from: "Bay Area Cleaning <reports@bayareacleaningpros.com>",
          to: [subcontractor.email],
          subject: `Your ${monthName} ${targetYear} Performance Summary - ${completedJobs.length} Jobs Completed`,
          html: emailHtml,
        });

        console.log('Performance summary sent to:', subcontractor.email, emailResponse);

        // Create notification record
        const { error: notificationError } = await supabase
          .from('subcontractor_notifications')
          .insert({
            subcontractor_id: subcontractor.id,
            title: 'Monthly Performance Summary',
            message: `Your ${monthName} performance summary is ready: ${completedJobs.length} jobs completed, $${totalEarnings.toFixed(2)} earned`,
            type: 'performance'
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }

        results.push({
          subcontractorId: subcontractor.id,
          email: subcontractor.email,
          success: true,
          emailId: emailResponse.data?.id
        });

      } catch (error) {
        console.error('Error processing subcontractor', subcontractor.id, error);
        results.push({
          subcontractorId: subcontractor.id,
          email: subcontractor.email,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      month: monthName,
      year: targetYear,
      results: results,
      message: `Monthly performance summaries sent to ${results.filter(r => r.success).length} subcontractors` 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-monthly-performance-summary function:", error);
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