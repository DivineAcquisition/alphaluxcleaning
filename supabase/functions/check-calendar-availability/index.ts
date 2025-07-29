import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime: string };
  end: { dateTime: string };
}

interface AvailabilitySlot {
  date: string;
  time: string;
  available: boolean;
}

serve(async (req) => {
  console.log('Function started, method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing request...');
    const body = await req.json();
    const { date, timeSlots } = body;
    
    console.log('Request data:', { date, timeSlots: timeSlots?.length });
    
    if (!date || !timeSlots) {
      throw new Error('Missing required fields: date and timeSlots');
    }

    // Use Google Calendar
    console.log('Attempting Google Calendar integration...');
    const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    
    if (!serviceAccountKey) {
      console.log('No Google Service Account key found, returning mock data');
      return createMockResponse(date, timeSlots, 'no_key');
    }

    let credentials;
    try {
      credentials = JSON.parse(serviceAccountKey);
      console.log('Service account parsed, email:', credentials.client_email);
      
      if (!credentials.private_key || !credentials.client_email) {
        throw new Error('Missing required credentials');
      }
    } catch (parseError) {
      console.error('Failed to parse service account:', parseError.message);
      return createMockResponse(date, timeSlots, 'parse_error');
    }
    
    try {
      console.log('Getting access token...');
      const accessToken = await getAccessToken(credentials);
      console.log('Access token obtained');
      
      // Try multiple calendar IDs until one works
      const calendarsToTry = [
        'elitehousekeepers@gmail.com',
        'primary',
        credentials.client_email
      ];
      
      for (const calendarId of calendarsToTry) {
        try {
          console.log(`Trying calendar: ${calendarId}`);
          const availability = await checkAvailability(accessToken, date, timeSlots, calendarId);
          console.log(`Calendar check completed for ${calendarId}, slots:`, availability.length);
          
          return new Response(JSON.stringify({ 
            availability, 
            source: 'google',
            calendar_used: calendarId,
            success: true 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (calendarError) {
          console.log(`Calendar ${calendarId} failed:`, calendarError.message);
          continue; // Try next calendar
        }
      }
      
      // If all calendars failed
      throw new Error('All calendars failed');
      
    } catch (calendarError) {
      console.error('Calendar API error:', calendarError.message);
      return createMockResponse(date, timeSlots, 'calendar_error');
    }
    
  } catch (error) {
    console.error('Function error:', error.message);
    
    // Always return a valid response, never crash
    const mockAvailability = [{
      date: new Date().toISOString().split('T')[0],
      time: '9:00 AM',
      available: true,
    }];
    
    return new Response(JSON.stringify({ 
      availability: mockAvailability, 
      source: 'error_fallback',
      error: error.message,
      success: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function createMockResponse(date: string, timeSlots: string[], reason: string) {
  console.log('Creating mock response, reason:', reason);
  const mockAvailability = timeSlots.map(timeSlot => ({
    date,
    time: timeSlot,
    available: true,
  }));
  
  return new Response(JSON.stringify({ 
    availability: mockAvailability, 
    source: 'mock',
    reason,
    success: true
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getAccessToken(credentials: any): Promise<string> {
  console.log('Creating JWT...');
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: expiry,
    iat: now,
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  
  console.log('Importing private key...');
  const privateKeyData = credentials.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    str2ab(atob(privateKeyData)),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  console.log('Signing JWT...');
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwt = `${signatureInput}.${encodedSignature}`;

  console.log('Exchanging JWT for access token...');
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  
  if (!tokenResponse.ok) {
    console.error('Token exchange failed:', tokenData);
    throw new Error(`Failed to get access token: ${tokenData.error_description || tokenData.error}`);
  }

  console.log('Access token obtained successfully');
  return tokenData.access_token;
}

async function checkAvailability(accessToken: string, date: string, timeSlots: string[], calendarId: string): Promise<AvailabilitySlot[]> {
  const startOfDay = new Date(`${date}T00:00:00`);
  const endOfDay = new Date(`${date}T23:59:59`);
  
  console.log('Fetching calendar events for:', calendarId);
  const calendarResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
    `timeMin=${startOfDay.toISOString()}&` +
    `timeMax=${endOfDay.toISOString()}&` +
    `singleEvents=true&` +
    `orderBy=startTime`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!calendarResponse.ok) {
    const errorText = await calendarResponse.text();
    console.error(`Calendar API error for ${calendarId}:`, calendarResponse.status, errorText);
    throw new Error(`Failed to fetch calendar events: ${calendarResponse.statusText}`);
  }

  const calendarData = await calendarResponse.json();
  const events: CalendarEvent[] = calendarData.items || [];
  
  console.log(`Found ${events.length} events for ${date} in calendar ${calendarId}`);

  // Also check against busy slots from our database
  console.log('Checking busy slots from database...');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  let busySlots: any[] = [];
  if (supabaseUrl && supabaseKey) {
    try {
      const busySlotsResponse = await fetch(
        `${supabaseUrl}/rest/v1/busy_slots?calendar_id=eq.${encodeURIComponent(calendarId)}&start_time=gte.${startOfDay.toISOString()}&end_time=lte.${endOfDay.toISOString()}`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (busySlotsResponse.ok) {
        busySlots = await busySlotsResponse.json();
        console.log(`Found ${busySlots.length} busy slots from database`);
      }
    } catch (error) {
      console.error('Failed to fetch busy slots:', error);
    }
  }

  const availability: AvailabilitySlot[] = timeSlots.map(timeSlot => {
    const googleCalendarConflict = hasConflict(events, date, timeSlot);
    const busySlotConflict = hasBusySlotConflict(busySlots, date, timeSlot);
    const isAvailable = !googleCalendarConflict && !busySlotConflict;
    
    return {
      date,
      time: timeSlot,
      available: isAvailable,
    };
  });

  return availability;
}

function hasConflict(events: CalendarEvent[], date: string, timeSlot: string): boolean {
  const { startTime, endTime } = parseTimeSlot(date, timeSlot);

  return events.some(event => {
    if (!event.start?.dateTime || !event.end?.dateTime) return false;
    
    const eventStart = new Date(event.start.dateTime);
    const eventEnd = new Date(event.end.dateTime);
    
    return (startTime < eventEnd && endTime > eventStart);
  });
}

function hasBusySlotConflict(busySlots: any[], date: string, timeSlot: string): boolean {
  const { startTime, endTime } = parseTimeSlot(date, timeSlot);

  return busySlots.some(slot => {
    const slotStart = new Date(slot.start_time);
    const slotEnd = new Date(slot.end_time);
    
    return (startTime < slotEnd && endTime > slotStart);
  });
}

function parseTimeSlot(date: string, timeSlot: string): { startTime: Date; endTime: Date } {
  const timeMap: Record<string, { start: number; end: number }> = {
    "8:00 AM": { start: 8, end: 10 },
    "9:00 AM": { start: 9, end: 11 },
    "10:00 AM": { start: 10, end: 12 },
    "11:00 AM": { start: 11, end: 13 },
    "12:00 PM": { start: 12, end: 14 },
    "1:00 PM": { start: 13, end: 15 },
    "2:00 PM": { start: 14, end: 16 },
    "3:00 PM": { start: 15, end: 17 },
    "4:00 PM": { start: 16, end: 18 },
  };

  const slot = timeMap[timeSlot];
  
  if (!slot) {
    // Fallback parsing
    const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)/i;
    const match = timeSlot.match(timeRegex);
    
    if (match) {
      let hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      const period = match[3].toUpperCase();
      
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      
      const start = hour + (minute / 60);
      const end = start + 2; // 2-hour duration
      
      const startTime = new Date(`${date}T${Math.floor(start).toString().padStart(2, '0')}:${((start % 1) * 60).toString().padStart(2, '0')}:00`);
      const endTime = new Date(`${date}T${Math.floor(end).toString().padStart(2, '0')}:${((end % 1) * 60).toString().padStart(2, '0')}:00`);
      
      return { startTime, endTime };
    }
    
    // Ultimate fallback
    const startTime = new Date(`${date}T09:00:00`);
    const endTime = new Date(`${date}T11:00:00`);
    return { startTime, endTime };
  }
  
  const startTime = new Date(`${date}T${Math.floor(slot.start).toString().padStart(2, '0')}:${((slot.start % 1) * 60).toString().padStart(2, '0')}:00`);
  const endTime = new Date(`${date}T${Math.floor(slot.end).toString().padStart(2, '0')}:${((slot.end % 1) * 60).toString().padStart(2, '0')}:00`);
  
  return { startTime, endTime };
}

function str2ab(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}