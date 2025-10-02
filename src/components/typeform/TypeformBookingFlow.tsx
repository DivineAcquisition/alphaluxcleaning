import React, { useState, useEffect } from 'react';
import { TypeformStep } from './TypeformStep';
import { ConversationalQuestion } from './ConversationalQuestion';
import { AnswerOption } from './AnswerOption';
import { TypeformProgress } from './TypeformProgress';
import { MapPin, Home, Sparkles, Calendar, Clock, MapPinned, Phone, FileText, CreditCard } from 'lucide-react';
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
import { toast } from 'sonner';

interface TypeformBookingFlowProps {
  onComplete?: () => void;
}

export function TypeformBookingFlow({ onComplete }: TypeformBookingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 10;

  // Booking data
  const [stateCode, setStateCode] = useState('');
  const [homeSizeId, setHomeSizeId] = useState('');
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [frequencyId, setFrequencyId] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [serviceTime, setServiceTime] = useState('');
  const [address, setAddress] = useState({ street: '', city: '', state: '', zipCode: '' });
  const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '' });
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Calculate pricing
  const [pricing, setPricing] = useState<any>(null);

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
    if (currentStep === 2 && !homeSizeId) {
      toast.error('Please select your home size');
      return;
    }
    if (currentStep === 3 && !serviceTypeId) {
      toast.error('Please select a service type');
      return;
    }
    if (currentStep === 4 && !frequencyId) {
      toast.error('Please select a frequency');
      return;
    }
    if (currentStep === 5 && !serviceDate) {
      toast.error('Please select a date');
      return;
    }
    if (currentStep === 6 && !serviceTime) {
      toast.error('Please select a time');
      return;
    }
    if (currentStep === 7 && (!address.street || !address.city || !address.zipCode)) {
      toast.error('Please fill in your address');
      return;
    }
    if (currentStep === 8 && (!contactInfo.name || !contactInfo.email || !contactInfo.phone)) {
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
      case 2: return !!homeSizeId;
      case 3: return !!serviceTypeId;
      case 4: return !!frequencyId;
      case 5: return !!serviceDate;
      case 6: return !!serviceTime;
      case 7: return !!(address.street && address.city && address.zipCode);
      case 8: return !!(contactInfo.name && contactInfo.email && contactInfo.phone);
      case 9: return true; // Special instructions are optional
      case 10: return !!pricing;
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

      {/* Step 2: Home Size */}
      <TypeformStep questionNumber={2} totalSteps={totalSteps} isActive={currentStep === 2}>
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

      {/* Step 3: Service Type */}
      <TypeformStep questionNumber={3} totalSteps={totalSteps} isActive={currentStep === 3}>
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

      {/* Step 4: Frequency */}
      <TypeformStep questionNumber={4} totalSteps={totalSteps} isActive={currentStep === 4}>
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

      {/* Step 5: Date Selection */}
      <TypeformStep questionNumber={5} totalSteps={totalSteps} isActive={currentStep === 5}>
        <ConversationalQuestion
          question="When would you like your first cleaning?"
          description="Choose a date that works best for you"
          icon={<Calendar className="w-8 h-8" />}
        >
          <Input
            type="date"
            value={serviceDate}
            onChange={(e) => setServiceDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="text-lg p-6"
          />
        </ConversationalQuestion>
      </TypeformStep>

      {/* Step 6: Time Selection */}
      <TypeformStep questionNumber={6} totalSteps={totalSteps} isActive={currentStep === 6}>
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

      {/* Step 7: Address */}
      <TypeformStep questionNumber={7} totalSteps={totalSteps} isActive={currentStep === 7}>
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

      {/* Step 8: Contact Info */}
      <TypeformStep questionNumber={8} totalSteps={totalSteps} isActive={currentStep === 8}>
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

      {/* Step 9: Special Instructions */}
      <TypeformStep questionNumber={9} totalSteps={totalSteps} isActive={currentStep === 9}>
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

      {/* Step 10: Payment */}
      <TypeformStep questionNumber={10} totalSteps={totalSteps} isActive={currentStep === 10}>
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
                  scheduledDate: serviceDate,
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
