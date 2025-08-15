import React from 'react';
import { Navigation } from '@/components/Navigation';
import { AuthenticatedBookingInterface } from '@/components/booking/AuthenticatedBookingInterface';

export default function ModernBooking() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <AuthenticatedBookingInterface />
    </div>
  );
}