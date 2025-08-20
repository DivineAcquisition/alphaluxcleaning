import React from 'react';
import { CustomerPortalWrapper } from '@/components/customer/CustomerPortalWrapper';
import { CustomerPortalNavigation } from '@/components/customer/CustomerPortalNavigation';
import { MobileCustomerPortal } from '@/components/customer/MobileCustomerPortal';

export default function CustomerPortalDashboard() {
  return (
    <CustomerPortalWrapper 
      title="Customer Dashboard" 
      description="Manage your cleaning services and account"
      requiresAuth={true}
    >
      <CustomerPortalNavigation title="Dashboard" />
      <MobileCustomerPortal />
    </CustomerPortalWrapper>
  );
}