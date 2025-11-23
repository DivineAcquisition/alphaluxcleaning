import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AssignJobRequest {
  bookingId: string;
  subcontractorId: string;
  companyId?: string;
}

export interface EligibleSubcontractor {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  reliability_score: number;
  is_available: boolean;
  areas_count: number;
  capacity_left: number;
  proximity_score: number;
}

/**
 * Assign a subcontractor to a job
 */
export const assignSubcontractor = async ({ bookingId, subcontractorId }: AssignJobRequest) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ 
        assigned_employee_id: subcontractorId,
        status: 'confirmed'
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;

    // Log the assignment event
    await supabase
      .from('job_assignments')
      .insert({
        job_id: bookingId,
        contractor_id: subcontractorId,
        assigned_by: (await supabase.auth.getUser()).data.user?.id,
        acceptance_status: 'pending'
      });

    toast.success('Job assigned successfully!');
    return { success: true, data };
  } catch (error) {
    console.error('Error assigning job:', error);
    toast.error('Failed to assign job');
    return { success: false, error: error.message };
  }
};

/**
 * Get eligible subcontractors for a specific job
 */
export const getEligibleSubcontractors = async (bookingId: string): Promise<EligibleSubcontractor[]> => {
  try {
    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('bookings')
      .select('service_date, service_time, service_address')
      .eq('id', bookingId)
      .single();

    if (jobError) throw jobError;

    // Get all active subcontractors
    const { data: subcontractors, error: subError } = await supabase
      .from('subcontractors')
      .select(`
        id,
        full_name,
        phone,
        email,
        rating,
        is_available,
        city,
        state,
        zip_code
      `)
      .eq('account_status', 'active')
      .eq('is_available', true);

    if (subError) throw subError;

    // Check availability and calculate scores
    const eligible: EligibleSubcontractor[] = [];
    
    for (const sub of subcontractors || []) {
      // Check if subcontractor is not on time off for the job date
      const { count: timeOffCount } = await supabase
        .from('subcontractor_timeoff')
        .select('*', { count: 'exact', head: true })
        .eq('subcontractor_id', sub.id)
        .lte('start_date', job.service_date)
        .gte('end_date', job.service_date);

      if (timeOffCount && timeOffCount > 0) continue;

      // Check daily capacity (simplified - assume max 5 jobs per day)
      const { count: assignedToday } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_employee_id', sub.id)
        .eq('service_date', job.service_date);

      const capacityLeft = 5 - (assignedToday || 0);
      if (capacityLeft <= 0) continue;

      // Simple proximity scoring (would be enhanced with actual distance calculation)
      const proximityScore = calculateProximityScore(job.service_address, sub.city, sub.state);

      eligible.push({
        id: sub.id,
        full_name: sub.full_name,
        phone: sub.phone,
        email: sub.email,
        reliability_score: sub.rating || 0,
        is_available: sub.is_available,
        areas_count: 1, // Simplified
        capacity_left: capacityLeft,
        proximity_score: proximityScore
      });
    }

    // Sort by reliability score and proximity
    eligible.sort((a, b) => {
      const scoreA = (a.reliability_score * 0.7) + (a.proximity_score * 0.3);
      const scoreB = (b.reliability_score * 0.7) + (b.proximity_score * 0.3);
      return scoreB - scoreA;
    });

    return eligible;
  } catch (error) {
    console.error('Error getting eligible subcontractors:', error);
    return [];
  }
};

/**
 * Mark booking as confirmed
 */
export const markBookingConfirmed = async (bookingId: string) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;

    toast.success('Booking confirmed!');
    return { success: true, data };
  } catch (error) {
    console.error('Error confirming booking:', error);
    toast.error('Failed to confirm booking');
    return { success: false, error: error.message };
  }
};

/**
 * Generate ICS calendar file for a booking
 */
export const generateIcsLink = async (bookingId: string) => {
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error) throw error;

    const startDateTime = new Date(`${booking.service_date}T${booking.service_time}`);
    const endDateTime = new Date(startDateTime.getTime() + (booking.estimated_duration || 120) * 60000);

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Bay Area Cleaning Pros//Booking//EN',
      'BEGIN:VEVENT',
      `UID:${bookingId}@alphaluxclean.com`,
      `DTSTART:${formatDateForICS(startDateTime)}`,
      `DTEND:${formatDateForICS(endDateTime)}`,
      `SUMMARY:Cleaning Service - ${booking.customer_name}`,
      `DESCRIPTION:Service at ${booking.service_address}`,
      `LOCATION:${booking.service_address}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `booking-${bookingId}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Calendar file downloaded!');
    return { success: true };
  } catch (error) {
    console.error('Error generating ICS:', error);
    toast.error('Failed to generate calendar file');
    return { success: false, error: error.message };
  }
};

/**
 * Seed demo data for testing
 */
