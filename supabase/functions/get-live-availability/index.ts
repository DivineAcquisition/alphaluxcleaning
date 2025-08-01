import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

// CORS headers for web application requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Calendar FreeBusy API endpoint
const GOOGLE_FREEBUSY_URL = 'https://www.googleapis.com/calendar/v3/freeBusy';

export default async function handler(req: Request) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { date, slot_duration = 30, working_hours_start = "08:00", working_hours_end = "18:00", check_connection_only = false } = await req.json();

    console.log('Processing availability request:', { date, slot_duration, working_hours_start, working_hours_end, check_connection_only });

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ status: 'error', error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has calendar tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_calendar_tokens')
      .select('access_token, refresh_token, token_expires_at, calendar_id')
      .eq('provider', 'google')
      .eq('is_active', true)
      .maybeSingle();

    // If only checking connection, return early
    if (check_connection_only) {
      return new Response(
        JSON.stringify({
          status: 'success',
          has_connection: !!tokenData && !tokenError
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (tokenError || !tokenData) {
      console.log('No calendar token found or error:', tokenError);
      
      // Return mock data for demonstration
      const mockSlots = generateMockSlots(working_hours_start, working_hours_end, slot_duration);
      
      return new Response(
        JSON.stringify({
          status: 'success',
          available_slots: mockSlots,
          working_hours: { start: working_hours_start, end: working_hours_end },
          date: date,
          note: 'Using mock data - calendar not connected'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token needs refresh
    const now = new Date();
    const expiresAt = new Date(tokenData.token_expires_at);
    
    let accessToken = tokenData.access_token;
    
    if (now >= expiresAt && tokenData.refresh_token) {
      console.log('Token expired, attempting refresh...');
      
      // Refresh the token
      const tokenRefreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
          refresh_token: tokenData.refresh_token,
          grant_type: 'refresh_token'
        })
      });

      if (tokenRefreshResponse.ok) {
        const refreshData = await tokenRefreshResponse.json();
        accessToken = refreshData.access_token;
        
        // Update token in database
        await supabase
          .from('user_calendar_tokens')
          .update({
            access_token: accessToken,
            token_expires_at: new Date(now.getTime() + refreshData.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', tokenData.id);
      } else {
        console.error('Failed to refresh token');
        
        // Return mock data as fallback
        const mockSlots = generateMockSlots(working_hours_start, working_hours_end, slot_duration);
        
        return new Response(
          JSON.stringify({
            status: 'success',
            available_slots: mockSlots,
            working_hours: { start: working_hours_start, end: working_hours_end },
            date: date,
            note: 'Using mock data - token refresh failed'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create time range for the day
    const startTime = `${date}T${working_hours_start}:00.000Z`;
    const endTime = `${date}T${working_hours_end}:00.000Z`;

    // Call Google Calendar FreeBusy API
    const freeBusyResponse = await fetch(GOOGLE_FREEBUSY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timeMin: startTime,
        timeMax: endTime,
        items: [
          { id: tokenData.calendar_id || 'primary' }
        ]
      })
    });

    if (!freeBusyResponse.ok) {
      console.error('FreeBusy API error:', await freeBusyResponse.text());
      
      // Return mock data as fallback
      const mockSlots = generateMockSlots(working_hours_start, working_hours_end, slot_duration);
      
      return new Response(
        JSON.stringify({
          status: 'success',
          available_slots: mockSlots,
          working_hours: { start: working_hours_start, end: working_hours_end },
          date: date,
          note: 'Using mock data - FreeBusy API failed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const freeBusyData = await freeBusyResponse.json();
    console.log('FreeBusy response:', freeBusyData);

    // Extract busy periods
    const calendarId = tokenData.calendar_id || 'primary';
    const busyPeriods = freeBusyData.calendars?.[calendarId]?.busy || [];

    // Generate available slots
    const availableSlots = generateAvailableSlots(
      working_hours_start,
      working_hours_end,
      slot_duration,
      busyPeriods,
      date
    );

    return new Response(
      JSON.stringify({
        status: 'success',
        available_slots: availableSlots,
        working_hours: { start: working_hours_start, end: working_hours_end },
        date: date,
        busy_periods: busyPeriods
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-live-availability:', error);
    
    // Return mock data as fallback
    const mockSlots = generateMockSlots("08:00", "18:00", 30);
    
    return new Response(
      JSON.stringify({
        status: 'success',
        available_slots: mockSlots,
        working_hours: { start: "08:00", end: "18:00" },
        date: new Date().toISOString().split('T')[0],
        note: 'Using mock data - error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

function generateMockSlots(startTime: string, endTime: string, duration: number) {
  const slots = [];
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  
  for (let time = start; time < end; time += duration) {
    const startHour = Math.floor(time / 60);
    const startMin = time % 60;
    const endTimeSlot = time + duration;
    const endHour = Math.floor(endTimeSlot / 60);
    const endMin = endTimeSlot % 60;
    
    slots.push({
      start: `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`,
      end: `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`,
      available: Math.random() > 0.3 // 70% chance of being available
    });
  }
  
  return slots;
}

function generateAvailableSlots(startTime: string, endTime: string, duration: number, busyPeriods: any[], date: string) {
  const slots = [];
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  
  for (let time = start; time < end; time += duration) {
    const startHour = Math.floor(time / 60);
    const startMin = time % 60;
    const endTimeSlot = time + duration;
    const endHour = Math.floor(endTimeSlot / 60);
    const endMin = endTimeSlot % 60;
    
    const slotStart = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
    const slotEnd = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    
    // Check if this slot conflicts with any busy periods
    const slotStartTime = new Date(`${date}T${slotStart}:00.000Z`);
    const slotEndTime = new Date(`${date}T${slotEnd}:00.000Z`);
    
    const isAvailable = !busyPeriods.some(busy => {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);
      
      // Check for overlap
      return slotStartTime < busyEnd && slotEndTime > busyStart;
    });
    
    slots.push({
      start: slotStart,
      end: slotEnd,
      available: isAvailable
    });
  }
  
  return slots;
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}