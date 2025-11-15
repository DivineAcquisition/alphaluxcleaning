import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { customer_id } = await req.json();

    if (!customer_id) {
      return new Response(
        JSON.stringify({ error: 'customer_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all recurring services for the customer
    const { data: services, error: servicesError } = await supabase
      .from('recurring_services')
      .select('*')
      .eq('customer_id', customer_id)
      .order('created_at', { ascending: false });

    if (servicesError) throw servicesError;

    // Fetch upcoming bookings for active services
    const activeServiceIds = services
      ?.filter(s => s.status === 'active')
      .map(s => s.id) || [];

    let upcomingBookings = [];
    if (activeServiceIds.length > 0) {
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, service_date, special_instructions, parent_recurring_service_id')
        .in('parent_recurring_service_id', activeServiceIds)
        .gte('service_date', new Date().toISOString())
        .order('service_date', { ascending: true })
        .limit(10);

      if (bookingsError) throw bookingsError;
      upcomingBookings = bookings || [];
    }

    // Helper function to calculate expected visits based on frequency
    const getExpectedVisits = (frequency: string, commitmentMonths: number) => {
      const monthlyFrequency: { [key: string]: number } = {
        'weekly': 4,
        'bi-weekly': 2,
        'monthly': 1
      };
      return (monthlyFrequency[frequency] || 1) * commitmentMonths;
    };

    // Helper function to calculate commitment progress
    const calculateCommitmentProgress = (service: any) => {
      if (!service.commitment_months || service.commitment_months === 0) {
        return { status: 'none' };
      }

      const startDate = new Date(service.created_at);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + service.commitment_months);
      
      const now = new Date();
      const daysTotal = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const expectedVisits = getExpectedVisits(service.frequency, service.commitment_months);
      const visitsCompleted = service.total_services_completed || 0;
      
      const isFulfilled = now >= endDate || visitsCompleted >= expectedVisits;

      return {
        expected_visits: expectedVisits,
        visits_completed: visitsCompleted,
        days_elapsed: Math.max(0, daysElapsed),
        days_total: daysTotal,
        status: isFulfilled ? 'fulfilled' : 'active',
        commitment_end_date: endDate.toISOString()
      };
    };

    // Group bookings by service and add commitment progress
    const servicesWithBookings = services?.map(service => ({
      ...service,
      upcoming_bookings: upcomingBookings.filter(
        b => b.parent_recurring_service_id === service.id
      ).slice(0, 3),
      commitment_progress: calculateCommitmentProgress(service)
    }));

    return new Response(
      JSON.stringify({ services: servicesWithBookings }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching recurring services:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});