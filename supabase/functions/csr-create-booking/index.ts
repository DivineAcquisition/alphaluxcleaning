import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingRequest {
  customerData: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    zipCode: string;
  };
  bookingData: {
    sqftRange: string;
    bedrooms: string;
    bathrooms: string;
    offerType: 'tester' | '90_day' | 'standard';
    paymentMode: 'instant' | 'link';
    preferredDate?: string;
    preferredTime?: string;
    specialInstructions?: string;
    visitCount?: number;
    planFrequency?: 'weekly' | 'biweekly' | 'monthly';
  };
  pricing: {
    total: number;
    deposit: number;
    balance: number;
    basePrice: number;
    discountAmount: number;
  };
  discount?: {
    type: 'percentage' | 'fixed' | 'none';
    value: number;
    reason: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔐 CSR booking creation initiated');

    // Get the authorization header and extract JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('❌ No authorization header');
      throw new Error('No authorization header');
    }

    // Extract JWT token from "Bearer <token>"
    const jwt = authHeader.replace('Bearer ', '');
    
    // Create client for user verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify user is authenticated by validating JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      throw new Error('User not authenticated');
    }

    console.log(`✅ User authenticated: ${user.email}`);

    // Create service role client for database operations (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify user is admin
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('role, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (adminError || !adminData) {
      console.error('❌ Admin verification failed:', adminError);
      throw new Error('User is not an admin');
    }

    console.log(`✅ Admin verified: ${adminData.role}`);

    // Parse request body
    const { customerData, bookingData, pricing, discount }: BookingRequest = await req.json();

    console.log('📝 Creating customer and booking...', {
      offerType: bookingData.offerType,
      visitCount: bookingData.visitCount,
      planFrequency: bookingData.planFrequency,
      discount: discount
    });

    // Create customer using service_role (bypasses RLS)
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .insert({
        email: customerData.email,
        first_name: customerData.firstName,
        last_name: customerData.lastName,
        phone: customerData.phone,
        address_line1: customerData.addressLine1,
        address_line2: customerData.addressLine2,
        postal_code: customerData.zipCode,
      })
      .select()
      .single();

    if (customerError) {
      console.error('❌ Customer creation failed:', customerError);
      throw new Error(`Failed to create customer: ${customerError.message}`);
    }

    console.log(`✅ Customer created: ${customer.id}`);

    // Determine offer details
    const visitCount = bookingData.visitCount || 1;
    const offerDetails = 
      bookingData.offerType === 'tester' 
        ? { name: 'Tester Deep Clean', type: 'tester', visits: visitCount, serviceType: 'Deep Cleaning' }
        : bookingData.offerType === '90_day'
        ? { name: '90-Day Reset & Maintain Plan', type: '90_day_plan', visits: 4, serviceType: 'Deep Cleaning' }
        : { name: 'Standard Clean', type: 'standard_clean', visits: visitCount, serviceType: 'Standard Cleaning' };
    
    // Determine frequency for 90-day plan
    const frequency = bookingData.offerType === '90_day' 
      ? (bookingData.planFrequency || 'biweekly')
      : 'one-time';

    // Create booking using service_role (bypasses RLS)
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        customer_id: customer.id,
        email: customerData.email,
        full_name: `${customerData.firstName} ${customerData.lastName}`,
        address_line1: customerData.addressLine1,
        address_line2: customerData.addressLine2,
        zip_code: customerData.zipCode,
        sqft_or_bedrooms: bookingData.sqftRange,
        service_type: offerDetails.serviceType,
        frequency: frequency,
        est_price: pricing.total,
        base_price: pricing.basePrice,
        deposit_amount: pricing.deposit,
        balance_due: pricing.balance,
        offer_name: offerDetails.name,
        offer_type: offerDetails.type,
        visit_count: offerDetails.visits,
        is_recurring: bookingData.offerType === '90_day',
        status: bookingData.paymentMode === 'instant' ? 'pending' : 'payment_pending',
        payment_status: 'pending',
        source: 'csr_phone',
        created_by_user_id: user.id,
        preferred_date: bookingData.preferredDate || null,
        preferred_time_block: bookingData.preferredTime || null,
        special_instructions: bookingData.specialInstructions || null,
        notes: discount ? `Discount Applied: ${discount.type} ${discount.value}${discount.type === 'percentage' ? '%' : '$'} - ${discount.reason}` : null,
        property_details: {
          bedrooms: bookingData.bedrooms,
          bathrooms: bookingData.bathrooms,
          sqft_range: bookingData.sqftRange,
          visit_count: visitCount,
          plan_frequency: bookingData.planFrequency || null,
          discount_applied: discount || null,
        },
      })
      .select()
      .single();

    if (bookingError) {
      console.error('❌ Booking creation failed:', bookingError);
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    console.log(`✅ Booking created: ${booking.id}`);

    // Return booking data
    return new Response(
      JSON.stringify({
        success: true,
        booking: booking,
        customer: customer,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ CSR booking creation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to create booking',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
