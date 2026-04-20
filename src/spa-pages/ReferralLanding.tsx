import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Star, Shield, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ReferralLanding: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [referrer, setReferrer] = useState<{ first_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setError('Invalid referral link');
      setLoading(false);
      return;
    }

    validateReferralCode();
    logReferralVisit();
  }, [code]);

  const validateReferralCode = async () => {
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('id, first_name, referral_code')
        .eq('referral_code', code)
        .single();

      if (error || !customer) {
        setError('This referral link is not valid or has expired.');
        return;
      }

      setReferrer({ first_name: customer.first_name });
    } catch (error) {
      console.error('Error validating referral code:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logReferralVisit = async () => {
    try {
      // Get UTM parameters
      const utmParams: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        if (key.startsWith('utm_')) {
          utmParams[key] = value;
        }
      });

      await supabase
        .from('attribution_events')
        .insert({
          event: 'REFERRAL_LINK_VISITED',
          payload: {
            referral_code: code,
            utms: utmParams,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            referrer: document.referrer
          }
        });
    } catch (error) {
      console.error('Error logging referral visit:', error);
    }
  };

  const handleStartBooking = () => {
    // Set referral cookie
    document.cookie = `ref_code=${code}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax`;
    
    // Navigate to booking with referral code and UTMs
    const urlParams = new URLSearchParams(searchParams);
    urlParams.set('ref', code!);
    
    navigate(`/start?${urlParams.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invalid Referral Link</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/')} className="w-full">
              Visit AlphaLux Cleaning
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Gift className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">AlphaLux Cleaning</h1>
          <Badge variant="secondary" className="text-lg px-4 py-1">
            Exclusive Referral Offer
          </Badge>
        </div>

        {/* Main Offer Card */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-8 text-center">
            <div className="text-6xl font-bold text-primary mb-4">$25 OFF</div>
            <div className="text-xl mb-2">Your First Professional Cleaning</div>
            {referrer && (
              <div className="text-lg text-muted-foreground">
                🎉 {referrer.first_name} sent you this exclusive offer!
              </div>
            )}
          </div>
          
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <Button 
                onClick={handleStartBooking}
                size="lg" 
                className="w-full md:w-auto text-lg px-12 py-4"
              >
                Claim $25 Off - Start Booking →
              </Button>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-3">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Professional Teams</h3>
                <p className="text-sm text-muted-foreground">
                  Bonded & insured cleaners with full background checks
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-3">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Same-Day Booking</h3>
                <p className="text-sm text-muted-foreground">
                  Book in under 60 seconds, service as soon as today
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">100% Guaranteed</h3>
                <p className="text-sm text-muted-foreground">
                  Not happy? We'll make it right or refund you
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Proof */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 fill-current" />
                ))}
              </div>
              <span className="ml-2 text-lg font-semibold">4.9/5</span>
            </div>
            <blockquote className="text-center italic text-lg mb-2">
              "Best cleaning service in New York! They're always on time and do an
              incredible job. My home has never looked better."
            </blockquote>
            <p className="text-center text-muted-foreground">- Sarah M., Verified Customer</p>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">How It Works</CardTitle>
            <CardDescription className="text-center">
              Get your home professionally cleaned in just a few simple steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold mb-2">Book Online</h3>
                <p className="text-sm text-muted-foreground">
                  Choose your home size, select add-ons, and pick a time that works for you
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-semibold mb-2">We Clean</h3>
                <p className="text-sm text-muted-foreground">
                  Our professional team arrives with all supplies and gets to work
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-primary">3</span>
                </div>
                <h3 className="font-semibold mb-2">Relax</h3>
                <p className="text-sm text-muted-foreground">
                  Come home to a sparkling clean house and enjoy your free time
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            Valid for new customers only. $25 discount applied to first cleaning service.
            {referrer && (
              <> When you complete your booking, {referrer.first_name} will also receive $25 credit.</>
            )}
          </p>
          <p className="mt-2">
            Offer expires 30 days from clicking this link.
          </p>
        </div>
      </div>
    </div>
  );
};