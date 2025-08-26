import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AirtableRecord {
  fields: Record<string, any>
}

interface AirtableResponse {
  records?: AirtableRecord[]
  error?: any
}

const AIRTABLE_BASE_ID = 'appFVs6wCxVMLa64Y'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const airtableApiKey = Deno.env.get('AIRTABLE_API_KEY')
    if (!airtableApiKey) {
      throw new Error('AIRTABLE_API_KEY not found in environment variables')
    }

    const { action, data } = await req.json()

    let result: any = {}

    switch (action) {
      case 'sync_order':
        result = await syncOrderToAirtable(data, airtableApiKey)
        break
      case 'sync_customer':
        result = await syncCustomerToAirtable(data, airtableApiKey)
        break
      case 'sync_all_orders':
        result = await syncAllOrdersToAirtable(supabase, airtableApiKey)
        break
      case 'test_connection':
        result = await testAirtableConnection(airtableApiKey)
        break
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error in sync-to-airtable:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    )
  }
})

async function testAirtableConnection(apiKey: string) {
  const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Orders?maxRecords=1`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Airtable connection failed: ${response.statusText}`)
  }

  return { connected: true, message: 'Successfully connected to Airtable' }
}

async function syncOrderToAirtable(orderData: any, apiKey: string) {
  const airtableData = mapOrderToAirtable(orderData)
  
  // Sync to Orders table
  const orderResponse = await createOrUpdateAirtableRecord('Orders', airtableData.order, apiKey, orderData.id)
  
  // Sync to Service Details table
  const serviceResponse = await createOrUpdateAirtableRecord('Service Details', airtableData.serviceDetails, apiKey, `service_${orderData.id}`)
  
  // Sync to Property Details table  
  const propertyResponse = await createOrUpdateAirtableRecord('Property Details', airtableData.propertyDetails, apiKey, `property_${orderData.id}`)
  
  // Sync to Pricing & Discounts table
  const pricingResponse = await createOrUpdateAirtableRecord('Pricing & Discounts', airtableData.pricing, apiKey, `pricing_${orderData.id}`)

  return {
    order: orderResponse,
    serviceDetails: serviceResponse,
    propertyDetails: propertyResponse,
    pricing: pricingResponse
  }
}

async function syncCustomerToAirtable(customerData: any, apiKey: string) {
  const airtableData = mapCustomerToAirtable(customerData)
  
  return await createOrUpdateAirtableRecord('Customers', airtableData, apiKey, customerData.customer_email)
}

async function syncAllOrdersToAirtable(supabase: any, apiKey: string) {
  // Fetch recent orders from Supabase
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`)
  }

  const results = []
  for (const order of orders) {
    try {
      const result = await syncOrderToAirtable(order, apiKey)
      results.push({ orderId: order.id, success: true, result })
    } catch (error) {
      results.push({ orderId: order.id, success: false, error: error.message })
    }
  }

  return { syncedCount: results.filter(r => r.success).length, results }
}

async function createOrUpdateAirtableRecord(tableName: string, data: any, apiKey: string, uniqueId: string) {
  // First try to find existing record
  const searchResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}?filterByFormula={Unique ID}='${uniqueId}'`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  )

  const searchData: AirtableResponse = await searchResponse.json()
  
  if (searchData.records && searchData.records.length > 0) {
    // Update existing record
    const recordId = searchData.records[0].id
    const updateResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}/${recordId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: { ...data, 'Unique ID': uniqueId } })
      }
    )
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json()
      throw new Error(`Failed to update ${tableName}: ${JSON.stringify(errorData)}`)
    }
    
    return await updateResponse.json()
  } else {
    // Create new record
    const createResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: { ...data, 'Unique ID': uniqueId } })
      }
    )
    
    if (!createResponse.ok) {
      const errorData = await createResponse.json()
      throw new Error(`Failed to create ${tableName}: ${JSON.stringify(errorData)}`)
    }
    
    return await createResponse.json()
  }
}

function mapOrderToAirtable(order: any) {
  return {
    order: {
      'Order ID': order.id,
      'Customer Email': order.customer_email,
      'Customer Name': order.customer_name,
      'Customer Phone': order.customer_phone,
      'Amount': order.amount,
      'Status': order.order_status,
      'Payment Status': order.payment_status,
      'Service Date': order.service_date,
      'Service Time': order.service_time,
      'Created At': order.created_at,
      'Special Instructions': order.special_instructions,
      'Subcontractor Assigned': order.subcontractor_assigned
    },
    serviceDetails: {
      'Order ID': order.id,
      'Service Type': order.service_details?.service_type,
      'Frequency': order.service_details?.frequency,
      'Duration': order.service_details?.duration,
      'Bedrooms': order.service_details?.bedrooms,
      'Bathrooms': order.service_details?.bathrooms,
      'Square Footage': order.service_details?.square_footage,
      'House Type': order.service_details?.house_type,
      'Cleaning Type': order.service_details?.cleaning_type
    },
    propertyDetails: {
      'Order ID': order.id,
      'Service Address': order.service_address,
      'City': order.city,
      'State': order.state,
      'Zip Code': order.zip_code,
      'Property Type': order.service_details?.house_type,
      'Access Instructions': order.special_instructions
    },
    pricing: {
      'Order ID': order.id,
      'Base Amount': order.amount,
      'Discount Applied': order.discount_applied,
      'Discount Amount': order.discount_amount,
      'Final Amount': order.final_amount,
      'Referral Code': order.referral_code,
      'Pricing Tier': order.pricing_details?.tier
    }
  }
}

function mapCustomerToAirtable(customer: any) {
  return {
    'Customer Email': customer.customer_email,
    'Customer Name': customer.customer_name,
    'Customer Phone': customer.customer_phone,
    'Total Orders': customer.total_orders || 0,
    'Total Spent': customer.total_spent || 0,
    'First Order Date': customer.first_order_date,
    'Last Order Date': customer.last_order_date,
    'Customer Status': customer.status || 'Active',
    'Lifetime Value': customer.lifetime_value || 0,
    'Preferred Service Type': customer.preferred_service_type
  }
}