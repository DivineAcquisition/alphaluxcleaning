import React from 'react';
import { Shield, Award, Clock, MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function HeroSection() {
  return (
    <div className="bg-gradient-to-br from-background to-secondary/20 py-6 lg:py-8">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* Mobile-First Headline - 60px height target */}
          <div className="mb-4">
            <h1 className="mobile-headline text-foreground mb-2 leading-tight">
              Dallas Professional Cleaning Service
            </h1>
          </div>
          
          {/* Mobile-First Pricing Banner - 40px height target */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-2 mb-4 inline-block">
            <p className="font-semibold text-primary text-base lg:text-lg">
              Starting at $280/month • Bi-weekly service
            </p>
          </div>

          {/* Value Proposition Bullets - 120px height target, Single Column Mobile */}
          <div className="mb-4 space-y-2 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 max-w-2xl mx-auto">
            <div className="flex items-center justify-center lg:justify-start gap-3 py-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <span className="mobile-body font-medium text-foreground">Same professional team every visit</span>
            </div>
            
            <div className="flex items-center justify-center lg:justify-start gap-3 py-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Award className="w-4 h-4 text-primary" />
              </div>
              <span className="mobile-body font-medium text-foreground">All cleaning supplies included</span>
            </div>
            
            <div className="flex items-center justify-center lg:justify-start gap-3 py-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <span className="mobile-body font-medium text-foreground">Satisfaction guaranteed</span>
            </div>
            
            <div className="flex items-center justify-center lg:justify-start gap-3 py-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <span className="mobile-body font-medium text-foreground">Flexible scheduling options</span>
            </div>
          </div>

          {/* Trust Signal - 30px height target */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-4 h-4 fill-warning text-warning" />
              ))}
            </div>
            <span className="text-muted-foreground text-sm font-medium">
              Trusted by 150+ Dallas families served
            </span>
          </div>

          {/* Trust Badges - Mobile Optimized */}
          <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-4">
            <Badge variant="secondary" className="mobile-touch-target gap-2 px-3 py-1">
              <Shield className="w-3 h-3" />
              <span className="text-xs">Bonded & Insured</span>
            </Badge>
            <Badge variant="secondary" className="mobile-touch-target gap-2 px-3 py-1">
              <Award className="w-3 h-3" />
              <span className="text-xs">Local Business</span>
            </Badge>
            <Badge variant="secondary" className="mobile-touch-target gap-2 px-3 py-1">
              <Clock className="w-3 h-3" />
              <span className="text-xs">Satisfaction Guaranteed</span>
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}