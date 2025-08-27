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

    const { email, order_id, search_type } = await req.json();
    
    if (!email && !order_id) {
      logStep('Missing search parameters');
      return new Response(
        JSON.stringify({ error: 'Email or Order ID is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (search_type === 'order_id' && order_id) {
      logStep('Fetching customer data by Order ID', { order_id });
      
      // First get the order to find the customer email
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('customer_email, id')
        .eq('id', order_id)
        .single();

      if (orderError || !orderData) {
        logStep('Order not found', { error: orderError?.message });
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Now fetch customer data using the email from the order
      const { data, error } = await supabase.rpc('get_customer_data_by_email_safe', {
        p_email: orderData.customer_email
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

      // Filter orders to only include the specific order requested
      if (data && data.orders) {
        data.orders = data.orders.filter((order: any) => order.id === order_id);
      }

      // Calculate stats for the filtered data
      const orders = data.orders || [];
      const completedOrders = orders.filter((order: any) => 
        order.service_status === 'completed' || order.status === 'completed'
      );
      
      const totalSpent = orders.reduce((sum: number, order: any) => sum + (order.amount / 100), 0);
      
      const stats = {
        totalOrders: orders.length,
        completedServices: completedOrders.length,
        upcomingServices: 0,
        totalSpent,
        averageRating: 4.8,
        memberSince: orders[0]?.created_at || ''
      };

      const responseData = {
        ...data,
        stats,
        hasData: orders.length > 0
      };

      logStep('Successfully retrieved customer data by Order ID', { 
        order_id, 
        ordersCount: orders.length
      });

      return new Response(
        JSON.stringify(responseData),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Default email search
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