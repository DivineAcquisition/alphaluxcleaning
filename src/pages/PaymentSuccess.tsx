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
      let foundIdentifier = null;
      
      // Try session_id first
      if (sessionId) {
        console.log('Attempting to get order details with session_id:', sessionId);
        try {
          const { data, error } = await supabase.functions.invoke('get-order-details', {
            body: { session_id: sessionId }
          });
          if (data?.order && !error) {
            orderData = data.order;
            foundIdentifier = 'session_id';
            console.log('Found order data via session_id:', orderData);
          } else {
            console.log('No order found via session_id, error:', error);
          }
        } catch (error) {
          console.error('Error fetching order by session_id:', error);
        }
      }
      
      // Try order_id if session_id failed
      if (!orderData && orderId) {
        console.log('Attempting to get order details with order_id:', orderId);
        try {
          const { data, error } = await supabase.functions.invoke('get-order-details', {
            body: { order_id: orderId }
          });
          if (data?.order && !error) {
            orderData = data.order;
            foundIdentifier = 'order_id';
            console.log('Found order data via order_id:', orderData);
          } else {
            console.log('No order found via order_id, error:', error);
          }
        } catch (error) {
          console.error('Error fetching order by order_id:', error);
        }
      }

      // Try payment_intent if both failed
      if (!orderData && paymentIntentId) {
        console.log('Attempting to get order details with payment_intent:', paymentIntentId);
        try {
          const { data, error } = await supabase.functions.invoke('get-order-details', {
            body: { payment_intent: paymentIntentId }
          });
          if (data?.order && !error) {
            orderData = data.order;
            foundIdentifier = 'payment_intent';
            console.log('Found order data via payment_intent:', orderData);
          } else {
            console.log('No order found via payment_intent, error:', error);
          }
        } catch (error) {
          console.error('Error fetching order by payment_intent:', error);
        }
      }

      // Try setup_intent if all others failed
      if (!orderData && setupIntentId) {
        console.log('Attempting to get order details with setup_intent:', setupIntentId);
        try {
          const { data, error } = await supabase.functions.invoke('get-order-details', {
            body: { setup_intent: setupIntentId }
          });
          if (data?.order && !error) {
            orderData = data.order;
            foundIdentifier = 'setup_intent';
            console.log('Found order data via setup_intent:', orderData);
          } else {
            console.log('No order found via setup_intent, error:', error);
          }
        } catch (error) {
          console.error('Error fetching order by setup_intent:', error);
        }
      }
      
      // Navigate based on what data we found
      if (orderData && orderData.id) {
        console.log('✅ Navigating to order-status-confirmation with order_id:', orderData.id, 'found via:', foundIdentifier);
        // Clean up localStorage only on success
        localStorage.removeItem('current_order_id');
        navigate(`/order-status-confirmation?order_id=${orderData.id}`, { replace: true });
      } else {
        console.log('❌ No valid order data found, redirecting to guest-booking after delay');
        console.log('Available identifiers were:', { sessionId, orderId, paymentIntentId, setupIntentId });
        // Wait a bit to show debug info if needed
        setTimeout(() => {
          navigate('/guest-booking', { replace: true });
        }, 3000);
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