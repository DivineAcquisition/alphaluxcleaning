import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { PricingCalculator } from "@/components/dashboard/PricingCalculator";
import { PaymentForm } from "@/components/PaymentForm";
import { CommercialEstimateSection } from "@/components/CommercialEstimateSection";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [pricingData, setPricingData] = useState({
    squareFootage: 1000,
    serviceType: "",
    cleaningType: "",
    frequency: "",
    addOns: []
  });
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [priceBreakdown, setPriceBreakdown] = useState({});

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <DashboardHeader />
        
        <Tabs defaultValue="residential" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="residential" className="text-sm">Residential Cleaning</TabsTrigger>
            <TabsTrigger value="commercial" className="text-sm">Commercial & Office</TabsTrigger>
          </TabsList>
          
          <TabsContent value="residential" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <PricingCalculator 
                  onPriceUpdate={(data, price, breakdown) => {
                    setPricingData(data);
                    setCalculatedPrice(price);
                    setPriceBreakdown(breakdown);
                  }}
                />
              </div>
              <div>
                <PaymentForm 
                  pricingData={pricingData}
                  calculatedPrice={calculatedPrice}
                  priceBreakdown={priceBreakdown}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="commercial" className="space-y-6">
            <CommercialEstimateSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
