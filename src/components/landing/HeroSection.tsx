import React from 'react';
import { Shield, Award, Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function HeroSection() {
  return (
    <div className="bg-gradient-to-br from-background to-secondary/30 py-8 lg:py-12">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Headline */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
            Professional Home Cleaning
            <span className="block text-primary mt-2">Starting at $118/visit</span>
          </h1>
          
          {/* Pricing Transparency */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6 max-w-md mx-auto">
            <p className="text-sm text-muted-foreground mb-1">Transparent Pricing</p>
            <p className="font-semibold text-primary text-lg">$118-$200/month for bi-weekly service</p>
          </div>

          {/* Local Social Proof */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <div key={star} className="w-4 h-4 bg-warning rounded-full flex items-center justify-center">
                  <span className="text-xs text-warning-foreground">★</span>
                </div>
              ))}
            </div>
            <span className="text-muted-foreground text-sm">
              Trusted by 150+ Texas & California families since 2020
            </span>
          </div>

          {/* Value Proposition Bullets */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Same Team</p>
                <p className="text-xs text-muted-foreground">Every visit</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Award className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Supplies Included</p>
                <p className="text-xs text-muted-foreground">All equipment</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Satisfaction</p>
                <p className="text-xs text-muted-foreground">Guaranteed</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Flexible</p>
                <p className="text-xs text-muted-foreground">Scheduling</p>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <Badge variant="secondary" className="gap-1">
              <Shield className="w-3 h-3" />
              Bonded & Insured
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Award className="w-3 h-3" />
              Local Business
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Clock className="w-3 h-3" />
              Satisfaction Guaranteed
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}