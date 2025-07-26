import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { date, timeSlots } = await req.json();
    
    const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKey) {
      throw new Error('Google Service Account key not configured');
    }

    let credentials;
    try {
      credentials = JSON.parse(serviceAccountKey);
    } catch (parseError) {
      console.error('Invalid JSON in service account key:', parseError);
      throw new Error('Invalid Google Service Account key format');
    }
    
    // Get access token using JWT
    const accessToken = await getAccessToken(credentials);
    
    // Check availability for the requested date
    const availability = await checkAvailability(accessToken, date, timeSlots);
    
    return new Response(JSON.stringify({ availability }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error checking calendar availability:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      availability: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getAccessToken(credentials: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

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
  
  // Import the private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    str2ab(atob(credentials.private_key.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, ''))),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwt = `${signatureInput}.${encodedSignature}`;

  // Exchange JWT for access token
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
    throw new Error(`Failed to get access token: ${tokenData.error_description || tokenData.error}`);
  }

  return tokenData.access_token;
}

async function checkAvailability(accessToken: string, date: string, timeSlots: string[]): Promise<AvailabilitySlot[]> {
  const startOfDay = new Date(`${date}T00:00:00`);
  const endOfDay = new Date(`${date}T23:59:59`);

  // Get calendar events for the day
  const calendarResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
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
    throw new Error(`Failed to fetch calendar events: ${calendarResponse.statusText}`);
  }

  const calendarData = await calendarResponse.json();
  const events: CalendarEvent[] = calendarData.items || [];

  // Check each time slot for availability
  const availability: AvailabilitySlot[] = timeSlots.map(timeSlot => {
    const isAvailable = !hasConflict(events, date, timeSlot);
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
    
    // Check if there's any overlap
    return (startTime < eventEnd && endTime > eventStart);
  });
}

function parseTimeSlot(date: string, timeSlot: string): { startTime: Date; endTime: Date } {
  // Parse time slots for business hours (9 AM-5 PM) with more granular options
  const timeMap: Record<string, { start: number; end: number }> = {
    "Morning (9:00 AM-12:00 PM)": { start: 9, end: 12 },
    "Early Afternoon (12:00 PM-2:30 PM)": { start: 12, end: 14.5 },
    "Late Afternoon (2:30 PM-5:00 PM)": { start: 14.5, end: 17 },
    "Afternoon (12:00 PM-3:00 PM)": { start: 12, end: 15 },
    "Late Afternoon (2:00 PM-5:00 PM)": { start: 14, end: 17 },
    "Afternoon (12:00 PM-5:00 PM)": { start: 12, end: 17 },
  };

  const slot = timeMap[timeSlot] || { start: 9, end: 17 }; // Default to business hours
  
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