import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Test email confirmation function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { testEmail } = await req.json();
    console.log("Sending test email to:", testEmail);

    const ghlApiKey = Deno.env.get("GOHIGHLEVEL_API_KEY");
    console.log("API key available:", ghlApiKey ? "Yes" : "No");
    
    if (!ghlApiKey) {
      throw new Error("GOHIGHLEVEL_API_KEY not found in environment variables");
    }

    // First, try to create/find a contact
    console.log("Creating contact in GoHighLevel...");
    const contactResponse = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ghlApiKey}`,
        'Content-Type': 'application/json',
        'Version': '2021-04-15'
      },
      body: JSON.stringify({
        email: testEmail,
        firstName: "Test",
        lastName: "User"
      })
    });

    const contactData = await contactResponse.json();
    console.log("Contact response status:", contactResponse.status);
    console.log("Contact response:", contactData);

    let contactId;
    if (contactData.contact?.id) {
      contactId = contactData.contact.id;
    } else if (contactData.id) {
      contactId = contactData.id;
    } else {
      // Contact might already exist, try to search
      console.log("Contact creation failed, searching for existing contact...");
      const searchResponse = await fetch(`https://services.leadconnectorhq.com/contacts/search/duplicate?email=${encodeURIComponent(testEmail)}`, {
        headers: {
          'Authorization': `Bearer ${ghlApiKey}`,
          'Version': '2021-04-15'
        }
      });
      const searchData = await searchResponse.json();
      console.log("Search response:", searchData);
      
      if (searchData.contact?.id) {
        contactId = searchData.contact.id;
      }
    }

    if (!contactId) {
      throw new Error("Could not create or find contact in GoHighLevel. Response: " + JSON.stringify(contactData));
    }

    console.log("Using contact ID:", contactId);

    // Create email content
    const emailContent = `
      <h1>🧪 Test Email - Booking Confirmation</h1>
      <p>This is a test email to verify the GoHighLevel integration is working.</p>
      <p>If you received this email, the integration is successful!</p>
    `;

    // Send email through GoHighLevel
    console.log("Sending email through GoHighLevel...");
    const emailResponse = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ghlApiKey}`,
        'Content-Type': 'application/json',
        'Version': '2021-04-15'
      },
      body: JSON.stringify({
        type: "Email",
        contactId: contactId,
        html: emailContent,
        message: "Test booking confirmation email"
      })
    });

    const emailData = await emailResponse.json();
    console.log("Email response status:", emailResponse.status);
    console.log("Email response:", emailData);

    if (!emailResponse.ok) {
      throw new Error(`GoHighLevel API error: ${JSON.stringify(emailData)}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Test email sent successfully to ${testEmail}!`,
      emailResponse: emailData
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in test-email-confirmation function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        stack: error.stack
      }),
      {
        status: 200, // Return 200 to avoid function errors
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);