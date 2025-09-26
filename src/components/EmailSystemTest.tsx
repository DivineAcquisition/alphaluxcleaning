import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const EmailSystemTest = () => {
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const testBookingConfirmation = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-order-confirmation', {
        body: {
          customerEmail: testEmail,
          customerName: "Test Customer",
          serviceDate: "2025-01-15",
          serviceTime: "10:00 AM - 12:00 PM",
          totalAmount: 150,
          depositAmount: 30,
          remainingBalance: 120,
          orderId: "TEST123456",
          serviceType: "regular"
        }
      });

      if (error) throw error;

      toast({
        title: "✅ Booking Confirmation Sent!",
        description: `Test booking confirmation sent to ${testEmail}`,
      });
    } catch (error: any) {
      console.error('Booking confirmation test error:', error);
      toast({
        title: "❌ Booking Test Failed",
        description: error.message || 'Failed to send booking confirmation',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testReferralEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-referral-email', {
        body: {
          ownerName: "Test Owner",
          ownerEmail: testEmail,
          referralCode: "TESTREF123",
          referralLink: "https://alphaluxclean.com?referral=TESTREF123&discount=50"
        }
      });

      if (error) throw error;

      toast({
        title: "✅ Referral Email Sent!",
        description: `Test referral email sent to ${testEmail}`,
      });
    } catch (error: any) {
      console.error('Referral email test error:', error);
      toast({
        title: "❌ Referral Test Failed",
        description: error.message || 'Failed to send referral email',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-6 bg-card rounded-lg border">
      <h3 className="text-lg font-semibold">Email System Test</h3>
      
      <div className="flex gap-2 items-center">
        <Input
          type="email"
          placeholder="test@example.com"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          className="flex-1"
        />
      </div>
      
      <div className="flex gap-2">
        <Button 
          onClick={testBookingConfirmation} 
          disabled={loading}
          variant="outline"
          className="flex-1"
        >
          {loading ? 'Sending...' : '📧 Test Booking Email'}
        </Button>
        
        <Button 
          onClick={testReferralEmail} 
          disabled={loading}
          variant="outline"
          className="flex-1"
        >
          {loading ? 'Sending...' : '🔗 Test Referral Email'}
        </Button>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Enter your email above and test both booking confirmation and referral email sending.
      </p>
    </div>
  );
};