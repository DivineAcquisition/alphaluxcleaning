import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Sparkles,
  Check,
  Phone,
  ArrowRight,
  Home,
  BadgePercent,
  ShieldCheck,
  Clock,
  Sprout,
  CreditCard,
} from 'lucide-react';
import {
  STATE_CONFIGS,
  type StateCode,
  formatPrice,
} from '@/lib/state-pricing-system';
import {
  NEW_CUSTOMER_PROMO_ACTIVE,
  NEW_CUSTOMER_PROMO_CODE,
  NEW_CUSTOMER_PROMO_PERCENT,
  previewPromoDiscount,
} from '@/lib/promo';

/**
 * Public `/pricing` rate card.
 *
 * Structured as five sections that map to the five questions a
 * prospective customer asks in order:
 *
 *   1. Hero — "What's the offer right now?"              (NEW_CUSTOMER_PROMO)
 *   2. Rate card — "What does it cost at my home size?"  (state tiers table)
 *   3. Recurring lane — "How does a subscription work?"  (maintenance tiers)
 *   4. Service comparison — "What's the difference?"     (side-by-side checklist)
 *   5. Trust + FAQ — "Is this legit?"                    (badges + accordion)
 *
 * Everything on this page reads from the shared pricing sources in
 * `src/lib/*-pricing*`, so whenever we update the rate card in the
 * booking flow the marketing page follows automatically.
 */
