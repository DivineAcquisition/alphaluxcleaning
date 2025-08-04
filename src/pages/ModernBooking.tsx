import React from 'react';
import { Navigation } from '@/components/Navigation';
import { ModernBookingFlow } from '@/components/booking/ModernBookingFlow';

export default function ModernBooking() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <ModernBookingFlow />
    </div>
  );
}