export const seedDemoData = async () => {
  try {
    console.log('Starting demo data seed...');

    console.log('Creating demo data - using simplified approach for now');
    
    // For now, create mock subcontractor data that can be used in the UI
    // In production, you would need to properly handle the subcontractors table schema
    const mockSubcontractors = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        full_name: 'Alice Johnson',
        email: 'alice.johnson@example.com',
        phone: '(555) 123-4567',
        is_available: true,
        reliability_score: 4.8
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        full_name: 'Bob Wilson',
        email: 'bob.wilson@example.com',
        phone: '(555) 234-5678',
        is_available: false,
        reliability_score: 4.6
      }
    ];

    // Store in localStorage for demo purposes
    localStorage.setItem('demo_subcontractors', JSON.stringify(mockSubcontractors));

    // Create demo orders
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const demoOrders = [
      {
        customer_name: 'John Smith',
        customer_email: 'john.smith@example.com',
        customer_phone: '(555) 111-2222',
        amount: 12000, // $120.00 in cents
        status: 'confirmed',
        payment_status: 'paid',
        service_details: { service_type: 'Standard Clean' }
      },
      {
        customer_name: 'Sarah Davis',
        customer_email: 'sarah.davis@example.com',
        customer_phone: '(555) 222-3333',
        amount: 15000, // $150.00 in cents
        status: 'pending',
        payment_status: 'pending',
        service_details: { service_type: 'Deep Clean' }
      },
      {
        customer_name: 'Michael Johnson',
        customer_email: 'michael.johnson@example.com',
        customer_phone: '(555) 333-4444',
        amount: 9000, // $90.00 in cents
        status: 'confirmed',
        payment_status: 'paid',
        service_details: { service_type: 'Basic Clean' }
      }
    ];

    const { data: orderData } = await supabase
      .from('orders')
      .upsert(demoOrders, { onConflict: 'customer_email' })
      .select('id, customer_email');

    // Create demo bookings
    const demoBookings = [
      {
        order_id: orderData?.find(o => o.customer_email === 'john.smith@example.com')?.id,
        service_date: today.toISOString().split('T')[0],
        service_time: '09:00:00',
        customer_name: 'John Smith',
        customer_email: 'john.smith@example.com',
        service_address: '123 Main St, San Francisco, CA 94102',
        status: 'confirmed',
        assigned_employee_id: mockSubcontractors[0].id,
        subcontractor_payout_amount: 75.00,
        estimated_duration: 120,
        priority: 'normal'
      },
      {
        order_id: orderData?.find(o => o.customer_email === 'sarah.davis@example.com')?.id,
        service_date: tomorrow.toISOString().split('T')[0],
        service_time: '11:00:00',
        customer_name: 'Sarah Davis',
        customer_email: 'sarah.davis@example.com',
        service_address: '456 Oak Ave, Oakland, CA 94601',
        status: 'scheduled',
        assigned_employee_id: null, // Unassigned
        subcontractor_payout_amount: 90.00,
        estimated_duration: 180,
        priority: 'high'
      },
      {
        order_id: orderData?.find(o => o.customer_email === 'michael.johnson@example.com')?.id,
        service_date: today.toISOString().split('T')[0],
        service_time: '14:00:00',
        customer_name: 'Michael Johnson',
        customer_email: 'michael.johnson@example.com',
        service_address: '789 Pine St, San Jose, CA 95110',
        status: 'in_progress',
        assigned_employee_id: mockSubcontractors[1].id,
        subcontractor_payout_amount: 60.00,
        estimated_duration: 90,
        priority: 'normal'
      }
    ];

    await supabase
      .from('bookings')
      .upsert(demoBookings, { onConflict: 'customer_email,service_date' });

    // Create some completed jobs for payouts
    const completedBookings = [
      {
        service_date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        service_time: '10:00:00',
        customer_name: 'Lisa Brown',
        customer_email: 'lisa.brown@example.com',
        service_address: '321 Elm St, Berkeley, CA 94704',
        status: 'completed',
        assigned_employee_id: mockSubcontractors[0].id,
        subcontractor_payout_amount: 80.00,
        priority: 'normal'
      }
    ];

    await supabase
      .from('bookings')
      .upsert(completedBookings, { onConflict: 'customer_email,service_date' });

    // Create demo checkpoints for in-progress job
    const inProgressBooking = await supabase
      .from('bookings')
      .select('id')
      .eq('customer_email', 'michael.johnson@example.com')
      .single();

    if (inProgressBooking.data) {
      await supabase
        .from('checkpoints')
        .upsert({
          booking_id: inProgressBooking.data.id,
          subcontractor_id: mockSubcontractors[1].id,
          type: 'check_in',
          notes: 'Arrived on time, starting service',
          created_at: new Date().toISOString()
        }, { onConflict: 'booking_id,type' });
    }

    console.log('Demo data seeded successfully!');
    toast.success('Demo data created successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error seeding demo data:', error);
    toast.error('Failed to create demo data');
    return { success: false, error: error.message };
  }
};

// Helper functions
function calculateProximityScore(jobAddress: string, subCity: string, subState: string): number {
  // Simplified proximity scoring based on city match
  // In a real implementation, this would use actual distance calculation
  if (jobAddress.toLowerCase().includes(subCity.toLowerCase())) {
    return 5.0;
  }
  return 3.0; // Default score for same region
}

function formatDateForICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}