import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentVerificationResult {
  verified: boolean;
  checking: boolean;
  details: {
    hasPaymentId: boolean;
    status: string;
    paidAt: string | null;
  } | null;
}

/**
 * Hook to verify that a booking has a valid payment ID
 * Useful for detecting bookings that were confirmed without payment processing
 */
export function usePaymentVerification(bookingId: string | null): PaymentVerificationResult {
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);
  const [details, setDetails] = useState<PaymentVerificationResult['details']>(null);
  
  useEffect(() => {
    if (!bookingId) {
      setChecking(false);
      return;
    }

    const verify = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('square_payment_id, status, paid_at')
          .eq('id', bookingId)
          .single();
        
        if (error) {
          console.error('Payment verification error:', error);
          setVerified(false);
          setDetails(null);
        } else {
          const hasPaymentId = !!data?.square_payment_id;
          const isConfirmed = data?.status === 'confirmed';
          
          setDetails({
            hasPaymentId,
            status: data?.status || 'unknown',
            paidAt: data?.paid_at || null,
          });
          
          // Booking is verified if it has a payment ID or is in test mode
          setVerified(hasPaymentId || data?.square_payment_id?.startsWith('test_'));
          
          // Log warning if booking is confirmed without payment ID
          if (isConfirmed && !hasPaymentId) {
            console.warn('⚠️ PAYMENT INTEGRITY ISSUE: Booking confirmed without payment ID', {
              bookingId,
              status: data?.status,
              square_payment_id: data?.square_payment_id,
            });
          }
        }
      } catch (err) {
        console.error('Payment verification exception:', err);
        setVerified(false);
        setDetails(null);
      } finally {
        setChecking(false);
      }
    };
    
    verify();
  }, [bookingId]);
  
  return { verified, checking, details };
}
