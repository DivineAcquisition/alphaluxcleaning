import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ModernBookingFlow } from './ModernBookingFlow';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, UserPlus, LogIn, RotateCcw, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface BookingData {
  homeSize: string;
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
  nextDayFee: number;
  promoDiscount: number;
  totalPrice: number;
  paymentType: 'pay_after_service' | '25_percent_with_discount';
  stripeSessionId?: string;
}

const BOOKING_STORAGE_KEY = 'guestBookingData';

export function GuestBookingWrapper() {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [showAuthChoice, setShowAuthChoice] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({});
  const [bookingStep, setBookingStep] = useState(1);
  const [hasRestoredData, setHasRestoredData] = useState(false);
  const [resumePromptShown, setResumePromptShown] = useState(false);

  // Check for saved booking data and show resume prompt
  useEffect(() => {
    const savedBooking = localStorage.getItem(BOOKING_STORAGE_KEY);
    if (savedBooking && !resumePromptShown) {
      try {
        const parsed = JSON.parse(savedBooking);
        const savedTimestamp = parsed._timestamp || 0;
        const hoursSinceLastSave = (Date.now() - savedTimestamp) / (1000 * 60 * 60);
        
        // Only show resume prompt if data was saved within last 24 hours
        if (hoursSinceLastSave < 24 && Object.keys(parsed).length > 2) {
          setHasRestoredData(true);
          setResumePromptShown(true);
        }
      } catch (error) {
        console.error('Failed to parse saved booking:', error);
        localStorage.removeItem(BOOKING_STORAGE_KEY);
      }
    }
  }, [resumePromptShown]);

  const handleResumeBooking = () => {
    const savedBooking = localStorage.getItem(BOOKING_STORAGE_KEY);
    if (savedBooking) {
      try {
        const parsed = JSON.parse(savedBooking);
        setBookingData(parsed);
        // Get step from URL or determine from data completeness
        const urlStep = parseInt(searchParams.get('step') || '1', 10);
        const dataStep = determineStepFromData(parsed);
        setBookingStep(Math.max(urlStep, dataStep));
        setHasRestoredData(false);
        toast.success('Welcome back! Your booking progress has been restored.');
      } catch (error) {
        console.error('Failed to restore booking:', error);
        localStorage.removeItem(BOOKING_STORAGE_KEY);
        setHasRestoredData(false);
      }
    }
  };

  const handleStartFresh = () => {
    localStorage.removeItem(BOOKING_STORAGE_KEY);
    setBookingData({});
    setBookingStep(1);
    setHasRestoredData(false);
    toast.success('Starting with a fresh booking form.');
  };

  const determineStepFromData = (data: Partial<BookingData>): number => {
    if (data.stripeSessionId) return 4;
    if (data.serviceDate && data.serviceTime && data.address?.street) return 3;
    if (data.homeSize && data.frequency) return 2;
    return 1;
  };

  // Clear saved booking data
  const clearBookingData = () => {
    localStorage.removeItem(BOOKING_STORAGE_KEY);
  };

  const handleBookingUpdate = (updates: Partial<BookingData>) => {
    const newData = { ...bookingData, ...updates };
    setBookingData(newData);
  };

  const handleStepChange = (step: number) => {
    setBookingStep(step);
    
    // For guest bookings, we don't require authentication until after successful booking
    // The guest flow will handle account creation automatically
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    setShowAuthChoice(false);
    toast.success('Successfully logged in! Continuing with your booking...');
  };

  const handleContinueAsGuest = () => {
    setShowAuthChoice(false);
    toast.success('Continuing as guest - we\'ll create your account automatically after payment.');
  };

  const handleBookingComplete = () => {
    clearBookingData();
  };

  // Show resume prompt if we have saved data
  if (hasRestoredData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-clean">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back!</CardTitle>
            <p className="text-muted-foreground">
              We found a saved booking in progress
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Your previous booking session was automatically saved.
              </p>
            </div>
            
            <Button
              onClick={handleResumeBooking}
              className="w-full"
              size="lg"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Resume Previous Booking
            </Button>
            
            <Button
              onClick={handleStartFresh}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Start Fresh Booking
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              Your data is saved locally and will be automatically cleared after 24 hours.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your booking...</p>
        </div>
      </div>
    );
  }

  // Show auth choice when user reaches payment step
  if (showAuthChoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-clean">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Before We Continue...</CardTitle>
            <p className="text-muted-foreground">
              Choose how you'd like to proceed with your booking
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => {
                setAuthMode('signup');
                setShowAuth(true);
              }}
              className="w-full"
              size="lg"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Create Account & Continue
            </Button>
            
            <Button
              onClick={() => {
                setAuthMode('signin');
                setShowAuth(true);
              }}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In to Existing Account
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            
            <Button
              onClick={handleContinueAsGuest}
              variant="ghost"
              className="w-full"
              size="lg"
            >
              Continue as Guest
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              Don't worry - we'll create an account for you automatically after your booking is complete!
            </p>
            
            <Button
              onClick={() => setShowAuthChoice(false)}
              variant="ghost"
              size="sm"
              className="w-full"
            >
              Back to Booking
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show auth form if requested
  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-clean">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {authMode === 'signup' ? 'Create Account' : 'Sign In'}
            </CardTitle>
            <p className="text-muted-foreground">
              {authMode === 'signup' 
                ? 'Create an account to continue with your booking' 
                : 'Sign in to your existing account'
              }
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Please use the main auth page to {authMode === 'signup' ? 'create an account' : 'sign in'}, 
              then return to continue your booking.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => window.location.href = '/auth'}
                className="w-full"
                size="lg"
              >
                Go to {authMode === 'signup' ? 'Sign Up' : 'Sign In'} Page
              </Button>
              <Button
                onClick={() => setShowAuth(false)}
                variant="ghost"
                size="sm"
                className="w-full"
              >
                Back to Booking Options
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show main booking flow
  return (
    <ModernBookingFlow
      initialData={bookingData}
      onDataUpdate={handleBookingUpdate}
      onStepChange={handleStepChange}
      onComplete={handleBookingComplete}
      guestMode={!user}
    />
  );
}