import React, { useState, useEffect } from 'react';
import { TypeformStep } from './TypeformStep';
import { ConversationalQuestion } from './ConversationalQuestion';
import { AnswerOption } from './AnswerOption';
import { TypeformProgress } from './TypeformProgress';
import { FloatingPricingSummary } from './FloatingPricingSummary';
import { MapPin, Home, Sparkles, Calendar, Clock, MapPinned, Phone, FileText, CreditCard, Mail, Hash, Bed, Bath, Building } from 'lucide-react';
import { HomeSizeGrid } from '../pricing/HomeSizeGrid';
import { FrequencySelector } from '../pricing/FrequencySelector';
import { PropertyDetailsSelector } from '../booking/PropertyDetailsSelector';
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
import { useFormPersistence } from '@/hooks/useFormPersistence';

interface TypeformBookingFlowProps {
  onComplete?: () => void;
}

export function TypeformBookingFlow({ onComplete }: TypeformBookingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 13; // Added property details step

  // Use form persistence hook
  const { data: bookingData, updateField, updateData, isLoading } = useFormPersistence(
    {
      stateCode: '',
      zipCode: '',
      email: '',
      homeSizeId: '',
      bedrooms: '2',
      bathrooms: '2',
      dwellingType: '',
      flooringType: '',
      serviceTypeId: '',
      frequencyId: '',
      serviceDate: null as Date | null,
      serviceTime: '',
      address: { street: '', city: '', state: '', zipCode: '' },
      contactInfo: { name: '', email: '', phone: '' },
      specialInstructions: ''
    },
    { storageKey: 'typeform-booking', debounceMs: 500 }
  );

  // Calculate pricing
  const [pricing, setPricing] = useState<any>(null);

  // Pre-fill address and contact info from earlier steps
  useEffect(() => {
    if (bookingData.stateCode && bookingData.zipCode) {
      updateField('address', { 
        ...bookingData.address, 
        state: bookingData.stateCode, 
        zipCode: bookingData.zipCode 
      });
    }
  }, [bookingData.stateCode, bookingData.zipCode]);

  useEffect(() => {
    if (bookingData.email) {
      updateField('contactInfo', { 
        ...bookingData.contactInfo, 
        email: bookingData.email 
      });
    }
  }, [bookingData.email]);

  useEffect(() => {
    if (bookingData.homeSizeId && bookingData.serviceTypeId && bookingData.frequencyId && bookingData.stateCode) {
      try {
        const result = calculateNewPricing(
          bookingData.homeSizeId, 
          bookingData.serviceTypeId, 
          bookingData.frequencyId, 
          bookingData.stateCode
        );
        const discountedResult = {
          ...result,
          finalPrice: applyGlobalDiscount(result.finalPrice)
        };
        setPricing(discountedResult);
      } catch (error) {
        console.error('Pricing calculation error:', error);
      }
    }
  }, [bookingData.homeSizeId, bookingData.serviceTypeId, bookingData.frequencyId, bookingData.stateCode]);

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 1 && !bookingData.stateCode) {
      toast.error('Please select a state');
      return;
    }
    if (currentStep === 2 && !bookingData.zipCode) {
      toast.error('Please enter your zip code');
      return;
    }
    if (currentStep === 3 && !bookingData.email) {
      toast.error('Please enter your email');
      return;
    }
    if (currentStep === 4 && !bookingData.homeSizeId) {
      toast.error('Please select your home size');
      return;
    }
    if (currentStep === 5 && (!bookingData.bedrooms || !bookingData.bathrooms || !bookingData.dwellingType)) {
      toast.error('Please complete property details');
      return;
    }
    if (currentStep === 6 && !bookingData.serviceTypeId) {
      toast.error('Please select a service type');
      return;
    }
    if (currentStep === 7 && !bookingData.frequencyId) {
      toast.error('Please select a frequency');
      return;
    }
    if (currentStep === 8 && !bookingData.serviceDate) {
      toast.error('Please select a date');
      return;
    }
    if (currentStep === 9 && !bookingData.serviceTime) {
      toast.error('Please select a time');
      return;
    }
    if (currentStep === 10 && (!bookingData.address.street || !bookingData.address.city || !bookingData.address.zipCode)) {
      toast.error('Please fill in your address');
      return;
    }
    if (currentStep === 11 && (!bookingData.contactInfo.name || !bookingData.contactInfo.email || !bookingData.contactInfo.phone)) {
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
      case 1: return !!bookingData.stateCode;
      case 2: return !!bookingData.zipCode && bookingData.zipCode.length === 5;
      case 3: return !!bookingData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.email);
      case 4: return !!bookingData.homeSizeId;
      case 5: return !!(bookingData.bedrooms && bookingData.bathrooms && bookingData.dwellingType);
      case 6: return !!bookingData.serviceTypeId;
      case 7: return !!bookingData.frequencyId;
      case 8: return !!bookingData.serviceDate;
      case 9: return !!bookingData.serviceTime;
      case 10: return !!(bookingData.address.street && bookingData.address.city && bookingData.address.zipCode);
      case 11: return !!(bookingData.contactInfo.name && bookingData.contactInfo.email && bookingData.contactInfo.phone);
      case 12: return true; // Special instructions are optional
      case 13: return !!pricing;
      default: return false;
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </div>;
  }

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
                isSelected={bookingData.stateCode === state.code}
                onClick={() => updateField('stateCode', state.code)}
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
            value={bookingData.zipCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 5);
              updateField('zipCode', value);
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
            value={bookingData.email}
            onChange={(e) => updateField('email', e.target.value)}
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
            selectedId={bookingData.homeSizeId}
            onSelect={(id) => updateField('homeSizeId', id)}
          />
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 5: Property Details */}
      <TypeformStep questionNumber={5} totalSteps={totalSteps} isActive={currentStep === 5}>
        <ConversationalQuestion
          question="Tell us about your property"
          description="This helps us provide the best service"
          icon={<Building className="w-8 h-8" />}
        >
          <PropertyDetailsSelector
            bedrooms={bookingData.bedrooms}
            bathrooms={bookingData.bathrooms}
            dwellingType={bookingData.dwellingType}
            flooringType={bookingData.flooringType}
            onBedroomsChange={(value) => updateField('bedrooms', value)}
            onBathroomsChange={(value) => updateField('bathrooms', value)}
            onDwellingTypeChange={(value) => updateField('dwellingType', value)}
            onFlooringTypeChange={(value) => updateField('flooringType', value)}
          />
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 6: Service Type */}
      <TypeformStep questionNumber={6} totalSteps={totalSteps} isActive={currentStep === 6}>
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
                  isSelected={bookingData.serviceTypeId === service.id}
                  onClick={() => updateField('serviceTypeId', service.id)}
                />
              );
            })}
          </div>
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 7: Frequency */}
      <TypeformStep questionNumber={7} totalSteps={totalSteps} isActive={currentStep === 7}>
        <ConversationalQuestion
          question="How often would you like service?"
          description="Regular service gets better rates and priority scheduling"
          icon={<Calendar className="w-8 h-8" />}
        >
          <FrequencySelector
            selectedId={bookingData.frequencyId}
            onSelect={(id) => updateField('frequencyId', id)}
          />
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 8: Date Selection */}
      <TypeformStep questionNumber={8} totalSteps={totalSteps} isActive={currentStep === 8}>
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
                  "w-full justify-center text-center font-normal text-lg p-6 h-auto",
                  !bookingData.serviceDate && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-5 w-5" />
                {bookingData.serviceDate ? format(new Date(bookingData.serviceDate), "MMM d, yyyy") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <CalendarComponent
                mode="single"
                selected={bookingData.serviceDate ? new Date(bookingData.serviceDate) : undefined}
                onSelect={(date) => updateField('serviceDate', date)}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 9: Time Selection */}
      <TypeformStep questionNumber={9} totalSteps={totalSteps} isActive={currentStep === 9}>
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
                isSelected={bookingData.serviceTime === time}
                onClick={() => updateField('serviceTime', time)}
              />
            ))}
          </div>
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 10: Address */}
      <TypeformStep questionNumber={10} totalSteps={totalSteps} isActive={currentStep === 10}>
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
                value={bookingData.address.street}
                onChange={(e) => updateField('address', { ...bookingData.address, street: e.target.value })}
                placeholder="123 Main St"
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={bookingData.address.city}
                  onChange={(e) => updateField('address', { ...bookingData.address, city: e.target.value })}
                  placeholder="Austin"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={bookingData.address.zipCode}
                  onChange={(e) => updateField('address', { ...bookingData.address, zipCode: e.target.value })}
                  placeholder="78701"
                  className="mt-2"
                />
              </div>
            </div>
          </Card>
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 11: Contact Info */}
      <TypeformStep questionNumber={11} totalSteps={totalSteps} isActive={currentStep === 11}>
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
                value={bookingData.contactInfo.name}
                onChange={(e) => updateField('contactInfo', { ...bookingData.contactInfo, name: e.target.value })}
                placeholder="John Doe"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={bookingData.contactInfo.email}
                onChange={(e) => updateField('contactInfo', { ...bookingData.contactInfo, email: e.target.value })}
                placeholder="john@example.com"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={bookingData.contactInfo.phone}
                onChange={(e) => updateField('contactInfo', { ...bookingData.contactInfo, phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="mt-2"
              />
            </div>
          </Card>
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 12: Special Instructions */}
      <TypeformStep questionNumber={12} totalSteps={totalSteps} isActive={currentStep === 12}>
        <ConversationalQuestion
          question="Any special instructions?"
          description="Let us know about pets, access codes, or specific requests (optional)"
          icon={<FileText className="w-8 h-8" />}
        >
          <Textarea
            value={bookingData.specialInstructions}
            onChange={(e) => updateField('specialInstructions', e.target.value)}
            placeholder="e.g., Please focus on the kitchen, we have a friendly dog..."
            rows={6}
            className="text-lg"
          />
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 13: Payment */}
      <TypeformStep questionNumber={13} totalSteps={totalSteps} isActive={currentStep === 13}>
        <ConversationalQuestion
          question="Ready to book?"
          description={pricing ? `Total: $${pricing.finalPrice.toFixed(2)}` : 'Calculating price...'}
          icon={<CreditCard className="w-8 h-8" />}
        >
          {pricing && (
            <Card className="p-6">
              <PaymentForm
                pricingData={{
                  squareFootage: parseInt(bookingData.homeSizeId.split('_')[0]) || 1500,
                  cleaningType: bookingData.serviceTypeId,
                  frequency: bookingData.frequencyId,
                  addOns: [],
                  bedrooms: parseInt(bookingData.bedrooms) || 2,
                  bathrooms: parseInt(bookingData.bathrooms) || 2,
                }}
                calculatedPrice={pricing.finalPrice}
                priceBreakdown={pricing.breakdown}
                schedulingData={{
                  scheduledDate: bookingData.serviceDate ? format(new Date(bookingData.serviceDate), 'yyyy-MM-dd') : '',
                  scheduledTime: bookingData.serviceTime,
                }}
                customerInfo={{
                  name: bookingData.contactInfo.name,
                  email: bookingData.contactInfo.email,
                  phone: bookingData.contactInfo.phone,
                }}
              />
            </Card>
          )}
        </ConversationalQuestion>
      </TypeformStep>

      {/* Floating Pricing Summary - Show from Step 4 onwards */}
      {currentStep >= 4 && (
        <FloatingPricingSummary
          result={pricing}
          homeSizeId={bookingData.homeSizeId}
          serviceTypeId={bookingData.serviceTypeId}
          frequencyId={bookingData.frequencyId}
          stateCode={bookingData.stateCode}
        />
      )}

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
