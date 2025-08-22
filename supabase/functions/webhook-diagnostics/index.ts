import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiagnosticsRequest {
  action: 'test_webhook' | 'get_logs' | 'replay_webhook' | 'webhook_health';
  webhook_url?: string;
  order_id?: string;
  limit?: number;
  since?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, webhook_url, order_id, limit = 50, since }: DiagnosticsRequest = await req.json();
    console.log('🔧 Webhook diagnostics action:', action);

    switch (action) {
      case 'test_webhook': {
        if (!webhook_url) {
          throw new Error('webhook_url is required for test_webhook action');
        }

        console.log(`🧪 Testing webhook endpoint: ${webhook_url}`);
        
        // Create test payload in OrderEntry format
        const testPayload = {
          order_details: {
            id: "test_order_diagnostics",
            customer_name: "Test Customer",
            customer_email: "test@example.com",
            customer_phone: "(555) 123-4567",
            street_address: "123 Test Street",
            city: "Test City",
            state: "CA",
            zip_code: "90210",
            country: "USA",
            service_type: "General Clean",
            amount: 195.97,
            square_footage: 1800,
            scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            scheduled_time: "10:00 AM",
            frequency: "one_time",
            add_ons: [{ name: "Window Cleaning", price: 25 }]
          },
          subcontractor_payment: {
            assigned_subcontractor: {
              id: "test_sub_001",
              name: "Test Cleaner",
              tier_level: 2,
              tier_name: "Professional"
            },
            hourly_rate_structure: {
              base_hourly_rate: 18,
              tier_level: 2,
              tier_name: "Professional"
            },
            job_duration: {
              estimated_duration: "2 hours",
              actual_duration: "2.0 hours",
              check_in_time: "10:00 AM",
              check_out_time: "12:00 PM",
              duration_minutes: 120
            },
            payment_calculation: {
              base_hourly_pay: 36,
              efficiency_bonus: 5.4,
              total_subcontractor_pay: 41.4,
              payment_method: "hourly"
            }
          },
          financial_breakdown: {
            base_service_cost: 187,
            add_ons: [{ name: "Window Cleaning", price: 25 }],
            add_ons_total: 25,
            subtotal_before_discount: 212,
            discount_applied: true,
            discount_type: "one_time_service",
            discount_description: "One-time service - 15% off",
            discount_percentage: 15,
            discount_amount_cash: 31.8,
            discounted_subtotal: 180.2,
            tax_rate: 8.75,
            tax_amount: 15.77,
            final_cost: 195.97,
            total_savings: 31.8
          },
          payment_data: {
            payment_method: "card",
            transaction_id: "test_transaction_diagnostics",
            payment_status: "succeeded",
            amount_paid: 195.97
          },
          analytics: {
            booking_source: "diagnostics_test",
            marketing_channel: "api_testing",
            device_type: "server",
            booking_completion_time: "00:00:30"
          }
        };

        const startTime = Date.now();
        let testResult;
        
        try {
          const response = await fetch(webhook_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'BayAreaCleaningPros-Diagnostics/1.0',
              'X-Webhook-Version': 'diagnostics-test',
              'X-Test-Mode': 'true'
            },
            body: JSON.stringify(testPayload)
          });

          const responseText = await response.text();
          const responseTime = Date.now() - startTime;

          testResult = {
            success: response.ok,
            status: response.status,
            status_text: response.statusText,
            response_time_ms: responseTime,
            response_body: responseText.substring(0, 1000),
            response_headers: Object.fromEntries(response.headers.entries()),
            payload_size_kb: Math.round(JSON.stringify(testPayload).length / 1024 * 100) / 100
          };

          console.log(`${response.ok ? '✅' : '❌'} Webhook test ${response.ok ? 'passed' : 'failed'}:`, testResult);

        } catch (error) {
          const responseTime = Date.now() - startTime;
          testResult = {
            success: false,
            error: error.message,
            response_time_ms: responseTime,
            payload_size_kb: Math.round(JSON.stringify(testPayload).length / 1024 * 100) / 100
          };
          console.error('🚨 Webhook test failed:', testResult);
        }

        return new Response(JSON.stringify({
          success: true,
          action: 'test_webhook',
          webhook_url,
          test_result: testResult,
          test_payload: testPayload
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }

      case 'get_logs': {
        console.log(`📋 Fetching webhook delivery logs (limit: ${limit})`);
        
        let query = supabase
          .from('webhook_delivery_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (since) {
          query = query.gte('created_at', since);
        }

        if (webhook_url) {
          query = query.eq('webhook_url', webhook_url);
        }

        const { data: logs, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch logs: ${error.message}`);
        }

        // Calculate statistics
        const stats = {
          total_logs: logs?.length || 0,
          successful_deliveries: logs?.filter(log => log.is_success).length || 0,
          failed_deliveries: logs?.filter(log => !log.is_success).length || 0,
          unique_endpoints: [...new Set(logs?.map(log => log.webhook_url) || [])].length,
          date_range: {
            earliest: logs?.[0]?.created_at,
            latest: logs?.[logs.length - 1]?.created_at
          }
        };

        return new Response(JSON.stringify({
          success: true,
          action: 'get_logs',
          logs: logs || [],
          statistics: stats
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }

      case 'replay_webhook': {
        if (!order_id) {
          throw new Error('order_id is required for replay_webhook action');
        }

        console.log(`🔄 Replaying webhook for order: ${order_id}`);

        // Call the enhanced webhook function
        const { data: replayResult, error } = await supabase.functions.invoke('enhanced-booking-webhook-v2', {
          body: {
            order_id: order_id,
            trigger_event: 'manual_replay',
            source: 'diagnostics'
          }
        });

        if (error) {
          throw new Error(`Webhook replay failed: ${error.message}`);
        }

        return new Response(JSON.stringify({
          success: true,
          action: 'replay_webhook',
          order_id,
          replay_result: replayResult
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }

      case 'webhook_health': {
        console.log('🏥 Checking webhook system health');

        // Get recent webhook configurations
        const { data: configs, error: configError } = await supabase
          .from('webhook_configurations')
          .select('*')
          .eq('is_active', true);

        if (configError) {
          throw new Error(`Failed to fetch webhook configs: ${configError.message}`);
        }

        // Get recent delivery statistics
        const { data: recentLogs, error: logsError } = await supabase
          .from('webhook_delivery_logs')
          .select('*')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false });

        if (logsError) {
          throw new Error(`Failed to fetch recent logs: ${logsError.message}`);
        }

        const healthStats = {
          active_endpoints: configs?.length || 0,
          last_24h_deliveries: recentLogs?.length || 0,
          last_24h_success_rate: recentLogs?.length ? 
            Math.round((recentLogs.filter(log => log.is_success).length / recentLogs.length) * 100) : 0,
          endpoint_health: configs?.map(config => {
            const endpointLogs = recentLogs?.filter(log => log.webhook_url === config.webhook_url) || [];
            return {
              webhook_url: config.webhook_url,
              deliveries_24h: endpointLogs.length,
              success_rate: endpointLogs.length ? 
                Math.round((endpointLogs.filter(log => log.is_success).length / endpointLogs.length) * 100) : 0,
              last_delivery: endpointLogs[0]?.created_at || null,
              status: endpointLogs.length === 0 ? 'idle' : 
                      endpointLogs.filter(log => log.is_success).length === endpointLogs.length ? 'healthy' :
                      endpointLogs.filter(log => log.is_success).length > 0 ? 'partial' : 'failing'
            };
          }) || []
        };

        return new Response(JSON.stringify({
          success: true,
          action: 'webhook_health',
          health_check: healthStats,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Error in webhook diagnostics:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      details: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});