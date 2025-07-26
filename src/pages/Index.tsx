import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Home as HomeIcon } from "lucide-react";
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

  // Track page view on component mount
  useEffect(() => {
    trackViewContent('Cleaning Services Homepage');
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
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Professional Cleaning Services
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Bay Area's premier cleaning service for residential and commercial properties
          </p>
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
              <CardContent className="p-8">
                <div className="space-y-8">
                  {/* Quote Section - Large like commercial */}
                  <div className="w-full">
                    <h2 className="text-3xl font-bold mb-6 text-center">Get Your Residential Cleaning Quote</h2>
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
                      <h2 className="text-2xl font-semibold mb-4 text-center">What's Included in Your Service</h2>
                      <ServiceIncluded 
                        cleaningType={pricingData.cleaningType}
                        serviceType={pricingData.serviceType}
                      />
                    </div>
                  )}
                  
                  {/* Scheduling and Payment sections side by side when data is available */}
                  {pricingData && (
                    <div className="grid gap-8 lg:grid-cols-2">
                      {/* Scheduling Section */}
                      <div>
                        <h2 className="text-2xl font-semibold mb-4">Schedule Your Service</h2>
            <VisualScheduler 
              onSchedulingUpdate={handleSchedulingUpdate} 
              selectedDate={schedulingData.scheduledDate}
              selectedTime={schedulingData.scheduledTime}
              serviceType={pricingData.cleaningType}
            />
                      </div>
                      
                      {/* Payment Section */}
                      <div>
                        <h2 className="text-2xl font-semibold mb-4">Complete Your Booking</h2>
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
