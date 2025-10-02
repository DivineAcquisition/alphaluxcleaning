import React, { useState, useEffect } from 'react';
import { TypeformStep } from './TypeformStep';
import { ConversationalQuestion } from './ConversationalQuestion';
import { AnswerOption } from './AnswerOption';
import { TypeformProgress } from './TypeformProgress';
import { MapPin, Home, Sparkles, Calendar, Clock, MapPinned, Phone, FileText, CreditCard, Mail, Hash } from 'lucide-react';
import { HomeSizeGrid } from '../pricing/HomeSizeGrid';
import { FrequencySelector } from '../pricing/FrequencySelector';
import { DEFAULT_PRICING_CONFIG } from '@/lib/new-pricing-system';
import { calculateNewPricing } from '@/lib/new-pricing-system';
import { applyGlobalDiscount } from '@/lib/pricing-utils';
import { PaymentForm } from '../PaymentForm';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TypeformBookingFlowProps {
  onComplete?: () => void;
}

export function TypeformBookingFlow({ onComplete }: TypeformBookingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 12;

  // Booking data with localStorage persistence
  const [stateCode, setStateCode] = useState(() => localStorage.getItem('booking_state') || '');
  const [zipCode, setZipCode] = useState(() => localStorage.getItem('booking_zipCode') || '');
  const [email, setEmail] = useState(() => localStorage.getItem('booking_email') || '');
  const [homeSizeId, setHomeSizeId] = useState(() => localStorage.getItem('booking_homeSizeId') || '');
  const [serviceTypeId, setServiceTypeId] = useState(() => localStorage.getItem('booking_serviceTypeId') || '');
  const [frequencyId, setFrequencyId] = useState(() => localStorage.getItem('booking_frequencyId') || '');
  const [serviceDate, setServiceDate] = useState<Date | undefined>(() => {
    const saved = localStorage.getItem('booking_serviceDate');
    return saved ? new Date(saved) : undefined;
  });
  const [serviceTime, setServiceTime] = useState(() => localStorage.getItem('booking_serviceTime') || '');
  const [address, setAddress] = useState(() => {
    const saved = localStorage.getItem('booking_address');
    return saved ? JSON.parse(saved) : { street: '', city: '', state: '', zipCode: '' };
  });
  const [contactInfo, setContactInfo] = useState(() => {
    const saved = localStorage.getItem('booking_contactInfo');
    return saved ? JSON.parse(saved) : { name: '', email: '', phone: '' };
  });
  const [specialInstructions, setSpecialInstructions] = useState(() => localStorage.getItem('booking_specialInstructions') || '');

  // Calculate pricing
  const [pricing, setPricing] = useState<any>(null);

  // Persist data to localStorage
  useEffect(() => {
    if (stateCode) localStorage.setItem('booking_state', stateCode);
  }, [stateCode]);

  useEffect(() => {
    if (zipCode) localStorage.setItem('booking_zipCode', zipCode);
  }, [zipCode]);

  useEffect(() => {
    if (email) localStorage.setItem('booking_email', email);
  }, [email]);

  useEffect(() => {
    if (homeSizeId) localStorage.setItem('booking_homeSizeId', homeSizeId);
  }, [homeSizeId]);

  useEffect(() => {
    if (serviceTypeId) localStorage.setItem('booking_serviceTypeId', serviceTypeId);
  }, [serviceTypeId]);

  useEffect(() => {
    if (frequencyId) localStorage.setItem('booking_frequencyId', frequencyId);
  }, [frequencyId]);

  useEffect(() => {
    if (serviceDate) localStorage.setItem('booking_serviceDate', serviceDate.toISOString());
  }, [serviceDate]);

  useEffect(() => {
    if (serviceTime) localStorage.setItem('booking_serviceTime', serviceTime);
  }, [serviceTime]);

  useEffect(() => {
    localStorage.setItem('booking_address', JSON.stringify(address));
  }, [address]);

  useEffect(() => {
    localStorage.setItem('booking_contactInfo', JSON.stringify(contactInfo));
  }, [contactInfo]);

  useEffect(() => {
    if (specialInstructions) localStorage.setItem('booking_specialInstructions', specialInstructions);
  }, [specialInstructions]);

  // Pre-fill address and contact info
  useEffect(() => {
    if (stateCode && zipCode) {
      setAddress(prev => ({ ...prev, state: stateCode, zipCode: zipCode }));
    }
  }, [stateCode, zipCode]);

  useEffect(() => {
    if (email) {
      setContactInfo(prev => ({ ...prev, email: email }));
    }
  }, [email]);

  useEffect(() => {
    if (homeSizeId && serviceTypeId && frequencyId && stateCode) {
      try {
        const result = calculateNewPricing(homeSizeId, serviceTypeId, frequencyId, stateCode);
        const discountedResult = {
          ...result,
          finalPrice: applyGlobalDiscount(result.finalPrice)
        };
        setPricing(discountedResult);
      } catch (error) {
        console.error('Pricing calculation error:', error);
      }
    }
  }, [homeSizeId, serviceTypeId, frequencyId, stateCode]);

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 1 && !stateCode) {
      toast.error('Please select a state');
      return;
    }
    if (currentStep === 2 && !zipCode) {
      toast.error('Please enter your zip code');
      return;
    }
    if (currentStep === 3 && !email) {
      toast.error('Please enter your email');
      return;
    }
    if (currentStep === 4 && !homeSizeId) {
      toast.error('Please select your home size');
      return;
    }
    if (currentStep === 5 && !serviceTypeId) {
      toast.error('Please select a service type');
      return;
    }
    if (currentStep === 6 && !frequencyId) {
      toast.error('Please select a frequency');
      return;
    }
    if (currentStep === 7 && !serviceDate) {
      toast.error('Please select a date');
      return;
    }
    if (currentStep === 8 && !serviceTime) {
      toast.error('Please select a time');
      return;
    }
    if (currentStep === 9 && (!address.street || !address.city || !address.zipCode)) {
      toast.error('Please fill in your address');
      return;
    }
    if (currentStep === 10 && (!contactInfo.name || !contactInfo.email || !contactInfo.phone)) {
      toast.error('Please fill in your contact information');
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1: return !!stateCode;
      case 2: return !!zipCode && zipCode.length === 5;
      case 3: return !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      case 4: return !!homeSizeId;
      case 5: return !!serviceTypeId;
      case 6: return !!frequencyId;
      case 7: return !!serviceDate;
      case 8: return !!serviceTime;
      case 9: return !!(address.street && address.city && address.zipCode);
      case 10: return !!(contactInfo.name && contactInfo.email && contactInfo.phone);
      case 11: return true; // Special instructions are optional
      case 12: return !!pricing;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Step 1: State Selection */}
      <TypeformStep questionNumber={1} totalSteps={totalSteps} isActive={currentStep === 1}>
        <ConversationalQuestion
          question="Where do you need cleaning?"
          description="Select your state to get accurate pricing"
          icon={<MapPin className="w-8 h-8" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEFAULT_PRICING_CONFIG.states.map((state) => (
              <AnswerOption
                key={state.code}
                label={state.name}
                icon={<MapPin className="w-6 h-6" />}
                isSelected={stateCode === state.code}
                onClick={() => setStateCode(state.code)}
              />
            ))}
          </div>
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 2: Zip Code */}
      <TypeformStep questionNumber={2} totalSteps={totalSteps} isActive={currentStep === 2}>
        <ConversationalQuestion
          question="What's your zip code?"
          description="We'll use this to check service availability and provide accurate pricing"
          icon={<Hash className="w-8 h-8" />}
        >
          <Input
            type="text"
            value={zipCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 5);
              setZipCode(value);
            }}
            placeholder="12345"
            maxLength={5}
            className="text-lg p-6 text-center text-2xl tracking-widest"
            autoFocus
          />
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 3: Email */}
      <TypeformStep questionNumber={3} totalSteps={totalSteps} isActive={currentStep === 3}>
        <ConversationalQuestion
          question="What's your email?"
          description="We'll send your booking confirmation and updates here"
          icon={<Mail className="w-8 h-8" />}
        >
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="text-lg p-6"
            autoFocus
          />
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 4: Home Size */}
      <TypeformStep questionNumber={4} totalSteps={totalSteps} isActive={currentStep === 4}>
        <ConversationalQuestion
          question="What size is your home?"
          description="This helps us provide accurate pricing and timing"
          icon={<Home className="w-8 h-8" />}
        >
          <HomeSizeGrid
            selectedId={homeSizeId}
            onSelect={setHomeSizeId}
          />
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 5: Service Type */}
      <TypeformStep questionNumber={5} totalSteps={totalSteps} isActive={currentStep === 5}>
        <ConversationalQuestion
          question="What type of cleaning do you need?"
          description="Choose the service that best fits your needs"
          icon={<Sparkles className="w-8 h-8" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEFAULT_PRICING_CONFIG.serviceTypes.map((service) => {
              const descriptions: Record<string, string> = {
                standard: 'Regular maintenance cleaning',
                deep: 'Thorough deep cleaning',
                move_in_out: 'Move-in or move-out cleaning'
              };
              
              return (
                <AnswerOption
                  key={service.id}
                  label={service.name}
                  description={descriptions[service.id]}
                  icon={<Sparkles className="w-6 h-6" />}
                  isSelected={serviceTypeId === service.id}
                  onClick={() => setServiceTypeId(service.id)}
                />
              );
            })}
          </div>
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 6: Frequency */}
      <TypeformStep questionNumber={6} totalSteps={totalSteps} isActive={currentStep === 6}>
        <ConversationalQuestion
          question="How often would you like service?"
          description="Regular service gets better rates and priority scheduling"
          icon={<Calendar className="w-8 h-8" />}
        >
          <FrequencySelector
            selectedId={frequencyId}
            onSelect={setFrequencyId}
          />
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 7: Date Selection */}
      <TypeformStep questionNumber={7} totalSteps={totalSteps} isActive={currentStep === 7}>
        <ConversationalQuestion
          question="When would you like your first cleaning?"
          description="Choose a date that works best for you"
          icon={<Calendar className="w-8 h-8" />}
        >
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal text-lg p-6 h-auto",
                  !serviceDate && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-5 w-5" />
                {serviceDate ? format(serviceDate, "PPPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <CalendarComponent
                mode="single"
                selected={serviceDate}
                onSelect={setServiceDate}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 8: Time Selection */}
      <TypeformStep questionNumber={8} totalSteps={totalSteps} isActive={currentStep === 8}>
        <ConversationalQuestion
          question="What time works best?"
          description="Select your preferred time slot"
          icon={<Clock className="w-8 h-8" />}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM'].map((time) => (
              <AnswerOption
                key={time}
                label={time}
                icon={<Clock className="w-6 h-6" />}
                isSelected={serviceTime === time}
                onClick={() => setServiceTime(time)}
              />
            ))}
          </div>
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 9: Address */}
      <TypeformStep questionNumber={9} totalSteps={totalSteps} isActive={currentStep === 9}>
        <ConversationalQuestion
          question="What's the service address?"
          description="Where should our team arrive?"
          icon={<MapPinned className="w-8 h-8" />}
        >
          <Card className="p-6 space-y-4">
            <div>
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                placeholder="123 Main St"
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  placeholder="Austin"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={address.zipCode}
                  onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                  placeholder="78701"
                  className="mt-2"
                />
              </div>
            </div>
          </Card>
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 10: Contact Info */}
      <TypeformStep questionNumber={10} totalSteps={totalSteps} isActive={currentStep === 10}>
        <ConversationalQuestion
          question="How can we reach you?"
          description="We'll send your booking confirmation here"
          icon={<Phone className="w-8 h-8" />}
        >
          <Card className="p-6 space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={contactInfo.name}
                onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                placeholder="John Doe"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={contactInfo.email}
                onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                placeholder="john@example.com"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={contactInfo.phone}
                onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="mt-2"
              />
            </div>
          </Card>
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 11: Special Instructions */}
      <TypeformStep questionNumber={11} totalSteps={totalSteps} isActive={currentStep === 11}>
        <ConversationalQuestion
          question="Any special instructions?"
          description="Let us know about pets, access codes, or specific requests (optional)"
          icon={<FileText className="w-8 h-8" />}
        >
          <Textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="e.g., Please focus on the kitchen, we have a friendly dog..."
            rows={6}
            className="text-lg"
          />
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 12: Payment */}
      <TypeformStep questionNumber={12} totalSteps={totalSteps} isActive={currentStep === 12}>
        <ConversationalQuestion
          question="Ready to book?"
          description={pricing ? `Total: $${pricing.finalPrice.toFixed(2)}` : 'Calculating price...'}
          icon={<CreditCard className="w-8 h-8" />}
        >
          {pricing && (
            <Card className="p-6">
              <PaymentForm
                pricingData={{
                  squareFootage: parseInt(homeSizeId.split('_')[0]) || 1500,
                  cleaningType: serviceTypeId,
                  frequency: frequencyId,
                  addOns: [],
                  bedrooms: 2,
                  bathrooms: 2,
                }}
                calculatedPrice={pricing.finalPrice}
                priceBreakdown={pricing.breakdown}
                schedulingData={{
                  scheduledDate: serviceDate ? format(serviceDate, 'yyyy-MM-dd') : '',
                  scheduledTime: serviceTime,
                }}
              />
            </Card>
          )}
        </ConversationalQuestion>
      </TypeformStep>

      {/* Progress Bar */}
      <TypeformProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={handleBack}
        onNext={handleNext}
        canGoNext={canGoNext()}
        nextLabel={currentStep === totalSteps ? 'Complete Booking' : 'Continue'}
      />
    </div>
  );
}
