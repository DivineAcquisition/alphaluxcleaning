import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Home as HomeIcon, Clock, Sparkles } from "lucide-react";
import { PricingCalculator } from "@/components/dashboard/PricingCalculator";
import { RecurringBookingInterface } from "@/components/RecurringBookingInterface";
import { CommercialEstimateSection } from "@/components/CommercialEstimateSection";
import VisualScheduler from "@/components/VisualScheduler";
import { PaymentForm } from "@/components/PaymentForm";
import { Navigation } from "@/components/Navigation";
import { ServiceDetailsDialog } from "@/components/ServiceDetailsDialog";
import { ReferralSection } from "@/components/ReferralSection";
import { trackViewContent, trackInitiateCheckout } from "@/lib/facebook-pixel";
const Index = () => {
  const [pricingData, setPricingData] = useState(null);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [priceBreakdown, setPriceBreakdown] = useState({});
  const [schedulingData, setSchedulingData] = useState({
    scheduledDate: "",
    scheduledTime: ""
  });
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });

  // Track page view on component mount
  useEffect(() => {
    trackViewContent('Cleaning Services Homepage');
    
    // Load chat widget
    const script = document.createElement('script');
    script.src = 'https://widgets.leadconnectorhq.com/loader.js';
    script.setAttribute('data-resources-url', 'https://widgets.leadconnectorhq.com/chat-widget/loader.js');
    script.setAttribute('data-widget-id', '688b7acb81758b9cee3c0c05');
    script.async = true;
    document.head.appendChild(script);

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
  const handleSchedulingUpdate = (data: any) => {
    setSchedulingData(data);
  };

  // Track InitiateCheckout when pricing data is available and user starts scheduling
  useEffect(() => {
    if (pricingData && calculatedPrice > 0) {
      trackInitiateCheckout(calculatedPrice, pricingData.cleaningType);
    }
  }, [pricingData, calculatedPrice]);
  return <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-jakarta font-bold tracking-tight mb-4">
            Professional Cleaning Services
          </h1>
          <p className="text-xl font-inter font-semibold text-muted-foreground max-w-2xl mx-auto">
            Bay Area's premier cleaning service for residential and commercial properties
          </p>
        </div>

        {/* Limited Time Offer Banner */}
        <div className="mb-8 max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-primary to-primary/80 border-none shadow-lg animate-pulse">
            <CardContent className="p-6">
              <div className="text-center text-white">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Sparkles className="h-6 w-6 animate-bounce" />
                  <h2 className="text-2xl font-jakarta font-bold">LIMITED TIME OFFER!</h2>
                  <Sparkles className="h-6 w-6 animate-bounce" />
                </div>
                
                <div className="mb-4">
                  <p className="text-xl font-jakarta font-semibold mb-1">Save $75 On Deep Cleanings Or Get 25% Off All Recurring Services</p>
                  <p className="font-inter font-semibold text-primary-foreground/90">
                    Book now and enjoy ongoing savings on every clean!
                  </p>
                </div>

                {/* Countdown Timer */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Clock className="h-5 w-5" />
                  <div className="flex items-center gap-1 text-lg font-mono font-bold">
                    <span className="bg-white/20 px-2 py-1 rounded">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span>:</span>
                    <span className="bg-white/20 px-2 py-1 rounded">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span>:</span>
                    <span className="bg-white/20 px-2 py-1 rounded">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <p className="text-sm font-inter font-semibold text-primary-foreground/80">
                  ⏰ Offer expires at midnight! Don't miss out on these incredible savings.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="residential" className="w-full max-w-7xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
            <TabsTrigger value="residential" className="flex items-center gap-2 text-base">
              <HomeIcon className="h-5 w-5" />
              Residential
            </TabsTrigger>
            <TabsTrigger value="commercial" className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5" />
              Commercial
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="residential" className="space-y-8">
            {/* Modern card-based layout */}
            <div className="grid gap-6 lg:gap-8">
              {/* Service Configuration Section */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-background/60 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-jakarta font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      Choose Your Residential Services
                    </h2>
                    <p className="font-inter font-semibold text-muted-foreground text-lg">
                      Customize your cleaning experience with our flexible options
                    </p>
                  </div>
                  <RecurringBookingInterface onBookingUpdate={(data) => {
                    setPricingData({
                      hours: data.tier.hours,
                      cleaningType: 'standard',
                      serviceType: data.recurring.frequency === 'once' ? 'hourly' : 'recurring',
                      membership: data.membership,
                      addOns: data.addOns,
                      recurring: data.recurring
                    });
                    setCalculatedPrice(data.pricing.total);
                    setPriceBreakdown({
                      basePrice: data.tier.basePrice,
                      addOns: data.addOns,
                      membership: data.membership,
                      recurring: data.recurring,
                      savings: data.pricing.recurringDiscount + data.pricing.membershipDiscount
                    });
                  }} />
                </CardContent>
              </Card>

              {/* Service Details Button */}
              {pricingData && (
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <h3 className="text-xl font-jakarta font-bold">Want to know exactly what's included?</h3>
                      <ServiceDetailsDialog 
                        cleaningType={pricingData.cleaningType} 
                        serviceType={pricingData.serviceType} 
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Payment Section */}
              {pricingData && (
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <div className="text-center space-y-6">
                      <h2 className="text-2xl font-jakarta font-bold">
                        Complete Your Booking
                      </h2>
                      <p className="text-muted-foreground max-w-2xl mx-auto">
                        Secure your spot with payment, then choose your preferred date and time on the next page.
                      </p>
                      <PaymentForm 
                        pricingData={pricingData} 
                        calculatedPrice={calculatedPrice} 
                        priceBreakdown={priceBreakdown} 
                        schedulingData={schedulingData} 
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Referral Section */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="p-8">
                  <ReferralSection />
                </CardContent>
              </Card>

              {/* Membership CTA */}
              <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-blue-50">
                <CardContent className="p-8 text-center space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Want More Savings? Join Clean & Covered™
                  </h3>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Get $20 credit every month, priority scheduling, and exclusive member perks for just $30/month.
                  </p>
                  <Button 
                    asChild 
                    size="lg" 
                    className="bg-primary hover:bg-primary/90"
                  >
                    <a href="/membership">Learn About Membership</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="commercial">
            <Card>
              <CardContent className="p-6">
                <CommercialEstimateSection />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
};
export default Index;