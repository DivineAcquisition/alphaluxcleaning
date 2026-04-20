import React from 'react';
import { Navigation } from '@/components/Navigation';
import { ModernLegacyBooking } from '@/components/booking/ModernLegacyBooking';

export default function LegacyBooking() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <ModernLegacyBooking />
    </div>
  );
}