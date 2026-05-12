import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Lock,
  Shield,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getStripeForKey, type StripeAccountSlug } from '@/lib/stripe';
import { toast } from 'sonner';
import { GoogleGuaranteedBadge } from '@/components/trust/GoogleGuaranteedBadge';

interface SavedCardSummary {
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
}

/**
 * Public, unauthenticated page that lets a customer save (or
 * update) a card on file with AlphaLux Cleaning.
 *
 * Why this exists:
 *   * Customers who pay a deposit during /book/checkout already
 *     have their card auto-saved via setup_future_usage. But some
 *     customers want to add a card before booking (CSR-quoted
 *     visits), update their card after expiration, or just have
 *     one on file ahead of recurring visits.
 *   * This page uses Stripe's SetupIntent flow (off_session usage)
 *     so the card is tokenized and attached to the customer's
 *     Stripe Customer object on the correct account (NY → try,
 *     CA/TX → book) and promoted to the default PaymentMethod
 *     for future invoices.
 *
 * Account routing is identical to /book/checkout — state code +
 * zip prefix drive which Stripe account the SetupIntent lands on.
 *
 * URL params:
 *   ?email=...   pre-fills the email field (used by post-booking
 *                emails that link customers here for card updates)
 *   ?name=...    pre-fills first+last name (split on space)
 */
