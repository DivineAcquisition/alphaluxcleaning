import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Copy, Share2, Mail, MessageSquare, Gift, Users, TrendingUp, DollarSign, Sparkles, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ReferralData {
  referral_code?: string;
  referral_link?: string;
  total_referrals: number;
  total_rewards: number;
  available_credits: number;
  recent_referrals: Array<{
    id: string;
    referred_email: string;
    status: string;
    created_at: string;
    reward_amount?: number;
  }>;
}

export const ReferralHub: React.FC = () => {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState<string>('');
  const [isRedemptionDialogOpen, setIsRedemptionDialogOpen] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      // Get current user's customer record
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: customer } = await supabase
        .from('customers')
        .select('id, referral_code, referral_link')
        .eq('user_id', user.id)
        .single();

      if (!customer) return;
      
      setCustomerId(customer.id);

      // Get referral statistics
      const { data: referrals } = await supabase
        .from('referrals')
        .select(`
          id, 
          referred_email, 
          status, 
          created_at,
          referral_rewards!inner(amount_cents)
        `)
        .eq('referrer_customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get available credits
      const { data: credits } = await supabase
        .from('referral_rewards')
        .select('amount_cents')
        .eq('customer_id', customer.id)
        .eq('status', 'EARNED');

      const availableCredits = credits?.reduce((sum, credit) => sum + credit.amount_cents, 0) || 0;
      const totalRewards = referrals?.reduce((sum, ref) => sum + (ref.referral_rewards?.[0]?.amount_cents || 0), 0) || 0;

      setReferralData({
        referral_code: customer.referral_code,
        referral_link: customer.referral_link,
        total_referrals: referrals?.length || 0,
        total_rewards: totalRewards,
        available_credits: availableCredits,
        recent_referrals: referrals?.map(ref => ({
          id: ref.id,
          referred_email: maskEmail(ref.referred_email),
          status: ref.status,
          created_at: ref.created_at,
          reward_amount: ref.referral_rewards?.[0]?.amount_cents
        })) || []
      });

    } catch (error) {
      console.error('Error loading referral data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemCredits = async () => {
    if (!customerId || !referralData?.available_credits) return;

    setIsRedeeming(true);
    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('email')
        .eq('id', customerId)
        .single();

      if (!customer?.email) {
        throw new Error('Customer email not found');
      }

      const { data, error } = await supabase.functions.invoke('apply-referral-credits', {
        body: {
          customer_email: customer.email,
          max_amount_cents: referralData.available_credits
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Credits Applied! $${data.amount_redeemed.toFixed(2)} will be automatically applied to your next booking.`);
        setIsRedemptionDialogOpen(false);
        loadReferralData(); // Refresh data
      } else {
        throw new Error('Failed to apply credits');
      }
    } catch (error: any) {
      console.error('Error redeeming credits:', error);
      toast.error(error.message || "Failed to redeem credits");
    } finally {
      setIsRedeeming(false);
    }
  };

  const generateReferralCode = async () => {
    if (!customerId) return;

    try {
      const { data, error } = await supabase.functions.invoke('referral-system', {
        body: { action: 'issue', customer_id: customerId }
      });

      if (error) throw error;

      toast.success('Referral code generated and welcome email sent!');
      loadReferralData();
    } catch (error: any) {
      console.error('Error generating referral code:', error);
      toast.error('Failed to generate referral code');
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const shareViaEmail = () => {
    if (!referralData?.referral_link) return;
    
    const subject = encodeURIComponent('Get $50 off your first AlphaLuxClean service!');
    const body = encodeURIComponent(`I love using AlphaLuxClean for my house cleaning and thought you might too! 

Use my referral link to get $50 off your first cleaning:
${referralData.referral_link}

They're professional, reliable, and do an amazing job. Plus, when you book, I'll get $50 credit toward my next cleaning too!

Let me know what you think after you try them out.`);
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaSMS = () => {
    if (!referralData?.referral_link) return;
    
    const message = encodeURIComponent(`Hey! Get $50 off your first AlphaLuxClean service with my link: ${referralData.referral_link}`);
    window.open(`sms:?body=${message}`);
  };

  const maskEmail = (email: string) => {
    const [username, domain] = email.split('@');
    const maskedUsername = username.length > 2 
      ? username.substring(0, 2) + '*'.repeat(username.length - 2)
      : username;
    return `${maskedUsername}@${domain}`;
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BOOKED': return 'bg-green-500';
      case 'REWARDED': return 'bg-blue-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'REJECTED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!referralData?.referral_code) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Gift className="h-6 w-6" />
              Set Up Your Referral Program
            </CardTitle>
            <CardDescription>
              Start earning $50 for every friend you refer to AlphaLuxClean
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-6">
              <div className="text-4xl font-bold text-primary mb-2">Give $50, Get $50</div>
              <p className="text-muted-foreground">
                Your friends get $50 off their first cleaning, and you earn $50 credit for each referral
              </p>
            </div>
            <Button onClick={generateReferralCode} size="lg" className="w-full">
              Generate My Referral Code
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold">{referralData.total_referrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Rewards Earned</p>
                <p className="text-2xl font-bold">{formatCurrency(referralData.total_rewards)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Available Credits</p>
                  <p className="text-2xl font-bold">{formatCurrency(referralData.available_credits)}</p>
                </div>
              </div>
              {referralData.available_credits > 0 && (
                <Dialog open={isRedemptionDialogOpen} onOpenChange={setIsRedemptionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" size="sm" className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      Use Credits
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Apply Referral Credits</DialogTitle>
                      <DialogDescription>
                        Apply your earned referral credits to your next booking
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3 mb-2">
                          <Gift className="h-6 w-6 text-green-600" />
                          <div>
                            <p className="font-semibold text-green-900">Available Credits</p>
                            <p className="text-2xl font-bold text-green-600">
                              {formatCurrency(referralData.available_credits)}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-green-700">
                          These credits will be automatically applied to reduce your payment amount on your next booking.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium">What happens next?</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Credits will be marked as "applied" and reserved for your next booking</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>During checkout, your payment amount will be automatically reduced</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>You'll see the credits applied in your booking summary</span>
                          </li>
                        </ul>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsRedemptionDialogOpen(false)}
                          disabled={isRedeeming}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleRedeemCredits}
                          disabled={isRedeeming}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {isRedeeming ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Applying...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Apply Credits
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Your Code</p>
                <p className="text-lg font-mono font-bold">{referralData.referral_code}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code & Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Referral
          </CardTitle>
          <CardDescription>
            Share your code or link to start earning rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Your Referral Code</label>
            <div className="flex gap-2">
              <Input 
                value={referralData.referral_code} 
                readOnly 
                className="font-mono"
              />
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard(referralData.referral_code!, 'Referral code')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Your Referral Link</label>
            <div className="flex gap-2">
              <Input 
                value={referralData.referral_link} 
                readOnly 
                className="text-sm"
              />
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard(referralData.referral_link!, 'Referral link')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button onClick={shareViaEmail} variant="outline" className="flex-1">
              <Mail className="h-4 w-4 mr-2" />
              Share via Email
            </Button>
            <Button onClick={shareViaSMS} variant="outline" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              Share via SMS
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Referrals */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Referrals</CardTitle>
          <CardDescription>Track your referral activity and rewards</CardDescription>
        </CardHeader>
        <CardContent>
          {referralData.recent_referrals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No referrals yet. Start sharing your code to earn rewards!
            </div>
          ) : (
            <div className="space-y-3">
              {referralData.recent_referrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{referral.referred_email}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {referral.reward_amount && (
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(referral.reward_amount)}
                      </span>
                    )}
                    <Badge className={`${getStatusColor(referral.status)} text-white`}>
                      {referral.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};