import React from 'react';
import { Shield, Award, Clock, MapPin, Star, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { GoogleGuaranteedBadge } from '@/components/trust/GoogleGuaranteedBadge';
import {
  NEW_CUSTOMER_PROMO_CODE,
  NEW_CUSTOMER_PROMO_PERCENT,
} from '@/lib/promo';

export function HeroSection({ bookingFlowUrl = '/book/zip' }: { bookingFlowUrl?: string }) {
  const [copied, setCopied] = React.useState(false);
  const copyPromo = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard?.writeText(NEW_CUSTOMER_PROMO_CODE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="relative bg-alx-hero text-alx-gold-pale py-16 lg:py-24 overflow-hidden">
      {/* Decorative background */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, hsl(var(--alx-gold-light)) 0%, transparent 40%), radial-gradient(circle at 80% 80%, hsl(var(--alx-gold)) 0%, transparent 45%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--alx-gold-light)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--alx-gold-light)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center animate-fade-up">
          {/* Trust Badge */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-2 bg-alx-gold/10 border border-alx-gold/40 rounded-full px-4 py-1.5 backdrop-blur-sm">
              <Star className="w-4 h-4 text-alx-gold-light fill-alx-gold-light" />
              <span className="text-sm font-medium text-alx-gold-pale">
                5-Star Rated • Trusted by 1,000+ customers
              </span>
            </div>
          </div>

          {/* Main Headline — mirrors the ALC2026 new-customer promo */}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-bold mb-4 lg:mb-6 leading-[1.05] tracking-tight">
            Save{" "}
            <span className="text-alx-gradient-gold">
              {NEW_CUSTOMER_PROMO_PERCENT}%
            </span>{" "}
            On Your First Cleaning
          </h1>
          <p className="text-sm sm:text-base lg:text-lg uppercase tracking-[0.24em] text-alx-gold font-semibold mb-5">
            A Higher Standard of Clean
          </p>

          {/* Subheadline */}
          <p className="text-base sm:text-lg lg:text-xl text-alx-gold-pale/85 mb-6 lg:mb-8 max-w-3xl mx-auto leading-relaxed">
            Premium residential & commercial cleaning across Long Island, NY,
            New Jersey, New York — eco-friendly, insured, and built
            around you. New customers unlock{" "}
            <span className="text-alx-gold-light font-semibold">
              {NEW_CUSTOMER_PROMO_PERCENT}% off
            </span>{" "}
            with code{" "}
            <span className="text-alx-gold-light font-bold tracking-[0.12em]">
              {NEW_CUSTOMER_PROMO_CODE}
            </span>
            .
          </p>

          {/* New-customer promo card */}
          <div className="mx-auto mb-8 lg:mb-10 max-w-xl">
            <div className="relative rounded-2xl border border-alx-gold/40 bg-alx-black-elev/60 backdrop-blur-sm p-5 text-center shadow-gold overflow-hidden promo-shimmer">
              <p className="text-[11px] uppercase tracking-[0.3em] text-alx-gold font-semibold mb-1">
                New Customer Offer
              </p>
              <p className="font-serif text-2xl md:text-3xl font-bold text-alx-gold-light">
                {NEW_CUSTOMER_PROMO_PERCENT}% OFF Your First Cleaning
              </p>
              <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                <span className="text-sm text-alx-gold-pale/80">
                  Use code:
                </span>
                <button
                  type="button"
                  onClick={copyPromo}
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-gold px-4 py-1.5 text-sm font-bold text-alx-black-ink shadow-gold hover:brightness-105 transition"
                  aria-label={`Copy promo code ${NEW_CUSTOMER_PROMO_CODE}`}
                >
                  <span className="tracking-[0.12em]">
                    {NEW_CUSTOMER_PROMO_CODE}
                  </span>
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4 opacity-80 group-hover:opacity-100" />
                  )}
                </button>
              </div>
              <p className="mt-3 text-xs text-alx-gold-pale/60">
                Applied automatically at checkout. Limit one redemption per
                customer.
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 lg:mb-14">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base lg:text-lg px-8 py-6 btn-alx-gold rounded-full font-semibold uppercase tracking-wider"
              asChild
            >
              <Link to={`${bookingFlowUrl}?promo=${NEW_CUSTOMER_PROMO_CODE}`}>Book Now</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-base lg:text-lg px-8 py-6 rounded-full btn-alx-outline-gold font-semibold uppercase tracking-wider"
              asChild
            >
              <a href="tel:+18577544557">Call Us</a>
            </Button>
          </div>

          {/* Trust Indicators Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 max-w-4xl mx-auto">
            {[
              { icon: Shield, label: "Bonded & Insured" },
              { icon: Award, label: "Eco-Friendly Clean" },
              { icon: Clock, label: "Same-Day Available" },
              { icon: MapPin, label: "NY • NJ" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="group flex flex-col items-center p-4 rounded-xl border border-alx-gold/20 bg-white/5 backdrop-blur-sm transition-all hover:border-alx-gold/60 hover:bg-white/10 hover:-translate-y-0.5"
              >
                <Icon className="w-8 h-8 lg:w-10 lg:h-10 text-alx-gold-light mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs lg:text-sm font-semibold text-alx-gold-pale">
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Google Guaranteed Badge */}
          <div className="flex justify-center mt-8">
            <GoogleGuaranteedBadge variant="standard" />
          </div>

          <p className="text-sm text-alx-gold-pale/70 mt-6">
            Trusted by 1,000+ homeowners & businesses across NY and NJ
          </p>
        </div>
      </div>
    </div>
  );
}
