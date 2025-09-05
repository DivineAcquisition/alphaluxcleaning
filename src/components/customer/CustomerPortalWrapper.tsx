import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { CustomerPortalProvider, useCustomerPortal } from '@/contexts/CustomerPortalContext';
import { Loader2 } from 'lucide-react';

interface CustomerPortalWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  requiresAuth?: boolean;
}

function CustomerPortalContent({ children }: { children: React.ReactNode }) {
  const { customerEmail, setCustomerEmail, loading, error, hasData } = useCustomerPortal();

  // If no email is set or no data found, redirect to order-status page
  if (!customerEmail || (customerEmail && !loading && !hasData)) {
    return <Navigate to="/order-status" replace />;
  }

  // Show loading while fetching customer data
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your services...</p>
        </div>
      </div>
    );
  }

  // Customer email is set and data is available, show the portal content
  return <>{children}</>;
}

export function CustomerPortalWrapper({ 
  children, 
  title = "Customer Portal", 
  description = "Manage your cleaning services", 
  requiresAuth = false // Changed to false for email-based access
}: CustomerPortalWrapperProps) {
  return (
    <CustomerPortalProvider>
      <CustomerPortalContent>
        {children}
      </CustomerPortalContent>
    </CustomerPortalProvider>
  );
}