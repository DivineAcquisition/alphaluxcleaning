import React from 'react';
import { Navigation } from '@/components/Navigation';
import { MobileCustomerPortal } from '@/components/customer/MobileCustomerPortal';

export default function CustomerPortalDashboard() {
  return (
    <>
      <Navigation />
      <MobileCustomerPortal />
    </>
  );
}