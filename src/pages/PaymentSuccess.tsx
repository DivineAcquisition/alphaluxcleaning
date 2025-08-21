import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      // Get all possible identifiers
      const sessionId = searchParams.get('session_id');
      const orderId = localStorage.getItem('current_order_id') || searchParams.get('order_id');
      const paymentIntentId = searchParams.get('payment_intent');
      const setupIntentId = searchParams.get('setup_intent');
      
      // Store debug info
      const debug = {
        sessionId,
        orderId,
        paymentIntentId,
        setupIntentId,
        allParams: Object.fromEntries(searchParams.entries()),
        localStorage: {
          current_order_id: localStorage.getItem('current_order_id'),
          booking_data: localStorage.getItem('booking_data')
        },
        timestamp: new Date().toISOString()
      };
      
      setDebugInfo(debug);
      console.log('PaymentSuccess debug info:', debug);

      // Try to find order data using any available identifier
      let orderData = null;
      
      if (sessionId) {
        console.log('Attempting to get order details with session_id:', sessionId);
        try {
          const { data, error } = await supabase.functions.invoke('get-order-details', {
            body: { session_id: sessionId }
          });
          if (data && !error) {
            orderData = data;
            console.log('Found order data via session_id:', orderData);
          }
        } catch (error) {
          console.error('Error fetching order by session_id:', error);
        }
      }
      
      if (!orderData && orderId) {
        console.log('Attempting to get order details with order_id:', orderId);
        try {
          const { data, error } = await supabase.functions.invoke('get-order-details', {
            body: { order_id: orderId }
          });
          if (data && !error) {
            orderData = data;
            console.log('Found order data via order_id:', orderData);
          }
        } catch (error) {
          console.error('Error fetching order by order_id:', error);
        }
      }

      // Clean up localStorage
      localStorage.removeItem('current_order_id');
      
      // Navigate based on what data we found
      if (orderData && orderData.order_id) {
        console.log('Navigating to service-details with order_id:', orderData.order_id);
        navigate(`/service-details?order_id=${orderData.order_id}`, { replace: true });
      } else if (sessionId) {
        console.log('Navigating to service-details with session_id:', sessionId);
        navigate(`/service-details?session_id=${sessionId}`, { replace: true });
      } else if (orderId) {
        console.log('Navigating to service-details with stored order_id:', orderId);
        navigate(`/service-details?order_id=${orderId}`, { replace: true });
      } else {
        console.log('No valid identifiers found, redirecting to instant-quote');
        // Wait a bit to show debug info if needed
        setTimeout(() => {
          navigate('/instant-quote', { replace: true });
        }, 2000);
        return; // Don't navigate immediately
      }
    };

    handlePaymentSuccess();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <div>
          <h2 className="text-xl font-semibold">Processing your payment...</h2>
          <p className="text-muted-foreground">Please wait while we redirect you to your booking details.</p>
        </div>
        
        {/* Debug info for development */}
        {debugInfo && process.env.NODE_ENV === 'development' && (
          <div className="bg-muted p-4 rounded-lg text-left text-xs">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}