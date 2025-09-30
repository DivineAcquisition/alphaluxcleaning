import React from 'react';
import { Shield, Award, Clock, MapPin, Star, Sparkles, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  const scrollToBooking = () => {
    const bookingElement = document.getElementById('booking-section');
    if (bookingElement) {
      bookingElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container mx-auto px-4 py-12 md:py-20 relative">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="flex justify-center animate-slide-in-up">
            <Badge className="bg-funnel-urgency text-white px-4 py-2 text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Limited Time: 20% OFF All Services
            </Badge>
          </div>

          {/* Headline */}
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Professional Home Cleaning
              <span className="block text-primary mt-2">
                At Transparent Prices
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Book your cleaning service in minutes. Pay only after we've made your home sparkle. 
              <span className="font-semibold text-foreground"> Starting at $120</span>
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto animate-slide-in-up">
            <div className="bg-card rounded-lg p-4 funnel-card">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">10+ Years</p>
                  <p className="text-xs text-muted-foreground">In Business</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg p-4 funnel-card">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">50K+</p>
                  <p className="text-xs text-muted-foreground">Happy Homes</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg p-4 funnel-card">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Star className="h-5 w-5 text-primary fill-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">4.9/5.0</p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg p-4 funnel-card">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">100%</p>
                  <p className="text-xs text-muted-foreground">Guaranteed</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-in-up">
            <Button 
              size="lg" 
              onClick={scrollToBooking}
              className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 animate-pulse-glow"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Book Now & Save 20%
            </Button>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Takes less than 3 minutes
            </p>
          </div>

          {/* Service Areas */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
            <MapPin className="h-4 w-4 text-primary" />
            <span>Serving Austin, Dallas, Houston, San Antonio & surrounding areas</span>
          </div>
        </div>
      </div>
    </div>
  );
}