export default function SavePaymentMethod() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<'form' | 'card' | 'success'>('form');

  // Contact form (driven by URL params on first render).
  const initialName = searchParams.get('name') || '';
  const [nameSplit] = useState(() => {
    const parts = initialName.trim().split(/\s+/);
    return {
      first: parts[0] || '',
      last: parts.slice(1).join(' ') || '',
    };
  });

  const [firstName, setFirstName] = useState(nameSplit.first);
  const [lastName, setLastName] = useState(nameSplit.last);
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [contactError, setContactError] = useState<string | null>(null);

  // SetupIntent state (filled after the contact form is submitted).
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [setupIntentId, setSetupIntentId] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [account, setAccount] = useState<StripeAccountSlug>('try');
  const [supabaseCustomerId, setSupabaseCustomerId] = useState<string | null>(
    null,
  );
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Final-state card metadata (set by the SetupElementForm child).
  const [savedCard, setSavedCard] = useState<SavedCardSummary | null>(null);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setContactError('Please enter your first and last name.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setContactError('Please enter a valid email address.');
      return;
    }

    setIsInitializing(true);
    setInitError(null);

    try {
      // We call create-payment-intent with mode='setup' (rather than
      // a dedicated create-setup-intent function) because Lovable's
      // auto-deploy doesn't reliably register newly-added edge
      // functions. create-payment-intent is already deployed and
      // its setup-mode branch wraps the same SetupIntent logic.
      const { data, error } = await supabase.functions.invoke(
        'create-payment-intent',
        {
          body: {
            mode: 'setup',
            customerEmail: email.trim().toLowerCase(),
            customerData: {
              email: email.trim().toLowerCase(),
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              phone: phone.trim() || undefined,
              state: state.trim().toUpperCase() || undefined,
              zip: zip.trim() || undefined,
            },
          },
        },
      );

      if (error) throw new Error(error.message);
      if (!data?.success || !data?.clientSecret) {
        throw new Error(
          data?.error ||
            'We could not initialize a secure card form. Please try again.',
        );
      }

      setClientSecret(data.clientSecret);
      setSetupIntentId(data.setupIntentId);
      setPublishableKey(data.publishableKey);
      setAccount((data.account as StripeAccountSlug) || 'try');
      setSupabaseCustomerId(data.customerId || null);
      setStep('card');
    } catch (err: any) {
      const msg = err?.message || 'Failed to initialize secure card form.';
      setInitError(msg);
      toast.error(msg);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 md:py-12">
      <div className="max-w-2xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Save a Card on File
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Keep your card securely stored with Stripe so we can quickly book
            your next cleaning — no need to re-enter your details.
          </p>
          <div className="flex justify-center mt-4">
            <GoogleGuaranteedBadge variant="compact" />
          </div>
        </header>

        {step === 'success' && savedCard ? (
          <SuccessCard card={savedCard} email={email} account={account} />
        ) : step === 'card' && clientSecret ? (
          <CardStep
            clientSecret={clientSecret}
            publishableKey={publishableKey}
            setupIntentId={setupIntentId!}
            account={account}
            supabaseCustomerId={supabaseCustomerId}
            firstName={firstName}
            lastName={lastName}
            email={email}
            onChangeContact={() => {
              setClientSecret(null);
              setSetupIntentId(null);
              setStep('form');
            }}
            onSaved={(card) => {
              setSavedCard(card);
              setStep('success');
            }}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Your Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We'll match this against your account and securely store
                  your card with Stripe for future bookings.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      maxLength={2}
                      placeholder="NY / CA / TX"
                      value={state}
                      onChange={(e) =>
                        setState(e.target.value.toUpperCase())
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="zip">ZIP code</Label>
                    <Input
                      id="zip"
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="11221"
                      value={zip}
                      onChange={(e) =>
                        setZip(e.target.value.replace(/\D/g, ''))
                      }
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground -mt-2">
                  Your state determines which AlphaLux Stripe account your
                  card is saved on (NY accounts are kept separate from CA/TX).
                </p>

                {contactError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{contactError}</AlertDescription>
                  </Alert>
                )}
                {initError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{initError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isInitializing}
                >
                  {isInitializing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Preparing secure card form…
                    </>
                  ) : (
                    'Continue to Card Details'
                  )}
                </Button>

                <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground pt-2">
                  <span className="inline-flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    256-bit TLS
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    Stripe PCI Level 1
                  </span>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function CardStep({
  clientSecret,
  publishableKey,
  setupIntentId,
  account,
  supabaseCustomerId,
  firstName,
  lastName,
  email,
  onChangeContact,
  onSaved,
}: {
  clientSecret: string;
  publishableKey: string | null;
  setupIntentId: string;
  account: StripeAccountSlug;
  supabaseCustomerId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  onChangeContact: () => void;
  onSaved: (card: SavedCardSummary) => void;
}) {
  // Memoize the Stripe promise so re-renders don't tear down the
  // PaymentElement and re-mount it (which produces the stuck-loading
  // symptom we hit earlier on /book/checkout).
  const stripePromise = useMemo(
    () => getStripeForKey(publishableKey),
    [publishableKey],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Card Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ContactSummary
          firstName={firstName}
          lastName={lastName}
          email={email}
          account={account}
          onChangeContact={onChangeContact}
        />
        <Separator className="my-4" />
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#0F77CC',
                colorBackground: '#ffffff',
                colorText: '#1B314B',
                borderRadius: '10px',
              },
            },
          }}
        >
          <SetupElementForm
            setupIntentId={setupIntentId}
            account={account}
            supabaseCustomerId={supabaseCustomerId}
            email={email}
            onSaved={onSaved}
          />
        </Elements>
      </CardContent>
    </Card>
  );
}

function ContactSummary({
  firstName,
  lastName,
  email,
  account,
  onChangeContact,
}: {
  firstName: string;
  lastName: string;
  email: string;
  account: StripeAccountSlug;
  onChangeContact: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
          Saving card for
        </p>
        <p className="text-sm font-semibold text-foreground">
          {firstName} {lastName}
        </p>
        <p className="text-sm text-muted-foreground">{email}</p>
        <Badge
          variant="outline"
          className="mt-1 text-[10px] uppercase tracking-wider"
        >
          {account === 'book' ? 'CA / TX account' : 'NY account'}
        </Badge>
      </div>
      <Button variant="ghost" size="sm" onClick={onChangeContact}>
        Edit
      </Button>
    </div>
  );
}

