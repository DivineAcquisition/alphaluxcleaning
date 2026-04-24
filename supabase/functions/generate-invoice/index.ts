import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-INVOICE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { order_id } = await req.json();
    if (!order_id) throw new Error("Order ID is required");

    logStep("Invoice generation requested", { order_id });

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    logStep("Order found", { orderId: order.id, customerEmail: order.customer_email });

    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    
    // Generate invoice data
    const invoiceData = {
      invoice_number: invoiceNumber,
      order_id: order_id,
      customer_email: order.customer_email,
      customer_name: order.customer_name,
      amount: order.amount,
      currency: order.currency || 'usd',
      service_description: order.cleaning_type?.replace(/_/g, ' ') || 'Cleaning Service',
      issue_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      status: order.status === 'paid' ? 'paid' : 'pending',
      line_items: [
        {
          description: order.cleaning_type?.replace(/_/g, ' ') || 'Professional Cleaning Service',
          quantity: 1,
          unit_price: order.amount,
          total: order.amount
        }
      ]
    };

    // Store invoice in database
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        order_id: order_id,
        customer_email: order.customer_email,
        amount: order.amount,
        currency: order.currency || 'usd',
        status: order.status === 'paid' ? 'paid' : 'pending',
        invoice_data: invoiceData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (invoiceError) {
      throw new Error(`Failed to create invoice: ${invoiceError.message}`);
    }

    logStep("Invoice created", { invoiceNumber, invoiceId: invoice.id });

    // Generate PDF invoice (simplified HTML version)
    const invoiceHTML = generateInvoiceHTML(invoiceData);
    
    // Store HTML version (in production, you'd convert this to PDF)
    await supabaseClient
      .from('invoices')
      .update({ 
        pdf_content: invoiceHTML,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice.id);

    logStep("Invoice PDF generated", { invoiceId: invoice.id });

    return new Response(JSON.stringify({
      success: true,
      invoice_id: invoice.id,
      invoice_number: invoiceNumber,
      invoice_data: invoiceData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in generate-invoice", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function generateInvoiceHTML(invoiceData: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Invoice ${invoiceData.invoice_number}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 40px; }
            .invoice-details { margin-bottom: 30px; }
            .billing-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .line-items { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .line-items th, .line-items td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .line-items th { background-color: #f5f5f5; }
            .total { text-align: right; font-size: 18px; font-weight: bold; }
            .status { padding: 8px 16px; border-radius: 4px; display: inline-block; }
            .paid { background-color: #d4edda; color: #155724; }
            .pending { background-color: #fff3cd; color: #856404; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>AlphaLux Clean</h1>
            <h2>Invoice</h2>
        </div>
        
        <div class="invoice-details">
            <p><strong>Invoice Number:</strong> ${invoiceData.invoice_number}</p>
            <p><strong>Issue Date:</strong> ${new Date(invoiceData.issue_date).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(invoiceData.due_date).toLocaleDateString()}</p>
            <p><strong>Status:</strong> <span class="status ${invoiceData.status}">${invoiceData.status.toUpperCase()}</span></p>
        </div>
        
        <div class="billing-info">
            <div>
                <h3>Bill To:</h3>
                <p>${invoiceData.customer_name}</p>
                <p>${invoiceData.customer_email}</p>
            </div>
            <div>
                <h3>From:</h3>
                <p>AlphaLux Clean</p>
                <p>Professional Cleaning Services</p>
            </div>
        </div>
        
        <table class="line-items">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${invoiceData.line_items.map((item: any) => `
                    <tr>
                        <td>${item.description}</td>
                        <td>${item.quantity}</td>
                        <td>$${(item.unit_price / 100).toFixed(2)}</td>
                        <td>$${(item.total / 100).toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="total">
            <p>Total Amount: $${(invoiceData.amount / 100).toFixed(2)} ${invoiceData.currency.toUpperCase()}</p>
        </div>
        
        <div style="margin-top: 40px; font-size: 14px; color: #666;">
            <p>Thank you for choosing AlphaLux Clean!</p>
            <p>Questions? Contact us at support@alphaluxcleaning.com</p>
        </div>
    </body>
    </html>
  `;
}