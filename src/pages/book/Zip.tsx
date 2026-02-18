import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingProgressBar } from '@/components/booking/BookingProgressBar';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBooking } from '@/contexts/BookingContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { CleaningShowcaseCarousel } from '@/components/booking/CleaningShowcaseCarousel';
import { ReviewsWidget } from '@/components/booking/ReviewsWidget';
import { GoogleGuaranteedBadge } from '@/components/trust/GoogleGuaranteedBadge';
import { z } from 'zod';
import { formatPhoneNumber } from '@/lib/validation-utils';
import { useUTMTracking } from '@/hooks/useUTMTracking';
import { toast } from 'sonner';

// Validation schema
const leadSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
});

export default function BookingZip() {
  const navigate = useNavigate();
  const { updateBookingData } = useBooking();
  const { getTrackingData } = useUTMTracking();
  
  // ZIP state
  const [zipCode, setZipCode] = useState('');
  const [zipError, setZipError] = useState('');
  const [isValidatingZip, setIsValidatingZip] = useState(false);
  const [zipValidated, setZipValidated] = useState(false);
  const [validatedLocation, setValidatedLocation] = useState<{ city: string; state: string } | null>(null);
  
  // Lead capture state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setZipCode(value);
    setZipError('');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(formatPhoneNumber(value));
    if (formErrors.phone) {
      setFormErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const handleCheckAvailability = async () => {
    if (zipCode.length !== 5) {
      setZipError('Please enter a valid 5-digit ZIP code');
      return;
    }
    
    setIsValidatingZip(true);
    setZipError('');
    
    try {
      const { data, error: functionError } = await supabase.functions.invoke('validate-zip', {
        body: { zipCode }
      });
      
      if (functionError) throw functionError;
      
      if (data?.isValid) {
        setValidatedLocation({ city: data.city, state: data.state });
        setZipValidated(true);
        
        // Store ZIP data in context
        updateBookingData({
          zipCode,
          city: data.city,
          state: data.state
        });
      } else {
        setZipError(data?.message || "We don't service this area yet.");
      }
    } catch (err: any) {
      console.error('ZIP validation error:', err);
      setZipError('Failed to validate ZIP code. Please try again.');
    } finally {
      setIsValidatingZip(false);
    }
  };

  const handleZipKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && zipCode.length === 5) {
      handleCheckAvailability();
    }
  };

  const validateLeadForm = (): boolean => {
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      leadSchema.parse({
        firstName,
        lastName,
        email,
        phone: cleanPhone,
      });
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const handleSubmitLead = async () => {
    if (!validateLeadForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const trackingData = getTrackingData();
      
      // Send to webhook with full tracking data (also triggers lead_welcome email)
      const { data, error } = await supabase.functions.invoke('emit-lead-webhook', {
        body: {
          firstName,
          lastName,
          email,
          phone: `+1${cleanPhone}`,
          zipCode,
          city: validatedLocation?.city,
          state: validatedLocation?.state,
          // Include all tracking data
          landingPage: trackingData.landing_page || window.location.href,
          referrer: trackingData.referrer,
          timestamp: trackingData.first_visit_timestamp,
          utmSource: trackingData.utm_source,
          utmMedium: trackingData.utm_medium,
          utmCampaign: trackingData.utm_campaign,
          utmContent: trackingData.utm_content,
          utmTerm: trackingData.utm_term,
        }
      });
      
      if (error) {
        console.error('Lead webhook error:', error);
        // Show error toast but don't block user
        toast.error('There was an issue saving your information, but you can still continue.');
      } else {
        console.log('Lead captured successfully:', data);
        // Show success toast
        toast.success('Information saved! Taking you to the next step...');
      }
      
      // Track booking progress for abandoned checkout detection
      supabase.functions.invoke('track-booking-progress', {
        body: {
          email,
          step: 'lead_captured',
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: `+1${cleanPhone}`,
            zip_code: zipCode,
            city: validatedLocation?.city,
            state: validatedLocation?.state,
            utms: trackingData
          }
        }
      }).catch(err => console.error('Error tracking progress:', err));
      
      // Update booking context with contact info
      updateBookingData({
        contactInfo: {
          firstName,
          lastName,
          email,
          phone: formatPhoneNumber(cleanPhone),
          city: validatedLocation?.city || '',
          state: validatedLocation?.state || '',
          zip: zipCode,
        } as any
      });
      
      // Clear form fields (in case user comes back)
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setFormErrors({});
      
      // Navigate to next step after brief delay for toast visibility
      setTimeout(() => {
        navigate('/book/sqft');
      }, 500);
      
    } catch (err) {
      console.error('Error submitting lead:', err);
      toast.error('Something went wrong, but you can still continue.');
      // Still navigate even if there's an error
      navigate('/book/sqft');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitLead();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BookingProgressBar currentStep={1} totalSteps={6} />
      
      <main className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-2xl">
          {/* Google Guaranteed Badge */}
          <div className="flex justify-center mb-6">
            <GoogleGuaranteedBadge variant="standard" />
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-5xl font-jakarta font-bold mb-3 leading-tight">
              New Customer Special: 20% OFF Your First Deep Clean
              <span className="block text-primary mt-2">
                + 10% Off Recurring Service
              </span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl">
              Enter your ZIP to get started and claim your discount
            </p>
          </div>
          
          <Card className="p-6 md:p-8">
            {!zipValidated ? (
              // Phase 1: ZIP Code Entry
              <div className="space-y-4">
                <div>
                  <Label htmlFor="zip" className="text-base mb-2">
                    ZIP Code
                  </Label>
                  <Input
                    id="zip"
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="75001"
                    value={zipCode}
                    onChange={handleZipChange}
                    onKeyPress={handleZipKeyPress}
                    className="text-lg md:text-2xl text-center h-12 md:h-16 tracking-wider"
                    autoFocus
                    disabled={isValidatingZip}
                  />
                </div>
                
                {zipError && (
                  <Alert variant="destructive">
                    <AlertDescription className="text-center">
                      {zipError}
                      {zipError.includes("don't service") && (
                        <div className="mt-2">
                          <a href="tel:9725590223" className="font-medium underline">
                            Call (972) 559-0223
                          </a>
                          {' '}for options
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button
                  size="lg"
                  className="w-full h-14 text-lg"
                  onClick={handleCheckAvailability}
                  disabled={isValidatingZip || zipCode.length !== 5}
                >
                  {isValidatingZip ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    'Check Availability'
                  )}
                </Button>
              </div>
            ) : (
              // Phase 2: Lead Capture Form
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Success Message */}
                <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">
                      Great news! We service {validatedLocation?.city}, {validatedLocation?.state}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Enter your details to claim your new customer discount
                    </p>
                  </div>
                </div>
                
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        if (formErrors.firstName) setFormErrors(prev => ({ ...prev, firstName: '' }));
                      }}
                      onKeyPress={handleFormKeyPress}
                      className={formErrors.firstName ? 'border-destructive' : ''}
                      disabled={isSubmitting}
                      autoFocus
                    />
                    {formErrors.firstName && (
                      <p className="text-sm text-destructive">{formErrors.firstName}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Smith"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        if (formErrors.lastName) setFormErrors(prev => ({ ...prev, lastName: '' }));
                      }}
                      onKeyPress={handleFormKeyPress}
                      className={formErrors.lastName ? 'border-destructive' : ''}
                      disabled={isSubmitting}
                    />
                    {formErrors.lastName && (
                      <p className="text-sm text-destructive">{formErrors.lastName}</p>
                    )}
                  </div>
                </div>
                
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                    }}
                    onKeyPress={handleFormKeyPress}
                    className={formErrors.email ? 'border-destructive' : ''}
                    disabled={isSubmitting}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-destructive">{formErrors.email}</p>
                  )}
                </div>
                
                {/* Phone Field */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(972) 555-0123"
                    value={phone}
                    onChange={handlePhoneChange}
                    onKeyPress={handleFormKeyPress}
                    className={formErrors.phone ? 'border-destructive' : ''}
                    disabled={isSubmitting}
                  />
                  {formErrors.phone && (
                    <p className="text-sm text-destructive">{formErrors.phone}</p>
                  )}
                </div>
                
                {/* Submit Button */}
                <Button
                  size="lg"
                  className="w-full h-14 text-lg"
                  onClick={handleSubmitLead}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Claim My Discount →'
                  )}
                </Button>
                
                {/* Change ZIP link */}
                <button
                  type="button"
                  onClick={() => {
                    setZipValidated(false);
                    setValidatedLocation(null);
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isSubmitting}
                >
                  ← Change ZIP code ({zipCode})
                </button>
              </div>
            )}
          </Card>
          
          <CleaningShowcaseCarousel />
          
          <ReviewsWidget />
          
          <p className="text-sm text-center text-muted-foreground mt-6">
            By booking you agree to AlphaLuxClean's terms & service policy
          </p>
        </div>
      </main>
    </div>
  );
}
