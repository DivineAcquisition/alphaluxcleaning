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
    
    // Check if GoHighLevel integration is available first
    const GHL_API_KEY = Deno.env.get("GOHIGHLEVEL_API_KEY");
    const GHL_LOCATION_ID = Deno.env.get("GOHIGHLEVEL_LOCATION_ID");

    if (GHL_API_KEY && GHL_LOCATION_ID) {
      console.log('Using GoHighLevel for availability check');
      try {
        const ghlAvailability = await checkGHLAvailability(date, timeSlots);
        return new Response(JSON.stringify({ availability: ghlAvailability, source: 'gohighlevel' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (ghlError) {
        console.error('GHL availability check failed, falling back to Google Calendar:', ghlError);
      }
    }

    // Fallback to Google Calendar
    console.log('Using Google Calendar for availability check');
    const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKey) {
      // If neither GHL nor Google Calendar is configured, return mock availability
      console.log('No Google Service Account key configured, using mock availability');
      const mockAvailability = Array.isArray(timeSlots) ? timeSlots.map(timeSlot => ({
        date,
        time: timeSlot,
        available: true,
      })) : [{
        date,
        time: timeSlots,
        available: true,
      }];
      return new Response(JSON.stringify({ availability: mockAvailability, source: 'mock' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let credentials;
    try {
      credentials = JSON.parse(serviceAccountKey);
      if (!credentials.private_key || !credentials.client_email) {
        throw new Error('Missing required fields in service account key');
      }
    } catch (parseError) {
      console.error('Invalid JSON in service account key:', parseError);
      // Return mock availability instead of failing
      const mockAvailability = Array.isArray(timeSlots) ? timeSlots.map(timeSlot => ({
        date,
        time: timeSlot,
        available: true,
      })) : [{
        date,
        time: timeSlots,
        available: true,
      }];
      return new Response(JSON.stringify({ availability: mockAvailability, source: 'mock_fallback' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Get access token using JWT
    const accessToken = await getAccessToken(credentials);
    
    // Check availability for the requested date
    const availability = await checkAvailability(accessToken, date, timeSlots);
    
    return new Response(JSON.stringify({ availability, source: 'google' }), {
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

async function checkGHLAvailability(date: string, timeSlots: string[]): Promise<AvailabilitySlot[]> {
  const GHL_API_KEY = Deno.env.get("GOHIGHLEVEL_API_KEY");
  const GHL_LOCATION_ID = Deno.env.get("GOHIGHLEVEL_LOCATION_ID");

  // Get calendars for the location
  const calendarsResponse = await fetch(`https://services.leadconnectorhq.com/calendars/`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${GHL_API_KEY}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    }
  });

  const calendarsData = await calendarsResponse.json();
  
  if (!calendarsData.calendars || calendarsData.calendars.length === 0) {
    throw new Error("No calendars found in GoHighLevel");
  }

  const calendar = calendarsData.calendars.find(cal => cal.locationId === GHL_LOCATION_ID) || calendarsData.calendars[0];

  // Get existing appointments for the date
  const appointmentsResponse = await fetch(`https://services.leadconnectorhq.com/calendars/events/appointments?calendarId=${calendar.id}&startDate=${date}&endDate=${date}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${GHL_API_KEY}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    }
  });

  const appointmentsData = await appointmentsResponse.json();
  const existingAppointments = appointmentsData.events || [];

  // Check each time slot for availability
  const availability: AvailabilitySlot[] = timeSlots.map(timeSlot => {
    const { startTime, endTime } = parseTimeSlot(date, timeSlot);
    
    // Check for conflicts with existing appointments
    const hasConflict = existingAppointments.some(appointment => {
      const appointmentStart = new Date(appointment.startTime);
      const appointmentEnd = new Date(appointment.endTime);
      
      return (startTime < appointmentEnd && endTime > appointmentStart);
    });

    return {
      date,
      time: timeSlot,
      available: !hasConflict,
    };
  });

  return availability;
}

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

  // Use the specific calendar ID for elitehousekeepers@gmail.com
  const calendarId = 'elitehousekeepers@gmail.com';
  
  // Get calendar events for the day
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
  // Handle both legacy format and new format time slots
  const timeMap: Record<string, { start: number; end: number }> = {
    "Morning (9:00 AM-12:00 PM)": { start: 9, end: 12 },
    "Early Afternoon (12:00 PM-2:30 PM)": { start: 12, end: 14.5 },
    "Late Afternoon (2:30 PM-5:00 PM)": { start: 14.5, end: 17 },
    "Afternoon (12:00 PM-3:00 PM)": { start: 12, end: 15 },
    "Late Afternoon (2:00 PM-5:00 PM)": { start: 14, end: 17 },
    "Afternoon (12:00 PM-5:00 PM)": { start: 12, end: 17 },
    // Add support for specific time slots from VisualScheduler
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
    // Try to parse a generic time like "10:00 AM" 
    const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)/i;
    const match = timeSlot.match(timeRegex);
    
    if (match) {
      let hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      const period = match[3].toUpperCase();
      
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      
      const start = hour + (minute / 60);
      const end = start + 2; // Default 2-hour service duration
      
      const startTime = new Date(`${date}T${Math.floor(start).toString().padStart(2, '0')}:${((start % 1) * 60).toString().padStart(2, '0')}:00`);
      const endTime = new Date(`${date}T${Math.floor(end).toString().padStart(2, '0')}:${((end % 1) * 60).toString().padStart(2, '0')}:00`);
      
      return { startTime, endTime };
    }
    
    // Fallback to default business hours
    const defaultSlot = { start: 9, end: 17 };
    const startTime = new Date(`${date}T${Math.floor(defaultSlot.start).toString().padStart(2, '0')}:${((defaultSlot.start % 1) * 60).toString().padStart(2, '0')}:00`);
    const endTime = new Date(`${date}T${Math.floor(defaultSlot.end).toString().padStart(2, '0')}:${((defaultSlot.end % 1) * 60).toString().padStart(2, '0')}:00`);
    
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