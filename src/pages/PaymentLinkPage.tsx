import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InstantPaymentForm } from '@/components/ui/instant-payment-form';
import { Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentLinkPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<any>(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            customers (
              email,
              first_name,
              last_name,
              phone
            )
          `)
          .eq('id', bookingId)
          .single();

        if (error) throw error;

        if (data.payment_status === 'paid' || data.status === 'confirmed') {
          setPaid(true);
        } else {
          setBookingData(data);
        }
      } catch (error: any) {
        console.error('Error fetching booking:', error);
        toast.error('Booking not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, navigate]);

  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      // Update booking status
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          square_payment_id: paymentId,
        })
        .eq('id', bookingId);

      if (error) throw error;

      setPaid(true);
      toast.success('Payment successful! You will receive a confirmation email shortly.');
    } catch (error: any) {
      console.error('Error updating booking:', error);
      toast.error('Payment processed but status update failed. Please contact support.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle>Payment Already Completed</CardTitle>
            <CardDescription>
              This booking has already been paid for. You should receive a confirmation email shortly.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!bookingData) {
    return null;
  }

  const customer = bookingData.customers;
  const offerName = bookingData.offer_name || 'Deep Clean Service';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Your Payment</h1>
          <p className="text-muted-foreground">Secure payment for your {offerName}</p>
        </div>

        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service:</span>
                <span className="font-medium">{offerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">
                  {customer?.first_name} {customer?.last_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Address:</span>
                <span className="font-medium">{bookingData.address_line1}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Total Price:</span>
                <span className="font-semibold">${bookingData.est_price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Today (25% Deposit):</span>
                <span className="font-bold text-primary text-lg">
                  ${bookingData.deposit_amount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balance Due After Service:</span>
                <span className="font-medium">${bookingData.balance_due}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <InstantPaymentForm
          paymentAmount={bookingData.deposit_amount}
          fullAmount={bookingData.est_price}
          paymentType="deposit"
          customerEmail={customer?.email || ''}
          customerName={`${customer?.first_name} ${customer?.last_name}`}
          customerPhone={customer?.phone || ''}
          bookingId={bookingId!}
          onSuccess={handlePaymentSuccess}
          onCancel={() => navigate('/')}
        />

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>🔒 Secure payment powered by Square</p>
          <p className="mt-2">Questions? Call us at (214) 919-7134</p>
        </div>
      </div>
    </div>
  );
}