function SetupElementForm({
  setupIntentId,
  account,
  supabaseCustomerId,
  email,
  onSaved,
}: {
  setupIntentId: string;
  account: StripeAccountSlug;
  supabaseCustomerId: string | null;
  email: string;
  onSaved: (card: SavedCardSummary) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elementReady, setElementReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: confirmErr, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}${window.location.pathname}`,
        },
        redirect: 'if_required',
      });

      if (confirmErr) {
        const msg =
          confirmErr.message ||
          'We could not save your card. Please check the details and try again.';
        setError(msg);
        toast.error(msg);
        setIsSubmitting(false);
        return;
      }

      if (!setupIntent || setupIntent.status !== 'succeeded') {
        const msg = `Card setup status: ${setupIntent?.status || 'unknown'}.`;
        setError(msg);
        toast.error(msg);
        setIsSubmitting(false);
        return;
      }

      // Server-side promote PM to default + mirror onto customers row.
      // Same reason as create — we call create-payment-intent with
      // mode='finalize-setup' instead of a dedicated function so
      // we don't depend on Lovable picking up new functions.
      const { data, error: confirmServerErr } = await supabase.functions.invoke(
        'create-payment-intent',
        {
          body: {
            mode: 'finalize-setup',
            setupIntentId,
            customerEmail: email,
            customerData: {
              email,
              state: undefined,
              zip: undefined,
            },
            // Forward the account hint so the server uses the same
            // Stripe credentials the SetupIntent ran against (the
            // SetupIntent's account is the source of truth — we
            // include this only as a sanity hint).
            account,
          },
        },
      );

      if (confirmServerErr || !data?.success) {
        const msg =
          data?.error ||
          confirmServerErr?.message ||
          'Your card was authorized but we could not finalize saving it. Please contact support.';
        setError(msg);
        toast.error(msg);
        setIsSubmitting(false);
        return;
      }

      toast.success('Card saved on file!');
      onSaved(data.card || {});
    } catch (err: any) {
      const msg = err?.message || 'An unexpected error occurred.';
      setError(msg);
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-border p-4 bg-card">
        {!elementReady && (
          <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
            Loading secure card form…
          </div>
        )}
        <PaymentElement
          onReady={() => setElementReady(true)}
          options={{ layout: 'tabs', paymentMethodOrder: ['card'] }}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between gap-3 border border-primary/20 bg-primary/5 text-primary px-3 py-2 rounded-lg">
        <div className="flex items-center gap-2 text-xs font-medium">
          <Lock className="h-4 w-4" />
          <span>Card stored securely with Stripe</span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.18em] text-primary/70">
          PCI Level 1
        </span>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!stripe || !elements || isSubmitting || !elementReady}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving card…
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Save Card on File
          </>
        )}
      </Button>
    </form>
  );
}

function SuccessCard({
  card,
  email,
  account,
}: {
  card: SavedCardSummary;
  email: string;
  account: StripeAccountSlug;
}) {
  const formattedBrand = useMemo(() => {
    if (!card.brand) return 'Card';
    return card.brand.charAt(0).toUpperCase() + card.brand.slice(1);
  }, [card.brand]);

  // Send the "card on file" event to GA / Meta if you ever wire
  // analytics here; left as a hook for future ops.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        (window as unknown as { dataLayer?: unknown[] })?.dataLayer?.push?.({
          event: 'card_saved_on_file',
          account,
          card_brand: card.brand,
        });
      } catch {
        /* no-op */
      }
    }
  }, [card.brand, account]);

  return (
    <Card className="border-green-200 bg-green-50/30">
      <CardContent className="pt-6 space-y-4 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Card saved on file
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            We'll use this card for your future AlphaLux cleanings — no need to
            re-enter your details at checkout.
          </p>
        </div>

        <div className="bg-card border rounded-xl p-4 text-left max-w-sm mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                Card on file
              </p>
              <p className="text-base font-semibold text-foreground mt-0.5">
                {formattedBrand}
                {card.last4 ? ` ···· ${card.last4}` : ''}
              </p>
              {card.expMonth && card.expYear && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Expires{' '}
                  {String(card.expMonth).padStart(2, '0')}/
                  {String(card.expYear).slice(-2)}
                </p>
              )}
            </div>
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <Separator className="my-3" />
          <p className="text-xs text-muted-foreground">
            Saved to your AlphaLux account ({email}) on the{' '}
            <strong>{account === 'book' ? 'CA / TX' : 'NY'}</strong> ops Stripe
            account.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 pt-2">
          <Button asChild>
            <a href="/book/zip">Book a cleaning</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/">Back to home</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
