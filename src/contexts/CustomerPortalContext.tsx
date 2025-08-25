import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useCustomerDataByEmail } from '@/hooks/useCustomerDataByEmail';

interface CustomerPortalContextType {
  customerEmail: string | null;
  setCustomerEmail: (email: string | null) => void;
  // Re-export all the data from the hook for easy access
  loading: boolean;
  profile: any;
  orders: any[];
  bookings: any[];
  notifications: any[];
  stats: any;
  error: string | null;
  hasData: boolean;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  updateProfile: (updates: any) => Promise<boolean>;
  refreshAll: () => Promise<void>;
  fetchCustomerData: (email: string) => Promise<void>;
}

const CustomerPortalContext = createContext<CustomerPortalContextType | null>(null);

interface CustomerPortalProviderProps {
  children: ReactNode;
}

export function CustomerPortalProvider({ children }: CustomerPortalProviderProps) {
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const customerData = useCustomerDataByEmail(customerEmail);

  const contextValue: CustomerPortalContextType = {
    customerEmail,
    setCustomerEmail,
    ...customerData
  };

  return (
    <CustomerPortalContext.Provider value={contextValue}>
      {children}
    </CustomerPortalContext.Provider>
  );
}

export function useCustomerPortal() {
  const context = useContext(CustomerPortalContext);
  if (!context) {
    throw new Error('useCustomerPortal must be used within a CustomerPortalProvider');
  }
  return context;
}