import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBooking } from '@/contexts/BookingContext';

interface TrackingData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  home_size?: string;
  service_type?: string;
  frequency?: string;
  preferred_date?: string;
  preferred_time?: string;
  base_price?: number;
  session_id?: string;
  utms?: Record<string, string>;
  // Optional pricing-calculator + offer-step extras
  service_date?: string;
  time_slot?: string;
  promo_code?: string;
  sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  window_count?: number;
  total?: number;
}

export function useBookingProgress() {
  const { bookingData } = useBooking();

  const trackStep = useCallback(async (step: string, additionalData?: TrackingData) => {
    const email = bookingData.contactInfo?.email;
    
    if (!email) {
      console.log('[BookingProgress] No email available, skipping tracking');
      return;
    }

    try {
      const data: TrackingData = {
        first_name: bookingData.contactInfo?.firstName,
        last_name: bookingData.contactInfo?.lastName,
        phone: bookingData.contactInfo?.phone,
        zip_code: bookingData.zipCode,
        city: bookingData.city,
        state: bookingData.state,
        home_size: bookingData.homeSizeId,
        service_type: bookingData.serviceType,
        frequency: bookingData.frequency,
        preferred_date: bookingData.date,
        preferred_time: bookingData.timeSlot,
        base_price: bookingData.basePrice,
        ...additionalData,
      };

      // Fire and forget - don't block the UI
      supabase.functions.invoke('track-booking-progress', {
        body: {
          email,
          step,
          data
        }
      }).then(({ error }) => {
        if (error) {
          console.error('[BookingProgress] Error tracking step:', error);
        } else {
          console.log('[BookingProgress] Tracked step:', step);
        }
      });
    } catch (err) {
      console.error('[BookingProgress] Exception tracking step:', err);
    }
  }, [bookingData]);

  const markCompleted = useCallback(async (bookingId?: string) => {
    const email = bookingData.contactInfo?.email;
    
    if (!email) {
      console.log('[BookingProgress] No email available, skipping completion');
      return;
    }

    try {
      supabase.functions.invoke('track-booking-progress', {
        body: {
          email,
          step: 'completed',
          data: {
            converted_booking_id: bookingId
          }
        }
      }).then(({ error }) => {
        if (error) {
          console.error('[BookingProgress] Error marking completed:', error);
        } else {
          console.log('[BookingProgress] Marked as completed');
        }
      });
    } catch (err) {
      console.error('[BookingProgress] Exception marking completed:', err);
    }
  }, [bookingData.contactInfo?.email]);

  return {
    trackStep,
    markCompleted
  };
}