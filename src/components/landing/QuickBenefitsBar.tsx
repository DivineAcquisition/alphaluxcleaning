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
    text: '20% OFF first deep clean',
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
    <div className="py-8 bg-muted/30 border-y border-border/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div 
                key={index}
                className="flex items-center gap-3 p-3 lg:p-4 bg-card rounded-lg border border-border/50 hover:border-primary/50 transition-all hover:shadow-md"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className={`w-5 h-5 lg:w-6 lg:h-6 ${benefit.color}`} />
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
