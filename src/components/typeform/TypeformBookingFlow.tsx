import React, { useState, useEffect } from 'react';
import { TypeformStep } from './TypeformStep';
import { ConversationalQuestion } from './ConversationalQuestion';
import { AnswerOption } from './AnswerOption';
import { TypeformProgress } from './TypeformProgress';
import { FloatingPricingSummary } from './FloatingPricingSummary';
import { WeeklyDateGrid } from './WeeklyDateGrid';
import { TimeSlotSelector } from './TimeSlotSelector';
import { WarmUpStep } from './WarmUpStep';
import { MapPin, Home, Sparkles, Calendar, MapPinned, Phone, FileText, CreditCard, Mail, Hash, Building } from 'lucide-react';
import { getDeepCleanRecommendation } from '@/lib/booking-recommendations';
import { HomeSizeGrid } from '../pricing/HomeSizeGrid';
import { FrequencySelector } from '../pricing/FrequencySelector';
import { PropertyDetailsSelector } from '../booking/PropertyDetailsSelector';
import { DEFAULT_PRICING_CONFIG, HOME_SIZE_RANGES } from '@/lib/new-pricing-system';
import { getPriceQuote } from '@/lib/pricing-adapter';
import { applyGlobalDiscount } from '@/lib/pricing-utils';
import { PaymentForm } from '../PaymentForm';
import { PromotionalBanner } from '../booking/PromotionalBanner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { useNavigate } from 'react-router-dom';
import { validateServiceAreaZipCode, ServiceAreaValidation } from '@/lib/service-area-validation';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { navigateToOrderConfirmation } from '@/utils/routing-helpers';
import { supabase } from '@/integrations/supabase/client';
interface TypeformBookingFlowProps {
  onComplete?: () => void;
}
export function TypeformBookingFlow({
  onComplete
}: TypeformBookingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 13; // Added warm-up step
  const navigate = useNavigate();

  // Use form persistence hook
  const {
    data: bookingData,
    updateField,
    updateData,
    clearData,
    isLoading,
    lastSaved
  } = useFormPersistence({
    lastCleanedTimeline: '',
    stateCode: '',
    zipCode: '',
    email: '',
    homeSizeId: '',
    customSqFt: null as number | null,
    bedrooms: '2',
    bathrooms: '2',
    dwellingType: '',
    flooringType: '',
    serviceTypeId: '',
    frequencyId: '',
    serviceDate: null as Date | null,
    serviceTime: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    contactInfo: {
      name: '',
      email: '',
      phone: ''
    },
    specialInstructions: ''
  }, {
    storageKey: 'typeform-booking',
    debounceMs: 2000
  });

  // Calculate pricing
  const [pricing, setPricing] = useState<any>(null);

  // ZIP code validation state
  const [zipValidation, setZipValidation] = useState<ServiceAreaValidation | null>(null);

  // Show "Start Fresh" banner if there's saved data
  const [showStartFreshBanner, setShowStartFreshBanner] = useState(false);

  // Deep clean recommendation state
  const [showDeepCleanRecommendation, setShowDeepCleanRecommendation] = useState(false);
  const [deepCleanReason, setDeepCleanReason] = useState('');

  // Payment completion tracking
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  
  // Final booking submission state
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check if there's saved data when component mounts
    if (lastSaved && currentStep === 0) {
      setShowStartFreshBanner(true);
    }
  }, []);

  // Check for deep clean recommendation when lastCleanedTimeline changes
  useEffect(() => {
    if (bookingData.lastCleanedTimeline) {
      const recommendation = getDeepCleanRecommendation(bookingData.lastCleanedTimeline);
      if (recommendation.shouldRecommend) {
        setShowDeepCleanRecommendation(true);
        setDeepCleanReason(recommendation.reason);
        
        // Auto-suggest deep cleaning if urgency is high
        if (recommendation.urgency === 'high' && bookingData.serviceTypeId !== 'deep') {
          updateField('serviceTypeId', 'deep');
          toast.info('We recommend Deep Cleaning for your situation');
        }
      } else {
        setShowDeepCleanRecommendation(false);
        setDeepCleanReason('');
      }
    }
  }, [bookingData.lastCleanedTimeline]);

  // Scroll to top instantly when step changes to prevent bottom-scroll issue
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentStep]);

  // Helper to convert homeSizeId to square footage
  const getSquareFootageFromHomeSizeId = (homeSizeId: string): number => {
    const sizeMap: Record<string, number> = {
      '1000_1500': 1250,
      '1501_2000': 1750,
      '2001_2500': 2250,
      '2501_3000': 2750,
      '3001_3500': 3250,
      '3501_4000': 3750,
      '4001_4500': 4250,
      '4501_5000': 4750,
      '5000_plus': 5500
    };
    return sizeMap[homeSizeId] || 1250;
  };
  useEffect(() => {
    if (bookingData.serviceTypeId && bookingData.frequencyId && (bookingData.homeSizeId || bookingData.customSqFt) && bookingData.stateCode) {
      try {
        const sqft = bookingData.customSqFt || getSquareFootageFromHomeSizeId(bookingData.homeSizeId);
        const result = getPriceQuote({
          stateCode: bookingData.stateCode,
          sqft,
          homeSizeId: bookingData.homeSizeId,
          serviceTypeId: bookingData.serviceTypeId,
          frequencyId: bookingData.frequencyId
        });
        
        if (result) {
          // Convert to format expected by payment form
          setPricing({
            discountedPrice: result.discountedPrice,
            recurringDetails: result.recurringDetails,
            tierLabel: result.tierLabel
          });
        }
      } catch (error) {
        console.error('Pricing calculation error:', error);
      }
    }
  }, [bookingData.serviceTypeId, bookingData.frequencyId, bookingData.homeSizeId, bookingData.customSqFt, bookingData.stateCode]);
  const handleNext = () => {
    // Validation for each step
    if (currentStep === 0 && !bookingData.lastCleanedTimeline) {
      toast.error('Please select an option');
      return;
    }
    if (currentStep === 1 && !bookingData.stateCode) {
      toast.error('Please select a state');
      return;
    }
    if (currentStep === 2) {
      if (!bookingData.zipCode) {
        toast.error('Please enter your zip code');
        return;
      }
      if (!zipValidation?.isValid) {
        toast.error('Please enter a valid ZIP code in TX, CA, or NY');
        return;
      }
    }
    if (currentStep === 3 && !bookingData.serviceTypeId) {
      toast.error('Please select a service type');
      return;
    }
    if (currentStep === 4 && !bookingData.homeSizeId && !bookingData.customSqFt) {
      toast.error('Please select your home size or enter exact square footage');
      return;
    }
    if (currentStep === 5 && !bookingData.frequencyId) {
      toast.error('Please select a frequency');
      return;
    }
    if (currentStep === 6 && (!bookingData.email || !bookingData.contactInfo.name || !bookingData.contactInfo.phone)) {
      toast.error('Please fill in all contact information');
      return;
    }
    if (currentStep === 7 && !paymentCompleted) {
      toast.error('Please complete payment to continue');
      return;
    }
    if (currentStep === 8 && (!bookingData.serviceDate || !bookingData.serviceTime)) {
      toast.error('Please select both a date and time');
      return;
    }
    if (currentStep === 9 && (!bookingData.bedrooms || !bookingData.bathrooms || !bookingData.dwellingType)) {
      toast.error('Please complete property details');
      return;
    }
    if (currentStep === 10 && (!bookingData.address.street || !bookingData.address.city || !bookingData.address.zipCode)) {
      toast.error('Please fill in your address');
      return;
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalSubmit = async () => {
    if (!paymentCompleted || !paymentInfo) {
      toast.error("Payment information is missing. Please contact support.");
      setCurrentStep(7);
      return;
    }

    // Validate all required fields
    const validationErrors = [];
    if (!bookingData.serviceDate) validationErrors.push("service date");
    if (!bookingData.serviceTime) validationErrors.push("service time");
    if (!bookingData.address.street) validationErrors.push("street address");
    if (!bookingData.address.city) validationErrors.push("city");
    if (!bookingData.bedrooms) validationErrors.push("bedrooms");
    if (!bookingData.bathrooms) validationErrors.push("bathrooms");
    if (!bookingData.dwellingType) validationErrors.push("dwelling type");

    if (validationErrors.length > 0) {
      toast.error(`Please complete: ${validationErrors.join(", ")}`);
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Handle customer creation (check for duplicates)
      let customerData;
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select()
        .eq('email', bookingData.email)
        .maybeSingle();

      if (existingCustomer) {
        customerData = existingCustomer;
        console.log('✅ Using existing customer:', customerData.id);
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            email: bookingData.email,
            name: bookingData.contactInfo.name,
            phone: bookingData.contactInfo.phone,
            address_line1: bookingData.address.street,
            city: bookingData.address.city,
            postal_code: bookingData.address.zipCode || bookingData.zipCode,
            state: bookingData.stateCode
          })
          .select()
          .single();

        if (customerError) throw customerError;
        customerData = newCustomer;
        console.log('✅ Created new customer:', customerData.id);
      }

      // Step 2: Create complete booking
      const depositAmount = pricing.discountedPrice * 0.2;
      const balanceDue = pricing.discountedPrice - depositAmount;

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: customerData.id,
          stripe_payment_intent_id: paymentInfo.paymentId,
          paid_at: new Date().toISOString(),
          status: 'confirmed',
          service_type: bookingData.serviceTypeId,
          sqft_or_bedrooms: bookingData.customSqFt || 
            getSquareFootageFromHomeSizeId(bookingData.homeSizeId)?.toString(),
          frequency: bookingData.frequencyId,
          est_price: pricing.discountedPrice,
          deposit_amount: depositAmount,
          balance_due: balanceDue,
          service_date: format(bookingData.serviceDate, 'yyyy-MM-dd'),
          time_slot: bookingData.serviceTime,
          property_details: {
            bedrooms: parseInt(bookingData.bedrooms),
            bathrooms: parseInt(bookingData.bathrooms),
            dwelling_type: bookingData.dwellingType,
            flooring_type: bookingData.flooringType
          },
          zip_code: bookingData.zipCode,
          special_instructions: bookingData.specialInstructions || '',
          source_channel: 'UI_DIRECT',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (bookingError) throw bookingError;
      console.log('✅ Booking created:', booking.id);

      // Step 3: Send confirmation email
      try {
        const emailResponse = await supabase.functions.invoke('send-email-system', {
          body: {
            template: 'booking_confirmed',
            to: bookingData.email,
            data: {
              first_name: bookingData.contactInfo.name.split(' ')[0],
              service_type: bookingData.serviceTypeId,
              service_date: format(bookingData.serviceDate, 'MMM d, yyyy'),
              time_window: bookingData.serviceTime,
              manage_link: `${window.location.origin}/customer-portal?booking=${booking.id}`,
              receipt_link: `${window.location.origin}/order-confirmation/${booking.id}`,
              total_price: pricing.discountedPrice,
              deposit_paid: depositAmount,
              balance_due: balanceDue,
              address: `${bookingData.address.street}, ${bookingData.address.city}`,
              property_details: {
                bedrooms: bookingData.bedrooms,
                bathrooms: bookingData.bathrooms,
                dwelling_type: bookingData.dwellingType
              }
            },
            category: 'transactional',
            event_id: `booking_confirmed_${booking.id}`
          }
        });

        if (emailResponse.error) {
          console.error('⚠️ Email failed:', emailResponse.error);
          await supabase.from('email_jobs').insert({
            template_name: 'booking_confirmed',
            to_email: bookingData.email,
            status: 'failed',
            last_error: emailResponse.error.message,
            payload: { booking_id: booking.id, customer_id: customerData.id }
          });
        } else {
          console.log('✅ Confirmation email sent');
        }
      } catch (emailError) {
        console.error('⚠️ Email error (non-fatal):', emailError);
      }

      // Step 4: Send webhook to Zapier
      try {
        const webhookPayload = {
          booking_id: booking.id,
          customer_id: customerData.id,
          customer_name: bookingData.contactInfo.name,
          customer_email: bookingData.email,
          customer_phone: bookingData.contactInfo.phone,
          service_type: bookingData.serviceTypeId,
          service_date: format(bookingData.serviceDate, 'yyyy-MM-dd'),
          service_time: bookingData.serviceTime,
          home_size: bookingData.customSqFt || getSquareFootageFromHomeSizeId(bookingData.homeSizeId),
          frequency: bookingData.frequencyId,
          total_price: pricing.discountedPrice,
          deposit_paid: depositAmount,
          balance_due: balanceDue,
          address: {
            street: bookingData.address.street,
            city: bookingData.address.city,
            zipCode: bookingData.address.zipCode || bookingData.zipCode,
            state: bookingData.stateCode
          },
          property_details: {
            bedrooms: parseInt(bookingData.bedrooms),
            bathrooms: parseInt(bookingData.bathrooms),
            dwelling_type: bookingData.dwellingType,
            flooring_type: bookingData.flooringType
          },
          special_instructions: bookingData.specialInstructions,
          payment_id: paymentInfo.paymentId,
          timestamp: new Date().toISOString()
        };

        const webhookUrl = import.meta.env.VITE_ZAPIER_WEBHOOK_URL;
        if (webhookUrl) {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookPayload)
          });
          console.log('✅ Zapier webhook sent');
        }
      } catch (webhookError) {
        console.error('⚠️ Webhook error (non-fatal):', webhookError);
      }

      // Clear form data and navigate
      clearData();
      toast.success('🎉 Booking confirmed! Check your email for details.', { duration: 6000 });
      navigateToOrderConfirmation(navigate, booking.id);
      
    } catch (error) {
      console.error('❌ Final submission error:', error);
      toast.error('Failed to complete booking. Please contact support at (555) 123-4567', { duration: 10000 });
    } finally {
      setIsProcessing(false);
    }
  };
  const canGoNext = () => {
    switch (currentStep) {
      case 0:
        return !!bookingData.lastCleanedTimeline;
      case 1:
        return !!bookingData.stateCode;
      case 2:
        return !!bookingData.zipCode && bookingData.zipCode.length === 5 && zipValidation?.isValid === true;
      case 3:
        return !!bookingData.serviceTypeId;
      case 4:
        return !!(bookingData.homeSizeId || (bookingData.customSqFt && bookingData.customSqFt >= 500 && bookingData.customSqFt <= 10000));
      case 5:
        return !!bookingData.frequencyId;
      case 6:
        return !!(bookingData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.email) && bookingData.contactInfo.name && bookingData.contactInfo.phone);
      case 7:
        return !!paymentCompleted;
      case 8:
        return !!(bookingData.serviceDate && bookingData.serviceTime);
      case 9:
        return !!(bookingData.bedrooms && bookingData.bathrooms && bookingData.dwellingType);
      case 10:
        return !!(bookingData.address.street && bookingData.address.city && bookingData.address.zipCode);
      case 11:
        return true; // Contact info review
      case 12:
        return true; // Special instructions optional
      default:
        return false;
    }
  };
  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Start Fresh Banner - Show if saved data exists */}
      {showStartFreshBanner && currentStep === 0 && (
        <div className="max-w-4xl mx-auto px-4 pt-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium">Continue where you left off?</p>
                <p className="text-xs text-muted-foreground mt-1">
                  We found a previous booking from {lastSaved ? format(lastSaved, 'MMM d, h:mm a') : 'earlier'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearData();
                    setShowStartFreshBanner(false);
                    toast.success('Starting fresh');
                  }}
                >
                  Start Fresh
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowStartFreshBanner(false)}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Promotional Banner - Show from step 0 through step 6 (customer contact info) */}
      {currentStep >= 0 && currentStep <= 6 && (
        <div className="max-w-4xl mx-auto px-4 pt-8">
          <PromotionalBanner />
        </div>
      )}

      {/* Step 0: Warm-Up Question */}
      <TypeformStep questionNumber={0} totalSteps={totalSteps} isActive={currentStep === 0} onBack={handleBack} onNext={handleNext} canGoNext={canGoNext()} nextLabel="Continue">
        <WarmUpStep 
          value={bookingData.lastCleanedTimeline}
          onSelect={(value) => updateField('lastCleanedTimeline', value)}
        />
      </TypeformStep>

      {/* Deep Clean Recommendation Banner */}
      {showDeepCleanRecommendation && currentStep === 3 && (
        <div className="max-w-4xl mx-auto px-4 pb-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-primary">💡 Deep Cleaning Recommended</p>
              <p className="text-xs text-muted-foreground mt-1">{deepCleanReason}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 1: State Selection */}
      <TypeformStep questionNumber={1} totalSteps={totalSteps} isActive={currentStep === 1} onBack={handleBack} onNext={handleNext} canGoNext={canGoNext()} nextLabel="Continue">
        <ConversationalQuestion question="Where do you need cleaning?" description="Select your state to get accurate pricing" icon={<MapPin className="w-8 h-8" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEFAULT_PRICING_CONFIG.states.map(state => <AnswerOption key={state.code} label={state.name} icon={<MapPin className="w-6 h-6" />} isSelected={bookingData.stateCode === state.code} onClick={() => updateField('stateCode', state.code)} />)}
          </div>
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 2: Zip Code */}
      <TypeformStep questionNumber={2} totalSteps={totalSteps} isActive={currentStep === 2} onBack={handleBack} onNext={handleNext} canGoNext={canGoNext()} nextLabel="Continue">
        <ConversationalQuestion question="What's your zip code?" description="We'll use this to check service availability and provide accurate pricing" icon={<Hash className="w-8 h-8" />}>
          <div className="space-y-4">
            <Input type="text" value={bookingData.zipCode} onChange={e => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 5);
            updateField('zipCode', value);

            // Validate ZIP code when 5 digits are entered
            if (value.length === 5) {
              const validation = validateServiceAreaZipCode(value, bookingData.stateCode);
              setZipValidation(validation);
            } else {
              setZipValidation(null);
            }
          }} placeholder="12345" maxLength={5} className={`text-lg p-6 text-center text-2xl tracking-widest ${zipValidation?.isValid === false ? 'border-destructive' : ''}`} autoFocus />
            
            {/* Validation message */}
            {zipValidation?.isValid === false && <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="text-destructive text-sm">
                  {zipValidation.message}
                </div>
              </div>}
            
            {zipValidation?.isValid === true && <div className="flex items-center justify-center gap-2 text-green-600 text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Service available in your area!</span>
              </div>}
          </div>
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 3: Service Type */}
      <TypeformStep questionNumber={3} totalSteps={totalSteps} isActive={currentStep === 3} onBack={handleBack} onNext={handleNext} canGoNext={canGoNext()} nextLabel="Continue">
        <ConversationalQuestion question="What type of cleaning do you need?" description="Choose the service that best fits your needs" icon={<Sparkles className="w-8 h-8" />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEFAULT_PRICING_CONFIG.serviceTypes.map(service => {
            const descriptions: Record<string, string> = {
              regular: 'Regular maintenance cleaning',
              deep: 'Thorough deep cleaning',
              move_in_out: 'Move-in or move-out cleaning'
            };
            return <AnswerOption key={service.id} label={service.name} description={descriptions[service.id]} icon={<Sparkles className="w-6 h-6" />} isSelected={bookingData.serviceTypeId === service.id} onClick={() => updateField('serviceTypeId', service.id)} />;
          })}
          </div>
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 4: Home Size */}
      <TypeformStep questionNumber={4} totalSteps={totalSteps} isActive={currentStep === 4} onBack={handleBack} onNext={handleNext} canGoNext={canGoNext()} nextLabel="Continue">
        <ConversationalQuestion question="What size is your home?" description="Enter exact square footage for the most accurate pricing" icon={<Home className="w-8 h-8" />}>
          <HomeSizeGrid 
            selectedId={bookingData.homeSizeId} 
            customSqFt={bookingData.customSqFt}
            onSelect={id => updateField('homeSizeId', id)}
            onCustomSqFtChange={sqft => updateField('customSqFt', sqft)}
          />
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 5: Frequency */}
      <TypeformStep questionNumber={5} totalSteps={totalSteps} isActive={currentStep === 5} onBack={handleBack} onNext={handleNext} canGoNext={canGoNext()} nextLabel="Continue">
        <ConversationalQuestion question="How often would you like service?" description="Regular service gets better rates and priority scheduling" icon={<Calendar className="w-8 h-8" />}>
          <FrequencySelector selectedId={bookingData.frequencyId} onSelect={id => updateField('frequencyId', id)} />
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 6: Contact Information (Email + Name + Phone) */}
      <TypeformStep questionNumber={6} totalSteps={totalSteps} isActive={currentStep === 6} onBack={handleBack} onNext={handleNext} canGoNext={canGoNext()} nextLabel="Continue">
        <ConversationalQuestion question="How can we reach you?" description="We need this to process your secure payment" icon={<Phone className="w-8 h-8" />}>
          <Card className="p-6 space-y-4">
            <div>
              <Label htmlFor="contactEmail">Email *</Label>
              <Input 
                id="contactEmail" 
                type="email" 
                value={bookingData.email} 
                onChange={e => {
                  updateField('email', e.target.value);
                  updateField('contactInfo', { ...bookingData.contactInfo, email: e.target.value });
                }} 
                placeholder="you@example.com" 
                className="mt-2" 
              />
            </div>
            <div>
              <Label htmlFor="contactName">Full Name *</Label>
              <Input 
                id="contactName" 
                value={bookingData.contactInfo.name} 
                onChange={e => updateField('contactInfo', { ...bookingData.contactInfo, name: e.target.value })} 
                placeholder="John Doe" 
                className="mt-2" 
              />
            </div>
            <div>
              <Label htmlFor="contactPhone">Phone Number *</Label>
              <Input 
                id="contactPhone" 
                type="tel" 
                value={bookingData.contactInfo.phone} 
                onChange={e => updateField('contactInfo', { ...bookingData.contactInfo, phone: e.target.value })} 
                placeholder="(555) 123-4567" 
                className="mt-2" 
              />
            </div>
          </Card>
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 7: Payment */}
      <TypeformStep questionNumber={7} totalSteps={totalSteps} isActive={currentStep === 7} onBack={handleBack} onNext={handleNext} canGoNext={canGoNext()} nextLabel="Continue">
        <ConversationalQuestion question="Secure your booking" description={pricing ? `Total: $${pricing.discountedPrice?.toFixed(0) || '0'}` : 'Calculating price...'} icon={<CreditCard className="w-8 h-8" />}>
          {!paymentCompleted && pricing && (
            <div className="space-y-4">
              <Card className="bg-primary/5 border-primary/20 p-4">
                <p className="font-semibold text-center">🎯 Locking in your price:</p>
                <p className="text-3xl font-bold text-primary text-center mt-2">${pricing.discountedPrice?.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground text-center mt-1">After payment, we'll collect a few more details</p>
              </Card>
              <Card className="p-6">
                <PaymentForm 
                  pricingData={{
                    squareFootage: bookingData.customSqFt || getSquareFootageFromHomeSizeId(bookingData.homeSizeId),
                    cleaningType: bookingData.serviceTypeId,
                    frequency: bookingData.frequencyId,
                    addOns: [],
                    bedrooms: parseInt(bookingData.bedrooms) || 2,
                    bathrooms: parseInt(bookingData.bathrooms) || 2
                  }} 
                  calculatedPrice={pricing.discountedPrice || 0} 
                  priceBreakdown={pricing.breakdown} 
                  schedulingData={{
                    scheduledDate: '',
                    scheduledTime: ''
                  }} 
                  customerInfo={{
                    name: bookingData.contactInfo.name,
                    email: bookingData.email,
                    phone: bookingData.contactInfo.phone
                  }}
                  authorizationOnly={true}
                  onPaymentSuccess={(paymentId, paymentDetails) => {
                    console.log('✅ Payment authorized', { paymentId, paymentDetails });
                    setPaymentInfo({ 
                      paymentId, 
                      timestamp: new Date().toISOString(),
                      amount: pricing.discountedPrice * 0.2,
                      fullAmount: pricing.discountedPrice,
                      status: 'authorized',
                      ...paymentDetails 
                    });
                    setPaymentCompleted(true);
                    toast.success("✅ Payment authorized! Let's complete your booking details.", { duration: 5000 });
                    setTimeout(() => handleNext(), 1000);
                  }}
                  onPaymentError={(error) => {
                    console.error('❌ Payment failed:', error);
                    toast.error(`Payment failed: ${error.message || 'Please try again or contact support.'}`, { duration: 8000 });
                    setPaymentCompleted(false);
                    setPaymentInfo(null);
                  }}
                />
              </Card>
            </div>
          )}
          {paymentCompleted && (
            <Card className="bg-green-50 border-green-200 p-6 text-center">
              <p className="text-2xl font-semibold text-green-800 mb-2">✅ Payment Confirmed!</p>
              <p className="text-green-600">Your booking is secured. Let's complete your service details.</p>
              <Button onClick={handleNext} className="mt-4" size="lg">Continue to Details →</Button>
            </Card>
          )}
        </ConversationalQuestion>
      </TypeformStep>

      {paymentCompleted && currentStep === 8 && (
        <div className="max-w-4xl mx-auto px-4 pb-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <p className="font-semibold text-green-800">✅ Payment Confirmed!</p>
              <p className="text-sm text-green-600 mt-1">Let's schedule your cleaning service</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 8: Combined Date & Time Selection */}
      <TypeformStep questionNumber={8} totalSteps={totalSteps} isActive={currentStep === 8} onBack={handleBack} onNext={handleNext} canGoNext={canGoNext()} nextLabel="Continue">
        <ConversationalQuestion question="When would you like your first cleaning?" description="Choose your preferred date and time" icon={<Calendar className="w-8 h-8" />}>
          <div className="space-y-8">
            {/* Date Selection */}
            <WeeklyDateGrid selectedDate={bookingData.serviceDate ? new Date(bookingData.serviceDate) : null} onSelectDate={date => updateField('serviceDate', date)} />

            {/* Time Selection - Shows after date is selected */}
            {bookingData.serviceDate && <div className="pt-6 border-t">
                <TimeSlotSelector selectedTime={bookingData.serviceTime} onSelectTime={time => updateField('serviceTime', time)} />
              </div>}
          </div>
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 9: Property Details */}
      <TypeformStep questionNumber={9} totalSteps={totalSteps} isActive={currentStep === 9} onBack={handleBack} onNext={handleNext} canGoNext={canGoNext()} nextLabel="Continue">
        <ConversationalQuestion question="Tell us about your property" description="This helps us provide the best service" icon={<Building className="w-8 h-8" />}>
          <PropertyDetailsSelector 
            bedrooms={bookingData.bedrooms} 
            bathrooms={bookingData.bathrooms} 
            dwellingType={bookingData.dwellingType} 
            flooringType={bookingData.flooringType} 
            onBedroomsChange={value => updateField('bedrooms', value)} 
            onBathroomsChange={value => updateField('bathrooms', value)} 
            onDwellingTypeChange={value => updateField('dwellingType', value)} 
            onFlooringTypeChange={value => updateField('flooringType', value)} 
          />
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 10: Address */}
      <TypeformStep questionNumber={10} totalSteps={totalSteps} isActive={currentStep === 10} onBack={handleBack} onNext={handleNext} canGoNext={canGoNext()} nextLabel="Continue">
        <ConversationalQuestion question="What's the service address?" description="Where should our team arrive?" icon={<MapPinned className="w-8 h-8" />}>
          <Card className="p-6 space-y-4">
            <div>
              <Label htmlFor="street">Street Address</Label>
              <Input id="street" value={bookingData.address.street} onChange={e => updateField('address', {
              ...bookingData.address,
              street: e.target.value
            })} placeholder="123 Main St" className="mt-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={bookingData.address.city} onChange={e => updateField('address', {
                ...bookingData.address,
                city: e.target.value
              })} placeholder="Austin" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input id="zipCode" value={bookingData.address.zipCode} onChange={e => updateField('address', {
                ...bookingData.address,
                zipCode: e.target.value
              })} placeholder="78701" className="mt-2" />
              </div>
            </div>
          </Card>
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 11: Contact Info Review */}
      <TypeformStep questionNumber={11} totalSteps={totalSteps} isActive={currentStep === 11} onBack={handleBack} onNext={handleNext} canGoNext={canGoNext()} nextLabel="Continue">
        <ConversationalQuestion question="Confirm your contact information" description="Is this information correct?" icon={<Phone className="w-8 h-8" />}>
          <Card className="p-6">
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{bookingData.contactInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{bookingData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">{bookingData.contactInfo.phone}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentStep(6)} className="w-full">
              Edit Contact Info
            </Button>
          </Card>
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 12: Special Instructions */}
      <TypeformStep questionNumber={12} totalSteps={totalSteps} isActive={currentStep === 12} onBack={handleBack} onNext={handleFinalSubmit} canGoNext={canGoNext()} nextLabel="Complete Booking" isProcessing={isProcessing}>
        <ConversationalQuestion question="Any special instructions?" description="Let us know about pets, access codes, or specific requests (optional)" icon={<FileText className="w-8 h-8" />}>
          <Textarea value={bookingData.specialInstructions} onChange={e => updateField('specialInstructions', e.target.value)} placeholder="e.g., Please focus on the kitchen, we have a friendly dog..." rows={6} className="text-lg" />
        </ConversationalQuestion>
      </TypeformStep>

      {/* Floating Pricing Summary - Show from Step 5 onwards (after frequency) with proceed button */}
      {currentStep >= 5 && currentStep !== 7 && bookingData.homeSizeId && bookingData.frequencyId && (
        <FloatingPricingSummary 
          serviceTypeId={bookingData.serviceTypeId} 
          frequencyId={bookingData.frequencyId} 
          homeSizeId={bookingData.homeSizeId}
          customSqFt={bookingData.customSqFt}
          stateCode={bookingData.stateCode}
          onProceed={currentStep < totalSteps ? handleNext : undefined}
        />
      )}
      
      {/* AI Chat Assistant */}
      <ChatWidget bookingContext={{
        currentStep,
        stateCode: bookingData.stateCode,
        zipCode: bookingData.zipCode,
        serviceType: bookingData.serviceTypeId,
        homeSize: bookingData.homeSizeId,
        frequency: bookingData.frequencyId,
        estimatedPrice: pricing?.discountedPrice
      }} />
    </div>;
}