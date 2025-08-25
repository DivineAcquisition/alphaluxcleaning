import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, data?: any) => {
  console.log(`[get-customer-data-by-email] ${step}`, data ? JSON.stringify(data) : '');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting customer data retrieval by email');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { email } = await req.json();
    
    if (!email) {
      logStep('Missing email parameter');
      return new Response(
        JSON.stringify({ error: 'Email is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logStep('Validating email and fetching customer data', { email });

    // Call the secure database function
    const { data, error } = await supabase.rpc('get_customer_data_by_email_safe', {
      p_email: email
    });

    if (error) {
      logStep('Database error', { error: error.message });
      return new Response(
        JSON.stringify({ error: 'Failed to fetch customer data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if we got an error from the function
    if (data && data.error) {
      logStep('Function returned error', { error: data.error });
      return new Response(
        JSON.stringify({ error: data.error }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate stats
    const orders = data.orders || [];
    const bookings = data.bookings || [];
    const notifications = data.notifications || [];

    const completedOrders = orders.filter((order: any) => 
      order.service_status === 'completed' || order.status === 'completed'
    );
    
    const upcomingBookings = bookings.filter((booking: any) => 
      booking.status === 'confirmed' && new Date(booking.service_date) > new Date()
    );

    const totalSpent = orders.reduce((sum: number, order: any) => sum + (order.amount / 100), 0);
    const memberSince = data.profile?.created_at || orders[0]?.created_at || bookings[0]?.created_at || '';

    const stats = {
      totalOrders: orders.length + bookings.length,
      completedServices: completedOrders.length,
      upcomingServices: upcomingBookings.length,
      totalSpent,
      averageRating: 4.8,
      memberSince
    };

    const responseData = {
      ...data,
      stats,
      hasData: orders.length > 0 || bookings.length > 0 || notifications.length > 0 || data.profile
    };

    logStep('Successfully retrieved customer data', { 
      email, 
      ordersCount: orders.length, 
      bookingsCount: bookings.length,
      notificationsCount: notifications.length,
      hasProfile: !!data.profile
    });

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    logStep('Unexpected error', { error: error.message });
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});