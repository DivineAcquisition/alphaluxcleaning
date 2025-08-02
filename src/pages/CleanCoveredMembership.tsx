import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Gift, 
  Star, 
  Calendar, 
  CheckCircle, 
  MessageCircle, 
  Calculator,
  Shield,
  X,
  Check,
  Quote,
  ArrowRight,
  Phone,
  Mail,
  Loader2,
  RefreshCw
} from 'lucide-react';

const CleanCoveredMembership = () => {
  const [monthlyCleanings, setMonthlyCleanings] = useState([1]);
  const [showStickyButton, setShowStickyButton] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    subscribed: boolean;
    subscription_tier: string | null;
    subscription_end: string | null;
    loading: boolean;
  }>({ subscribed: false, subscription_tier: null, subscription_end: null, loading: true });
  const [actionLoading, setActionLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Check for URL parameters to show success/cancel messages
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast({
        title: "Welcome to Clean & Covered™!",
        description: "Your membership is now active. You'll receive your first $20 credit immediately.",
      });
      // Remove URL parameters
      window.history.replaceState({}, '', '/membership');
    } else if (urlParams.get('canceled') === 'true') {
      toast({
        title: "Membership signup canceled",
        description: "No worries! You can join anytime to start saving on your cleanings.",
        variant: "destructive"
      });
      // Remove URL parameters
      window.history.replaceState({}, '', '/membership');
    }
  }, [toast]);

  // Check subscription status when component mounts and when user changes
  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
    } else {
      setSubscriptionStatus({ subscribed: false, subscription_tier: null, subscription_end: null, loading: false });
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    if (!user) return;
    
    try {
      setSubscriptionStatus(prev => ({ ...prev, loading: true }));
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      setSubscriptionStatus({
        subscribed: data.subscribed || false,
        subscription_tier: data.subscription_tier || null,
        subscription_end: data.subscription_end || null,
        loading: false
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscriptionStatus(prev => ({ ...prev, loading: false }));
      toast({
        title: "Error checking subscription status",
        description: "Please try refreshing the page.",
        variant: "destructive"
      });
    }
  };

  const handleJoinNow = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to join the membership.",
        variant: "destructive"
      });
      return;
    }

    if (subscriptionStatus.subscribed) {
      // Already subscribed, show manage subscription
      handleManageSubscription();
      return;
    }

    try {
      setActionLoading(true);
      const { data, error } = await supabase.functions.invoke('create-membership-checkout');
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error starting membership signup",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    try {
      setActionLoading(true);
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error opening subscription management",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const membershipPerks = [
    {
      icon: <Gift className="h-8 w-8 text-primary" />,
      title: "$20 Credit Every Month",
      description: "Applied to every cleaning you book — guaranteed savings"
    },
    {
      icon: <Star className="h-8 w-8 text-primary" />,
      title: "Free Add-On Every 3rd Booking",
      description: "Fridge, microwave, or baseboard detailing — on us"
    },
    {
      icon: <Calendar className="h-8 w-8 text-primary" />,
      title: "Priority Scheduling Access",
      description: "First pick for weekends, holidays, and last-minute slots"
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-primary" />,
      title: "50% Off Deep Cleans",
      description: "Half price on 4+ hour deep cleaning services — members only"
    },
    {
      icon: <Star className="h-8 w-8 text-primary" />,
      title: "Loyalty Reward at 6 Months",
      description: "Earn a free standard cleaning or additional deep clean discount"
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-primary" />,
      title: "VIP Text Line",
      description: "Text-in reschedules, questions, or booking requests 24/7"
    }
  ];

  const calculateSavings = (cleaningsPerMonth: number) => {
    const monthlySavings = cleaningsPerMonth * 20; // $20 per cleaning
    const membershipCost = 30;
    const netSavings = monthlySavings - membershipCost;
    const annualSavings = netSavings * 12;
    return { monthlySavings, netSavings, annualSavings };
  };

  const savings = calculateSavings(monthlyCleanings[0]);

  const comparisonFeatures = [
    { feature: "Monthly Cleaning Credit", nonMember: "❌ None", member: "✅ $20/month" },
    { feature: "Add-On Perks", nonMember: "❌ Paid Extra", member: "✅ Every 3rd booking" },
    { feature: "Deep Clean Discount", nonMember: "❌ Full Price", member: "✅ 50% Off (4hr+)" },
    { feature: "Priority Booking Access", nonMember: "❌ No", member: "✅ Yes" },
    { feature: "Loyalty Bonus", nonMember: "❌ No", member: "✅ Yes" },
    { feature: "VIP Text Support", nonMember: "❌ Standard", member: "✅ Direct Line" }
  ];

  const faqs = [
    {
      question: "Can I cancel anytime?",
      answer: "Yes, it's month-to-month with no long-term commitment. You can cancel anytime."
    },
    {
      question: "Does my credit roll over?",
      answer: "Yes, your $20 monthly credit rolls over for up to 1 month if unused."
    },
    {
      question: "Do I need to be a member to book cleanings?",
      answer: "No, but members save more and get exclusive perks like priority scheduling."
    },
    {
      question: "What if I skip a month?",
      answer: "Your credit rolls over once, so you won't lose it if you skip a month."
    },
    {
      question: "How do I use my VIP text line?",
      answer: "Once you're a member, we'll provide you with a dedicated number for instant support."
    }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      location: "San Francisco",
      text: "The membership has saved me so much time and money. Priority booking means I always get my preferred weekend slots!"
    },
    {
      name: "Mike R.",
      location: "Oakland",
      text: "The VIP text line is a game changer. I can reschedule in seconds without calling anyone."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Navigation />
      
      {/* Sticky CTA Button for Mobile */}
      {showStickyButton && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
          <Button 
            onClick={handleJoinNow}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 text-lg shadow-lg"
          >
            Join Now – Only $30/month
          </Button>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        {/* Subscription Status Bar */}
        {user && !subscriptionStatus.loading && (
          <div className="mb-8 max-w-4xl mx-auto">
            <Card className={`${subscriptionStatus.subscribed ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {subscriptionStatus.subscribed ? (
                      <>
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        <div>
                          <p className="font-semibold text-green-800">Active Member</p>
                          <p className="text-sm text-green-700">
                            {subscriptionStatus.subscription_end && `Renews ${new Date(subscriptionStatus.subscription_end).toLocaleDateString()}`}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Shield className="h-6 w-6 text-blue-600" />
                        <div>
                          <p className="font-semibold text-blue-800">Not a Member</p>
                          <p className="text-sm text-blue-700">Join today to start saving!</p>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={checkSubscriptionStatus}
                      disabled={subscriptionStatus.loading}
                    >
                      <RefreshCw className={`h-4 w-4 ${subscriptionStatus.loading ? 'animate-spin' : ''}`} />
                    </Button>
                     {subscriptionStatus.subscribed && (
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={handleManageSubscription}
                         disabled={actionLoading}
                       >
                         {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage Billing"}
                       </Button>
                     )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Hero Section */}
        <section className="text-center py-16 md:py-24">
          <div className="max-w-4xl mx-auto space-y-8">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              Clean & Covered™ Membership
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
              {subscriptionStatus.subscribed ? (
                <>Welcome Back, <span className="text-primary">Member!</span></>
              ) : (
                <>Never Worry About Your Next Clean — <span className="text-primary"> You're Covered.</span></>
              )}
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              {subscriptionStatus.subscribed ? (
                "Enjoy your exclusive member benefits and $20 monthly cleaning credit."
              ) : (
                "Join Clean & Covered™ for just $30/month and unlock exclusive perks, savings, and peace of mind."
              )}
            </p>
            
            <div className="space-y-4">
              <Button 
                onClick={handleJoinNow}
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-6 text-xl"
                disabled={actionLoading || subscriptionStatus.loading}
              >
                {actionLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {subscriptionStatus.subscribed ? (
                  "Manage Membership"
                ) : (
                  user ? "Join Now – Only $30/month" : "Sign In to Join – $30/month"
                )}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <p className="text-sm text-gray-500">
                Cancel anytime. Save every time.
              </p>
            </div>
          </div>
        </section>

        {/* Membership Perks Section */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Exclusive Member Benefits
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need for a hassle-free cleaning experience
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {membershipPerks.map((perk, index) => (
                <Card key={index} className="border-2 hover:border-primary/30 transition-all duration-200 hover:shadow-lg">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="flex justify-center">
                      {perk.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {perk.title}
                    </h3>
                    <p className="text-gray-600">
                      {perk.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Savings Calculator */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-blue-50">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <Calculator className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    See How Much You Save as a Member
                  </h2>
                </div>
                
                <div className="space-y-8">
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-4">
                      How many cleanings per month? {monthlyCleanings[0]}
                    </label>
                    <Slider
                      value={monthlyCleanings}
                      onValueChange={setMonthlyCleanings}
                      max={4}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4+</span>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-600">Monthly Savings</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${savings.monthlySavings}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Net Monthly Benefit</p>
                        <p className="text-2xl font-bold text-primary">
                          ${savings.netSavings > 0 ? '+' : ''}${savings.netSavings}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Annual Savings</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${savings.annualSavings > 0 ? '+' : ''}${savings.annualSavings}
                        </p>
                      </div>
                    </div>
                    
                    {savings.netSavings > 0 && (
                      <div className="text-center">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          You save ${Math.abs(savings.annualSavings)}/year with {monthlyCleanings[0]} clean{monthlyCleanings[0] > 1 ? 's' : ''}/month!
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Member vs Non-Member
              </h2>
              <p className="text-xl text-gray-600">
                See what you get with Clean & Covered™
              </p>
            </div>
            
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-lg font-semibold text-gray-900">
                        Feature
                      </th>
                      <th className="px-6 py-4 text-center text-lg font-semibold text-gray-900">
                        Non-Member
                      </th>
                      <th className="px-6 py-4 text-center text-lg font-semibold text-primary bg-primary/5">
                        Clean & Covered™ Member
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {comparisonFeatures.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {item.feature}
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600">
                          {item.nonMember}
                        </td>
                        <td className="px-6 py-4 text-center text-primary font-medium bg-primary/5">
                          {item.member}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
            </div>
            
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                What Our Members Say
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-primary/20">
                  <CardContent className="p-6">
                    <Quote className="h-8 w-8 text-primary mb-4" />
                    <p className="text-gray-700 mb-4 italic">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {testimonial.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{testimonial.name}</p>
                        <p className="text-sm text-gray-600">{testimonial.location}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Shield className="h-6 w-6" />
                <span className="font-semibold">100% Satisfaction Guarantee</span>
              </div>
              <p className="text-gray-600 mt-2">
                Not happy? Get your money back, no questions asked.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-blue-50">
              <CardContent className="p-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Join Today and Save on Every Clean
                </h2>
                
                <div className="space-y-6">
                  <Button 
                    onClick={handleJoinNow}
                    size="lg" 
                    className="bg-primary hover:bg-primary/90 text-white font-semibold px-12 py-6 text-xl"
                  >
                    Become a Member – $30/Month
                    <ArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                  
                  <p className="text-lg text-gray-600">
                    Cancel anytime. Save every time.
                  </p>
                  
                  <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>VIP Support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>No Contract</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>Money Back Guarantee</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CleanCoveredMembership;