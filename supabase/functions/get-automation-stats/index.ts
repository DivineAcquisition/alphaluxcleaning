import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Get automation rules stats
    const { data: rules, error: rulesError } = await supabase
      .from('automation_rules')
      .select('*');

    if (rulesError) throw rulesError;

    // Get queued messages from messages table
    const { data: queuedMessages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('status', 'queued');

    if (messagesError) throw messagesError;

    // Get this week's execution count
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: weeklyExecutions, error: executionsError } = await supabase
      .from('automation_executions')
      .select('*')
      .gte('executed_at', oneWeekAgo.toISOString());

    if (executionsError) throw executionsError;

    // Calculate stats
    const activeAutomations = rules.filter(rule => rule.enabled).length;
    const totalSuccessCount = rules.reduce((sum, rule) => sum + (rule.success_count || 0), 0);
    const totalFailureCount = rules.reduce((sum, rule) => sum + (rule.failure_count || 0), 0);
    const totalExecutions = totalSuccessCount + totalFailureCount;
    
    const avgSuccessRate = totalExecutions > 0 
      ? (totalSuccessCount / totalExecutions) * 100 
      : 0;

    const stats = {
      activeAutomations,
      queuedMessages: queuedMessages.length,
      avgSuccessRate: parseFloat(avgSuccessRate.toFixed(1)),
      messagesThisWeek: weeklyExecutions.length,
      totalRules: rules.length,
      totalExecutions,
      successCount: totalSuccessCount,
      failureCount: totalFailureCount
    };

    return new Response(JSON.stringify({ stats }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in get-automation-stats:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});