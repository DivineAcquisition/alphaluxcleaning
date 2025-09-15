import { ModernBookingFlow } from "@/components/booking/ModernBookingFlow";
import { Navigation } from "@/components/Navigation";

export function DomainAwareHome() {
  return (
    <>
      <Navigation />
      <ModernBookingFlow />
    </>
  );
}