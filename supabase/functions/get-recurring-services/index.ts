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
        .select('*')
        .in('parent_recurring_service_id', activeServiceIds)
        .gte('service_date', new Date().toISOString())
        .order('service_date', { ascending: true })
        .limit(10);

      if (bookingsError) throw bookingsError;
      upcomingBookings = bookings || [];
    }

    // Group bookings by service
    const servicesWithBookings = services?.map(service => ({
      ...service,
      upcoming_bookings: upcomingBookings.filter(
        b => b.parent_recurring_service_id === service.id
      ).slice(0, 3)
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