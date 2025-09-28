import React from 'react';
import { Shield, Award, Clock, MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
export function HeroSection() {
  return <div className="bg-gradient-to-br from-background to-secondary/20 py-6 lg:py-8">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          
          {/* Mobile-First Pricing Banner - 40px height target */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-2 mb-4 inline-block">
            <p className="font-semibold text-primary text-base lg:text-lg">Starting at $120-$280/month For Bi-weekly or weekly service</p>
          </div>

          {/* Value Proposition Bullets - 120px height target, Single Column Mobile */}
          

          {/* Trust Signal - 30px height target */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-4 h-4 fill-warning text-warning" />)}
            </div>
            <span className="text-muted-foreground text-sm font-medium">Trusted by 150+ TX & CA families served</span>
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
    </div>;
}