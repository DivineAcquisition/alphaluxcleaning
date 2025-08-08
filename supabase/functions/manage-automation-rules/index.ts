import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutomationRuleRequest {
  name: string;
  type: 'email' | 'sms' | 'notification';
  trigger_event: string;
  description?: string;
  trigger_conditions?: any;
  action_config?: any;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const url = new URL(req.url);
    const method = req.method;
    
    if (method === 'GET') {
      // Get all automation rules with success rates
      const { data: rules, error } = await supabase
        .from('automation_rules')
        .select(`
          *,
          automation_executions(
            status,
            executed_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate success rates and format data
      const rulesWithStats = rules.map(rule => {
        const executions = rule.automation_executions || [];
        const totalExecutions = rule.success_count + rule.failure_count;
        const successRate = totalExecutions > 0 
          ? (rule.success_count / totalExecutions) * 100 
          : 0;

        return {
          id: rule.id,
          name: rule.name,
          type: rule.type,
          trigger: rule.trigger_event,
          description: rule.description,
          enabled: rule.enabled,
          last_run: rule.last_run_at,
          success_rate: parseFloat(successRate.toFixed(1)),
          success_count: rule.success_count,
          failure_count: rule.failure_count,
          created_at: rule.created_at
        };
      });

      return new Response(JSON.stringify({ rules: rulesWithStats }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (method === 'POST') {
      // Create new automation rule
      const body: AutomationRuleRequest = await req.json();
      
      const { data, error } = await supabase
        .from('automation_rules')
        .insert({
          name: body.name,
          type: body.type,
          trigger_event: body.trigger_event,
          description: body.description,
          trigger_conditions: body.trigger_conditions || {},
          action_config: body.action_config || {},
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ rule: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (method === 'PUT') {
      // Update automation rule
      const ruleId = url.pathname.split('/').pop();
      const body = await req.json();

      const { data, error } = await supabase
        .from('automation_rules')
        .update(body)
        .eq('id', ruleId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ rule: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (method === 'DELETE') {
      // Delete automation rule
      const ruleId = url.pathname.split('/').pop();
      
      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });

  } catch (error: any) {
    console.error('Error in manage-automation-rules:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});