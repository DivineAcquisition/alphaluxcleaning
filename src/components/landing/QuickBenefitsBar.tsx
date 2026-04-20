import React from 'react';
import { Calendar, DollarSign, Sparkles, Shield } from 'lucide-react';

const benefits = [
  {
    icon: Calendar,
    text: 'Book in 60 seconds',
    color: 'text-primary'
  },
  {
    icon: DollarSign,
    text: 'No hidden fees',
    color: 'text-success'
  },
  {
    icon: Sparkles,
    text: '$25 OFF first deep clean',
    color: 'text-warning'
  },
  {
    icon: Shield,
    text: 'Satisfaction guaranteed',
    color: 'text-primary'
  }
];

export function QuickBenefitsBar() {
  return (
    <div className="py-10 bg-card border-y border-alx-gold/15">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="group flex items-center gap-3 p-4 rounded-xl border border-alx-gold/15 bg-gradient-card hover:border-alx-gold/50 transition-all hover:shadow-soft hover:-translate-y-0.5"
              >
                <div className="flex-shrink-0">
                  <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-alx-navy text-alx-gold-light group-hover:bg-gradient-gold group-hover:text-alx-navy-ink flex items-center justify-center transition-all shadow-soft">
                    <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
                  </div>
                </div>
                <p className="text-xs lg:text-sm font-semibold text-foreground leading-tight">
                  {benefit.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
