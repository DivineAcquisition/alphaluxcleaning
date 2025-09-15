import { ModernBookingFlow } from "@/components/booking/ModernBookingFlow";
import { Navigation } from "@/components/Navigation";

export function DomainAwareHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Book Your Cleaning Service
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional cleaning services tailored to your needs. 
            Get started with our easy booking process.
          </p>
        </div>
        <ModernBookingFlow />
      </div>
    </div>
  );
}