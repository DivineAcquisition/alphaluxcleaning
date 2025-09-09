import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { OTPForm } from '@/components/auth/OTPForm';
import { Loader2 } from 'lucide-react';

export default function CustomerLogin() {
  const { user, loading, requestCustomerOTP, verifyCustomerOTP } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for customer portal token
    const portalToken = localStorage.getItem('customer_portal_token');
    if (portalToken || (user && !loading)) {
      navigate('/portal');
    }
  }, [user, loading, navigate]);

  const handleOTPSent = () => {
    // Optional: Show success message or update UI
  };

  const handleOTPVerified = () => {
    // Navigation will be handled by useEffect
    navigate('/portal');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Bay Area Cleaning Pros
          </h1>
          <p className="text-muted-foreground">
            Customer Portal Access
          </p>
        </div>

        <OTPForm
          type="customer"
          onOTPSent={handleOTPSent}
          onOTPVerified={handleOTPVerified}
          requestOTP={requestCustomerOTP}
          verifyOTP={verifyCustomerOTP}
        />
      </div>
    </div>
  );
}