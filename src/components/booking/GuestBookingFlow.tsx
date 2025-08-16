import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Calendar, MapPin, User, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import ModernScheduler from '@/components/ModernScheduler';
import { BookingCheckoutPage } from './BookingCheckoutPage';

interface QuoteData {
  homeSize: string;
  serviceType: string;
  frequency: string;
  location: string;
  zipCode: string;
  quote: number;
  timestamp: string;
}

interface BookingData {
  homeSize: string;
  serviceType: string;
  frequency: string;
  addOns: string[];
  serviceDate: string;
  serviceTime: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  contactNumber: string;
  specialInstructions: string;
  basePrice: number;
  addOnPrices: { [key: string]: number };
  frequencyDiscount: number;
  totalPrice: number;
  paymentType: 'pay_after_service' | '25_percent_with_discount';
  promoDiscount: number;
  nextDayFee?: number;
}

const steps = [
  { id: 1, title: 'Service Details', description: 'Enter your service information' },
  { id: 2, title: 'Schedule', description: 'Choose date and time' },
  { id: 3, title: 'Payment', description: 'Complete your booking' }
];

export function GuestBookingFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [bookingData, setBookingData] = useState<BookingData>({
    homeSize: '',
    serviceType: '',
    frequency: '',
    addOns: [],
    serviceDate: '',
    serviceTime: '',
    address: {
      street: '',
      city: '',
      state: 'CA',
      zipCode: ''
    },
    contactNumber: '',
    specialInstructions: '',
    basePrice: 0,
    addOnPrices: {},
    frequencyDiscount: 0,
    totalPrice: 0,
    paymentType: 'pay_after_service',
    promoDiscount: 0
  });

  // Load quote data from localStorage on mount
  React.useEffect(() => {
    const storedQuote = localStorage.getItem('instant_quote');
    if (storedQuote) {
      try {
        const quote = JSON.parse(storedQuote);
        setQuoteData(quote);
        
        // Pre-fill booking data with quote information
        setBookingData(prev => ({
          ...prev,
          homeSize: quote.homeSize,
          serviceType: quote.serviceType,
          frequency: quote.frequency,
          basePrice: quote.quote,
          totalPrice: quote.quote,
          address: {
            ...prev.address,
            city: quote.location || '',
            zipCode: quote.zipCode || ''
          }
        }));
      } catch (error) {
        console.error('Failed to parse quote data:', error);
        toast.error('Quote data not found. Please start over.');
      }
    } else {
      toast.error('No quote found. Please get a quote first.');
    }
  }, []);

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate step 1 fields
      if (!bookingData.address.street || !bookingData.contactNumber) {
        toast.error('Please fill in all required fields');
        return;
      }
    }
    
    if (currentStep === 2) {
      // Validate step 2 fields
      if (!bookingData.serviceDate || !bookingData.serviceTime) {
        toast.error('Please select a date and time');
        return;
      }
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handlePaymentSuccess = (sessionId: string) => {
    toast.success('Booking confirmed! Redirecting to confirmation...');
    // Clear the stored quote data
    localStorage.removeItem('instant_quote');
    // Redirect to confirmation page
    window.location.href = `/booking-confirmation?session_id=${sessionId}`;
  };

  const handleSchedulingComplete = (data: { scheduled_date: string; scheduled_time: string }) => {
    updateBookingData({
      serviceDate: data.scheduled_date,
      serviceTime: data.scheduled_time
    });
    handleNext();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="shadow-clean">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Service Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quote Summary */}
              {quoteData && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-semibold text-primary mb-2">Your Quote</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Service:</strong> {quoteData.serviceType?.replace(/_/g, ' ')}
                    </div>
                    <div>
                      <strong>Size:</strong> {quoteData.homeSize?.replace('br', ' bedroom')}
                    </div>
                    <div>
                      <strong>Frequency:</strong> {quoteData.frequency?.replace(/_/g, ' ')}
                    </div>
                    <div>
                      <strong>Total:</strong> ${quoteData.quote}
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="contactNumber">Phone Number *</Label>
                  <Input
                    id="contactNumber"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={bookingData.contactNumber}
                    onChange={(e) => updateBookingData({ contactNumber: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    placeholder="123 Main Street"
                    value={bookingData.address.street}
                    onChange={(e) => updateBookingData({ 
                      address: { ...bookingData.address, street: e.target.value }
                    })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="San Francisco"
                      value={bookingData.address.city}
                      onChange={(e) => updateBookingData({ 
                        address: { ...bookingData.address, city: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      placeholder="94102"
                      value={bookingData.address.zipCode}
                      onChange={(e) => updateBookingData({ 
                        address: { ...bookingData.address, zipCode: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
                  <Textarea
                    id="specialInstructions"
                    placeholder="Any special instructions for our cleaners..."
                    value={bookingData.specialInstructions}
                    onChange={(e) => updateBookingData({ specialInstructions: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="shadow-clean">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule Your Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ModernScheduler
                serviceType={bookingData.serviceType}
                onComplete={handleSchedulingComplete}
              />
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <BookingCheckoutPage
            bookingData={bookingData}
            updateBookingData={updateBookingData}
            onPaymentSuccess={handlePaymentSuccess}
            onBack={handleBack}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                    ${currentStep >= step.id 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-muted-foreground text-muted-foreground'
                    }
                  `}>
                    {step.id}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-4 ${
                      currentStep > step.id ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation Buttons */}
          {currentStep < 3 && (
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              
              <Button
                onClick={handleNext}
                className="flex items-center gap-2"
              >
                {currentStep === 2 ? 'Continue to Payment' : 'Next'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}