import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingProgressBar } from '@/components/booking/BookingProgressBar';
import { StripePaymentForm } from '@/components/booking/StripePaymentForm';
import { useTestMode } from '@/hooks/useTestMode';
import { useBookingProgress } from '@/hooks/useBookingProgress';
import { useFacebookPixel } from '@/hooks/useFacebookPixel';
import { TestTube } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useBooking } from '@/contexts/BookingContext';
import { supabase } from '@/integrations/supabase/client';
import { getStripeAccountSlug } from '@/lib/stripe';
import { toast } from 'sonner';
import {
  Loader2,
  Shield,
  CreditCard,
  Lock,
  Tag,
  CheckCircle2,
  Clock,
  Star,
  Repeat,
} from 'lucide-react';
import { GoogleGuaranteedBadge } from '@/components/trust/GoogleGuaranteedBadge';
import { BrandedLoader } from '@/components/BrandedLoader';

export default function BookingCheckout() {
  const navigate = useNavigate();
  const { bookingData, updateBookingData } = useBooking();
  const { isTestMode } = useTestMode();
  const { trackStep, markCompleted } = useBookingProgress();
  const { trackInitiateCheckout } = useFacebookPixel();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [accountPublishableKey, setAccountPublishableKey] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [initSlow, setInitSlow] = useState(false);
  const [hasTrackedCheckout, setHasTrackedCheckout] = useState(false);

  // Recurring 3-clean commitment acknowledgment. Required before the
  // embedded Stripe payment form is enabled when offerType ===
  // 'recurring'. Persisted on the booking row in
  // property_details.recurring_agreement_accepted_at via
  // confirm-booking-payment so we have an audit trail.
  const [recurringAgreed, setRecurringAgreed] = useState(false);

  // Local contact form state — the Offer step doesn't collect it, so we
  // prompt for it inline if it's missing. This prevents the page from
  // silently blanking out and keeps the Stripe form loading flow in one
  // place.
  const [contactDraft, setContactDraft] = useState({
    firstName: bookingData.contactInfo?.firstName || '',
    lastName: bookingData.contactInfo?.lastName || '',
    email: bookingData.contactInfo?.email || '',
    phone: bookingData.contactInfo?.phone || '',
  });
  const [contactFormError, setContactFormError] = useState<string | null>(null);

  const hasContact = Boolean(
    bookingData.contactInfo?.firstName &&
      bookingData.contactInfo?.lastName &&
      bookingData.contactInfo?.email &&
      bookingData.contactInfo?.phone,
  );

  // Redirect back to the zip step if the customer somehow landed here
  // without picking a home size / offer.
  useEffect(() => {
    if (!bookingData.zipCode) {
      navigate('/book/zip', { replace: true });
    } else if (!bookingData.basePrice) {
      navigate('/book/offer', { replace: true });
    }
  }, [bookingData.zipCode, bookingData.basePrice, navigate]);

  // Self-heal stale localStorage shape from the pre-fix /book/offer
  // bug (where promoDiscount equaled the entire basePrice). We blow
  // the bad promo away once on mount so the Stripe init below uses
  // the correct deposit amount; the customer can re-apply the promo
  // freely afterward via the input on this same page.
  useEffect(() => {
    const base = bookingData.basePrice || 0;
    const discount = bookingData.promoDiscount || 0;
    if (base > 0 && discount > 0 && discount >= base) {
      console.warn(
        '[checkout] Detected duplicated promo discount in stored booking — clearing.',
        { basePrice: base, promoDiscount: discount },
      );
      updateBookingData({ promoCode: '', promoDiscount: 0 });
      setPromoDisplay(null);
      setPromoInput('');
    }
    // Run only once on mount; subsequent edits go through handleApplyPromo /
    // handleRemovePromo which already keep the shape clean.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hasContact && !hasTrackedCheckout) {
      trackStep('checkout_started');
      setHasTrackedCheckout(true);
    }
  }, [hasContact, hasTrackedCheckout, trackStep]);

  // ---- Promo code (customer-entered, not auto-applied) ----
  // We start from whatever is already stored on the booking context
  // (e.g. a code carried over via ?promo=ALC2026 deep link) and let
  // the customer type a new code if they have one.
  const [promoInput, setPromoInput] = useState(bookingData.promoCode || '');
  const [promoApplying, setPromoApplying] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoDisplay, setPromoDisplay] = useState<string | null>(
    bookingData.promoCode && bookingData.promoDiscount
      ? `Code ${bookingData.promoCode.toUpperCase()} applied`
      : null,
  );

  // Calculate final amounts.
  //
  // Defensive guard: there was previously a bug in /book/offer where
  // `basePrice` was stored as the **already-discounted** price and
  // `promoDiscount` was stored alongside it, causing the discount to
  // be subtracted twice here and the total to crash to $0. The Offer
  // page now writes the pre-discount price, but customers who hit
  // the old code path still have the bad shape sitting in
  // localStorage. If the discount equals or exceeds the base price we
  // assume the data is corrupted and ignore the discount rather than
  // sell a $0 booking. The promo can still be re-applied below.
  const rawBase = bookingData.basePrice || 0;
  const rawDiscount = bookingData.promoDiscount || 0;
  const discountIsCorrupt = rawDiscount > 0 && rawDiscount >= rawBase;
  const effectiveDiscount = discountIsCorrupt ? 0 : rawDiscount;
  const finalPrice = Math.max(0, rawBase - effectiveDiscount);

  // Payment model:
  //
  //   * One-time offers (Standard / Deep Clean / one-off Recurring
  //     first visit): customer pays a 50% deposit up front to
  //     reserve the slot. Stripe saves the card on file
  //     (setup_future_usage='off_session' on the PaymentIntent) and
  //     the remaining 50% is billed after the cleaning is complete
  //     via `send-balance-invoice`.
  //   * 90-day plan: keeps the original starter-deposit + monthly
  //     subscription split because the plan is the product (3
  //     monthly payments are baked into the offer). We surface a
  //     small 6.25% starter deposit to lock the slot and then bill
  //     the rest via the recurring subscription.
  const is90DayPlan = bookingData.offerType === '90_day_plan';
  const monthlyPayment = Math.round(finalPrice * 0.25);
  const totalMonthlyPayments = monthlyPayment * 3;
  const starterDeposit = is90DayPlan
    ? Math.max(1, Math.round(finalPrice * 0.0625))
    : 0;
  // 50% deposit for one-time bookings — rounded to the nearest cent
  // so the deposit + balance always reconciles back to `finalPrice`.
  const oneTimeDeposit = !is90DayPlan
    ? Math.round(finalPrice * 0.5 * 100) / 100
    : 0;
  // `dueToday` is what we charge in the embedded card form. For
  // one-time bookings that's the 50% reservation deposit. For the
  // 90-day plan it's the small starter deposit; the rest comes via
  // the auto-bill subscription created by `create-90day-subscription`.
  const dueToday = is90DayPlan ? starterDeposit : oneTimeDeposit;
  const balanceDue = is90DayPlan
    ? Math.max(0, finalPrice - starterDeposit)
    : Math.max(0, finalPrice - oneTimeDeposit);
  const firstCleanBalance = is90DayPlan
    ? Math.max(0, finalPrice - starterDeposit - totalMonthlyPayments)
    : 0;

  const individualServicePrice = bookingData.basePrice
    ? (bookingData.basePrice / 4) * 1.2
    : 0;
  const totalIndividualCost = individualServicePrice * 4;
  const savings = Math.round(totalIndividualCost - finalPrice);

  const initializePayment = useCallback(async () => {
    if (isInitializing || clientSecret) return;
    if (!hasContact) {
      setInitError('Please enter your contact details to continue.');
      return;
    }
    setIsInitializing(true);
    setInitError(null);
    setInitSlow(false);
    // After 8s we surface a manual "Try Again" escape hatch so the
    // BrandedLoader can never trap the user if the edge function
    // (or Stripe) is taking too long to respond.
    const slowTimer = window.setTimeout(() => setInitSlow(true), 8000);
    // Hard 25s timeout — if the edge function is wedged we want to
    // show an actionable error instead of an infinite spinner.
    const hardTimer = window.setTimeout(() => {
      setInitError(
        'Stripe is taking longer than expected to respond. Please try again.',
      );
      setIsInitializing(false);
    }, 25000);
    const clearTimers = () => {
      window.clearTimeout(slowTimer);
      window.clearTimeout(hardTimer);
    };

    try {
      // If we already minted a booking on this page (e.g. the user
      // applied a promo which forced a fresh PaymentIntent), reuse
      // that booking row instead of letting the server insert a new
      // one. Without this, every promo apply/remove creates a
      // duplicate booking.
      const reuseBookingId = bookingId;

      const customerData = {
        email: bookingData.contactInfo.email,
        firstName: bookingData.contactInfo.firstName,
        lastName: bookingData.contactInfo.lastName,
        phone: bookingData.contactInfo.phone,
        address1: bookingData.contactInfo.address1,
        address2: bookingData.contactInfo.address2,
        city: bookingData.contactInfo.city || bookingData.city,
        state: bookingData.contactInfo.state || bookingData.state,
        zip: bookingData.contactInfo.zip || bookingData.zipCode,
      };

      const bookingPayload = {
        serviceType: bookingData.serviceType,
        frequency: bookingData.frequency,
        sqftOrBedrooms: `${bookingData.bedrooms}bed/${bookingData.bathrooms}bath`,
        homeSize: bookingData.homeSizeId,
        zipCode: bookingData.zipCode,
        estPrice: finalPrice,
        // `depositAmount` is the column name used by the bookings
        // table for "what we charged at checkout". For one-time
        // bookings we charge the full price, so deposit == final.
        depositAmount: dueToday,
        basePrice: finalPrice,
        balanceDue,
        offerName: bookingData.offerName,
        offerType: bookingData.offerType,
        visitCount: bookingData.visitCount,
        isRecurring: is90DayPlan,
        promoCode: bookingData.promoCode || null,
        promoDiscountCents: bookingData.promoDiscount
          ? Math.round(bookingData.promoDiscount * 100)
          : 0,
        serviceDate: bookingData.date || null,
        timeSlot: bookingData.timeSlot || null,
        specialInstructions: bookingData.specialInstructions || null,
        addressLine1: bookingData.contactInfo.address1 || null,
        addressLine2: bookingData.contactInfo.address2 || null,
        fullName:
          `${bookingData.contactInfo.firstName} ${bookingData.contactInfo.lastName}`.trim(),
        source: 'customer_web',
        pricingBreakdown: {
          basePrice: bookingData.basePrice || 0,
          promoCode: bookingData.promoCode,
          promoDiscount: bookingData.promoDiscount || 0,
          finalPrice,
          depositAmount: dueToday,
          balanceDue,
          monthlyAmount: monthlyPayment,
        },
      };

      // STRICT state-based Stripe account routing. NY → try, CA + TX
      // → book. We pass the resolved slug to the edge function so it
      // doesn't have to re-derive it from request headers — the
      // server still validates against customerData.state/zip on its
      // end and ignores this hint if it disagrees with the location.
      const stripeAccount = getStripeAccountSlug(
        bookingData.contactInfo?.state || bookingData.state,
        bookingData.contactInfo?.zip || bookingData.zipCode,
      );

      if (isTestMode) {
        console.log('🧪 TEST MODE: Creating booking via edge function', {
          stripeAccount,
        });
        const { data, error } = await supabase.functions.invoke(
          'create-payment-intent',
          {
            body: {
              amount: dueToday,
              customerEmail: customerData.email,
              customerName: `${customerData.firstName} ${customerData.lastName}`,
              customerPhone: customerData.phone,
              customerData,
              bookingData: bookingPayload,
              paymentType: is90DayPlan ? 'deposit' : 'full',
              bookingId: reuseBookingId,
              account: stripeAccount,
            },
          },
        );
        if (error) throw new Error(error.message);
        setCustomerId(data?.customerId ?? null);
        setBookingId(data?.bookingId ?? null);
        return;
      }

      if (is90DayPlan) {
        const { data: initData, error: initError } =
          await supabase.functions.invoke('create-payment-intent', {
            body: {
              amount: dueToday,
              customerEmail: customerData.email,
              customerName: `${customerData.firstName} ${customerData.lastName}`,
              customerPhone: customerData.phone,
              customerData,
              bookingData: bookingPayload,
              paymentType: 'deposit',
              bookingId: reuseBookingId,
              account: stripeAccount,
            },
          });

        const initServerError = (initData as any)?.error;
        const initServerCode = (initData as any)?.code;
        if (initError || initServerError) {
          const friendly =
            initServerCode === 'stripe_auth_error'
              ? 'Our payment processor is temporarily unavailable. Please try again shortly.'
              : initServerError || initError?.message || 'Failed to create payment';
          throw new Error(friendly);
        }
        setCustomerId(initData.customerId);
        setBookingId(initData.bookingId);

        const { data, error } = await supabase.functions.invoke(
          'create-90day-subscription',
          {
            body: {
              bookingId: initData.bookingId,
              customerId: initData.customerId,
              customerEmail: customerData.email,
              customerName: `${customerData.firstName} ${customerData.lastName}`,
              customerPhone: customerData.phone,
              depositAmount: dueToday,
              monthlyAmount: monthlyPayment,
              totalAmount: finalPrice,
              address: {
                line1: customerData.address1,
                line2: customerData.address2,
                city: customerData.city,
                state: customerData.state,
                postal_code: customerData.zip,
              },
            },
          },
        );

        if (error) throw new Error(error.message);
        if (!data?.clientSecret) throw new Error('Failed to create payment');

        setClientSecret(data.clientSecret);
      } else {
        console.log('[checkout] Calling create-payment-intent', {
          amount: dueToday,
          paymentType: 'deposit',
          reuseBookingId,
          stripeAccount,
        });
        const { data, error } = await supabase.functions.invoke(
          'create-payment-intent',
          {
            body: {
              amount: dueToday,
              customerEmail: customerData.email,
              customerName: `${customerData.firstName} ${customerData.lastName}`,
              customerPhone: customerData.phone,
              customerData,
              bookingData: bookingPayload,
              // One-time offers charge a 50% reservation deposit
              // up front; the remaining 50% is invoiced after the
              // cleaning via `send-balance-invoice`. The card is
              // saved on the Stripe Customer (setup_future_usage)
              // so the balance invoice can use the saved card.
              paymentType: 'deposit',
              bookingId: reuseBookingId,
              metadata: { offer_type: bookingData.offerType },
              account: stripeAccount,
            },
          },
        );
        console.log('[checkout] create-payment-intent response', {
          hasData: !!data,
          hasError: !!error,
          hasClientSecret: !!(data?.clientSecret || data?.client_secret),
        });

        // Surface the server's structured error payload. supabase-js
        // sets a FunctionsHttpError on non-2xx but doesn't always
        // surface the JSON body, so we also peek at error.context.
        let serverError = (data as any)?.error;
        let serverCode = (data as any)?.code;
        if (error && !serverError) {
          try {
            const ctxRes: Response | undefined = (error as any)?.context;
            if (ctxRes && typeof ctxRes.json === 'function') {
              const body = await ctxRes.clone().json();
              serverError = body?.error || serverError;
              serverCode = body?.code || serverCode;
            }
          } catch {
            // ignore — fall through to generic error below
          }
        }
        if (error || serverError) {
          const friendly =
            serverCode === 'stripe_auth_error'
              ? "Our payment processor is temporarily unavailable. Please try again in a moment or reach out to support — we'll still honor your quote."
              : serverError || error?.message || 'Failed to create payment';
          throw new Error(friendly);
        }
        const secret = data?.clientSecret || data?.client_secret;
        if (!secret) throw new Error('Failed to create payment intent');

        setCustomerId(data.customerId);
        setBookingId(data.bookingId);
        setClientSecret(secret);
        // The server returns the publishable key inline with the
        // client secret so Stripe.js boots against the exact same
        // Stripe account that owns this PaymentIntent in one round
        // trip — no separate /get-stripe-config call required.
        if (data.publishableKey) setAccountPublishableKey(data.publishableKey);
      }

      // Meta Pixel — InitiateCheckout fires once the PaymentIntent
      // is live and the customer is staring at the card form. We
      // report the amount they're actually about to pay (the full
      // service price for one-time bookings, or the starter deposit
      // for the 90-day plan) — InitiateCheckout value in Meta is
      // supposed to represent what the user is submitting, not the
      // lifetime contract value.
      trackInitiateCheckout({
        value: dueToday,
        currency: 'USD',
      });

      console.log('✅ Payment initialized');
    } catch (error: any) {
      console.error('Failed to initialize payment:', error);
      const msg = error?.message || 'Failed to initialize payment';
      setInitError(msg);
      toast.error(msg);
    } finally {
      clearTimers();
      setInitSlow(false);
      setIsInitializing(false);
    }
  }, [
    bookingData,
    finalPrice,
    dueToday,
    balanceDue,
    monthlyPayment,
    is90DayPlan,
    isTestMode,
    isInitializing,
    clientSecret,
    hasContact,
    bookingId,
  ]);

  // Kick off Stripe initialization as soon as we have a contact and
  // haven't already done it. Missing contact info shows the inline
  // "Contact Details" form instead of silently doing nothing.
  useEffect(() => {
    if (hasContact && !clientSecret && !isTestMode && !isInitializing) {
      initializePayment();
    }
  }, [hasContact, clientSecret, isTestMode, isInitializing, initializePayment]);

  const handleApplyPromo = async () => {
    const trimmed = promoInput.trim().toUpperCase();
    if (!trimmed) {
      setPromoError('Enter a promo code to apply.');
      return;
    }
    if (!bookingData.basePrice || bookingData.basePrice <= 0) {
      setPromoError('Please complete your selection before applying a code.');
      return;
    }

    setPromoApplying(true);
    setPromoError(null);

    try {
      const { data, error } = await supabase.functions.invoke('promo-system', {
        body: {
          action: 'validate',
          code: trimmed,
          subtotal_cents: Math.round((bookingData.basePrice || 0) * 100),
          booking_type: bookingData.offerType === '90_day_plan' ? 'ANY' : 'ONE_TIME',
          email: bookingData.contactInfo?.email || null,
        },
      });

      if (error) {
        setPromoError(error.message || 'Failed to validate promo code');
        return;
      }

      if (!data?.valid) {
        setPromoError(data?.reason || 'This code is not valid right now.');
        return;
      }

      const discountDollars =
        (data.discount_cents ?? 0) / 100;

      if (discountDollars <= 0) {
        setPromoError('This code does not discount this order.');
        return;
      }

      updateBookingData({
        promoCode: trimmed,
        promoDiscount: discountDollars,
      });
      setPromoDisplay(data.display || `Code ${trimmed} applied`);
      // Force Stripe to re-initialize so the payment intent uses the
      // new deposit amount.
      setClientSecret(null);
      setAccountPublishableKey(null);
      setBookingId(null);
      toast.success(data.display || `Promo ${trimmed} applied`);
    } catch (err: any) {
      setPromoError(err?.message || 'Could not validate promo code');
    } finally {
      setPromoApplying(false);
    }
  };

  const handleRemovePromo = () => {
    updateBookingData({ promoCode: '', promoDiscount: 0 });
    setPromoInput('');
    setPromoDisplay(null);
    setPromoError(null);
    setClientSecret(null);
    setAccountPublishableKey(null);
    setBookingId(null);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactFormError(null);

    const { firstName, lastName, email, phone } = contactDraft;
    if (!firstName.trim() || !lastName.trim()) {
      setContactFormError('Please enter your first and last name.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setContactFormError('Please enter a valid email address.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setContactFormError('Please enter a valid phone number.');
      return;
    }

    updateBookingData({
      contactInfo: {
        ...bookingData.contactInfo,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      },
    });
  };

  const handlePaymentSuccess = async (
    paymentIntentId: string,
    subscriptionId?: string,
  ) => {
    if (!bookingId) {
      // We got a successful PaymentIntent but lost the bookingId (most
      // likely a full-page reload between intent creation and 3DS
      // return). Don't leave the user frozen — warn, reset, and ask
      // them to refresh so we can pick the booking back up from
      // storage.
      toast.error(
        'Payment succeeded but we lost your booking reference. Please refresh.',
      );
      setIsProcessing(false);
      return;
    }

    try {
      // Both one-time bookings and the 90-day plan now flow through
      // `deposit_paid` — one-time bookings collect a 50% reservation
      // deposit at checkout and the remaining 50% is invoiced after
      // the cleaning. The 90-day plan handles its remaining balance
      // via the auto-bill subscription.
      const paymentStatus = 'deposit_paid';
      // For recurring plans, record the moment the customer agreed
      // to the 3-clean minimum + saved-card terms so we have an
      // audit trail on the booking row. The checkbox at /book/checkout
      // is required before the payment form was even enabled, so
      // reaching this code path implies acceptance.
      const recurringAgreementAcceptedAt =
        isRecurringPlan && recurringAgreed
          ? new Date().toISOString()
          : undefined;
      const { error } = await supabase.functions.invoke(
        'confirm-booking-payment',
        {
          body: {
            bookingId,
            paymentIntentId,
            subscriptionId,
            paymentStatus,
            recurringAgreementAcceptedAt,
          },
        },
      );

      if (error) {
        console.error('Error confirming booking payment:', error);
        throw new Error(error.message);
      }

      markCompleted(bookingId);

      // Redeem the promo server-side if one was applied — this enforces
      // the once-per-customer rule and stamps the booking with the
      // final discount.
      if (bookingData.promoCode && bookingData.promoDiscount && bookingData.promoDiscount > 0) {
        try {
          await supabase.functions.invoke('promo-system', {
            body: {
              action: 'redeem',
              code: bookingData.promoCode,
              booking_id: bookingId,
              customer_id: customerId,
              subtotal_cents: Math.round((bookingData.basePrice || 0) * 100),
              booking_type: is90DayPlan ? 'ANY' : 'ONE_TIME',
              email: bookingData.contactInfo?.email || null,
            },
          });
        } catch (promoErr) {
          console.error('Failed to redeem promo server-side:', promoErr);
        }
      }

      // For one-time bookings the customer paid a 50% reservation
      // deposit; queue the balance invoice for the remaining 50% so
      // it goes out after the cleaning is complete. We don't want to
      // block the redirect on this — fire-and-forget with a logged
      // error if Stripe rejects it (the saved card on the Customer
      // means it'll succeed off-session when the invoice runs).
      if (!is90DayPlan && balanceDue > 0) {
        try {
          await supabase.functions.invoke('send-balance-invoice', {
            body: { bookingId },
          });
        } catch (invoiceErr) {
          console.error('Failed to queue balance invoice:', invoiceErr);
        }
      }

      try {
        await supabase.functions.invoke('send-payment-schedule', {
          body: {
            bookingId,
            customerEmail: bookingData.contactInfo.email,
            customerName: `${bookingData.contactInfo.firstName} ${bookingData.contactInfo.lastName}`,
            offerType: bookingData.offerType || 'standard',
            totalPrice: finalPrice,
            depositAmount: dueToday,
            firstCleanBalance,
            monthlyPayment,
          },
        });
      } catch (emailError) {
        console.error('Failed to send payment schedule email:', emailError);
      }

      toast.success(
        is90DayPlan
          ? "Starter deposit paid! Let's finalize your booking."
          : "50% deposit received! Let's finalize your booking.",
      );
      navigate(`/book/details?booking_id=${bookingId}`);
    } catch (error: any) {
      console.error('Error updating booking:', error);
      toast.error('Payment recorded but failed to update booking');
      setIsProcessing(false);
    }
  };

  const handleTestPayment = async () => {
    if (!bookingId) {
      await initializePayment();
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke(
        'confirm-booking-payment',
        {
          body: {
            bookingId,
            paymentIntentId: 'test_' + Date.now(),
            paymentStatus: 'deposit_paid',
          },
        },
      );

      if (error) throw new Error(error.message);
      markCompleted(bookingId);
      toast.success('Test payment successful!');
      navigate(`/book/details?booking_id=${bookingId}`);
    } catch (error: any) {
      toast.error(error.message || 'Test payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    navigate('/book/offer');
  };

  if (!bookingData.basePrice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center space-y-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">
              Preparing your quote… redirecting.
            </p>
            <Button onClick={() => navigate('/book/offer')} variant="outline">
              Pick a Service
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getServiceDetails = () => {
    const serviceType = bookingData.serviceType || 'standard';

    const details = {
      standard: {
        title: 'Standard Cleaning',
        duration: '2–3 hours',
        features: [
          'Professional cleaning team',
          'Eco-friendly cleaning products',
          'All supplies and equipment included',
          'Satisfaction guarantee',
        ],
        checklist: [
          'Kitchen: countertops, sink, stovetop, appliance exteriors',
          'Bathrooms: sanitize fixtures, polish mirrors, mop floors',
          'Living areas: dust surfaces, vacuum carpets, mop floors',
          'Bedrooms: dust furniture, change linens on request',
          'Trash removal and general tidying',
        ],
      },
      deep: {
        title: 'Deep Clean',
        duration: '3–5 hours',
        features: [
          'Professional 2-person team',
          'Eco-friendly products & HEPA vacuums',
          'All supplies and equipment included',
          '100% satisfaction guarantee',
        ],
        checklist: [
          'Kitchen: deep clean appliances, cabinets, countertops',
          'Bathrooms: scrub tiles, sanitize fixtures, polish mirrors',
          'Living areas: dust surfaces, vacuum carpets, mop floors',
          'Bedrooms: full refresh and detailed dusting',
          'Interior windows, sills, and baseboards',
        ],
      },
      tester: {
        title: 'Tester Deep Clean (90-Min)',
        duration: '90 minutes',
        features: [
          'Experienced cleaning professional',
          'Focus on high-priority areas',
          'Premium eco-friendly products',
          'Perfect for trying our service',
        ],
        checklist: [
          'Kitchen: countertops, sink, and stovetop',
          'Bathroom: sanitize toilet, sink, and mirror',
          'Living room: dust surfaces and vacuum',
          'Quick tidy of visible areas',
          'Trash removal and basic organizing',
        ],
      },
      '90day': {
        title: '90-Day Deep Clean Bundle',
        duration: '3–4 hours per visit',
        features: [
          '3 deep cleaning sessions over 90 days',
          'Consistent cleaning team',
          'Flexible scheduling',
          'Best value for money',
        ],
        checklist: [
          'Complete deep cleaning for each visit',
          'All areas covered thoroughly',
          'Kitchen, bathrooms, bedrooms, living areas',
          'Windows, baseboards, and detailed surfaces',
          'Customizable priority areas',
        ],
      },
    };

    return details[serviceType as keyof typeof details] || details.deep;
  };

  const serviceDetails = getServiceDetails();

  // Show the applied discount as a real percent of the pre-promo price
  // rather than a hard-coded "20% Off" label. If no promo is applied
  // (or the stored discount was flagged as corrupt above) the discount
  // line hides entirely.
  const promoPercent =
    effectiveDiscount > 0 && rawBase > 0
      ? Math.round((effectiveDiscount / rawBase) * 100)
      : 0;
  const promoLabelSuffix = promoPercent > 0 ? `${promoPercent}% Off` : 'Discount';
  // 90-day plan keeps the small starter-deposit label; one-time
  // offers now collect a 50% reservation deposit at checkout (the
  // remaining 50% is invoiced after the cleaning to the saved card).
  const dueTodayLabel = is90DayPlan ? '6.25% Starter Deposit' : '50% Deposit Due Today';

  // The "Deep + Standard within 14 days" combo is a 2-visit one-time
  // bundle. We surface different copy in the checkout summary so the
  // customer knows the deposit covers both visits and the second
  // half is invoiced after the second cleaning.
  const isComboBundle = bookingData.offerType === 'deep_plus_standard';

  // Recurring Maintenance is a 3-clean minimum commitment.
  // First visit is 50% deposit + 50% balance (existing flow). Visits
  // 2 + 3 are billed off-session at the maintenance rate against the
  // card saved at checkout (setup_future_usage='off_session' on the
  // PaymentIntent already attaches the PaymentMethod to the
  // Customer). The customer must explicitly acknowledge the 3-visit
  // minimum + saved-card terms before the embedded Stripe form
  // becomes interactive.
  const isRecurringPlan = bookingData.offerType === 'recurring';
  const recurringMinVisits = 3;
  // The post-promo `finalPrice` is just visit 1. Visits 2 + 3 bill
  // at the standard maintenance rate (no promo). We pull the
  // maintenance rate from the booking's pricingBreakdown if it's
  // there; otherwise we conservatively assume each remaining visit
  // costs the same as the pre-promo basePrice (which is the
  // maintenance rate on the recurring offer).
  const recurringMaintenancePerVisit = rawBase || finalPrice;
  const recurringRemainingVisitsTotal = isRecurringPlan
    ? recurringMaintenancePerVisit * (recurringMinVisits - 1)
    : 0;
  const recurringContractTotal = isRecurringPlan
    ? finalPrice + recurringRemainingVisitsTotal
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <BookingProgressBar currentStep={4} totalSteps={6} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-3">
            Review & Reserve
          </h1>
          <p className="text-lg text-muted-foreground">
            {is90DayPlan
              ? 'Lock in your 90-day plan with a small starter deposit. Monthly billing handles the rest. No hidden fees.'
              : isComboBundle
                ? 'Reserve your Deep + Standard combo with a 50% deposit today. Your card is securely saved on file — the remaining 50% is automatically charged after your follow-up Standard Clean (within 14 days).'
                : isRecurringPlan
                  ? `Start your 3-visit recurring plan with a 50% deposit on visit 1. Your card is securely saved on file and visits 2 and 3 are auto-billed at the maintenance rate.`
                  : 'Reserve your service with a 50% deposit today. Your card is securely saved on file and the remaining 50% is automatically charged after your cleaning is complete.'}
          </p>
          <div className="flex justify-center mt-4">
            <GoogleGuaranteedBadge variant="compact" />
          </div>
        </div>

        <div className="grid gap-6">
          {/* Booking Summary */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service</span>
                <span className="font-semibold">
                  {bookingData.offerName || 'Cleaning Service'}
                </span>
              </div>
              {(bookingData.city || bookingData.state) && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-semibold">
                    {[bookingData.city, bookingData.state]
                      .filter(Boolean)
                      .join(', ') || bookingData.zipCode}
                  </span>
                </div>
              )}

              <Separator />

              {bookingData.promoCode && effectiveDiscount > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Original Price
                    </span>
                    <span className="line-through text-muted-foreground">
                      ${rawBase.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm bg-primary/10 p-2 rounded-lg border border-primary/30">
                    <span className="flex items-center gap-1 text-primary font-semibold">
                      <Tag className="w-4 h-4" />
                      New Customer Special ({promoLabelSuffix})
                    </span>
                    <span className="text-primary font-bold">
                      -${effectiveDiscount.toFixed(2)}
                    </span>
                  </div>
                  <Separator />
                </>
              )}

              <div className="flex justify-between font-bold text-lg">
                <span>
                  {bookingData.offerType === '90_day_plan'
                    ? 'Total Service Cost (Over 3 Months)'
                    : 'Total Service Cost'}
                </span>
                <span>${finalPrice.toFixed(2)}</span>
              </div>

              {bookingData.offerType === '90_day_plan' && savings > 0 && (
                <div className="text-sm text-primary font-semibold">
                  Save ${savings} vs booking separately
                </div>
              )}

              <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                {bookingData.offerType === '90_day_plan' ? (
                  <>
                    <div className="mb-3">
                      <p className="font-semibold text-sm mb-3">
                        Payment Breakdown
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Today ({dueTodayLabel})
                          </span>
                          <span className="font-bold text-primary">
                            ${dueToday.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            After 1st Service
                          </span>
                          <span className="font-bold">
                            ${firstCleanBalance.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-border/50">
                          <span className="text-sm font-medium">
                            Monthly Payment (3 months, auto-billed)
                          </span>
                          <span className="text-lg font-bold text-primary">
                            ${monthlyPayment}/month
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{dueTodayLabel}</span>
                      <span className="text-2xl font-bold text-primary">
                        ${dueToday.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-border/50">
                      <span className="text-muted-foreground">
                        Remaining Balance (charged after service)
                      </span>
                      <span className="font-bold">
                        ${balanceDue.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {isComboBundle ? (
                        <>
                          Your card is securely saved on file with Stripe.
                          Today's deposit covers both visits — the remaining
                          50% is automatically charged after your follow-up
                          Standard Clean (within 14 days). No need to enter
                          your card again.
                        </>
                      ) : (
                        <>
                          Your card is securely saved on file with Stripe.
                          The remaining 50% is automatically charged after
                          your cleaning is complete — no need to enter your
                          card again.
                        </>
                      )}
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Service Details */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                What's Included
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-semibold">{serviceDetails.duration}</span>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-sm">Premium Features</h3>
                <div className="grid gap-2">
                  {serviceDetails.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3 text-sm">
                  Detailed Cleaning Checklist
                </h3>
                <div className="grid gap-2">
                  {serviceDetails.checklist.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Promo code */}
          <Card className="border-alx-gold/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Promo Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {promoDisplay ? (
                <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1 text-sm">
                    <div className="font-semibold text-primary">
                      {promoDisplay}
                    </div>
                    {effectiveDiscount > 0 ? (
                      <div className="text-xs text-muted-foreground">
                        Savings: ${effectiveDiscount.toFixed(2)}
                      </div>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleRemovePromo}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Have a code? Enter it here to unlock your discount — promo codes
                    are validated and redeemed one-time per customer.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      aria-label="Promo code"
                      placeholder="e.g. ALC2026"
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value.toUpperCase());
                        setPromoError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyPromo();
                        }
                      }}
                      className="uppercase tracking-wider"
                      disabled={promoApplying}
                    />
                    <Button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={promoApplying || !promoInput.trim()}
                    >
                      {promoApplying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Checking…
                        </>
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </div>
                  {promoError && (
                    <Alert variant="destructive">
                      <AlertDescription>{promoError}</AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Recurring Service Agreement — only shown when the
              customer is signing up for a recurring plan. The
              embedded Stripe form below will not enable until the
              checkbox is ticked. */}
          {isRecurringPlan && (
            <Card className="border-alx-gold/40 bg-alx-gold/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Repeat className="h-5 w-5 text-alx-gold" />
                  Recurring Service Agreement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground">
                  Recurring Maintenance is a <strong>3-clean minimum
                  commitment</strong>. By starting this plan you agree
                  to the following terms:
                </p>
                <ul className="space-y-2 text-sm text-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-alx-gold mt-0.5 flex-shrink-0" />
                    <span>
                      You'll receive at least <strong>3 cleanings</strong>{' '}
                      under this plan. The 50% deposit you pay today
                      covers visit&nbsp;1; the remaining 50% of visit&nbsp;1
                      is invoiced after that cleaning.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-alx-gold mt-0.5 flex-shrink-0" />
                    <span>
                      Your card is{' '}
                      <strong>securely saved on file with Stripe</strong>{' '}
                      and will be auto-charged for visits&nbsp;2 and&nbsp;3
                      at the standard maintenance rate of{' '}
                      <strong>${recurringMaintenancePerVisit.toFixed(2)}</strong>{' '}
                      per visit, before each scheduled cleaning.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-alx-gold mt-0.5 flex-shrink-0" />
                    <span>
                      Estimated total over the 3-visit minimum:{' '}
                      <strong>${recurringContractTotal.toFixed(2)}</strong>{' '}
                      (visit&nbsp;1 with promo + 2 maintenance visits at
                      the standard rate).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-alx-gold mt-0.5 flex-shrink-0" />
                    <span>
                      After the 3-visit minimum is complete, you can
                      pause, change frequency, or cancel anytime by
                      contacting AlphaLux support.
                    </span>
                  </li>
                </ul>

                <div className="flex items-start gap-3 rounded-lg border border-alx-gold/40 bg-background p-3">
                  <Checkbox
                    id="recurring-agree"
                    checked={recurringAgreed}
                    onCheckedChange={(v) => setRecurringAgreed(v === true)}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="recurring-agree"
                    className="text-sm font-medium leading-snug cursor-pointer"
                  >
                    I understand and agree — I'm signing up for a
                    minimum of 3 cleanings, and my card will be saved
                    on file and auto-charged before visits&nbsp;2 and&nbsp;3.
                  </Label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hasContact ? (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Tell us where to send your booking confirmation and
                    service updates.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="firstName">First name</Label>
                      <Input
                        id="firstName"
                        autoComplete="given-name"
                        value={contactDraft.firstName}
                        onChange={(e) =>
                          setContactDraft((d) => ({
                            ...d,
                            firstName: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input
                        id="lastName"
                        autoComplete="family-name"
                        value={contactDraft.lastName}
                        onChange={(e) =>
                          setContactDraft((d) => ({
                            ...d,
                            lastName: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={contactDraft.email}
                      onChange={(e) =>
                        setContactDraft((d) => ({
                          ...d,
                          email: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      value={contactDraft.phone}
                      onChange={(e) =>
                        setContactDraft((d) => ({
                          ...d,
                          phone: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {contactFormError && (
                    <Alert variant="destructive">
                      <AlertDescription>{contactFormError}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" size="lg" className="w-full">
                    Continue to Secure Payment
                  </Button>
                </form>
              ) : isRecurringPlan && !recurringAgreed ? (
                <Alert className="border-alx-gold/40 bg-alx-gold/5">
                  <Repeat className="h-4 w-4 text-alx-gold" />
                  <AlertDescription className="text-sm">
                    Please review and accept the{' '}
                    <strong>Recurring Service Agreement</strong> above
                    (3-clean minimum + saved-card terms) to enable the
                    payment form.
                  </AlertDescription>
                </Alert>
              ) : isTestMode ? (
                <>
                  <Alert>
                    <TestTube className="h-4 w-4" />
                    <AlertDescription>
                      TEST MODE: Payment processing is simulated.
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={handleTestPayment}
                    disabled={isProcessing}
                    size="lg"
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : is90DayPlan ? (
                      `Pay $${dueToday.toFixed(2)} Starter Deposit (Test)`
                    ) : isRecurringPlan ? (
                      `Start 3-Visit Plan — Pay $${dueToday.toFixed(2)} (Test)`
                    ) : (
                      `Pay $${dueToday.toFixed(2)} (Test)`
                    )}
                  </Button>
                </>
              ) : isInitializing ? (
                <div className="space-y-4">
                  <BrandedLoader
                    caption="Preparing secure checkout…"
                    fullScreen={false}
                  />
                  {initSlow && (
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Stripe is taking longer than usual.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsInitializing(false);
                          setInitSlow(false);
                          setClientSecret(null);
                          setAccountPublishableKey(null);
                          setBookingId(null);
                          setTimeout(() => initializePayment(), 50);
                        }}
                      >
                        Try Again
                      </Button>
                    </div>
                  )}
                </div>
              ) : clientSecret ? (
                <StripePaymentForm
                  dueToday={dueToday}
                  totalAmount={finalPrice}
                  monthlyAmount={is90DayPlan ? monthlyPayment : undefined}
                  offerType={bookingData.offerType || 'standard'}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handleCancel}
                  clientSecret={clientSecret}
                  publishableKey={accountPublishableKey}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                />
              ) : (
                <div className="text-center py-8 space-y-3">
                  {initError && (
                    <Alert variant="destructive">
                      <AlertDescription>{initError}</AlertDescription>
                    </Alert>
                  )}
                  <p className="text-muted-foreground">
                    We couldn't load the secure payment form.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button onClick={initializePayment}>Try Again</Button>
                    <Button variant="outline" onClick={handleCancel}>
                      Back to Offers
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trust Badges */}
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center text-sm mb-4">
                <div>
                  <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Secure payment via Stripe</p>
                </div>
                <div>
                  <Lock className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="font-medium">No Contracts</p>
                </div>
                <div>
                  <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Insured & Bonded</p>
                </div>
              </div>
              <div className="pt-4 border-t flex justify-center">
                <GoogleGuaranteedBadge variant="standard" showSubtitle />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
