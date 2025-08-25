import React from 'react';
import { Navigation } from '@/components/Navigation';
import { SinglePageBooking } from '@/components/booking/SinglePageBooking';

export default function LegacyBooking() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <SinglePageBooking />
    </div>
  );
}