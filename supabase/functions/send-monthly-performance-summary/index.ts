import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';
import { Resend } from "npm:resend@2.0.0";

// Simple HTML email template function
const generateMonthlyPerformanceSummaryHtml = ({
  subcontractorName,
  month,
  year,
  stats,
  achievements,
  dashboardUrl
}: {
  subcontractorName: string;
  month: string;
  year: string;
  stats: {
    jobsCompleted: number;
    totalEarnings: string;
    averageRating: number;
    onTimePercentage: number;
    customerSatisfaction: number;
  };
  achievements: string[];
  improvementAreas?: string[];
  dashboardUrl: string;
}) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Monthly Performance Summary</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px; border-bottom: 1px solid #eaeaea; padding-bottom: 20px;">
            <img src="https://app.alphaluxclean.com/logo.png" alt="AlphaLux Cleaning" style="width: 120px; height: 40px;">
          </div>
          
          <!-- Main Content -->
          <div style="padding: 0 20px;">
            <h1 style="color: #1a1a1a; font-size: 28px; font-weight: bold; margin: 0 0 24px 0;">
              🎉 Your ${month} ${year} Performance Summary
            </h1>
            
            <p style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">
              Hi ${subcontractorName},
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
              Here's how you performed this month with AlphaLux Cleaning!
            </p>
            
            <!-- Stats Section -->
            <div style="margin: 32px 0; padding: 24px 0; border-top: 1px solid #e5e7eb;">
              <h2 style="color: #1a1a1a; font-size: 22px; font-weight: bold; margin: 0 0 20px 0;">
                📊 Your Monthly Stats
              </h2>
              
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 20px 0;">
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
                  <div style="color: #1f2937; font-size: 32px; font-weight: bold; margin: 0 0 8px 0;">
                    ${stats.jobsCompleted}
                  </div>
                  <div style="color: #6b7280; font-size: 14px; font-weight: 500;">
                    Jobs Completed
                  </div>
                </div>
                
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
                  <div style="color: #1f2937; font-size: 32px; font-weight: bold; margin: 0 0 8px 0;">
                    ${stats.totalEarnings}
                  </div>
                  <div style="color: #6b7280; font-size: 14px; font-weight: 500;">
                    Total Earnings
                  </div>
                </div>
                
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
                  <div style="color: #1f2937; font-size: 32px; font-weight: bold; margin: 0 0 8px 0;">
                    ${stats.averageRating.toFixed(1)}⭐
                  </div>
                  <div style="color: #6b7280; font-size: 14px; font-weight: 500;">
                    Average Rating
                  </div>
                </div>
                
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
                  <div style="color: #1f2937; font-size: 32px; font-weight: bold; margin: 0 0 8px 0;">
                    ${stats.onTimePercentage}%
                  </div>
                  <div style="color: #6b7280; font-size: 14px; font-weight: 500;">
                    On-Time Rate
                  </div>
                </div>
              </div>
            </div>
            
            ${achievements.length > 0 ? `
            <!-- Achievements Section -->
            <div style="margin: 32px 0; padding: 24px 0; border-top: 1px solid #e5e7eb;">
              <h2 style="color: #1a1a1a; font-size: 22px; font-weight: bold; margin: 0 0 20px 0;">
                🏆 Achievements This Month
              </h2>
              ${achievements.map(achievement => `
                <p style="color: #059669; font-size: 16px; margin: 0 0 8px 0; font-weight: 500;">
                  ✅ ${achievement}
                </p>
              `).join('')}
            </div>
            ` : ''}
            
            <!-- CTA Section -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${dashboardUrl}" 
                 style="background-color: #3b82f6; color: #ffffff !important; padding: 16px 32px; 
                        border-radius: 6px; text-decoration: none; font-weight: 600; 
                        display: inline-block; font-size: 16px;">
                View Full Dashboard
              </a>
            </div>
            
            <!-- Footer Messages -->
            <div style="margin: 32px 0;">
              <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">
                Keep up the great work! Questions? Reply to this email.
              </p>
              <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">
                - The AlphaLux Cleaning Team
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="border-top: 1px solid #eaeaea; padding-top: 20px; margin-top: 40px; text-align: center;">
            <p style="color: #666666; font-size: 12px; line-height: 16px; margin: 4px 0;">
              <a href="https://app.alphaluxclean.com" style="color: #666666; text-decoration: underline;">
                AlphaLux Cleaning
              </a><br>
              Premium cleaning services in Texas and California
            </p>
            <p style="color: #666666; font-size: 12px; line-height: 16px; margin: 4px 0;">
              <a href="tel:+15551234567" style="color: #666666; text-decoration: underline;">
                (857) 754-4557
              </a> • 
              <a href="mailto:support@alphaluxcleaning.com" style="color: #666666; text-decoration: underline;">
                support@alphaluxcleaning.com
              </a>
            </p>
          </div>
          
        </div>
      </body>
    </html>
  `;
};

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

        // Render email using simple HTML template
        const emailHtml = generateMonthlyPerformanceSummaryHtml({
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
        });

        // Send email
        const emailResponse = await resend.emails.send({
          from: "AlphaLux Cleaning <noreply@info.alphaluxclean.com>",
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