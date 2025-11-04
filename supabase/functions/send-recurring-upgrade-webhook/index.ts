import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpgradeWebhookInput {
  booking_context_data: any;
  upgrade_details: {
    previous_frequency: string;
    new_frequency: string;
    recurring_start_date: string;
    additional_discount: number;
    new_price_per_clean: number;
    annual_savings?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const input: UpgradeWebhookInput = await req.json();
    console.log('🔄 Recurring upgrade webhook triggered:', {
      previous_frequency: input.upgrade_details.previous_frequency,
      new_frequency: input.upgrade_details.new_frequency,
      timestamp: new Date().toISOString()
    });

    const bookingData = input.booking_context_data;
    const upgradeDetails = input.upgrade_details;

    // Helper functions
    function normalizeServiceType(serviceType: string): string {
      const normalized = serviceType.toLowerCase();
      if (normalized.includes('deep')) return "Deep Clean";
      if (normalized.includes('move')) return "Move-In/Out";
      return "Standard Clean";
    }

    function normalizeFrequency(frequency: string): string {
      const normalized = frequency.toLowerCase();
      if (normalized.includes('bi')) return "Bi-Weekly";
      if (normalized.includes('week')) return "Weekly";
      if (normalized.includes('month')) return "Monthly";
      return "One-Time";
    }

    function formatPhoneToE164(phone: string): string {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 10) return `+1${cleaned}`;
      if (cleaned.length === 11 && cleaned.startsWith('1')) return `+${cleaned}`;
      return phone.startsWith('+') ? phone : `+1${cleaned}`;
    }

    function formatSquareFootageRange(sqft: number): string {
      if (sqft <= 1000) return "Under 1,000";
      if (sqft <= 1500) return "1,001–1,500";
      if (sqft <= 2000) return "1,501–2,000";
      if (sqft <= 2500) return "2,001–2,500";
      if (sqft <= 3000) return "2,501–3,000";
      if (sqft <= 3500) return "3,001–3,500";
      if (sqft <= 4000) return "3,501–4,000";
      if (sqft <= 4500) return "4,001–4,500";
      return "4,501+";
    }

    function calculatePreviousPrice(pricing: any): number {
      // Recalculate without the upgrade discount
      const basePrice = pricing?.basePrice || 0;
      const discountAmount = pricing?.discountAmount || 0;
      return Math.round(basePrice - discountAmount + (basePrice * upgradeDetails.additional_discount));
    }

    // Build standardized webhook payload
    const webhookPayload = {
      type: "recurring-upgrade",
      data: {
        session_id: `temp-${Date.now()}`,
        booking_context: {
          zip_code: bookingData.zipCode,
          service_type: normalizeServiceType(bookingData.serviceType),
          sq_ft_range: formatSquareFootageRange(bookingData.sqft || 2000),
          scheduled_date: bookingData.date,
          time_slot: bookingData.timeSlot
        },
        customer: {
          first_name: bookingData.contactInfo?.firstName || '',
          last_name: bookingData.contactInfo?.lastName || '',
          email: bookingData.contactInfo?.email || '',
          phone: formatPhoneToE164(bookingData.contactInfo?.phone || '')
        },
        address: {
          street: bookingData.contactInfo?.address1 || '',
          city: bookingData.city || '',
          state: bookingData.state || '',
          zip: bookingData.zipCode || ''
        },
        upgrade_details: {
          previous_frequency: normalizeFrequency(upgradeDetails.previous_frequency),
          new_frequency: normalizeFrequency(upgradeDetails.new_frequency),
          recurring_start_date: upgradeDetails.recurring_start_date,
          converted_at: new Date().toISOString()
        },
        pricing: {
          previous_price: calculatePreviousPrice(bookingData.pricing),
          new_price_per_clean: upgradeDetails.new_price_per_clean,
          discount_rate: (upgradeDetails.additional_discount * 100),
          annual_savings: upgradeDetails.annual_savings || 0,
          total_discount_applied: bookingData.recurringUpgradeDiscount || upgradeDetails.additional_discount
        },
        conversion_metrics: {
          upsell_success: true,
          conversion_page: "summary",
          conversion_timestamp: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString(),
      source: "summary_page_upsell"
    };

    console.log('📦 Upgrade webhook payload generated:', {
      type: webhookPayload.type,
      customer_email: webhookPayload.data.customer.email,
      new_frequency: webhookPayload.data.upgrade_details.new_frequency,
      savings: webhookPayload.data.pricing.annual_savings
    });

    // Get active webhook configurations
    const { data: webhookConfigs, error: configError } = await supabase
      .from('webhook_configurations')
      .select('*')
      .eq('active', true);

    if (configError) {
      console.error('Error fetching webhook configs:', configError);
      throw new Error('Failed to fetch webhook configurations');
    }

    if (!webhookConfigs || webhookConfigs.length === 0) {
      console.log('⚠️ No active webhook configurations found');
      return new Response(JSON.stringify({
        success: true,
        message: 'No active webhook configurations - upgrade tracked but not sent',
        formatted_data: webhookPayload
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const results = [];
    const payloadString = JSON.stringify(webhookPayload);
    console.log(`📡 Sending upgrade webhook to ${webhookConfigs.length} endpoint(s)`);

    // Send webhook to each configured endpoint
    for (const config of webhookConfigs) {
      const webhookStartTime = Date.now();
      console.log(`🚀 Sending to: ${config.name} (${config.url})`);
      
      let isSuccess = false;
      let responseText = '';
      
      try {
        const webhookResponse = await fetch(config.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'AlphaLux-RecurringUpgrade/1.0',
            'X-Webhook-Type': 'recurring-upgrade',
            ...config.headers
          },
          body: payloadString
        });
        
        responseText = await webhookResponse.text();
        isSuccess = webhookResponse.ok;
        
        const responseTime = Date.now() - webhookStartTime;
        console.log(`${isSuccess ? '✅' : '❌'} ${config.name}: ${webhookResponse.status} (${responseTime}ms)`);
        
        // Log delivery
        await supabase
          .from('webhook_delivery_logs')
          .insert({
            webhook_config_id: config.id,
            booking_id: null, // No booking ID yet
            payload: webhookPayload,
            response_status: webhookResponse.status,
            response_body: responseText,
            response_headers: Object.fromEntries(webhookResponse.headers.entries()),
            delivered_at: isSuccess ? new Date().toISOString() : null,
            error_message: isSuccess ? null : `HTTP ${webhookResponse.status}: ${responseText}`,
            attempts: 1
          });
        
        results.push({
          webhook: config.name,
          url: config.url,
          success: isSuccess,
          status_code: webhookResponse.status,
          response_time: responseTime
        });
        
      } catch (error) {
        const responseTime = Date.now() - webhookStartTime;
        console.error(`❌ ${config.name} failed:`, error.message);
        
        await supabase
          .from('webhook_delivery_logs')
          .insert({
            webhook_config_id: config.id,
            booking_id: null,
            payload: webhookPayload,
            error_message: error.message,
            attempts: 1
          });
        
        results.push({
          webhook: config.name,
          url: config.url,
          success: false,
          error: error.message,
          response_time: responseTime
        });
      }
    }
    
    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    
    console.log(`🏁 Upgrade webhook delivery completed: ${successCount}/${results.length} successful (${totalTime}ms)`);
    
    return new Response(JSON.stringify({
      success: true,
      message: `Recurring upgrade webhook sent: ${successCount}/${results.length} successful`,
      results,
      formatted_data: webhookPayload,
      performance: {
        total_time: totalTime
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('💥 Recurring upgrade webhook error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      function: 'send-recurring-upgrade-webhook'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
