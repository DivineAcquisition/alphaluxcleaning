import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Home as HomeIcon, Clock, Sparkles } from "lucide-react";
import { PricingCalculator } from "@/components/dashboard/PricingCalculator";
import { CommercialEstimateSection } from "@/components/CommercialEstimateSection";
import { VisualScheduler } from "@/components/VisualScheduler";
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
  return (
    <div className="min-h-screen bg-background cyber-grid relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl animate-pulse" />
      
      <Navigation />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Hero Section with Futuristic Design */}
        <div className="text-center mb-12 relative">
          <div className="inline-block">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 gradient-text text-glow">
              FUTURE CLEAN
            </h1>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent mb-6" />
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-light">
            Bay Area's most advanced cleaning service powered by precision and technology
          </p>
        </div>

        {/* Futuristic Limited Time Offer */}
        <div className="mb-12 max-w-5xl mx-auto">
          <Card className="glass-morphism border-0 neon-glow relative overflow-hidden hover-lift">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20" />
            <div className="scan-line" />
            <CardContent className="p-8 relative z-10">
              <div className="text-center text-foreground">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Sparkles className="h-8 w-8 animate-bounce text-primary" />
                  <h2 className="text-3xl md:text-4xl font-bold tracking-wider">QUANTUM SAVINGS</h2>
                  <Sparkles className="h-8 w-8 animate-bounce text-accent" />
                </div>
                
                <div className="mb-6">
                  <p className="text-xl md:text-2xl font-semibold mb-2 gradient-text">
                    Save $75 On Deep Cleanings + 25% Off Recurring Services
                  </p>
                  <p className="text-muted-foreground text-lg">
                    Unlock premium cleaning technology at breakthrough prices
                  </p>
                </div>

                {/* Enhanced Countdown Timer */}
                <div className="flex items-center justify-center gap-6 mb-6">
                  <Clock className="h-6 w-6 text-primary" />
                  <div className="flex items-center gap-2 text-2xl font-mono font-bold">
                    <div className="glass-morphism px-4 py-2 rounded-lg cyber-border">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </div>
                    <span className="text-primary">:</span>
                    <div className="glass-morphism px-4 py-2 rounded-lg cyber-border">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </div>
                    <span className="text-primary">:</span>
                    <div className="glass-morphism px-4 py-2 rounded-lg cyber-border">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  ⚡ Quantum offer expires at system midnight - Activate before time runs out
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Futuristic Tabs */}
        <Tabs defaultValue="residential" className="w-full max-w-7xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-12 h-16 glass-morphism border-0">
            <TabsTrigger 
              value="residential" 
              className="flex items-center gap-3 text-lg font-semibold data-[state=active]:glass-morphism data-[state=active]:neon-glow"
            >
              <HomeIcon className="h-6 w-6" />
              RESIDENTIAL
            </TabsTrigger>
            <TabsTrigger 
              value="commercial" 
              className="flex items-center gap-3 text-lg font-semibold data-[state=active]:glass-morphism data-[state=active]:neon-glow"
            >
              <Building2 className="h-6 w-6" />
              COMMERCIAL
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="residential" className="space-y-12">
            <div className="grid gap-8 lg:gap-12">
              {/* Service Configuration Section */}
              <Card className="floating-card border-0 cyber-border hover-lift relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
                <CardContent className="p-10">
                  <div className="text-center mb-10">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
                      CONFIGURE SERVICES
                    </h2>
                    <p className="text-muted-foreground text-xl">
                      Customize your cleaning matrix with precision controls
                    </p>
                  </div>
                  <PricingCalculator onPriceUpdate={(data, price, breakdown) => {
                    setPricingData(data);
                    setCalculatedPrice(price);
                    setPriceBreakdown(breakdown);
                  }} />
                </CardContent>
              </Card>

              {/* Service Details Section */}
              {pricingData && (
                <Card className="glass-morphism border-0 hover-lift relative">
                  <CardContent className="p-8">
                    <div className="text-center space-y-6">
                      <h3 className="text-2xl font-semibold gradient-text">
                        SERVICE SPECIFICATIONS
                      </h3>
                      <ServiceDetailsDialog 
                        cleaningType={pricingData.cleaningType} 
                        serviceType={pricingData.serviceType} 
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Booking Section */}
              {pricingData && (
                <div className="grid gap-8 xl:grid-cols-2">
                  {/* Scheduling Section */}
                  <Card className="floating-card border-0 cyber-border hover-lift">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
                    <CardContent className="p-10">
                      <h2 className="text-3xl font-bold mb-8 text-center gradient-text">
                        SCHEDULE MATRIX
                      </h2>
                      <VisualScheduler 
                        onSchedulingUpdate={handleSchedulingUpdate} 
                        selectedDate={schedulingData.scheduledDate} 
                        selectedTime={schedulingData.scheduledTime} 
                        serviceType={pricingData.cleaningType} 
                      />
                    </CardContent>
                  </Card>
                  
                  {/* Payment Section */}
                  <Card className="floating-card border-0 cyber-border hover-lift">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-primary" />
                    <CardContent className="p-10">
                      <h2 className="text-3xl font-bold mb-8 text-center gradient-text">
                        PAYMENT PROTOCOL
                      </h2>
                      <PaymentForm 
                        pricingData={pricingData} 
                        calculatedPrice={calculatedPrice} 
                        priceBreakdown={priceBreakdown} 
                        schedulingData={schedulingData} 
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {/* Referral Section */}
              <Card className="glass-morphism border-0 neon-glow hover-lift relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
                <CardContent className="p-10 relative z-10">
                  <ReferralSection />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="commercial">
            <Card className="floating-card border-0 cyber-border">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
              <CardContent className="p-10">
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