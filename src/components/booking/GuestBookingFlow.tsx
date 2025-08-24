import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, ArrowRight, Calendar, MapPin, User, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import ModernScheduler from '@/components/ModernScheduler';
import { BookingCheckoutPage } from './BookingCheckoutPage';
import { hasUsedPromoOffer, markPromoOfferUsed, CustomerData } from '@/lib/offer-tracking';

interface QuoteData {
  homeSize: string;
  serviceType: string;
  frequency: string;
  location: string;
  zipCode: string;
  quote: number;
  quoteAmount?: number;
  timestamp: string;
  squareFootage?: string;
  basePrice?: number;
  addOns?: string[];
  addOnPrices?: { [key: string]: number };
  frequencyDiscount?: number;
  offerEligible?: boolean;
  // Property details
  bedrooms?: string;
  bathrooms?: string;
  dwellingType?: string;
  flooringType?: string;
  // Date & time
  serviceDate?: string;
  serviceTime?: string;
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
  customerName?: string;
  customerEmail?: string;
  offerEligible?: boolean;
}

const steps = [
  { id: 1, title: 'Service Details', description: 'Enter your service information' },
  { id: 2, title: 'Schedule', description: 'Choose date and time' },
  { id: 3, title: 'Payment', description: 'Complete your booking' }
];

