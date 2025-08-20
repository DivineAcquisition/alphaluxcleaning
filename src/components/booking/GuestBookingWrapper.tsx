import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ModernBookingFlow } from './ModernBookingFlow';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, UserPlus, LogIn } from 'lucide-react';

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
  nextDayFee: number;
  promoDiscount: number;
  totalPrice: number;
  paymentType: 'pay_after_service' | '25_percent_with_discount';
}

const BOOKING_STORAGE_KEY = 'guestBookingData';

export function GuestBookingWrapper() {
  const { user, loading } = useAuth();
  const [showAuthChoice, setShowAuthChoice] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({});
  const [bookingStep, setBookingStep] = useState(1);

  // Load booking data from session storage on mount
  useEffect(() => {
    const savedBooking = sessionStorage.getItem(BOOKING_STORAGE_KEY);
    if (savedBooking) {
      try {
        const parsed = JSON.parse(savedBooking);
        setBookingData(parsed.data);
        setBookingStep(parsed.step);
        toast.success('Your booking progress has been restored!');
      } catch (error) {
        console.error('Failed to parse saved booking:', error);
      }
    }
  }, []);

  // Save booking data to session storage
  const saveBookingData = (data: Partial<BookingData>, step: number) => {
    try {
      sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify({
        data,
        step,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Failed to save booking data:', error);
    }
  };

  // Clear saved booking data
  const clearBookingData = () => {
    sessionStorage.removeItem(BOOKING_STORAGE_KEY);
  };

  const handleBookingUpdate = (updates: Partial<BookingData>) => {
    const newData = { ...bookingData, ...updates };
    setBookingData(newData);
    saveBookingData(newData, bookingStep);
  };

  const handleStepChange = (step: number) => {
    setBookingStep(step);
    saveBookingData(bookingData, step);
    
    // Show auth choice when reaching payment step (step 3) if not authenticated
    if (step === 3 && !user && !loading) {
      setShowAuthChoice(true);
    }
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