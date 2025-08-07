import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Home as HomeIcon, 
  Clock, 
  Sparkles, 
  Star, 
  CheckCircle, 
  Phone, 
  Calendar,
  Zap,
  Users,
  Shield,
  Heart
} from "lucide-react";
import { PaymentForm } from "@/components/PaymentForm";
import { Navigation } from "@/components/Navigation";
import { ReferralSection } from "@/components/ReferralSection";
import { trackViewContent, trackInitiateCheckout } from "@/lib/facebook-pixel";

const Index = () => {
  const [selectedService, setSelectedService] = useState('standard');
  const [selectedFrequency, setSelectedFrequency] = useState('weekly');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });

  // Service packages matching Bay Area Cleaning Pros style
  const services = [
    {
      id: 'standard',
      name: 'Standard Clean',
      price: 149,
      originalPrice: 299,
      icon: HomeIcon,
      features: [
        'Deep cleaning of all rooms',
        'Kitchen & bathroom sanitization', 
        'Dusting & vacuuming',
        'Floor mopping & wiping'
      ],
      popular: false
    },
    {
      id: 'deep',
      name: 'Deep Clean',
      price: 199,
      originalPrice: 399,
      icon: Sparkles,
      features: [
        'Everything in Standard',
        'Inside oven & fridge cleaning',
        'Baseboards & window sills',
        'Light fixture cleaning'
      ],
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium Clean',
      price: 249,
      originalPrice: 499,
      icon: Star,
      features: [
        'Everything in Deep Clean',
        'Garage organization',
        'Laundry wash & fold',
        'Interior window cleaning'
      ],
      popular: false
    }
  ];

  const frequencies = [
    { id: 'weekly', name: 'Weekly', discount: '50% OFF' },
    { id: 'biweekly', name: 'Bi-Weekly', discount: '40% OFF' },
    { id: 'monthly', name: 'Monthly', discount: '30% OFF' },
    { id: 'onetime', name: 'One Time', discount: '50% OFF' }
  ];

  // Track page view on component mount
  useEffect(() => {
    trackViewContent('Cleaning Services Homepage');

    // Load chat widget with defer to prevent layout shift
    const loadChatWidget = () => {
      const script = document.createElement('script');
      script.src = 'https://widgets.leadconnectorhq.com/loader.js';
      script.setAttribute('data-resources-url', 'https://widgets.leadconnectorhq.com/chat-widget/loader.js');
      script.setAttribute('data-widget-id', '688b7acb81758b9cee3c0c05');
      script.async = true;
      document.head.appendChild(script);
    };

    // Defer chat widget loading
    setTimeout(loadChatWidget, 2000);
    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[data-widget-id="688b7acb81758b9cee3c0c05"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let newSeconds = prev.seconds - 1;
        let newMinutes = prev.minutes;
        let newHours = prev.hours;
        if (newSeconds < 0) {
          newSeconds = 59;
          newMinutes = prev.minutes - 1;
          if (newMinutes < 0) {
            newMinutes = 59;
            newHours = prev.hours - 1;
            if (newHours < 0) {
              // Reset to 24 hours when it reaches 0
              return {
                hours: 23,
                minutes: 59,
                seconds: 59
              };
            }
          }
        }
        return {
          hours: newHours,
          minutes: newMinutes,
          seconds: newSeconds
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBookNow = () => {
    const selectedServiceData = services.find(s => s.id === selectedService);
    setShowPaymentForm(true);
    
    // Track conversion
    trackInitiateCheckout(selectedServiceData?.price || 149, selectedService);
  };

  const handleContactUs = () => {
    window.open('tel:+1-555-CLEAN-SF', '_self');
  };

  if (showPaymentForm) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <PaymentForm 
            pricingData={{
              squareFootage: 1000,
              cleaningType: selectedService,
              frequency: selectedFrequency,
              addOns: [],
              hours: 4,
              membership: false
            }}
            calculatedPrice={services.find(s => s.id === selectedService)?.price || 149}
            priceBreakdown={{}}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Special Offer Banner */}
      <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-3">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <span className="font-semibold text-sm md:text-base">LIMITED TIME: Up to 50% OFF First Clean</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs md:text-sm">
                {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              className="bg-card text-primary hover:bg-card/90 text-xs md:text-sm"
              onClick={handleBookNow}
            >
              Book Now
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section - Bay Area Cleaning Pros Style */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                We do the work
              </span>
              <br />
              <span className="text-foreground">
                so you can enjoy your home.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Professional cleaning services in the Bay Area. Trusted by thousands of families for over 10 years.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 h-auto min-w-[200px]"
                onClick={handleBookNow}
              >
                <Calendar className="mr-2 h-5 w-5" />
                BOOK NOW
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6 h-auto min-w-[200px]"
                onClick={handleContactUs}
              >
                <Phone className="mr-2 h-5 w-5" />
                CONTACT US
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto text-center">
              <div className="flex flex-col items-center">
                <div className="bg-primary/10 p-3 rounded-full mb-2">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground">10K+</div>
                <div className="text-sm text-muted-foreground">Happy Clients</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-primary/10 p-3 rounded-full mb-2">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground">10+</div>
                <div className="text-sm text-muted-foreground">Years Experience</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-primary/10 p-3 rounded-full mb-2">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground">100%</div>
                <div className="text-sm text-muted-foreground">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Special Offer Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-accent">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto border-none shadow-2xl bg-card/95 backdrop-blur">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  New Client Special
                </Badge>
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                First Clean Starting at 
                <span className="text-primary"> $149</span>
              </h2>
              
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="text-2xl line-through text-muted-foreground">$299</span>
                <span className="text-4xl font-bold text-primary">$149</span>
                <Badge className="bg-success text-success-foreground">Save 50%</Badge>
              </div>

              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Experience our premium cleaning service at an unbeatable price. Limited time offer for new clients only.
              </p>

              <Button 
                size="lg" 
                className="text-xl px-12 py-6 h-auto"
                onClick={handleBookNow}
              >
                Claim Your Special Offer
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Service Selection */}
      <section className="py-16 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Choose Your Service
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Select the perfect cleaning package for your home
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Card 
                  key={service.id} 
                  className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    selectedService === service.id 
                      ? 'ring-2 ring-primary shadow-lg transform scale-105' 
                      : 'hover:transform hover:scale-102'
                  } ${service.popular ? 'border-primary' : ''}`}
                  onClick={() => setSelectedService(service.id)}
                >
                  {service.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-4">
                    <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{service.name}</CardTitle>
                    <CardDescription className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-lg line-through text-muted-foreground">${service.originalPrice}</span>
                        <span className="text-3xl font-bold text-primary">${service.price}</span>
                      </div>
                      <Badge variant="secondary">50% OFF</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {service.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Frequency Selection */}
          <div className="mt-12 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-6 text-foreground">
              How often would you like cleaning?
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {frequencies.map((freq) => (
                <Card 
                  key={freq.id}
                  className={`cursor-pointer transition-all duration-300 ${
                    selectedFrequency === freq.id 
                      ? 'ring-2 ring-primary shadow-lg' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedFrequency(freq.id)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-semibold text-foreground mb-1">{freq.name}</div>
                    <Badge variant="outline" className="text-xs">{freq.discount}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="text-xl px-12 py-6 h-auto"
              onClick={handleBookNow}
            >
              Book Your ${services.find(s => s.id === selectedService)?.price || 149} Clean Now
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              No commitment • Satisfaction guaranteed • Free cancellation
            </p>
          </div>
        </div>
      </section>

      {/* Referral Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <ReferralSection />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;