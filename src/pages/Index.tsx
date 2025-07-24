import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { PricingCalculator } from "@/components/dashboard/PricingCalculator";
import { ServicePricing } from "@/components/dashboard/ServicePricing";
import { PaymentForm } from "@/components/PaymentForm";
import { useState } from "react";

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
        <ServicePricing />
      </div>
    </div>
  );
};

export default Index;
