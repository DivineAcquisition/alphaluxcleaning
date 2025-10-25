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
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Why Choose AlphaLux Clean?</h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            We're more than just a cleaning service. We're your trusted partner in maintaining a spotless, healthy home.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card 
                key={index}
                className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-border/50 hover:border-primary/50 bg-gradient-to-br from-card to-muted/20"
              >
                <CardHeader className="pb-3 md:pb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-2 md:mb-3 transition-colors">
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <CardTitle className="text-base md:text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Service Areas */}
        <div className="mt-8 md:mt-12 text-center">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 md:p-6 max-w-2xl mx-auto">
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">Service Areas</h3>
            <p className="text-sm md:text-base text-muted-foreground mb-4">
              Proudly serving Texas and California with reliable, professional cleaning services
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
              <div>
                <h4 className="font-medium text-primary mb-2">Texas Cities</h4>
                <p className="text-muted-foreground">Houston • Austin • Dallas • San Antonio • Fort Worth</p>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-2">California Cities</h4>
                <p className="text-muted-foreground">Los Angeles • San Diego • San Francisco • Sacramento</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}