import React from 'react';
import { Navigation } from '@/components/Navigation';
import { GuestBookingWrapper } from '@/components/booking/GuestBookingWrapper';

export default function GuestBooking() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <GuestBookingWrapper />
    </div>
  );
}