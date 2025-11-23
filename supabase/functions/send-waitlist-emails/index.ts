import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendWaitlistEmailsRequest {
  emails: string[];
  template: string;
  preserveOffer?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emails, template, preserveOffer = false }: SendWaitlistEmailsRequest = await req.json();

    console.log(`Processing bulk email send: ${emails.length} recipients, template: ${template}`);

    if (!emails || emails.length === 0) {
      throw new Error('No email addresses provided');
    }

    if (!template) {
      throw new Error('No template specified');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch waitlist leads for these emails to get their details
    const { data: leads, error: leadsError } = await supabase
      .from('waitlist_leads')
      .select('email, first_name')
      .in('email', emails);

    if (leadsError) {
      console.error('Error fetching waitlist leads:', leadsError);
      throw leadsError;
    }

    console.log(`Found ${leads?.length || 0} matching leads`);

    let queued = 0;
    let failed = 0;

    // Queue emails for each recipient
    for (const lead of leads || []) {
      try {
        // Build payload based on template
        let payload: any = {
          first_name: lead.first_name || 'Valued Customer',
          email: lead.email,
          app_url: 'https://book.alphaluxclean.com'
        };

        // Add offer-specific data for waitlist welcome emails
        if (template === 'waitlist_welcome' && preserveOffer) {
          payload = {
            ...payload,
            promo_code: 'DEEPCLEAN60',
            promo_amount: 60,
            booking_url: 'https://book.alphaluxclean.com/booking?promo=DEEPCLEAN60&source=waitlist'
          };
        }

        // Queue the email using emails-queue function
        const { error: queueError } = await supabase.functions.invoke('emails-queue', {
          body: {
            to: lead.email,
            name: lead.first_name || 'Valued Customer',
            template: template,
            payload: payload,
            category: template === 'waitlist_welcome' ? 'marketing' : 'transactional'
          }
        });

        if (queueError) {
          console.error(`Failed to queue email for ${lead.email}:`, queueError);
          failed++;
        } else {
          queued++;
          console.log(`Queued email for ${lead.email}`);
        }

        // Rate limiting: small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing email for ${lead.email}:`, error);
        failed++;
      }
    }

    console.log(`Bulk email send complete: ${queued} queued, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        queued,
        failed,
        total: emails.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in send-waitlist-emails function:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
