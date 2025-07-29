import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalendarEvent {
  calendar_id: string;
  start_time: string;
  end_time: string;
  event_title?: string;
  event_id?: string;
}

serve(async (req) => {
  console.log('Webhook received, method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Processing webhook request...');
    const body = await req.json();
    console.log('Webhook payload:', JSON.stringify(body, null, 2));
    
    // Handle both direct format and Google Calendar format
    let calendar_id, start_time, end_time, event_title, event_id;
    
    if (body.calendar_id) {
      // Direct format (expected)
      ({ calendar_id, start_time, end_time, event_title, event_id } = body);
    } else if (body.start && body.end) {
      // Google Calendar format fallback
      calendar_id = body.organizer?.email || body.creator?.email;
      start_time = body.start.dateTime;
      end_time = body.end.dateTime;
      event_title = body.summary;
      event_id = body.id;
    } else {
      // Check if payload is wrapped in a string (Zapier issue)
      const keys = Object.keys(body);
      console.log('Available keys in body:', keys);
      
      if (keys.length === 1) {
        const key = keys[0];
        console.log('Single key found:', JSON.stringify(key));
        
        // Check for various Zapier wrapping patterns
        if (key.includes('Content-Type') || key.includes('\n') || key.includes('json') || key.trim() === '') {
          try {
            console.log('Attempting to parse wrapped payload from key:', JSON.stringify(key));
            const innerData = JSON.parse(body[key]);
            console.log('Successfully parsed inner data:', innerData);
            ({ calendar_id, start_time, end_time, event_title, event_id } = innerData);
          } catch (parseError) {
            console.error('Failed to parse inner payload from key', JSON.stringify(key), ':', parseError);
            console.error('Raw value:', body[key]);
          }
        }
      }
    }
    
    if (!calendar_id || !start_time || !end_time) {
      throw new Error('Missing required fields: calendar_id, start_time, end_time');
    }

    // Convert to proper timestamp format
    const startTimestamp = new Date(start_time).toISOString();
    const endTimestamp = new Date(end_time).toISOString();
    
    console.log('Calling upsert_busy_slot function...');
    const { data, error } = await supabase.rpc('upsert_busy_slot', {
      p_calendar_id: calendar_id,
      p_start_time: startTimestamp,
      p_end_time: endTimestamp,
      p_event_title: event_title || null,
      p_event_id: event_id || null,
      p_calendar_type: 'business'
    });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Busy slot upserted successfully:', data);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Calendar event synced successfully',
      data: data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Webhook error:', error.message);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Failed to sync calendar event'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});