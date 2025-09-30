import React, { useState, useEffect } from 'react';
import { Shield, Award, Clock, MapPin, Star, Sparkles, CheckCircle, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  const [bookingsToday, setBookingsToday] = useState(12);
  
  // Simulate real-time bookings
  useEffect(() => {
    const interval = setInterval(() => {
      setBookingsToday(prev => prev + 1);
    }, 45000); // Update every 45 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/10 py-12 lg:py-20">
      {/* Floating decorative elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Trust Badges Row */}
          <div className="flex flex-wrap justify-center gap-4 mb-8 animate-fade-in">
            <Badge className="bg-cvr-trust/10 text-cvr-trust border-cvr-trust/20 px-4 py-2 text-sm font-medium">
              <Shield className="w-4 h-4 mr-2" />
              100% Satisfaction Guaranteed
            </Badge>
            <Badge className="bg-success/10 text-success border-success/20 px-4 py-2 text-sm font-medium">
              <Award className="w-4 h-4 mr-2" />
              5-Star Rated Service
            </Badge>
            <Badge className="bg-warning/10 text-warning border-warning/20 px-4 py-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              Professional Team
            </Badge>
          </div>

          {/* Main Headline */}
          <div className="text-center space-y-6 mb-10">
            <div className="inline-block mb-4">
              <Badge className="gradient-urgency text-white px-6 py-2 text-lg font-bold animate-pulse-glow">
                🔥 SAVE 20% - Limited Time Offer!
              </Badge>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
              Premium House Cleaning
              <span className="block mt-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Starting at Just $78
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Top-rated professional cleaning service in Dallas & Beyond. 
              <span className="font-semibold text-foreground"> Book in 60 seconds.</span> 
              <span className="text-success font-semibold"> Pay after service.</span>
            </p>

            {/* Live Social Proof */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-bounce-subtle">
              <TrendingUp className="w-5 h-5 text-success" />
              <span className="font-medium">
                <span className="text-success font-bold">{bookingsToday}</span> homes booked today
              </span>
            </div>
          </div>

          {/* Value Props Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              {
                icon: Clock,
                title: '60-Second Booking',
                description: 'Quick online booking, no phone calls needed',
                color: 'text-primary'
              },
              {
                icon: Shield,
                title: 'Pay After Service',
                description: 'Only 20% deposit required to secure your date',
                color: 'text-success'
              },
              {
                icon: Star,
                title: '5-Star Guarantee',
                description: 'Not satisfied? We\'ll re-clean for free',
                color: 'text-warning'
              }
            ].map((item, index) => (
              <div
                key={index}
                className="bg-card/80 backdrop-blur border border-border rounded-xl p-6 hover-lift transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className={`w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <div className="flex -space-x-2">
                {['👨‍💼', '👩‍⚕️', '👨‍🎓', '👩‍🏫'].map((emoji, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-lg">
                    {emoji}
                  </div>
                ))}
              </div>
              <span className="font-medium">
                <span className="text-foreground font-bold">10,000+</span> happy Dallas customers
              </span>
            </div>

            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Most popular time slots fill up fast - Book now to secure your preferred date</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