export function GuestBookingFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [showOfferUsedAlert, setShowOfferUsedAlert] = useState(false);
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
    promoDiscount: 0,
    offerEligible: true
  });

  // Load quote data from localStorage on mount
  React.useEffect(() => {
    const storedQuote = localStorage.getItem('quoteData') || localStorage.getItem('instant_quote');
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
          basePrice: quote.basePrice || quote.quote,
          totalPrice: quote.quoteAmount || quote.quote,
          addOns: quote.addOns || [],
          addOnPrices: quote.addOnPrices || {},
          frequencyDiscount: quote.frequencyDiscount || 0,
          serviceDate: quote.serviceDate || '',
          serviceTime: quote.serviceTime || '',
          offerEligible: quote.offerEligible !== undefined ? quote.offerEligible : true,
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

  // Check offer eligibility when customer details are complete
  const checkOfferEligibility = (customerData: CustomerData) => {
    const hasUsed = hasUsedPromoOffer(customerData);
    
    if (hasUsed && bookingData.offerEligible) {
      // Customer has already used the offer, update pricing to original
      setBookingData(prev => ({
        ...prev,
        offerEligible: false,
        frequencyDiscount: 0,
        // Recalculate total without discount
        totalPrice: prev.basePrice + Object.values(prev.addOnPrices).reduce((sum, price) => sum + price, 0) + (prev.nextDayFee || 0)
      }));
      
      setShowOfferUsedAlert(true);
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate step 1 fields
      if (!bookingData.address.street || !bookingData.contactNumber || !bookingData.customerName || !bookingData.customerEmail) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Check offer eligibility with complete customer data
      const customerData: CustomerData = {
        name: bookingData.customerName,
        email: bookingData.customerEmail,
        phone: bookingData.contactNumber,
        zipCode: bookingData.address.zipCode,
        address: bookingData.address.street
      };

      checkOfferEligibility(customerData);
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
    // Mark offer as used if it was eligible and used
    if (bookingData.offerEligible && bookingData.frequencyDiscount > 0) {
      const customerData: CustomerData = {
        name: bookingData.customerName,
        email: bookingData.customerEmail,
        phone: bookingData.contactNumber,
        zipCode: bookingData.address.zipCode,
        address: bookingData.address.street
      };
      markPromoOfferUsed(customerData);
    }

    toast.success('Booking confirmed! Redirecting to confirmation...');
    // Clear both possible quote data storage keys
    localStorage.removeItem('quoteData');
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
                  <h3 className="font-semibold text-primary mb-3">Your Quote</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Service:</strong> {quoteData.serviceType?.replace(/_/g, ' ')}
                      </div>
                      <div>
                        <strong>Size:</strong> {quoteData.squareFootage || quoteData.homeSize?.replace('br', ' bedroom')}
                      </div>
                      <div>
                        <strong>Frequency:</strong> {quoteData.frequency?.replace(/_/g, ' ')}
                      </div>
                      <div>
                        <strong>Total:</strong> ${quoteData.quoteAmount || quoteData.quote}
                      </div>
                    </div>
                    
                    {/* Property Details if available */}
                    {(quoteData.bedrooms || quoteData.bathrooms || quoteData.dwellingType) && (
                      <div className="border-t pt-3 mt-3">
                        <h4 className="font-medium text-sm mb-2">Property Details:</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          {quoteData.bedrooms && (
                            <div>Bedrooms: {quoteData.bedrooms}</div>
                          )}
                          {quoteData.bathrooms && (
                            <div>Bathrooms: {quoteData.bathrooms}</div>
                          )}
                          {quoteData.dwellingType && (
                            <div className="col-span-2">Type: {quoteData.dwellingType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Date & Time if pre-selected from Legacy Booking */}
                    {(quoteData.serviceDate || quoteData.serviceTime) && (
                      <div className="border-t pt-3 mt-3">
                        <h4 className="font-medium text-sm mb-2">Selected Appointment:</h4>
                        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
                          {quoteData.serviceDate && (
                            <div>Date: {new Date(quoteData.serviceDate).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}</div>
                          )}
                          {quoteData.serviceTime && (
                            <div>Time: {quoteData.serviceTime}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Add-ons if available */}
                    {quoteData.addOns && quoteData.addOns.length > 0 && (
                      <div className="border-t pt-3 mt-3">
                        <h4 className="font-medium text-sm mb-2">Add-ons:</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {quoteData.addOns.map((addOn) => (
                            <div key={addOn} className="flex justify-between">
                              <span>{addOn.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                              <span>+${quoteData.addOnPrices?.[addOn] || 0}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

               {/* Contact Information */}
               <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="customerName">Full Name *</Label>
                     <Input
                       id="customerName"
                       placeholder="John Doe"
                       value={bookingData.customerName || ''}
                       onChange={(e) => updateBookingData({ customerName: e.target.value })}
                       required
                     />
                   </div>
                   <div>
                     <Label htmlFor="customerEmail">Email Address *</Label>
                     <Input
                       id="customerEmail"
                       type="email"
                       placeholder="john@example.com"
                       value={bookingData.customerEmail || ''}
                       onChange={(e) => updateBookingData({ customerEmail: e.target.value })}
                       required
                     />
                   </div>
                 </div>

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
        // If date/time already selected in Legacy Booking, skip scheduling step
        if (bookingData.serviceDate && bookingData.serviceTime) {
          // Auto-advance to payment
          React.useEffect(() => {
            setCurrentStep(3);
          }, []);
          
          return (
            <Card className="shadow-clean">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Appointment Confirmed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-lg font-medium mb-2">Your appointment is scheduled for:</div>
                  <div className="text-xl text-primary font-bold mb-1">
                    {new Date(bookingData.serviceDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="text-lg text-primary font-semibold">
                    {bookingData.serviceTime}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Continue to payment to confirm your booking
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        }
        
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
       
       {/* Alert Dialog for Offer Already Used */}
       <AlertDialog open={showOfferUsedAlert} onOpenChange={setShowOfferUsedAlert}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Promotional Offer Already Redeemed</AlertDialogTitle>
             <AlertDialogDescription>
               Our records show that this promotional offer has already been used with your details (name, address, email, or phone number). 
               Each customer can only redeem this special offer once. You can continue with regular pricing.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogAction onClick={() => setShowOfferUsedAlert(false)}>
             Continue with Regular Pricing
           </AlertDialogAction>
         </AlertDialogContent>
       </AlertDialog>
     </div>
   );
 }