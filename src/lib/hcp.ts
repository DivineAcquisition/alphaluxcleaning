import { supabase } from '@/integrations/supabase/client';

export interface BookingPayload {
  booking_id: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
  };
  service: {
    type: string;
    frequency: string;
    sqft_range: string;
    addons?: string[];
  };
  schedule: {
    date: string;
    time_window?: string;
    timezone: string;
  };
  pricing: {
    total: number;
    mrr_est?: number;
    arr_est?: number;
    currency: string;
  };
  source: string;
}

export interface HCPConfig {
  api_key: string;
  base_url: string;
  enabled: boolean;
  test_mode: boolean;
}

export interface HCPCustomer {
  id: string;
  first_name: string;
  last_name: string;  
  emails: string[];
  phones: string[];
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
  };
  tags?: string[];
}

export interface HCPJob {
  id: string;
  customer_id: string;
  title: string;
  scheduled_start: string;
  scheduled_end: string;
  notes?: string;
  address_override?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
  };
  line_items?: Array<{
    name: string;
    quantity: number;
    unit_price: number;
  }>;
  tags?: string[];
}

export class HCPError extends Error {
  constructor(message: string, public statusCode?: number, public response?: any) {
    super(message);
    this.name = 'HCPError';
  }
}

export async function getHCPConfig(): Promise<HCPConfig | null> {
  try {
    const { data, error } = await supabase.functions.invoke('get-hcp-config');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to get HCP config:', error);
    return null;
  }
}

export async function updateHCPConfig(config: Partial<HCPConfig>): Promise<void> {
  const { error } = await supabase.functions.invoke('update-hcp-config', {
    body: config
  });
  if (error) throw error;
}

export async function syncBookingToHCP(bookingPayload: BookingPayload): Promise<{ customerId: string; jobId: string }> {
  try {
    console.log('Syncing booking to HCP:', bookingPayload.booking_id);
    
    const { data, error } = await supabase.functions.invoke('sync-booking-to-hcp', {
      body: bookingPayload
    });
    
    if (error) {
      throw new HCPError(`Failed to sync booking: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('HCP sync error:', error);
    throw error;
  }
}

export async function retryFailedSync(bookingId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('retry-hcp-sync', {
    body: { booking_id: bookingId }
  });
  if (error) throw error;
}

export async function getHCPSyncLogs(filters?: { status?: string; limit?: number }) {
  const { data, error } = await supabase
    .from('hcp_sync_log')
    .select(`
      *,
      bookings!inner(
        id,
        customer_id,
        customers!inner(name, email)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(filters?.limit || 100);
    
  if (error) throw error;
  return data;
}

export function redactApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '****';
  return key.substring(0, 4) + '****' + key.substring(key.length - 4);
}

export function formatTimeWindow(date: string, timeWindow: string, timezone: string): { start: string; end: string } {
  const [startTime, endTime] = timeWindow.split('-');
  
  const startDate = new Date(`${date}T${startTime}:00`);
  const endDate = new Date(`${date}T${endTime}:00`);
  
  return {
    start: startDate.toISOString(),
    end: endDate.toISOString()
  };
}

export function buildJobTitle(serviceType: string, frequency: string): string {
  return `${serviceType} Cleaning (${frequency})`;
}

export function buildJobNotes(payload: BookingPayload): string {
  const notes = [
    `Booking ID: ${payload.booking_id}`,
    `Source: ${payload.source}`,
    `Sq Ft: ${payload.service.sqft_range}`
  ];
  
  if (payload.service.addons?.length) {
    notes.push(`Addons: ${payload.service.addons.join(', ')}`);
  }
  
  if (payload.pricing.mrr_est) {
    notes.push(`MRR est: $${payload.pricing.mrr_est}`);
  }
  
  if (payload.pricing.arr_est) {
    notes.push(`ARR est: $${payload.pricing.arr_est}`);
  }
  
  return notes.join('\n');
}