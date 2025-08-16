import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Get order_id from localStorage or URL params
    const orderId = localStorage.getItem('current_order_id') || searchParams.get('order_id');
    const sessionId = searchParams.get('session_id');

    console.log('PaymentSuccess redirect:', { orderId, sessionId });

    // Redirect to payment confirmation with proper params
    if (sessionId) {
      navigate(`/payment-confirmation?session_id=${sessionId}`, { replace: true });
    } else if (orderId) {
      navigate(`/payment-confirmation?order_id=${orderId}`, { replace: true });
    } else {
      // Fallback to instant quote for guest users
      navigate('/instant-quote', { replace: true });
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}