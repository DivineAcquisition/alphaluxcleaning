import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TipRequest {
  order_id: string;
  amount: number;
  customer_message?: string;
  tip_type?: 'one_time' | 'recurring' | 'team_pooled';
  distribution_method?: 'individual' | 'team_split' | 'performance_based';
  schedule_for_service?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const tipRequest: TipRequest = await req.json();
    console.log("Processing enhanced tip request:", tipRequest);

    // Get order and booking details
    const { data: order } = await supabase
      .from('orders')
      .select('*, bookings(*)')
      .eq('id', tipRequest.order_id)
      .single();

    if (!order) {
      throw new Error("Order not found");
    }

    // Get assigned subcontractor(s)
    const { data: assignments } = await supabase
      .from('subcontractor_job_assignments')
      .select('subcontractor_id, subcontractors(*)')
      .in('booking_id', order.bookings.map((b: any) => b.id));

    // Process tip based on type and distribution method
    let tipRecords = [];

    if (tipRequest.tip_type === 'team_pooled' && assignments && assignments.length > 1) {
      // Split tip among team members
      const tipPerPerson = tipRequest.amount / assignments.length;
      
      for (const assignment of assignments) {
        tipRecords.push({
          order_id: tipRequest.order_id,
          subcontractor_id: assignment.subcontractor_id,
          amount: tipPerPerson,
          customer_message: tipRequest.customer_message,
          tip_type: 'team_pooled',
          distribution_method: tipRequest.distribution_method
        });
      }
    } else if (tipRequest.tip_type === 'performance_based' && assignments) {
      // Distribute based on performance ratings
      const { data: performanceData } = await supabase
        .from('performance_metrics')
        .select('subcontractor_id, customer_rating')
        .in('subcontractor_id', assignments.map((a: any) => a.subcontractor_id))
        .order('month_year', { ascending: false })
        .limit(assignments.length);

      const totalRating = performanceData?.reduce((sum, p) => sum + p.customer_rating, 0) || 1;
      
      for (const perf of performanceData || []) {
        const tipAmount = (perf.customer_rating / totalRating) * tipRequest.amount;
        tipRecords.push({
          order_id: tipRequest.order_id,
          subcontractor_id: perf.subcontractor_id,
          amount: tipAmount,
          customer_message: tipRequest.customer_message,
          tip_type: 'performance_based',
          distribution_method: tipRequest.distribution_method
        });
      }
    } else {
      // Standard individual tip
      const subcontractorId = assignments?.[0]?.subcontractor_id;
      if (subcontractorId) {
        tipRecords.push({
          order_id: tipRequest.order_id,
          subcontractor_id: subcontractorId,
          amount: tipRequest.amount,
          customer_message: tipRequest.customer_message,
          tip_type: tipRequest.tip_type || 'one_time',
          distribution_method: 'individual'
        });
      }
    }

    // Insert tip records
    const { error: tipError } = await supabase
      .from('order_tips')
      .insert(tipRecords);

    if (tipError) throw tipError;

    // Send thank you notifications to subcontractors
    for (const tip of tipRecords) {
      await sendTipNotification(supabase, tip, order);
    }

    // Schedule recurring tips if requested
    if (tipRequest.schedule_for_service && order.is_recurring) {
      await scheduleRecurringTips(supabase, tipRequest, order);
    }

    // Update tip analytics
    await updateTipAnalytics(supabase, tipRecords);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Tip processed successfully",
        tips_distributed: tipRecords.length,
        total_amount: tipRequest.amount
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Enhanced tip processing error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

async function sendTipNotification(supabase: any, tip: any, order: any) {
  console.log(`Sending tip notification to subcontractor ${tip.subcontractor_id}`);
  
  // Get subcontractor details
  const { data: subcontractor } = await supabase
    .from('subcontractors')
    .select('email, full_name')
    .eq('id', tip.subcontractor_id)
    .single();

  if (subcontractor) {
    // Create notification record
    await supabase
      .from('subcontractor_notifications')
      .insert({
        subcontractor_id: tip.subcontractor_id,
        title: 'Tip Received!',
        message: `You received a $${tip.amount.toFixed(2)} tip from ${order.customer_name}. ${tip.customer_message || ''}`,
        type: 'tip_received',
        read: false
      });

    // Send email notification (integrate with email service)
    console.log(`Email notification would be sent to ${subcontractor.email}`);
  }
}

async function scheduleRecurringTips(supabase: any, tipRequest: TipRequest, order: any) {
  console.log("Scheduling recurring tips for order:", order.id);
  
  // Create recurring tip schedule
  await supabase
    .from('recurring_tip_schedules')
    .insert({
      order_id: tipRequest.order_id,
      amount: tipRequest.amount,
      customer_message: tipRequest.customer_message,
      tip_type: tipRequest.tip_type,
      distribution_method: tipRequest.distribution_method,
      frequency: order.recurring_frequency,
      next_tip_date: calculateNextTipDate(order.next_service_date),
      is_active: true
    });
}

async function updateTipAnalytics(supabase: any, tipRecords: any[]) {
  console.log("Updating tip analytics");
  
  const totalAmount = tipRecords.reduce((sum, tip) => sum + tip.amount, 0);
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  
  // Update monthly tip analytics
  await supabase
    .from('tip_analytics')
    .upsert({
      month_year: currentMonth,
      total_tips: totalAmount,
      tip_count: tipRecords.length,
      average_tip: totalAmount / tipRecords.length
    });
}

function calculateNextTipDate(nextServiceDate: string): string {
  // Calculate next tip date based on service frequency
  const serviceDate = new Date(nextServiceDate);
  // For simplicity, schedule tip for same day as service
  return serviceDate.toISOString().split('T')[0];
}