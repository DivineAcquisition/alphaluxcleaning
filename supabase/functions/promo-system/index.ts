import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidateRequest {
  action: 'validate';
  code: string;
  subtotal_cents: number;
  booking_type?: string;
}

interface RedeemRequest {
  action: 'redeem';
  code: string;
  booking_id: string;
  customer_id: string;
  subtotal_cents: number;
  booking_type?: string;
}

interface AdminRequest {
  action: 'create' | 'bulk-create' | 'disable' | 'list';
  codes?: Array<{
    code: string;
    amount_cents: number;
    max_redemptions?: number;
    expires_at?: string;
    metadata?: any;
  }>;
  code_id?: string;
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

    const body = await req.json();
    const { action } = body;

    console.log('🎟️ [promo-system] Action:', action, 'Body:', JSON.stringify(body));

    // Validate promo code
    if (action === 'validate') {
      const { code, subtotal_cents, booking_type = 'ONE_TIME' } = body as ValidateRequest;
      
      const normalizedCode = code.trim().toUpperCase();
      console.log('🔍 [promo-system] Validating code:', normalizedCode);

      const { data: promo, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', normalizedCode)
        .eq('active', true)
        .single();

      if (error || !promo) {
        console.log('❌ [promo-system] Code not found or inactive:', normalizedCode);
        return new Response(
          JSON.stringify({ valid: false, reason: 'Invalid or expired promo code' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if code has started
      if (promo.starts_at && new Date(promo.starts_at) > new Date()) {
        return new Response(
          JSON.stringify({ valid: false, reason: 'This promo code is not yet active' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if code has expired
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ valid: false, reason: 'This promo code has expired' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check redemption limit
      if (promo.redemptions >= promo.max_redemptions) {
        return new Response(
          JSON.stringify({ valid: false, reason: 'This promo code has been fully redeemed' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check booking type eligibility
      if (promo.applies_to !== 'ANY' && promo.applies_to !== booking_type) {
        return new Response(
          JSON.stringify({ valid: false, reason: 'This promo code is not valid for this booking type' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check minimum subtotal
      if (subtotal_cents < promo.min_subtotal_cents) {
        const minAmount = (promo.min_subtotal_cents / 100).toFixed(2);
        return new Response(
          JSON.stringify({ valid: false, reason: `Minimum order of $${minAmount} required` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const discountAmount = (promo.amount_cents / 100).toFixed(2);
      console.log('✅ [promo-system] Code valid:', normalizedCode, 'Discount: $' + discountAmount);

      return new Response(
        JSON.stringify({
          valid: true,
          discount_cents: promo.amount_cents,
          display: `$${discountAmount} off applied`,
          code: normalizedCode
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Redeem promo code (atomic)
    if (action === 'redeem') {
      const { code, booking_id, customer_id, subtotal_cents, booking_type = 'ONE_TIME' } = body as RedeemRequest;
      
      const normalizedCode = code.trim().toUpperCase();
      console.log('💳 [promo-system] Redeeming code:', normalizedCode, 'for booking:', booking_id);

      // Re-validate first
      const { data: promo, error: promoError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', normalizedCode)
        .eq('active', true)
        .single();

      if (promoError || !promo) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid or expired promo code' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // All validation checks
      if (promo.starts_at && new Date(promo.starts_at) > new Date()) {
        return new Response(
          JSON.stringify({ success: false, error: 'This promo code is not yet active' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ success: false, error: 'This promo code has expired' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      if (promo.redemptions >= promo.max_redemptions) {
        return new Response(
          JSON.stringify({ success: false, error: 'This promo code has been fully redeemed' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      if (promo.applies_to !== 'ANY' && promo.applies_to !== booking_type) {
        return new Response(
          JSON.stringify({ success: false, error: 'This promo code is not valid for this booking type' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      if (subtotal_cents < promo.min_subtotal_cents) {
        return new Response(
          JSON.stringify({ success: false, error: 'Minimum order requirement not met' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Atomic redemption: insert redemption record and increment counter
      const { data: redemption, error: redemptionError } = await supabase
        .from('promo_redemptions')
        .insert({
          code: normalizedCode,
          booking_id,
          customer_id,
          discount_cents: promo.amount_cents
        })
        .select()
        .single();

      if (redemptionError) {
        console.error('❌ [promo-system] Redemption insert failed:', redemptionError);
        if (redemptionError.code === '23505') { // Unique constraint violation
          return new Response(
            JSON.stringify({ success: false, error: 'This promo code has already been applied to this booking' }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to redeem promo code' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      // Increment redemption counter atomically
      const { data: updatedPromo, error: updateError } = await supabase
        .from('promo_codes')
        .update({ redemptions: promo.redemptions + 1 })
        .eq('id', promo.id)
        .lt('redemptions', promo.max_redemptions) // Ensure we don't exceed limit
        .select()
        .single();

      if (updateError || !updatedPromo) {
        console.error('❌ [promo-system] Counter increment failed:', updateError);
        // Rollback - delete redemption record
        await supabase.from('promo_redemptions').delete().eq('id', redemption.id);
        return new Response(
          JSON.stringify({ success: false, error: 'Promo code redemption limit reached' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Update booking with promo info
      await supabase
        .from('bookings')
        .update({
          promo_code: normalizedCode,
          promo_discount_cents: promo.amount_cents
        })
        .eq('id', booking_id);

      console.log('✅ [promo-system] Code redeemed successfully:', normalizedCode);

      // Send confirmation email
      try {
        const { data: customer } = await supabase
          .from('customers')
          .select('email, name')
          .eq('id', customer_id)
          .single();

        const { data: booking } = await supabase
          .from('bookings')
          .select('est_price, service_date, time_slot')
          .eq('id', booking_id)
          .single();

        if (customer && booking) {
          const discountAmount = (promo.amount_cents / 100).toFixed(2);
          const originalTotal = (booking.est_price || 0);
          const newTotal = Math.max(0, originalTotal - (promo.amount_cents / 100)).toFixed(2);

          await supabase.functions.invoke('send-system-email', {
            body: {
              companyId: '550e8400-e29b-41d4-a716-446655440000',
              to: customer.email,
              templateKey: 'promo_applied',
              variables: {
                customer_name: customer.name,
                promo_code: normalizedCode,
                discount_amount: discountAmount,
                original_total: originalTotal.toFixed(2),
                new_total: newTotal,
                service_date: booking.service_date || 'TBD',
                service_time: booking.time_slot || 'TBD'
              }
            }
          });
          console.log('📧 [promo-system] Confirmation email sent to:', customer.email);
        }
      } catch (emailError) {
        console.error('❌ [promo-system] Email sending failed:', emailError);
        // Don't fail the redemption if email fails
      }

      return new Response(
        JSON.stringify({
          success: true,
          discount_cents: promo.amount_cents,
          code: normalizedCode
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin actions
    if (action === 'create' || action === 'bulk-create' || action === 'disable' || action === 'list') {
      // Verify admin access
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Admin actions not yet implemented' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 501 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );

  } catch (error) {
    console.error('❌ [promo-system] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
