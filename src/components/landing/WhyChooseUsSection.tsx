import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Clock, Award, MapPin, Zap } from 'lucide-react';

const benefits = [
  {
    icon: Users,
    title: "Consistent Team",
    description: "Same professional cleaners every visit who know your preferences and home layout."
  },
  {
    icon: Shield,
    title: "Bonded & Insured",
    description: "Fully licensed, bonded, and insured for your peace of mind and protection."
  },
  {
    icon: Clock,
    title: "Flexible Scheduling",
    description: "Choose weekly, bi-weekly, or monthly service that fits your lifestyle and budget."
  },
  {
    icon: Award,
    title: "Quality Guarantee",
    description: "Not satisfied? We'll come back within 24 hours to make it right, free of charge."
  },
  {
    icon: MapPin,
    title: "Local Business",
    description: "Texas and California based company supporting local communities since 2020."
  },
  {
    icon: Zap,
    title: "Eco-Friendly",
    description: "Green cleaning products that are safe for your family, pets, and the environment."
  }
];

export function WhyChooseUsSection() {
  return (
    <div className="py-16 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <p className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-alx-gold mb-3">
            Why Choose AlphaLux
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            A Higher Standard of Clean
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            We're more than a cleaning service — we're your trusted partner for
            a spotless, healthy space. Professional, reliable, and eco-friendly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card
                key={index}
                className="group relative overflow-hidden border-alx-gold/15 bg-card hover:border-alx-gold/50 hover:-translate-y-1 transition-all duration-300 shadow-soft hover:shadow-clean"
              >
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 bg-gradient-gold opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-xl bg-alx-navy text-alx-gold-light flex items-center justify-center mb-3 group-hover:bg-gradient-gold group-hover:text-alx-navy-ink transition-all shadow-soft">
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {benefit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Service Areas */}
        <div className="mt-16 text-center">
          <div className="relative overflow-hidden rounded-2xl bg-alx-hero text-alx-gold-pale p-8 md:p-10 max-w-4xl mx-auto shadow-clean">
            <div
              aria-hidden
              className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-gradient-gold opacity-20 blur-3xl"
            />
            <h3 className="font-serif text-2xl md:text-3xl font-bold mb-3 text-alx-gold-light">
              Service Areas
            </h3>
            <p className="text-sm md:text-base text-alx-gold-pale/85 mb-6 max-w-2xl mx-auto">
              Proudly serving New York, New Jersey, Texas and California with
              reliable, professional cleaning services.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {[
                { region: "New York", cities: "Long Island • NYC" },
                { region: "New Jersey", cities: "Statewide" },
                { region: "Texas", cities: "Houston • Dallas • Austin" },
                { region: "California", cities: "LA • SF • San Diego" },
              ].map((area) => (
                <div
                  key={area.region}
                  className="rounded-xl border border-alx-gold/20 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <h4 className="font-semibold text-alx-gold-light mb-1">
                    {area.region}
                  </h4>
                  <p className="text-xs text-alx-gold-pale/80">{area.cities}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}