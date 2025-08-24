import React from 'react';
import { Navigation } from '@/components/Navigation';
import { LegacyBookingFlow } from '@/components/booking/LegacyBookingFlow';

export default function LegacyBooking() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <LegacyBookingFlow />
    </div>
  );
}