import React from 'react';
import { Shield, Award, Clock, MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function HeroSection({ bookingFlowUrl = '/book/zip' }: { bookingFlowUrl?: string }) {
  return (
    <div className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12 lg:py-20 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Trust Badge */}
          <div className="flex items-center justify-center gap-2 mb-6 animate-fade-in">
            <div className="flex items-center gap-1 bg-warning/10 border border-warning/30 rounded-full px-3 py-1">
              <Star className="w-4 h-4 text-warning fill-warning" />
              <span className="text-sm font-medium text-foreground">4.9/5 from 1,000+ customers</span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-4 lg:mb-6 leading-tight">
            Professional Home Cleaning in <span className="text-primary">TX, CA & NY</span>
          </h1>

          {/* Subheadline with Offers */}
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 lg:mb-8 max-w-3xl mx-auto leading-relaxed">
            Same-day booking available • 100% satisfaction guarantee
            <span className="block mt-2 text-primary font-semibold">
              Get <span className="text-warning">10% OFF</span> Standard Cleaning • <span className="text-warning">20% OFF</span> Deep Cleaning
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 lg:mb-12">
            <Button 
              size="lg" 
              className="w-full sm:w-auto text-base lg:text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
              asChild
            >
              <Link to={bookingFlowUrl}>Get Instant Quote</Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto text-base lg:text-lg px-8 py-6"
              asChild
            >
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>

          {/* Trust Indicators Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-w-4xl mx-auto">
            <div className="flex flex-col items-center p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
              <Shield className="w-8 h-8 lg:w-10 lg:h-10 text-primary mb-2" />
              <p className="text-xs lg:text-sm font-semibold text-foreground">Bonded & Insured</p>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
              <Award className="w-8 h-8 lg:w-10 lg:h-10 text-primary mb-2" />
              <p className="text-xs lg:text-sm font-semibold text-foreground">Same Team Every Visit</p>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
              <Clock className="w-8 h-8 lg:w-10 lg:h-10 text-primary mb-2" />
              <p className="text-xs lg:text-sm font-semibold text-foreground">Same-Day Available</p>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
              <MapPin className="w-8 h-8 lg:w-10 lg:h-10 text-primary mb-2" />
              <p className="text-xs lg:text-sm font-semibold text-foreground">Serving TX, CA, NY</p>
            </div>
          </div>

          {/* Social Proof Text */}
          <p className="text-sm text-muted-foreground mt-6">
            Trusted by 1,000+ homeowners across Texas, California, and New York
          </p>
        </div>
      </div>
    </div>
  );
}
