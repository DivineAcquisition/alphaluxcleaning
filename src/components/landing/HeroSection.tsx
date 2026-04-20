import React from 'react';
import { Shield, Award, Clock, MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { GoogleGuaranteedBadge } from '@/components/trust/GoogleGuaranteedBadge';

export function HeroSection({ bookingFlowUrl = '/book/zip' }: { bookingFlowUrl?: string }) {
  return (
    <div className="relative bg-alx-hero text-alx-gold-pale py-16 lg:py-24 overflow-hidden">
      {/* Decorative background */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, hsl(var(--alx-gold-light)) 0%, transparent 40%), radial-gradient(circle at 80% 80%, hsl(var(--alx-gold)) 0%, transparent 45%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
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

          {/* Main Headline */}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-bold mb-4 lg:mb-6 leading-[1.05] tracking-tight">
            A Higher Standard of{" "}
            <span className="text-alx-gradient-gold">Clean</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg lg:text-xl text-alx-gold-pale/80 mb-6 lg:mb-8 max-w-3xl mx-auto leading-relaxed">
            Premium residential & commercial cleaning across Long Island, NY,
            New Jersey, Texas and California. Eco-friendly, insured, and built
            around you.
            <span className="block mt-3 text-alx-gold-light font-semibold">
              10% OFF Standard Cleaning • 20% OFF Deep Cleaning
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 lg:mb-14">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base lg:text-lg px-8 py-6 btn-alx-gold border-0 rounded-full font-semibold"
              asChild
            >
              <Link to={bookingFlowUrl}>Get Instant Quote</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-base lg:text-lg px-8 py-6 rounded-full border-alx-gold/60 text-alx-gold-pale hover:bg-alx-gold/10 hover:text-alx-gold-light"
              asChild
            >
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>

          {/* Trust Indicators Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 max-w-4xl mx-auto">
            {[
              { icon: Shield, label: "Bonded & Insured" },
              { icon: Award, label: "Eco-Friendly Clean" },
              { icon: Clock, label: "Same-Day Available" },
              { icon: MapPin, label: "NY • NJ • TX • CA" },
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
            Trusted by 1,000+ homeowners & businesses across NY, NJ, TX and CA
          </p>
        </div>
      </div>
    </div>
  );
}
