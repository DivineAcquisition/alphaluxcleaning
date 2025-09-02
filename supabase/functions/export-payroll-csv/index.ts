import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PayrollExportRequest {
  period_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${authHeader}` } } }
    );

    // Verify user is admin
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.user.id);

    const isAdmin = userRoles?.some(r => r.role === 'super_admin');
    if (!isAdmin) {
      return new Response('Forbidden', { 
        status: 403, 
        headers: corsHeaders 
      });
    }

    const { period_id }: PayrollExportRequest = await req.json();

    if (!period_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing period_id' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log(`Exporting payroll CSV for period: ${period_id}`);

    // Get payroll period details
    const { data: period, error: periodError } = await supabase
      .from('payroll_periods')
      .select('*')
      .eq('id', period_id)
      .single();

    if (periodError || !period) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Payroll period not found' 
        }),
        { 
          status: 404, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Get payroll records for the period
    const { data: records, error: recordsError } = await supabase
      .from('payroll_records')
      .select(`
        *,
        subcontractors:contractor_id (
          full_name,
          email,
          hourly_rate
        ),
        timesheets:timesheet_id (
          start_time,
          end_time,
          hours_calc
        )
      `)
      .eq('payroll_period_id', period_id)
      .order('created_at', { ascending: true });

    if (recordsError) {
      console.error('Error fetching payroll records:', recordsError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch payroll records' 
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Generate CSV content
    const csvContent = generatePayrollCSV(period, records || []);

    console.log(`Generated CSV with ${records?.length || 0} records`);

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="payroll_${period.period_start}_${period.period_end}.csv"`,
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Error in export-payroll-csv:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

function generatePayrollCSV(period: any, records: any[]): string {
  // CSV headers
  const headers = [
    'Period Start',
    'Period End',
    'Contractor Name',
    'Email',
    'Pay Type',
    'Hours/Units',
    'Rate',
    'Base Pay',
    'Bonus',
    'Total Pay',
    'Status',
    'Approved By',
    'Approved At',
    'Memo',
    'Created At'
  ];

  let csv = headers.join(',') + '\n';

  // Calculate totals
  let totalPay = 0;
  let totalHours = 0;

  // Add data rows
  for (const record of records) {
    const contractor = record.subcontractors || {};
    const totalRecordPay = (record.pay_calc || 0) + (record.bonus || 0);
    
    totalPay += totalRecordPay;
    if (record.pay_type === 'hourly') {
      totalHours += record.units || 0;
    }

    const row = [
      period.period_start,
      period.period_end,
      escapeCSV(contractor.full_name || ''),
      escapeCSV(contractor.email || ''),
      record.pay_type || '',
      record.units || 0,
      record.rate || 0,
      record.pay_calc || 0,
      record.bonus || 0,
      totalRecordPay,
      record.status || '',
      escapeCSV(record.approved_by || ''),
      record.approved_at || '',
      escapeCSV(record.memo || ''),
      record.created_at || ''
    ];

    csv += row.join(',') + '\n';
  }

  // Add summary row
  csv += '\n';
  csv += `Summary,,,,,,,,${totalPay.toFixed(2)},Total Pay,,,\n`;
  csv += `,,,,,,,,${totalHours.toFixed(2)},Total Hours,,,\n`;
  csv += `,,,,,,,,${records.length},Total Records,,,\n`;

  return csv;
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

serve(handler);