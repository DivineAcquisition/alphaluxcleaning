import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Home as HomeIcon } from "lucide-react";
import { PricingCalculator } from "@/components/dashboard/PricingCalculator";
import { CommercialEstimateSection } from "@/components/CommercialEstimateSection";
import { BookingScheduler } from "@/components/BookingScheduler";
import { PaymentForm } from "@/components/PaymentForm";
import { Navigation } from "@/components/Navigation";

const Index = () => {
  const [pricingData, setPricingData] = useState(null);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [priceBreakdown, setPriceBreakdown] = useState({});
  const [schedulingData, setSchedulingData] = useState(null);

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
            {/* Full screen residential layout with logo */}
            <div className="relative">
              {/* Logo in corner */}
              <div className="absolute top-4 right-4 z-10">
                <img 
                  src="/lovable-uploads/58721dab-bcc3-4b69-bb80-6cca4ddf9f0c.png" 
                  alt="Bay Area Cleaning Professionals" 
                  className="w-32 h-32 md:w-40 md:h-40 object-contain"
                />
              </div>
              
              <Card className="w-full">
                <CardContent className="p-8">
                  <div className="grid gap-8 lg:grid-cols-2">
                    {/* Left Column - Pricing & Booking */}
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-semibold mb-4">Get Your Quote</h2>
                        <PricingCalculator 
                          onPriceUpdate={(data, price, breakdown) => {
                            setPricingData(data);
                            setCalculatedPrice(price);
                            setPriceBreakdown(breakdown);
                          }}
                        />
                      </div>
                      
                      {pricingData && (
                        <div>
                          <h2 className="text-2xl font-semibold mb-4">Schedule Your Service</h2>
                          <BookingScheduler 
                            onSchedulingUpdate={setSchedulingData}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Right Column - Payment */}
                    <div>
                      {pricingData && schedulingData && (
                        <div>
                          <h2 className="text-2xl font-semibold mb-4">Complete Your Booking</h2>
                          <PaymentForm 
                            pricingData={pricingData}
                            calculatedPrice={calculatedPrice}
                            priceBreakdown={priceBreakdown}
                            schedulingData={schedulingData}
                          />
                        </div>
                      )}
                    </div>
                  </div>
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
    </div>
  );
};

export default Index;
