import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookingProgressBar } from '@/components/booking/BookingProgressBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBooking } from '@/contexts/BookingContext';
import { supabase } from '@/integrations/supabase/client';
import { squarePromise } from '@/lib/square';
import { toast } from 'sonner';
import { Loader2, TestTube } from 'lucide-react';
import { useTestMode } from '@/hooks/useTestMode';
import { BookingCountdown } from '@/components/booking/BookingCountdown';
import { RecurringUpsellCard } from '@/components/booking/RecurringUpsellCard';
import { getTierPrice } from '@/lib/tier-pricing-system';

export default function BookingCheckout() {
  const navigate = useNavigate();
  const { bookingData, updateBookingData, pricing, depositAmount, clearBookingData } = useBooking();
  const { isTestMode } = useTestMode();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCardReady, setIsCardReady] = useState(false);
  const [cardInstance, setCardInstance] = useState<any>(null);
  const [availableCredits, setAvailableCredits] = useState(0);
  const [applyCredits, setApplyCredits] = useState(false);
  const showRecurringUpsell = true; // Always show to allow toggling
  const isInitializing = useRef(false);

  // Log test mode status on mount
  useEffect(() => {
    const testModeStatus = localStorage.getItem('booking_test_mode');
    console.log('🧪 Test mode check:', { 
      isTestMode, 
      localStorage: testModeStatus 
    });
    
    if (isTestMode) {
      console.warn('⚠️ TEST MODE ACTIVE - PAYMENTS WILL BE BYPASSED');
    }
  }, [isTestMode]);

  useEffect(() => {
    if (!bookingData.zipCode || !bookingData.date) {
      navigate('/book/zip');
    }
  }, [bookingData, navigate]);

  useEffect(() => {
    fetchAvailableCredits();
  }, [bookingData.contactInfo.email]);

  useEffect(() => {
    // Skip Square initialization in test mode
    if (!isTestMode) {
      initializeSquare();
    } else {
      setIsCardReady(true); // Card is "ready" in test mode
    }
    return () => {
      if (cardInstance) {
        cardInstance.destroy();
      }
    };
  }, [isTestMode]);

  const fetchAvailableCredits = async () => {
    if (!bookingData.contactInfo.email) return;

    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', bookingData.contactInfo.email)
        .maybeSingle();

      if (!customer) return;

      const { data: credits } = await supabase
        .from('referral_rewards')
        .select('amount_cents')
        .eq('customer_id', customer.id)
        .eq('status', 'APPLIED');

      const total = credits?.reduce((sum, c) => sum + c.amount_cents, 0) || 0;
      setAvailableCredits(total / 100);
      if (total > 0) setApplyCredits(true);
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const initializeSquare = async () => {
    if (isInitializing.current) return;
    isInitializing.current = true;

    try {
      // Wait for DOM element to be ready
      const checkElement = () => {
        return new Promise((resolve) => {
          const element = document.getElementById('square-card-container');
          if (element) {
            resolve(element);
          } else {
            setTimeout(() => resolve(checkElement()), 100);
          }
        });
      };

      await checkElement();

      const square = await squarePromise;
      if (!square?.payments) throw new Error('Square not loaded');

      const card = await square.payments.card();
      await card.attach('#square-card-container');
      
      setCardInstance(card);
      setIsCardReady(true);
      console.log('✅ Square card form ready');
    } catch (error) {
      console.error('Square initialization error:', error);
      toast.error('Failed to load payment form');
    } finally {
      isInitializing.current = false;
    }
  };

  const handlePayment = async () => {
    if (!pricing) {
      toast.error('Payment form not ready');
      return;
    }

    // In test mode, skip card validation
    if (!isTestMode && !cardInstance) {
      toast.error('Payment form not ready');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Tokenize card (skip in test mode)
      let token = 'test_token';
      let details: any = { verification_token: 'test_verification' };
      
      if (!isTestMode) {
        const tokenResult = await cardInstance.tokenize();
        if (tokenResult.status === 'OK') {
          token = tokenResult.token;
          details = tokenResult.details;
        } else {
          throw new Error(tokenResult.errors?.[0]?.message || 'Card tokenization failed');
        }
      }

        // Step 2: Create customer in Supabase
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .insert({
            email: bookingData.contactInfo.email,
            name: `${bookingData.contactInfo.firstName} ${bookingData.contactInfo.lastName}`,
            first_name: bookingData.contactInfo.firstName,
            last_name: bookingData.contactInfo.lastName,
            phone: bookingData.contactInfo.phone,
            address_line1: bookingData.contactInfo.address1,
            address_line2: bookingData.contactInfo.address2,
            city: bookingData.contactInfo.city,
            state: bookingData.contactInfo.state,
            postal_code: bookingData.contactInfo.zip,
          })
          .select()
          .single();

        if (customerError && customerError.code !== '23505') {
          throw customerError;
        }

        // If customer exists, fetch it
        let customerId = customerData?.id;
        if (!customerId) {
          const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq('email', bookingData.contactInfo.email)
            .single();
          customerId = existingCustomer?.id;
        }

        // Step 3: Create booking
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .insert({
            customer_id: customerId,
            service_type: bookingData.serviceType,
            frequency: bookingData.frequency,
            service_date: bookingData.date,
            time_slot: bookingData.timeSlot,
            est_price: pricing.finalPrice,
            deposit_amount: depositAmount,
            status: 'pending',
            zip_code: bookingData.zipCode,
            special_instructions: bookingData.specialInstructions,
            sqft_or_bedrooms: `${bookingData.bedrooms}BR/${bookingData.bathrooms}BA`,
            property_details: {
              bedrooms: bookingData.bedrooms,
              bathrooms: bookingData.bathrooms,
              sqft: bookingData.sqft,
              homeType: bookingData.homeType,
            },
          })
          .select()
          .single();

        if (bookingError) throw bookingError;

        // Step 3.5: Send booking confirmed webhook
        try {
          console.log('📡 Sending booking confirmation webhook...');
          await supabase.functions.invoke('enhanced-booking-webhook-v2', {
            body: {
              booking_id: booking.id,
              trigger_event: bookingData.upgradedToRecurring 
                ? 'booking-confirmed-recurring'
                : 'booking-confirmed',
              include_upgrade_metadata: bookingData.upgradedToRecurring
            }
          });
          console.log('✅ Booking confirmation webhook sent');
        } catch (webhookError) {
          console.error('❌ Webhook failed (non-blocking):', webhookError);
          // Don't block booking flow if webhook fails
        }

        // Step 4: Calculate final amount with credits
        const finalPaymentAmount = applyCredits 
          ? Math.max(0, depositAmount - availableCredits)
          : depositAmount;

        // Step 5: Process payment via Square (skip in test mode)
        let paymentData: any = null;
        
        if (!isTestMode) {
          console.log('💳 Invoking create-square-payment...', {
            amount: finalPaymentAmount,
            bookingId: booking.id,
            customerEmail: bookingData.contactInfo.email,
            hasToken: !!token,
            hasVerificationToken: !!details?.verification_token,
            applyCredits,
            creditsAmount: availableCredits
          });

          const { data, error: paymentError } = await supabase.functions.invoke(
            'create-square-payment',
            {
              body: {
                amount: finalPaymentAmount,
                customerEmail: bookingData.contactInfo.email,
                customerName: `${bookingData.contactInfo.firstName} ${bookingData.contactInfo.lastName}`,
                customerPhone: bookingData.contactInfo.phone,
                bookingId: booking.id,
                sourceId: token,
                verificationToken: details?.verification_token,
                saveCard: true,
                applyCredits: applyCredits,
                creditsAmount: availableCredits,
              },
            }
          );

          console.log('💳 Payment response:', { data, error: paymentError });

          if (paymentError) {
            console.error('❌ Payment error details:', paymentError);
            throw new Error(`Payment failed: ${paymentError.message}`);
          }

          if (!data?.success) {
            console.error('❌ Payment returned unsuccessful status:', data);
            throw new Error('Payment processing returned unsuccessful status');
          }

          paymentData = data;
        } else {
          // Test mode: simulate successful payment
          console.log('🧪 TEST MODE: Skipping Square payment processing');
          paymentData = { 
            success: true, 
            payment_id: 'test_payment_' + Date.now(),
            credits_applied: applyCredits ? availableCredits : 0
          };
          
          // Update booking status to confirmed in test mode
          await supabase
            .from('bookings')
            .update({ status: 'confirmed' })
            .eq('id', booking.id);
        }

        // CRITICAL: Verify payment was actually processed
        if (!isTestMode && !paymentData?.payment_id) {
          console.error('❌ CRITICAL: Payment processing failed - no payment ID received', paymentData);
          throw new Error('Payment processing failed - no payment ID received. Please contact support.');
        }

        // Only update to confirmed if payment succeeded (non-test mode)
        if (!isTestMode) {
          console.log('✅ Updating booking to confirmed with payment ID:', paymentData.payment_id);
          await supabase
            .from('bookings')
            .update({ 
              status: 'confirmed',
              square_payment_id: paymentData.payment_id,
              paid_at: new Date().toISOString()
            })
            .eq('id', booking.id);
        }

        // Success message with credits info
        const successMessage = isTestMode 
          ? '🧪 TEST MODE: Booking created (no payment processed)'
          : paymentData?.credits_applied > 0 
            ? `Booking confirmed! $${paymentData.credits_applied.toFixed(2)} in referral credits applied.`
            : 'Booking confirmed! Check your email.';
        
        toast.success(successMessage);

        // Step 6: If membership selected, note it (future: create Square subscription)
        if (bookingData.joinMembership) {
          // TODO: Implement Square membership subscription ($9/month)
          console.log('Membership requested - to be implemented');
        }

      // Step 7: Clear booking data and redirect to success page with referral incentive
      if (!booking?.id) {
        console.error('❌ No booking ID available for redirect');
        toast.error('Booking created but redirect failed. Check your email for confirmation.');
        return;
      }
      
      clearBookingData();
      navigate(`/book/success?booking_id=${booking.id}`);
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const serviceTypeLabels: Record<string, string> = {
    regular: 'Standard Cleaning',
    deep: 'Deep Cleaning',
    move_in_out: 'Move-In/Out Cleaning',
  };

  const frequencyLabels: Record<string, string> = {
    one_time: 'One-Time',
    weekly: 'Weekly',
    bi_weekly: 'Bi-Weekly',
    monthly: 'Monthly',
  };

  const handleCountdownExpire = () => {
    toast.error('Time slot expired. Please select a new date and time.');
    navigate('/book/schedule');
  };

  // Calculate pricing for recurring upsell
  const getRecurringUpsellPricing = () => {
    if (!bookingData.tier || !bookingData.sqft || !bookingData.stateCode) return null;
    
    const oneTimeResult = getTierPrice(bookingData.tier, bookingData.sqft, bookingData.stateCode, 'one_time');
    const monthlyResult = getTierPrice(bookingData.tier, bookingData.sqft, bookingData.stateCode, 'monthly');
    
    return {
      oneTimePrice: oneTimeResult.finalPrice,
      monthlyPrice: monthlyResult.finalPrice,
    };
  };

  const handleRecurringSelection = (frequency: 'one_time' | 'monthly') => {
    updateBookingData({ frequency });
    // Show success toast when monthly is selected
    if (frequency === 'monthly') {
      toast.success('✅ Monthly Membership Selected! You\'re saving on every visit.');
    }
  };

  if (!pricing) return null;

  const recurringUpsellPricing = getRecurringUpsellPricing();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BookingProgressBar currentStep={5} totalSteps={5} />
      
      <div className="flex-1 px-4 py-8 lg:py-12">
        <div className="max-w-6xl mx-auto">
          {isTestMode && (
            <Alert className="mb-6 bg-orange-50 dark:bg-orange-950/30 border-orange-300">
              <TestTube className="h-4 w-4" />
              <AlertDescription>
                <strong>Test Mode Active:</strong> This booking will be created without processing payment.
                All webhooks will fire normally. Perfect for testing integrations.
              </AlertDescription>
            </Alert>
          )}

          {/* Countdown Timer */}
          {bookingData.bookingExpiresAt && (
            <div className="mb-6">
              <BookingCountdown 
                expiresAt={bookingData.bookingExpiresAt}
                onExpire={handleCountdownExpire}
              />
            </div>
          )}

          {/* Recurring Upsell Card */}
          {recurringUpsellPricing && (
            <RecurringUpsellCard
              oneTimePrice={recurringUpsellPricing.oneTimePrice}
              monthlyPrice={recurringUpsellPricing.monthlyPrice}
              onSelectOneTime={() => handleRecurringSelection('one_time')}
              onSelectMonthly={() => handleRecurringSelection('monthly')}
              selectedFrequency={bookingData.frequency}
            />
          )}
          
          <Link
            to="/book/summary" 
            className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block transition-colors"
          >
            ← Previous
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            🎊 Almost there!
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Reserve your spot now • Just ${depositAmount} to lock in this rate
          </p>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Contact Form & Payment */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName"
                        value={bookingData.contactInfo.firstName}
                        onChange={(e) => updateBookingData({
                          contactInfo: { ...bookingData.contactInfo, firstName: e.target.value }
                        })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName"
                        value={bookingData.contactInfo.lastName}
                        onChange={(e) => updateBookingData({
                          contactInfo: { ...bookingData.contactInfo, lastName: e.target.value }
                        })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      type="email"
                      value={bookingData.contactInfo.email}
                      onChange={(e) => updateBookingData({
                        contactInfo: { ...bookingData.contactInfo, email: e.target.value }
                      })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone"
                      type="tel"
                      value={bookingData.contactInfo.phone}
                      onChange={(e) => updateBookingData({
                        contactInfo: { ...bookingData.contactInfo, phone: e.target.value }
                      })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address1">Address</Label>
                    <Input 
                      id="address1"
                      value={bookingData.contactInfo.address1}
                      onChange={(e) => updateBookingData({
                        contactInfo: { ...bookingData.contactInfo, address1: e.target.value }
                      })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address2">Apt, Suite (Optional)</Label>
                    <Input 
                      id="address2"
                      value={bookingData.contactInfo.address2}
                      onChange={(e) => updateBookingData({
                        contactInfo: { ...bookingData.contactInfo, address2: e.target.value }
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="instructions">Special Instructions (Optional)</Label>
                    <Textarea 
                      id="instructions"
                      placeholder="Gate code, parking info, pet details..."
                      rows={3}
                      value={bookingData.specialInstructions}
                      onChange={(e) => updateBookingData({ specialInstructions: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <Checkbox 
                  id="membership"
                  checked={bookingData.joinMembership}
                  onCheckedChange={(checked) => updateBookingData({ joinMembership: !!checked })}
                />
                <Label htmlFor="membership" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">Join AlphaLux Club</span>
                    <Badge>$9/month</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Save on every clean, priority booking, and VIP support
                  </p>
                </Label>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>
                    {isTestMode ? '🧪 Test Payment' : 'Payment'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isTestMode ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Secure your booking with ${depositAmount} today. Card will be saved for remaining balance due after service.
                      </p>
                      <div id="square-card-container" className="min-h-[200px]"></div>
                    </>
                  ) : (
                    <Alert className="bg-orange-50 dark:bg-orange-950/30 border-orange-300">
                      <TestTube className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <strong>Test Mode:</strong> Payment processing is bypassed. No card required.
                        The booking will be created and all webhooks will fire normally.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Button 
                    size="lg" 
                    className="w-full h-14 text-lg font-semibold" 
                    onClick={handlePayment}
                    disabled={isProcessing || (!isTestMode && !isCardReady)}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {isTestMode ? 'Creating Test Booking...' : 'Processing...'}
                      </>
                    ) : isTestMode ? (
                      <>🧪 Create Test Booking</>
                    ) : (
                      <>🎉 Reserve My Spot - ${depositAmount} Today</>
                    )}
                  </Button>
                  {!isTestMode && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Lock in this rate • Remaining balance due at service
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Right: Booking Summary */}
            <Card className="h-fit sticky top-24">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Service</p>
                  <p className="font-medium">{serviceTypeLabels[bookingData.serviceType]}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Service Plan</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{frequencyLabels[bookingData.frequency]}</p>
                    {bookingData.frequency === 'monthly' && (
                      <Badge className="bg-primary text-xs">Membership</Badge>
                    )}
                  </div>
                  {bookingData.frequency === 'monthly' && recurringUpsellPricing && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      💰 Saving ${recurringUpsellPricing.oneTimePrice - recurringUpsellPricing.monthlyPrice} per visit
                    </p>
                  )}
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">
                    {new Date(bookingData.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm">{bookingData.timeSlot}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">
                    {bookingData.contactInfo.address1}
                    {bookingData.contactInfo.address2 && `, ${bookingData.contactInfo.address2}`}
                  </p>
                  <p className="text-sm">
                    {bookingData.city}, {bookingData.state} {bookingData.zipCode}
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${pricing.basePrice.toFixed(2)}</span>
                  </div>
                  
                  {pricing.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>
                        Discount ({pricing.basePrice > 0 ? Math.round((pricing.discountAmount / pricing.basePrice) * 100) : 0}%):
                      </span>
                      <span>-${pricing.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {availableCredits > 0 && applyCredits && (
                    <div className="flex justify-between text-sm text-primary font-medium">
                      <span>Referral Credits Applied</span>
                      <span>-${availableCredits.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${pricing.finalPrice.toFixed(2)}</span>
                  </div>
                  
                  <div className="bg-primary/10 p-3 rounded-lg mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Due Today</span>
                      <span className="text-xl font-bold text-primary">
                        ${(applyCredits ? Math.max(0, depositAmount - availableCredits) : depositAmount).toFixed(2)}
                      </span>
                    </div>
                    {availableCredits > 0 && applyCredits && (
                      <p className="text-xs text-success mb-1">
                        🎉 ${availableCredits.toFixed(2)} in referral credits applied!
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Remaining ${(pricing.finalPrice - depositAmount).toFixed(2)} due after service
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
