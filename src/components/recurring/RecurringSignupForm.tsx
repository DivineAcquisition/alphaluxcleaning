import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, TrendingDown } from 'lucide-react';
import { SavingsCalculator } from './SavingsCalculator';
import { EmbeddedSquarePaymentForm } from '@/components/booking/EmbeddedSquarePaymentForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RecurringSignupFormProps {
  booking: {
    id: string;
    service_type: string;
    est_price: number;
    property_details: any;
    customers: {
      id: string;
      name: string;
      email: string;
      phone: string;
      address_line1: string;
      address_line2?: string;
      city: string;
      state: string;
      postal_code: string;
    };
  };
}

type Frequency = 'weekly' | 'bi-weekly' | 'monthly';

const DISCOUNT_RATES = {
  weekly: 0.15,
  'bi-weekly': 0.10,
  monthly: 0.05,
};

const FREQUENCY_LABELS = {
  weekly: 'Weekly',
  'bi-weekly': 'Bi-Weekly',
  monthly: 'Monthly',
};

export function RecurringSignupForm({ booking }: RecurringSignupFormProps) {
  const navigate = useNavigate();
  const [selectedFrequency, setSelectedFrequency] = useState<Frequency>('weekly');
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const basePrice = booking.est_price;
  const discountRate = DISCOUNT_RATES[selectedFrequency];
  const recurringPrice = basePrice * (1 - discountRate);
  const savingsPerVisit = basePrice - recurringPrice;

  const handleContinue = () => {
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentMethodId: string) => {
    setIsProcessing(true);
    
    try {
      // Create recurring service via edge function
      const { data, error } = await supabase.functions.invoke('create-recurring-service', {
        body: {
          customerId: booking.customers.id,
          bookingId: booking.id,
          frequency: selectedFrequency,
          serviceType: booking.service_type,
          pricePerService: recurringPrice,
          discountPercentage: discountRate * 100,
          paymentMethodId,
          serviceAddress: {
            street: booking.customers.address_line1,
            street2: booking.customers.address_line2,
            city: booking.customers.city,
            state: booking.customers.state,
            postalCode: booking.customers.postal_code,
          },
          propertyDetails: booking.property_details,
        },
      });

      if (error) throw error;

      toast.success('🎉 Recurring service activated!');
      
      // Redirect to recurring services page
      setTimeout(() => {
        navigate('/recurring-services?success=true');
      }, 1500);
    } catch (error: any) {
      console.error('Error creating recurring service:', error);
      toast.error(error.message || 'Failed to set up recurring service');
      setIsProcessing(false);
    }
  };

  if (showPayment) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Authorize Payment Method</h2>
          <p className="text-muted-foreground mb-4">
            We'll securely save your payment method for automatic billing. Your first service will be charged on the scheduled date.
          </p>
          
          <div className="mb-6 p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Service:</span>
              <span>{booking.service_type.charAt(0).toUpperCase() + booking.service_type.slice(1)} Cleaning</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Frequency:</span>
              <span>{FREQUENCY_LABELS[selectedFrequency]}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Price per visit:</span>
              <span className="text-xl font-bold">${recurringPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span className="font-medium">You save:</span>
              <span className="font-bold">${savingsPerVisit.toFixed(2)} per visit</span>
            </div>
          </div>

          <EmbeddedSquarePaymentForm
            paymentAmount={0.50}
            fullAmount={recurringPrice}
            paymentType="deposit"
            onSuccess={handlePaymentSuccess}
            onCancel={() => setShowPayment(false)}
            customerEmail={booking.customers.email}
            customerName={booking.customers.name}
            customerPhone={booking.customers.phone}
            bookingId={booking.id}
          />
        </Card>

        {isProcessing && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="p-8 text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <h3 className="text-xl font-semibold">Setting up your recurring service...</h3>
              <p className="text-muted-foreground">This will only take a moment</p>
            </Card>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Frequency Selection */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-center">Choose Your Schedule</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Weekly */}
          <button
            onClick={() => setSelectedFrequency('weekly')}
            className={`relative group ${selectedFrequency === 'weekly' ? 'ring-2 ring-primary' : ''}`}
          >
            <Card className="p-6 h-full transition-all hover:shadow-lg">
              {selectedFrequency === 'weekly' && (
                <Badge className="absolute -top-2 -right-2">Selected</Badge>
              )}
              <div className="text-center space-y-3">
                <Badge variant="destructive" className="mb-2">🔥 BEST VALUE</Badge>
                <h3 className="text-xl font-bold">Weekly</h3>
                <div className="text-3xl font-bold text-primary">
                  ${(basePrice * 0.85).toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">per visit</p>
                <Badge variant="secondary" className="text-lg">Save 15%</Badge>
                <p className="text-sm text-muted-foreground">~4x per month</p>
                <div className="pt-3 border-t">
                  <p className="text-sm font-semibold text-green-600">
                    Save ${((basePrice * 0.15) * 4 * 12).toFixed(0)}/year
                  </p>
                </div>
              </div>
            </Card>
          </button>

          {/* Bi-Weekly */}
          <button
            onClick={() => setSelectedFrequency('bi-weekly')}
            className={`relative group ${selectedFrequency === 'bi-weekly' ? 'ring-2 ring-primary' : ''}`}
          >
            <Card className="p-6 h-full transition-all hover:shadow-lg">
              {selectedFrequency === 'bi-weekly' && (
                <Badge className="absolute -top-2 -right-2">Selected</Badge>
              )}
              <div className="text-center space-y-3">
                <Badge variant="secondary" className="mb-2">💼 POPULAR</Badge>
                <h3 className="text-xl font-bold">Bi-Weekly</h3>
                <div className="text-3xl font-bold text-primary">
                  ${(basePrice * 0.90).toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">per visit</p>
                <Badge variant="secondary" className="text-lg">Save 10%</Badge>
                <p className="text-sm text-muted-foreground">~2x per month</p>
                <div className="pt-3 border-t">
                  <p className="text-sm font-semibold text-green-600">
                    Save ${((basePrice * 0.10) * 2 * 12).toFixed(0)}/year
                  </p>
                </div>
              </div>
            </Card>
          </button>

          {/* Monthly */}
          <button
            onClick={() => setSelectedFrequency('monthly')}
            className={`relative group ${selectedFrequency === 'monthly' ? 'ring-2 ring-primary' : ''}`}
          >
            <Card className="p-6 h-full transition-all hover:shadow-lg">
              {selectedFrequency === 'monthly' && (
                <Badge className="absolute -top-2 -right-2">Selected</Badge>
              )}
              <div className="text-center space-y-3">
                <Badge variant="outline" className="mb-2">🏠 FLEXIBLE</Badge>
                <h3 className="text-xl font-bold">Monthly</h3>
                <div className="text-3xl font-bold text-primary">
                  ${(basePrice * 0.95).toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">per visit</p>
                <Badge variant="secondary" className="text-lg">Save 5%</Badge>
                <p className="text-sm text-muted-foreground">1x per month</p>
                <div className="pt-3 border-t">
                  <p className="text-sm font-semibold text-green-600">
                    Save ${((basePrice * 0.05) * 12).toFixed(0)}/year
                  </p>
                </div>
              </div>
            </Card>
          </button>
        </div>
      </div>

      {/* Savings Calculator */}
      <SavingsCalculator
        basePrice={basePrice}
        frequency={selectedFrequency}
        discountRate={discountRate}
      />

      {/* Service Details */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Your Service Details
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Service Type:</span>
            <span className="font-medium">
              {booking.service_type.charAt(0).toUpperCase() + booking.service_type.slice(1)} Cleaning
            </span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Address:</span>
            <span className="font-medium text-right">
              {booking.customers.address_line1}<br />
              {booking.customers.city}, {booking.customers.state} {booking.customers.postal_code}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Frequency:</span>
            <span className="font-medium">{FREQUENCY_LABELS[selectedFrequency]}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Next Service:</span>
            <span className="font-medium">To be scheduled</span>
          </div>
        </div>
      </Card>

      {/* CTA */}
      <Card className="p-6 bg-primary text-primary-foreground">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <TrendingDown className="h-6 w-6 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold mb-2">
                You're saving ${savingsPerVisit.toFixed(2)} per visit!
              </h3>
              <p className="text-primary-foreground/90">
                Set up your recurring service now and never worry about cleaning again. 
                You can pause or cancel anytime with no penalties.
              </p>
            </div>
          </div>
          <Button 
            size="lg" 
            className="w-full bg-background text-foreground hover:bg-background/90"
            onClick={handleContinue}
          >
            Continue to Payment
          </Button>
        </div>
      </Card>
    </div>
  );
}
