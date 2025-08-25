import React, { useState } from 'react';
import { CustomerPortalProvider, useCustomerPortal } from '@/contexts/CustomerPortalContext';
import { EmailPortalAccess } from './EmailPortalAccess';
import { Loader2 } from 'lucide-react';

interface CustomerPortalWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  requiresAuth?: boolean;
}

function CustomerPortalContent({ children }: { children: React.ReactNode }) {
  const { customerEmail, setCustomerEmail, loading, error, hasData } = useCustomerPortal();

  const handleEmailSubmit = async (email: string) => {
    setCustomerEmail(email);
  };

  // If no email is set, show the email entry form
  if (!customerEmail) {
    return (
      <EmailPortalAccess 
        onEmailSubmit={handleEmailSubmit}
        loading={loading}
        error={error}
      />
    );
  }

  // If email is set but no data found, show the email form with error
  if (customerEmail && !loading && !hasData) {
    return (
      <EmailPortalAccess 
        onEmailSubmit={handleEmailSubmit}
        loading={loading}
        error={error || "No service records found for this email address."}
      />
    );
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