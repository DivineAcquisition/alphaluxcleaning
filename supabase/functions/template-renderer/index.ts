import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TemplateRenderRequest {
  templateId: string;
  variables: Record<string, any>;
  deliveryMethod: 'sms' | 'email' | 'in_app';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { templateId, variables, deliveryMethod }: TemplateRenderRequest = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      throw new Error(`Template not found: ${templateError?.message}`);
    }

    // Get the appropriate template content based on delivery method
    let templateContent = '';
    if (deliveryMethod === 'sms' && template.body_template) {
      templateContent = template.body_template;
    } else if (deliveryMethod === 'email' && template.subject_template) {
      templateContent = template.subject_template;
    } else if (deliveryMethod === 'in_app' && template.message_template) {
      templateContent = template.message_template;
    } else {
      templateContent = template.body_template || template.message_template || '';
    }

    if (!templateContent) {
      throw new Error(`No template content found for delivery method: ${deliveryMethod}`);
    }

    // Render template with variables
    let renderedContent = templateContent;
    
    // Replace variables in the format {{variable_name}}
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      
      // Format different types of values
      let formattedValue = '';
      if (typeof value === 'string') {
        formattedValue = value;
      } else if (typeof value === 'number') {
        // Format currency if the key suggests it's an amount
        if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('price') || key.toLowerCase().includes('cost')) {
          formattedValue = `$${value.toFixed(2)}`;
        } else {
          formattedValue = value.toString();
        }
      } else if (value instanceof Date) {
        // Format dates nicely
        formattedValue = value.toLocaleDateString();
      } else if (typeof value === 'boolean') {
        formattedValue = value ? 'Yes' : 'No';
      } else {
        formattedValue = JSON.stringify(value);
      }
      
      renderedContent = renderedContent.replace(regex, formattedValue);
    }

    // Log template rendering for debugging
    console.log('Template rendered:', {
      templateId,
      deliveryMethod,
      originalLength: templateContent.length,
      renderedLength: renderedContent.length,
      variablesCount: Object.keys(variables).length
    });

    return new Response(JSON.stringify({
      success: true,
      renderedContent,
      templateName: template.name,
      deliveryMethod,
      variablesUsed: Object.keys(variables)
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Template Renderer Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});