export default function Pricing() {
  const navigate = useNavigate();
  const selectedState: StateCode = 'NY';
  const stateConfig = STATE_CONFIGS.find((s) => s.code === selectedState);
  if (!stateConfig) return null;

  const bookableTiers = stateConfig.tiers.filter((t) => t.id !== '5000_plus');
  const customQuoteTier = stateConfig.tiers.find((t) => t.id === '5000_plus');

  const promoActive = NEW_CUSTOMER_PROMO_ACTIVE;
  const promoCode = NEW_CUSTOMER_PROMO_CODE;
  const promoPercent = NEW_CUSTOMER_PROMO_PERCENT;

  // Sample the promo for a realistic mid-tier deep clean so the
  // hero showcases a real dollar amount instead of a vague "up to".
  const sampleTier = bookableTiers[1]; // 1,500–2,000 sq ft
  const sampleDeepPreview = previewPromoDiscount(sampleTier?.deep ?? 0);
  const sampleDeepOriginal = sampleTier?.deep ?? 0;
  const sampleDeepAfter = sampleDeepPreview.total;
  const sampleDeepSavings = sampleDeepPreview.amount;

  return (
    <>
      <Helmet>
        <title>Transparent Cleaning Pricing — AlphaLux Cleaning</title>
        <meta
          name="description"
          content={
            promoActive
              ? `Flat, published rates for Standard, Deep, and Move-In/Out cleaning in New York. New customers save ${promoPercent}% with code ${promoCode}.`
              : 'Flat, published rates for Standard, Deep, and Move-In/Out cleaning in New York.'
          }
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />

        {/* ───────────────── Hero ───────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-14 md:py-20">
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {promoActive && (
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Sparkles className="h-4 w-4" />
                New customer special — {promoPercent}% off with code{' '}
                <span className="font-mono tracking-wider">{promoCode}</span>
              </div>
            )}

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              Transparent pricing,
              <br />
              <span className="text-primary">no hidden fees</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Flat, published rates for every home size. Pay in full at
              checkout — no deposit, no balance invoice, no surprises.
            </p>

            {promoActive && sampleTier && sampleDeepSavings > 0 && (
              <div className="inline-flex items-baseline gap-3 rounded-2xl border border-primary/25 bg-primary/5 px-5 py-3 mb-8 text-left">
                <span className="text-sm text-muted-foreground">
                  Deep Clean, {sampleTier.label.toLowerCase()}:
                </span>
                <span className="text-muted-foreground line-through">
                  {formatPrice(sampleDeepOriginal)}
                </span>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(sampleDeepAfter)}
                </span>
                <span className="text-xs text-primary font-semibold uppercase tracking-wider">
                  save {formatPrice(sampleDeepSavings)}
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => navigate(`/book/zip?promo=${promoCode}`)}
                className="gap-2"
              >
                Get your free quote
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.open('tel:+18577544557', '_self')}
                className="gap-2"
              >
                <Phone className="h-4 w-4" />
                (857) 754-4557
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-6 inline-flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              Trained, insured team · Secure payment via Stripe · Serving
              New York State
            </p>
          </div>
        </section>

        {/* ───────────── Rate card (one-time) ───────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-baseline justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Rate card
              </h2>
              <p className="text-sm text-muted-foreground">
                Prices shown are the full service price for a one-time
                cleaning. {promoActive ? `First-time customers save ${promoPercent}% at checkout with code ` : ''}
                {promoActive && (
                  <span className="font-mono tracking-wider text-primary font-semibold">
                    {promoCode}
                  </span>
                )}
                .
              </p>
            </div>
            <Badge
              variant="outline"
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
            >
              NY · NYC · Long Island · Hudson Valley · Upstate
            </Badge>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Home size</TableHead>
                      <TableHead className="font-semibold">
                        Standard Clean
                      </TableHead>
                      <TableHead className="font-semibold">Deep Clean</TableHead>
                      <TableHead className="font-semibold">
                        Move-In / Move-Out
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookableTiers.map((tier) => {
                      const regPreview = previewPromoDiscount(tier.regular);
                      const deepPreview = previewPromoDiscount(tier.deep);
                      const movePreview = previewPromoDiscount(tier.moveInOut);
                      return (
                        <TableRow key={tier.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-muted-foreground" />
                              {tier.label}
                            </div>
                          </TableCell>
                          <TableCell>
                            <PriceCell
                              list={tier.regular}
                              after={regPreview.total}
                              save={regPreview.amount}
                              promoActive={promoActive}
                              promoPercent={promoPercent}
                            />
                          </TableCell>
                          <TableCell>
                            <PriceCell
                              list={tier.deep}
                              after={deepPreview.total}
                              save={deepPreview.amount}
                              promoActive={promoActive}
                              promoPercent={promoPercent}
                              accent
                            />
                          </TableCell>
                          <TableCell>
                            <PriceCell
                              list={tier.moveInOut}
                              after={movePreview.total}
                              save={movePreview.amount}
                              promoActive={promoActive}
                              promoPercent={promoPercent}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {customQuoteTier && (
                      <TableRow className="bg-accent/5">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            {customQuoteTier.label}
                          </div>
                        </TableCell>
                        <TableCell colSpan={3}>
                          <span className="text-sm">
                            Custom quote — call{' '}
                            <a
                              href="tel:+18577544557"
                              className="font-semibold text-primary"
                            >
                              (857) 754-4557
                            </a>
                          </span>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground mt-3">
            Add-ons (interior windows, extra bedrooms / bathrooms beyond the
            base plan) are priced transparently on the quote builder at
            checkout.
          </p>
        </section>

        {/* ───────── Recurring maintenance lane ───────── */}
        <section className="bg-muted/30 py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Recurring maintenance
              </h2>
              <p className="text-muted-foreground">
                Book a recurring cadence after your first deep clean and lock
                in the same trusted cleaning team at a lower per-visit rate.
                No long-term contract — pause or cancel any time.
              </p>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">
                          Home size
                        </TableHead>
                        <TableHead className="font-semibold">
                          Weekly
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-normal">
                            Save 13%
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold">
                          Bi-weekly
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-normal">
                            Save 8% · Most popular
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold">
                          Monthly
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-normal">
                            Save 4%
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookableTiers.map((tier) => {
                        const perVisit = tier.regular;
                        const weekly = Math.round(perVisit * 0.87);
                        const biweekly = Math.round(perVisit * 0.92);
                        const monthly = Math.round(perVisit * 0.96);
                        return (
                          <TableRow key={tier.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Home className="h-4 w-4 text-muted-foreground" />
                                {tier.label}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-lg font-bold">
                                {formatPrice(weekly)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                / visit · {formatPrice(weekly * 4)}/mo
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-lg font-bold">
                                {formatPrice(biweekly)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                / visit · {formatPrice(biweekly * 2)}/mo
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-lg font-bold">
                                {formatPrice(monthly)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                / visit · {formatPrice(monthly)}/mo
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground mt-3">
              Recurring rates apply after the first full-price Deep Clean (or
              the first Standard Clean if you skip the deep). Billed
              per-visit, auto-paused on cancellation.
            </p>
          </div>
        </section>

        {/* ─────────── Service comparison ─────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              What's included
            </h2>
            <p className="text-muted-foreground">
              Every cleaning — whatever the type — comes with trained,
              insured AlphaLux team members, eco-friendly products, and a
              100% satisfaction guarantee.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <ServiceCard
              title="Standard Clean"
              subtitle="Keep-it-tidy maintenance"
              priceHint={`From ${formatPrice(bookableTiers[0]?.regular)}`}
              tone="neutral"
              items={[
                'Dust all reachable surfaces',
                'Vacuum carpets + rugs',
                'Mop hard floors',
                'Sanitize kitchen counters + sink',
                'Sanitize bathrooms',
                'Empty trash + general tidy',
              ]}
            />
            <ServiceCard
              title="Deep Clean"
              subtitle="Top-to-bottom reset"
              priceHint={`From ${formatPrice(bookableTiers[0]?.deep)}`}
              tone="primary"
              items={[
                'Everything in Standard Clean',
                'Baseboards + door frames',
                'Inside appliances on request',
                'Light fixtures + ceiling fans',
                'Window sills + tracks',
                'Detailed scrub of bathrooms',
              ]}
            />
            <ServiceCard
              title="Move-In / Move-Out"
              subtitle="Empty-home detail"
              priceHint={`From ${formatPrice(bookableTiers[0]?.moveInOut)}`}
              tone="gold"
              items={[
                'Everything in Deep Clean',
                'Inside all cabinets + drawers',
                'Inside oven + fridge',
                'Wall spot cleaning',
                'Door frames + closets',
                'Ready for walkthrough',
              ]}
            />
          </div>
        </section>

        {/* ───────────── Trust strip ───────────── */}
        <section className="bg-muted/30 py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <TrustItem
              icon={ShieldCheck}
              title="100% guarantee"
              subtitle="We'll fix it or refund"
            />
            <TrustItem
              icon={BadgePercent}
              title="No hidden fees"
              subtitle="Flat, published rates"
            />
            <TrustItem
              icon={Clock}
              title="Flexible scheduling"
              subtitle="Morning to evening slots"
            />
            <TrustItem
              icon={Sprout}
              title="Eco-friendly"
              subtitle="Low-tox products"
            />
          </div>
        </section>

        {/* ───────────── FAQ ───────────── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
            Frequently asked
          </h2>

          <Accordion type="single" collapsible className="space-y-3">
            <AccordionItem value="calculated" className="border rounded-lg px-4">
              <AccordionTrigger>How is pricing calculated?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We publish a flat rate per home size and service type — no
                hourly surprises. Our quote builder at checkout lets you add
                optional surcharges (interior windows, extra rooms beyond the
                base plan) with transparent per-item pricing. What you see is
                what you pay.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="difference" className="border rounded-lg px-4">
              <AccordionTrigger>
                What's the difference between Standard and Deep?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Standard Clean covers day-to-day upkeep — dusting, vacuuming,
                bathroom and kitchen surfaces. Deep Clean adds the detail
                work: baseboards, inside appliances on request, light
                fixtures, window sills, and a thorough scrub of every surface.
                Most new customers start with a Deep Clean and then move to a
                recurring Standard cadence.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="deposit" className="border rounded-lg px-4">
              <AccordionTrigger>Is there a deposit?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                No. You pay the full service price at checkout (with any
                promo applied). There's no hold, no pre-auth, and no follow-up
                balance invoice after the cleaning — your booking is complete
                when the payment goes through.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pets" className="border rounded-lg px-4">
              <AccordionTrigger>Do you charge extra for pets?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                No extra charge for pets — just let us know during booking so
                the team arrives prepared with the right setup.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cancellation" className="border rounded-lg px-4">
              <AccordionTrigger>
                What's your cancellation policy?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Free rescheduling or cancellation up to 24 hours before your
                service. Same-day cancellations are subject to a 25% fee to
                cover crew scheduling.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="payment" className="border rounded-lg px-4">
              <AccordionTrigger>How do I pay?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Securely via Stripe at the end of the booking flow — all
                major cards + Apple Pay + Google Pay are accepted. We never
                see or store your card number; Stripe handles the full
                transaction.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* ───────────── Bottom CTA ───────────── */}
        <section className="bg-gradient-to-br from-primary to-accent text-primary-foreground py-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Ready to book your cleaning?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              {promoActive
                ? `Start with a free quote — ${promoPercent}% off with code ${promoCode} locks in automatically for new customers.`
                : 'Start with a free quote. No deposit, no contracts, no surprises.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate(`/book/zip?promo=${promoCode}`)}
                className="gap-2"
              >
                Book now
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.open('tel:+18577544557', '_self')}
                className="gap-2 bg-white/10 hover:bg-white/20 border-white/30 text-white"
              >
                <Phone className="h-4 w-4" />
                (857) 754-4557
              </Button>
            </div>

            <p className="text-xs mt-6 opacity-75 inline-flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5" />
              Pay the full service price at checkout. No deposit, no balance
              invoice.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

function PriceCell({
  list,
  after,
  save,
  promoActive,
  promoPercent,
  accent,
}: {
  list: number;
  after: number;
  save: number;
  promoActive: boolean;
  promoPercent: number;
  accent?: boolean;
}) {
  const showSavings = promoActive && save > 0;
  const primaryClass = accent ? 'text-primary' : 'text-foreground';
  return (
    <div className="flex flex-col gap-0.5">
      {showSavings ? (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(list)}
            </span>
            <span className={`text-lg font-bold ${primaryClass}`}>
              {formatPrice(after)}
            </span>
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary text-[10px] font-semibold"
            >
              {promoPercent}% off
            </Badge>
          </div>
          <div className="text-[11px] text-muted-foreground">
            You save {formatPrice(save)}
          </div>
        </>
      ) : (
        <span className={`text-lg font-bold ${primaryClass}`}>
          {formatPrice(list)}
        </span>
      )}
    </div>
  );
}

function ServiceCard({
  title,
  subtitle,
  priceHint,
  items,
  tone,
}: {
  title: string;
  subtitle: string;
  priceHint: string;
  items: string[];
  tone: 'neutral' | 'primary' | 'gold';
}) {
  const toneClasses =
    tone === 'primary'
      ? 'border-primary/40 bg-primary/5'
      : tone === 'gold'
        ? 'border-alx-gold/40 bg-alx-gold/5'
        : 'border-border bg-card';
  const checkClass =
    tone === 'primary'
      ? 'text-primary'
      : tone === 'gold'
        ? 'text-alx-gold-dark'
        : 'text-success';
  return (
    <Card className={`border-2 ${toneClasses}`}>
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          <p className="text-xs text-muted-foreground mt-1">{priceHint}</p>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Check className={`h-4 w-4 ${checkClass} mt-0.5 flex-shrink-0`} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function TrustItem({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof ShieldCheck;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-1">
      <Icon className="h-6 w-6 text-primary mx-auto mb-1" />
      <h3 className="font-semibold text-foreground text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}
