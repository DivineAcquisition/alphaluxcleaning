import React from 'react';
import { Navigation } from '@/components/Navigation';
import { GuestBookingFlow } from '@/components/booking/GuestBookingFlow';

export default function GuestBooking() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <GuestBookingFlow />
    </div>
  );
}