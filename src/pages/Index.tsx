import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { PricingCalculator } from "@/components/dashboard/PricingCalculator";
import { ServicePricing } from "@/components/dashboard/ServicePricing";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <DashboardHeader />
        <PricingCalculator />
        <ServicePricing />
      </div>
    </div>
  );
};

export default Index;
