import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Gift, Copy, Share2, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GoogleGuaranteedBadge } from '@/components/trust/GoogleGuaranteedBadge';
import { BrandedLoader } from '@/components/BrandedLoader';

const Success: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralLink, setReferralLink] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');

  const bookingId = searchParams.get('booking_id');

  useEffect(() => {
    const loadBookingAndGenerateReferral = async () => {
      if (!bookingId) {
        navigate('/book');
        return;
      }

      try {
        // Get booking details
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .select('customer_id, customers(email, first_name, referral_code, referral_link)')
          .eq('id', bookingId)
          .single();

        if (bookingError) throw bookingError;

        const customer = booking.customers as any;
        setCustomerEmail(customer.email);
        setCustomerName(customer.first_name || 'there');

        // Check if customer already has a referral code
        if (customer.referral_code && customer.referral_link) {
          setReferralCode(customer.referral_code);
          setReferralLink(customer.referral_link);
        } else {
          // Generate new referral code
          const { data: code, error: codeError } = await supabase
            .rpc('issue_referral_code', { input_customer_id: booking.customer_id });

          if (codeError) throw codeError;

          const link = `${window.location.origin}/ref/${code}`;
          setReferralCode(code);
          setReferralLink(link);

          // Update customer with referral link
          await supabase
            .from('customers')
            .update({ referral_link: link })
            .eq('id', booking.customer_id);
        }
      } catch (error: any) {
        console.error('Error loading referral:', error);
        toast.error('Failed to load referral details');
      } finally {
        setLoading(false);
      }
    };

    loadBookingAndGenerateReferral();
  }, [bookingId, navigate]);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const shareReferral = async () => {
    const shareData = {
      title: 'Get $50 off your first cleaning!',
      text: `I use AlphaLux Cleaning and love it! Use my referral code ${referralCode} to get $50 off your first cleaning.`,
      url: referralLink
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyToClipboard(referralLink, 'Referral link');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  if (loading) {
    return <BrandedLoader caption="Loading…" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Header */}
        <Card className="p-8 text-center border-primary/20 shadow-lg">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Booking Confirmed! 🎉</h1>
          <p className="text-muted-foreground">
            Thank you, {customerName}! Your cleaning is scheduled and we've sent a confirmation to {customerEmail}
          </p>
          <div className="flex justify-center mt-4">
            <GoogleGuaranteedBadge variant="standard" />
          </div>
        </Card>

        {/* Referral Incentive */}
        <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 shadow-lg">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <Gift className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">Earn $50 Per Referral!</h2>
              <p className="text-muted-foreground">
                Share your unique referral link with friends and family. When they book their first cleaning, you both get $50 in credits!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-background/50 backdrop-blur-sm p-4 rounded-lg border border-border/50">
              <div className="text-3xl font-bold text-primary mb-1">$50</div>
              <div className="text-sm text-muted-foreground">For you</div>
            </div>
            <div className="bg-background/50 backdrop-blur-sm p-4 rounded-lg border border-border/50">
              <div className="text-3xl font-bold text-primary mb-1">$50</div>
              <div className="text-sm text-muted-foreground">For your friend</div>
            </div>
          </div>

          {/* Referral Code */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Your Referral Code</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-background/70 backdrop-blur-sm border border-border rounded-lg px-4 py-3 font-mono text-lg font-bold">
                  {referralCode}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(referralCode, 'Code')}
                  className="h-auto"
                >
                  <Copy className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Your Referral Link</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-background/70 backdrop-blur-sm border border-border rounded-lg px-4 py-3 font-mono text-sm truncate">
                  {referralLink}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(referralLink, 'Link')}
                  className="h-auto"
                >
                  <Copy className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <Button 
              onClick={shareReferral} 
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share & Earn $50
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-border/50">
            <h3 className="font-semibold mb-2">How it works:</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <Badge variant="outline" className="h-5 w-5 rounded-full flex items-center justify-center p-0 flex-shrink-0">1</Badge>
                <span>Share your referral link or code with friends</span>
              </li>
              <li className="flex gap-2">
                <Badge variant="outline" className="h-5 w-5 rounded-full flex items-center justify-center p-0 flex-shrink-0">2</Badge>
                <span>They book their first cleaning using your code</span>
              </li>
              <li className="flex gap-2">
                <Badge variant="outline" className="h-5 w-5 rounded-full flex items-center justify-center p-0 flex-shrink-0">3</Badge>
                <span>You both receive $50 credits automatically!</span>
              </li>
            </ol>
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex-1 h-12"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </Button>
          <Button 
            onClick={() => navigate('/referrals')}
            className="flex-1 h-12"
          >
            View My Referrals
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Success;
