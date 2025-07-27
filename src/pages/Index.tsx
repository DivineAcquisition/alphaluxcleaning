import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Home as HomeIcon, Clock, Sparkles } from "lucide-react";
import { PricingCalculator } from "@/components/dashboard/PricingCalculator";
import { CommercialEstimateSection } from "@/components/CommercialEstimateSection";
import { VisualScheduler } from "@/components/VisualScheduler";
import { PaymentForm } from "@/components/PaymentForm";
import { Navigation } from "@/components/Navigation";
import { ServiceIncluded } from "@/components/ServiceIncluded";
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
              return { hours: 23, minutes: 59, seconds: 59 };
            }
          }
        }

        return { hours: newHours, minutes: newMinutes, seconds: newSeconds };
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold font-jakarta tracking-tight mb-4" style={{letterSpacing: '-3px'}}>
            Professional Cleaning Services
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto font-inter">
            Bay Area's premier cleaning service for residential and commercial properties
          </p>
        </div>

        {/* Limited Time Offer Banner */}
        <div className="mb-8 max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-primary to-primary/80 border-none shadow-lg animate-pulse">
            <CardContent className="p-6">
              <div className="text-center text-white">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 animate-bounce" />
                  <h2 className="text-lg sm:text-2xl font-bold font-jakarta" style={{letterSpacing: '-3px'}}>LIMITED TIME OFFER!</h2>
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 animate-bounce" />
                </div>
                
                <div className="mb-4">
                  <p className="text-lg sm:text-xl font-semibold mb-1 font-jakarta" style={{letterSpacing: '-2px'}}>
                    Save $75 + Get 25% Off All Recurring Services
                  </p>
                  <p className="text-sm sm:text-base text-primary-foreground/90 font-inter">
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

                <p className="text-xs sm:text-sm text-primary-foreground/80 font-inter">
                  ⏰ Offer expires at midnight! Don't miss out on these incredible savings.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="residential" className="w-full max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="residential" className="flex items-center gap-2">
              <HomeIcon className="h-4 w-4" />
              Residential
            </TabsTrigger>
            <TabsTrigger value="commercial" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Commercial
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="residential" className="space-y-6">
            {/* Full screen residential layout matching commercial style */}
            <Card className="w-full">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="space-y-8">
                   {/* Quote Section - Large like commercial */}
                  <div className="w-full">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center font-jakarta" style={{letterSpacing: '-3px'}}>Choose Your Residential Services</h2>
                    <PricingCalculator 
                      onPriceUpdate={(data, price, breakdown) => {
                        setPricingData(data);
                        setCalculatedPrice(price);
                        setPriceBreakdown(breakdown);
                      }}
                    />
                  </div>
                  
                   {/* Service Details Section */}
                  {pricingData && (
                    <div className="w-full">
                      <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-center font-jakarta" style={{letterSpacing: '-2px'}}>What's Included in Your Service</h2>
                      <ServiceIncluded 
                        cleaningType={pricingData.cleaningType}
                        serviceType={pricingData.serviceType}
                      />
                    </div>
                  )}
                  
                   {/* Scheduling and Payment sections side by side when data is available */}
                  {pricingData && (
                    <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
                      {/* Scheduling Section */}
                      <div>
                        <h2 className="text-xl sm:text-2xl font-semibold mb-4 font-jakarta" style={{letterSpacing: '-2px'}}>Schedule Your Service</h2>
            <VisualScheduler 
              onSchedulingUpdate={handleSchedulingUpdate} 
              selectedDate={schedulingData.scheduledDate}
              selectedTime={schedulingData.scheduledTime}
              serviceType={pricingData.cleaningType}
            />
                      </div>
                      
                      {/* Payment Section */}
                      <div>
                        <h2 className="text-xl sm:text-2xl font-semibold mb-4 font-jakarta" style={{letterSpacing: '-2px'}}>Complete Your Booking</h2>
            <PaymentForm 
              pricingData={pricingData}
              calculatedPrice={calculatedPrice}
              priceBreakdown={priceBreakdown}
              schedulingData={schedulingData}
            />
                      </div>
                    </div>
                  )}
                  
                  {/* Referral Section */}
                  <div className="w-full">
                    <ReferralSection />
                  </div>
                </div>
              </CardContent>
            </Card>
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
    </div>
  );
};

export default Index;
