import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Shield, Star, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TrialLandingPage() {
  const navigate = useNavigate();

  const benefits = [
    { icon: CheckCircle, title: 'First Cleaning FREE', description: 'Experience our premium service at no cost' },
    { icon: Clock, title: '2-Hour Service Window', description: 'We arrive within your specified 2-hour window' },
    { icon: Shield, title: 'Insured & Bonded', description: 'Complete peace of mind with full coverage' },
    { icon: Star, title: '5-Star Rated Cleaners', description: 'Only top-rated professionals service your home' }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      location: 'San Francisco',
      rating: 5,
      text: 'Amazing service! My house has never been cleaner. The trial convinced me immediately.'
    },
    {
      name: 'Mike Chen',
      location: 'Oakland',
      rating: 5,
      text: 'Professional, reliable, and thorough. Been using them for 6 months after the trial.'
    },
    {
      name: 'Lisa Rodriguez',
      location: 'San Jose',
      rating: 5,
      text: 'The trial was perfect - no hidden fees, exactly as promised. Highly recommend!'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Bay Area Cleaning</span>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/auth')}
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <Badge className="mb-6 text-lg px-6 py-2 bg-primary/10 text-primary border-primary/20">
            LIMITED TIME OFFER
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Your First Cleaning is
            <span className="block text-primary mt-2">100% FREE</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience premium house cleaning with no commitment. See why thousands of Bay Area families trust us with their homes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 h-auto"
              onClick={() => navigate('/schedule-service?trial=true')}
            >
              <Zap className="mr-2 h-5 w-5" />
              Claim Your FREE Cleaning
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-lg px-8 py-6 h-auto"
              onClick={() => navigate('/guest-booking')}
            >
              Get Instant Quote
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>10,000+ Happy Customers</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Fully Insured</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-card/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Why Choose Your Trial with Us?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            How Your Free Trial Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Book Your Trial</h3>
              <p className="text-muted-foreground">Select your preferred date and time. No payment required upfront.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">We Clean Your Home</h3>
              <p className="text-muted-foreground">Our professional team arrives and performs a complete deep cleaning.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Decide If You Love It</h3>
              <p className="text-muted-foreground">No obligation to continue. Book regular service only if you're thrilled!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-card/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            What Trial Customers Say
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.text}"</p>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.location}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Ready to Try Risk-Free?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who started with our free trial. No contracts, no commitments.
          </p>
          
          <Button 
            size="lg" 
            className="text-xl px-12 py-8 h-auto"
            onClick={() => navigate('/schedule-service?trial=true')}
          >
            <Zap className="mr-3 h-6 w-6" />
            Schedule Your FREE Trial Cleaning
          </Button>
          
          <p className="text-sm text-muted-foreground mt-4">
            * No credit card required • Cancel anytime • 100% satisfaction guaranteed
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span>Licensed & Insured</span>
            <span>•</span>
            <span>Same-Day Booking Available</span>
            <span>•</span>
            <span>Satisfaction Guaranteed</span>
          </div>
        </div>
      </footer>
    </div>
  );
}