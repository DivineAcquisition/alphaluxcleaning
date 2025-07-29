import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Create calendar event function started, method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('Processing calendar event creation request...');
    const body = await req.json();
    const { date, time, serviceType, sessionId, duration = 2 } = body;
    
    console.log('Event data:', { date, time, serviceType, sessionId, duration });
    
    if (!date || !time) {
      throw new Error('Missing required fields: date and time');
    }

    // Get Google Service Account credentials
    const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    
    if (!serviceAccountKey) {
      console.log('No Google Service Account key found');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Google Calendar not configured' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid service account configuration' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Get access token
    console.log('Getting access token...');
    const accessToken = await getAccessToken(credentials);
    console.log('Access token obtained');
    
    // Create calendar event
    console.log('Creating calendar event...');
    const eventData = await createCalendarEvent(accessToken, date, time, serviceType, duration);
    console.log('Calendar event created successfully:', eventData.id);
    
    return new Response(JSON.stringify({ 
      success: true,
      eventId: eventData.id,
      eventLink: eventData.htmlLink
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Function error:', error.message);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

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
    scope: 'https://www.googleapis.com/auth/calendar',
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

async function createCalendarEvent(accessToken: string, date: string, time: string, serviceType: string, duration: number) {
  const calendarId = 'elitehousekeepers@gmail.com';
  
  // Parse the time and create start/end times
  const { startTime, endTime } = parseTimeSlot(date, time, duration);
  
  const eventData = {
    summary: `${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Cleaning Service`,
    description: `Professional ${serviceType} cleaning service appointment.\n\nService Details:\n- Type: ${serviceType}\n- Duration: ${duration} hours\n\nBooked through Bay Area Cleaning Pros website.`,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'America/Los_Angeles',
    },
    location: 'Customer Location (TBD)',
    attendees: [
      {
        email: 'elitehousekeepers@gmail.com',
        displayName: 'Bay Area Cleaning Pros'
      }
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'email', minutes: 60 }, // 1 hour before
      ],
    },
  };

  console.log('Creating event with data:', JSON.stringify(eventData, null, 2));
  
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Calendar API error:', response.status, errorText);
    throw new Error(`Failed to create calendar event: ${response.statusText}`);
  }

  const responseData = await response.json();
  console.log('Event created successfully:', responseData.id);
  
  return responseData;
}

function parseTimeSlot(date: string, timeSlot: string, duration: number): { startTime: Date; endTime: Date } {
  // Parse time like "9:00 AM" to hour
  const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)/i;
  const match = timeSlot.match(timeRegex);
  
  if (!match) {
    throw new Error(`Invalid time format: ${timeSlot}`);
  }

  let hour = parseInt(match[1]);
  const minute = parseInt(match[2]);
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  
  const startTime = new Date(`${date}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`);
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + duration);
  
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