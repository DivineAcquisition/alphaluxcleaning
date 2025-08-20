import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileBottomNav } from '@/components/customer/MobileBottomNav';
import { MobileCustomerPortal } from '@/components/customer/MobileCustomerPortal';
import { CustomerNotificationCenter } from '@/components/customer/CustomerNotificationCenter';
import { CustomerProfileCard } from '@/components/customer/CustomerProfileCard';
import { QuickServiceActions } from '@/components/customer/QuickServiceActions';
import { MobileHelpButton } from '@/components/customer/MobileHelpButton';
import CustomerErrorBoundary from '@/components/customer/CustomerErrorBoundary';
import { PWAInstallPrompt } from '@/components/customer/PWAInstallPrompt';
import PaymentPortal from '@/pages/PaymentPortal';
import { useCustomerData } from '@/hooks/useCustomerData';

export default function CustomerMobilePortal() {
  const isMobile = useIsMobile();
  const { notifications, orders, bookings } = useCustomerData();
  const [activeTab, setActiveTab] = useState('dashboard');

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const hasActiveServices = orders.length > 0 || bookings.length > 0;
  const hasRecurringServices = orders.some(order => order.is_recurring);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <MobileCustomerPortal />;
      case 'services':
        return (
          <div className="p-4 space-y-6 pb-24">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-foreground">My Services</h1>
            </div>
            <QuickServiceActions 
              hasActiveServices={hasActiveServices}
              hasRecurringServices={hasRecurringServices}
            />
            {/* Service list will be rendered by the service actions component */}
          </div>
        );
      case 'notifications':
        return (
          <div className="p-4 space-y-6 pb-24">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            </div>
            <CustomerNotificationCenter />
          </div>
        );
      case 'billing':
        return (
          <div className="pb-24">
            <PaymentPortal />
          </div>
        );
      case 'profile':
        return (
          <div className="p-4 space-y-6 pb-24">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-foreground">Profile</h1>
            </div>
            <CustomerProfileCard />
          </div>
        );
      default:
        return <MobileCustomerPortal />;
    }
  };

  if (!isMobile) {
    return <MobileCustomerPortal />;
  }

  return (
    <CustomerErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* PWA Install Prompt */}
        <PWAInstallPrompt />
        
        {/* Main Content */}
        <div className="pb-20">
          {renderTabContent()}
        </div>
        
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          notificationCount={unreadNotifications.length}
        />
        
        {/* Floating Help Button */}
        <MobileHelpButton />
      </div>
    </CustomerErrorBoundary>
  );
}