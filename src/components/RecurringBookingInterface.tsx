import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculatePaymentAmount, formatPriceFromCents } from '@/lib/pricing-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, Clock, Users, Star, Shield, CreditCard, RotateCcw, FileText, Home, Sparkles, ArrowRight, Building, Bed, Bath, User, Mail, Phone, Check, Tag, Lock, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProgressIndicator } from '@/components/booking/ProgressIndicator';
import { PriceSummaryCard } from '@/components/booking/PriceSummaryCard';
import { ServiceDetailsDialog } from '@/components/ServiceDetailsDialog';
import { ReferralCodeDialog } from '@/components/ReferralCodeDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { stripePromise } from '@/lib/stripe';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BookingTier {
  id: string;
  hours: number;
  basePrice: number;
  description: string;
  shortDescription: string;
  cleaners: number;
  icon: string;
  popular: boolean;
  bestFor: string;
  includes: string[];
}

interface AddOnService {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface RecurringOption {
  id: string;
  name: string;
  frequency: string;
  discount: number;
  description: string;
}

interface PaymentData {
  amount: number;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  cleaningType?: string;
  frequency?: string;
  squareFootage?: number;
  addOns?: string[];
  bedrooms?: number;
  bathrooms?: number;
  serviceAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  paymentType?: string;
}

interface RecurringBookingInterfaceProps {
  onBookingUpdate?: (data: any) => void;
  onPaymentRequest?: (data: PaymentData) => void;
  existingMember?: boolean;
  newClient?: boolean;
}

const bookingTiers: BookingTier[] = [
  {
    id: 'general',
    hours: 2,
    basePrice: 220,
    description: 'General Cleaning',
    shortDescription: 'Perfect for regular maintenance with 15% off one-time service',
    cleaners: 2,
    icon: 'home',
    popular: false,
    bestFor: 'Weekly maintained homes',
    includes: [
      'All surfaces dusted and wiped',
      'Floors vacuumed and mopped', 
      'Bathrooms deep cleaned',
      'Kitchen cleaned and sanitized'
    ]
  },
  {
    id: 'complete',
    hours: 4,
    basePrice: 420,
    description: 'Deep Clean',
    shortDescription: 'Our most popular comprehensive service with 15% off one-time service',
    cleaners: 2,
    icon: 'star',
    popular: true,
    bestFor: 'Most homes every 2-4 weeks',
    includes: [
      'All surfaces dusted and wiped',
      'Floors vacuumed and mopped', 
      'Bathrooms deep cleaned',
      'Kitchen cleaned and sanitized',
      'Inside appliances cleaned',
      'Detailed bathroom sanitization',
      'Light fixture dusting',
      'Window sill cleaning'
    ]
  },
  {
    id: 'premium',
    hours: 6,
    basePrice: 500,
    description: 'Premium Deep Clean',
    shortDescription: 'Complete top-to-bottom transformation - premium pricing',
    cleaners: 3,
    icon: 'sparkles',
    popular: false,
    bestFor: 'Move-ins, special occasions, deep refresh',
    includes: [
      'Everything in Signature Clean',
      'Baseboards hand-wiped',
      'Cabinet fronts detailed',
      'Light switch plates cleaned',
      'Door frames and trim detailed',
      'Extra attention to problem areas'
    ]
  }
];

const addOnServices: AddOnService[] = [
  { id: 'fridge', name: 'Inside Refrigerator', price: 35, description: 'Clean and organize inside refrigerator' },
  { id: 'oven', name: 'Inside Oven', price: 35, description: 'Deep clean inside oven' },
  { id: 'baseboards', name: 'Whole Home Baseboards', price: 50, description: 'Hand-wipe all baseboards' },
  { id: 'cabinet-fronts', name: 'Cabinet Front Cleaning', price: 50, description: 'Clean all kitchen cabinet fronts' },
  { id: 'blinds', name: 'Detailed Blind Cleaning', price: 15, description: 'Per blind detailed cleaning' },
  { id: 'wall-washing', name: 'Wall Washing', price: 25, description: 'Per room wall washing' },
  { id: 'laundry', name: 'Extra Laundry Folding', price: 20, description: 'Per basket laundry folding' },
  { id: 'garage', name: 'Garage Sweeping', price: 30, description: 'Complete garage sweep' },
];

const recurringOptions: RecurringOption[] = [
  {
    id: 'one-time',
    name: 'One-Time Clean',
    frequency: 'once',
    discount: 0,
    description: 'Single cleaning service'
  },
  {
    id: 'weekly',
    name: 'Weekly',
    frequency: 'weekly',
    discount: 10,
    description: 'Every week - Maximum savings!'
  },
  {
    id: 'bi-weekly',
    name: 'Bi-Weekly',
    frequency: 'bi-weekly',
    discount: 7,
    description: 'Every 2 weeks - Great value'
  },
  {
    id: 'monthly',
    name: 'Monthly',
    frequency: 'monthly',
    discount: 5,
    description: 'Once a month - Convenient'
  }
];

const membershipPerks = [
  { icon: <CreditCard className="h-4 w-4" />, text: '$20 off every clean' },
  { icon: <Star className="h-4 w-4" />, text: 'Free add-ons every 3rd visit' },
  { icon: <CheckCircle className="h-4 w-4" />, text: 'Priority scheduling' },
  { icon: <RotateCcw className="h-4 w-4" />, text: 'Loyalty perks & rewards' }
];

// Original square footage pricing tiers from PricingCalculator
const squareFootageTiers = [
  { min: 0, max: 1000, label: "Under 1,000 sq ft" },
  { min: 1001, max: 1400, label: "1,001 - 1,400 sq ft" },
  { min: 1401, max: 1800, label: "1,401 - 1,800 sq ft" },
  { min: 1801, max: 2400, label: "1,801 - 2,400 sq ft" },
  { min: 2401, max: 2800, label: "2,401 - 2,800 sq ft" },
  { min: 2801, max: 3300, label: "2,801 - 3,300 sq ft" },
  { min: 3301, max: 3900, label: "3,301 - 3,900 sq ft" },
  { min: 3901, max: 4500, label: "3,901 - 4,500 sq ft" },
  { min: 4501, max: 5100, label: "4,501 - 5,100 sq ft" }
];

// Embedded Payment Form Component
interface EmbeddedPaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

function EmbeddedPaymentForm({ amount, onSuccess, onCancel }: EmbeddedPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isElementReady, setIsElementReady] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  console.log('PaymentElement Status:', { stripe: !!stripe, elements: !!elements, isElementReady });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
    });

    if (error) {
      console.error('Payment confirmation error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during payment processing.",
        variant: "destructive"
      });
    } else {
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h5 className="font-semibold">Payment Amount</h5>
          <p className="text-2xl font-bold text-green-600">${amount}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Secured by Stripe</span>
        </div>
      </div>

      <PaymentElement 
        onReady={() => {
          console.log('PaymentElement is ready!');
          setIsElementReady(true);
          setPaymentError(null);
        }}
        onLoadError={(errorEvent) => {
          console.error('PaymentElement load error:', errorEvent);
          const errorMessage = errorEvent.error?.message || 'Payment form failed to load';
          setPaymentError(errorMessage);
          toast({
            title: "Payment Form Error",
            description: "Unable to load payment form. Please refresh and try again.",
            variant: "destructive"
          });
        }}
        options={{
          layout: 'tabs'
        }}
      />
      
      {paymentError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Payment Form Error:</span>
          </div>
          <p className="text-sm text-red-600 mt-1">{paymentError}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>
      )}
      
      {!isElementReady && !paymentError && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading secure payment form...</span>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !stripe || !elements || !isElementReady}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Pay ${amount}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export const RecurringBookingInterface: React.FC<RecurringBookingInterfaceProps> = ({
  onBookingUpdate,
  onPaymentRequest,
  existingMember = false,
  newClient = false
}) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Debug customer info
  console.log('🔍 RecurringBookingInterface Debug:', {
    onPaymentRequest: !!onPaymentRequest,
    existingMember,
    newClient
  });
  const [selectedTier, setSelectedTier] = useState<string>(''); // No default selection
  const [selectedRecurring, setSelectedRecurring] = useState<string>('one-time'); // Default to one-time for discounts
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [addMembership, setAddMembership] = useState<boolean>(false);
  const [termsAgreed, setTermsAgreed] = useState<boolean>(false);
  
  // Home details state - using original square footage ranges
  const [squareFootage, setSquareFootage] = useState<number>(1000);
  const [bedrooms, setBedrooms] = useState<string>('');
  const [bathrooms, setBathrooms] = useState<string>('');
  
  // Payment flow state
  const [showPaymentOptions, setShowPaymentOptions] = useState<boolean>(false);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<string>('pay_after_service');
  const [showCompleteBooking, setShowCompleteBooking] = useState<boolean>(false);
  
  // Customer information state
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: ""
  });
  
  // Payment type state
  const [paymentType, setPaymentType] = useState<string>('pay_after_service');
  const [referralCode, setReferralCode] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedReferral, setAppliedReferral] = useState<any>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  
  // Stripe payment state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const selectedTierData = selectedTier ? bookingTiers.find(tier => tier.id === selectedTier) : null;
  const selectedRecurringData = selectedRecurring ? recurringOptions.find(opt => opt.id === selectedRecurring) : null;

  const calculatePricing = () => {
    console.log('Calculating pricing with:', {
      selectedTier,
      selectedRecurring,
      selectedTierData,
      selectedRecurringData
    });
    
    if (!selectedTierData) {
      return {
        basePrice: 0,
        addOnsTotal: 0,
        subtotal: 0,
        recurringDiscount: 0,
        membershipDiscount: 0,
        addonMemberDiscount: 0,
        total: 0,
        membershipFee: 0
      };
    }

    let basePrice = selectedTierData.basePrice;
    console.log('Original base price:', basePrice);
    
    // Apply one-time service discounts
    if (selectedRecurringData && selectedRecurringData.frequency === 'once') {
      console.log('Applying one-time discount for:', selectedTier);
      if (selectedTier === 'general' || selectedTier === 'complete') {
        // General and Deep Clean get 15% discount for one-time service
        basePrice = Math.round(basePrice * 0.85);
        console.log('Applied 15% discount, new price:', basePrice);
      } else if (selectedTier === 'premium') {
        // Premium Deep Clean gets 20% discount for one-time service
        basePrice = Math.round(basePrice * 0.80);
        console.log('Applied 20% discount, new price:', basePrice);
      }
    }
    
    // Apply new client special for Complete Clean
    if (newClient && selectedTier === 'complete') {
      basePrice = 349;
    }
    
    // Calculate addon total with member discount
    const addOnsTotal = selectedAddOns.reduce((total, addOnId) => {
      const addOn = addOnServices.find(service => service.id === addOnId);
      const addOnPrice = addOn?.price || 0;
      // Apply 10% discount for existing members or new membership signups
      const discountedPrice = (existingMember || addMembership) ? addOnPrice * 0.9 : addOnPrice;
      return total + discountedPrice;
    }, 0);
    
    const addonMemberDiscount = selectedAddOns.length > 0 && (existingMember || addMembership) 
      ? selectedAddOns.reduce((total, addOnId) => {
          const addOn = addOnServices.find(service => service.id === addOnId);
          return total + ((addOn?.price || 0) * 0.1);
        }, 0)
      : 0;
    
    const subtotal = basePrice + addOnsTotal;
    const recurringDiscount = selectedRecurringData ? Math.round(subtotal * (selectedRecurringData.discount / 100)) : 0;
    const membershipDiscount = (existingMember || addMembership) ? 20 : 0;
    
    const total = subtotal - recurringDiscount - membershipDiscount;
    const membershipFee = addMembership ? 39 : 0;

    // Apply referral discount (10% off)
    let referralDiscount = 0;
    if (appliedReferral) {
      referralDiscount = (subtotal - recurringDiscount - membershipDiscount) * 0.10;
    }

    // Apply discount code (50% off for FRIEND50 codes)
    let codeDiscount = 0;
    if (appliedDiscount && appliedDiscount.type === 'deep_clean_50_percent') {
      codeDiscount = (subtotal - recurringDiscount - membershipDiscount - referralDiscount) * 0.50;
    }

    const finalTotal = subtotal - recurringDiscount - membershipDiscount - referralDiscount - codeDiscount;

    return {
      basePrice,
      addOnsTotal,
      subtotal,
      recurringDiscount,
      membershipDiscount,
      addonMemberDiscount,
      referralDiscount,
      codeDiscount,
      total: Math.max(0, finalTotal),
      membershipFee
    };
    
    console.log('Final pricing result:', {
      basePrice,
      addOnsTotal,
      subtotal,
      total: Math.max(0, finalTotal)
    });
    
    return {
      basePrice,
      addOnsTotal,
      subtotal,
      recurringDiscount,
      membershipDiscount,
      addonMemberDiscount,
      referralDiscount,
      codeDiscount,
      total: Math.max(0, finalTotal),
      membershipFee
    };
  };

  const pricing = calculatePricing();
  
  // Force calculation on component mount and selection changes
  useEffect(() => {
    console.log('Selection changed - triggering calculation');
    calculatePricing();
  }, [selectedTier, selectedRecurring, selectedAddOns, addMembership]);

  const handleAddOnToggle = (addOnId: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addOnId) 
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const handleSubmitSelection = () => {
    setShowPaymentOptions(true);
    // Scroll to payment options
    setTimeout(() => {
      document.getElementById('payment-options')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleApplyReferralCode = async () => {
    console.log("handleApplyReferralCode called");
    if (!referralCode.trim()) {
      toast({
        title: "Missing Code",
        description: "Please enter a referral code",
        variant: "destructive"
      });
      return;
    }
    if (!customerInfo.email || !customerInfo.name) {
      toast({
        title: "Missing Information", 
        description: "Please fill in your name and email first",
        variant: "destructive"
      });
      return;
    }
    try {
      const { data, error } = await supabase.rpc('validate_and_use_referral_code', {
        p_code: referralCode.trim(),
        p_user_email: customerInfo.email,
        p_user_name: customerInfo.name,
        p_order_id: null
      });
      if (error) throw error;
      const result = data as any;
      if (result?.success) {
        setAppliedReferral(result);
        toast({
          title: "Success!",
          description: "Referral code applied! You get 10% off your service."
        });
      } else {
        toast({
          title: "Invalid Code",
          description: "The referral code you entered is not valid",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error applying referral code:", error);
      toast({
        title: "Error",
        description: "Failed to apply referral code. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Real-time referral code validation
  const handleReferralCodeChange = async (value: string) => {
    setReferralCode(value);
    
    // Clear existing referral if input is empty
    if (!value.trim()) {
      setAppliedReferral(null);
      return;
    }
    
    // Auto-validate if we have customer info and a code
    if (value.trim().length >= 3 && customerInfo.email && customerInfo.name) {
      try {
        const { data, error } = await supabase.rpc('validate_and_use_referral_code', {
          p_code: value.trim(),
          p_user_email: customerInfo.email,
          p_user_name: customerInfo.name,
          p_order_id: null
        });
        if (error) throw error;
        const result = data as any;
        if (result?.success) {
          setAppliedReferral(result);
        } else {
          setAppliedReferral(null);
        }
      } catch (error) {
        console.error("Error validating referral code:", error);
        setAppliedReferral(null);
      }
    }
  };

  const handleApplyDiscountCode = async () => {
    if (!discountCode.trim()) {
      toast({
        title: "Missing Code",
        description: "Please enter a discount code",
        variant: "destructive"
      });
      return;
    }
    if (discountCode.startsWith('FRIEND50')) {
      if (appliedReferral) {
        toast({
          title: "Cannot Combine",
          description: "Cannot combine discount codes with referral codes",
          variant: "destructive"
        });
        return;
      }
      setAppliedDiscount({
        code: discountCode,
        type: 'deep_clean_50_percent',
        description: '50% off deep cleaning service'
      });
      toast({
        title: "Success!",
        description: "Discount code applied! 50% off your deep cleaning service."
      });
    } else {
      toast({
        title: "Invalid Code",
        description: "The discount code you entered is not valid",
        variant: "destructive"
      });
    }
  };

  // Real-time discount code validation
  const handleDiscountCodeChange = (value: string) => {
    setDiscountCode(value);
    
    if (!value.trim()) {
      setAppliedDiscount(null);
      return;
    }
    
    if (value.startsWith('FRIEND50') && !appliedReferral) {
      setAppliedDiscount({
        code: value,
        type: 'deep_clean_50_percent',
        description: '50% off deep cleaning service'
      });
    } else {
      setAppliedDiscount(null);
    }
  };

  // Create payment intent when ready to book
  const initializePayment = async () => {
    setPaymentLoading(true);
    try {
      // Calculate the correct payment amount based on selected payment option
      const actualPaymentAmount = calculatePaymentAmount(pricing.total, selectedPaymentOption as any);
      
      const paymentData = {
        amount: actualPaymentAmount,
        customerEmail: customerInfo.email,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        cleaningType: selectedTierData?.description || 'General Cleaning',
        frequency: selectedRecurringData?.frequency || 'once',
        squareFootage: squareFootage,
        addOns: selectedAddOns,
        bedrooms: Number(bedrooms) || 0,
        bathrooms: Number(bathrooms) || 0,
        serviceAddress: customerInfo.address,
        city: customerInfo.city,
        state: customerInfo.state,
        zipCode: customerInfo.zipCode,
        paymentType: selectedPaymentOption
      };

      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: paymentData
      });

      if (error) throw error;

      if (data?.client_secret) {
        setClientSecret(data.client_secret);
        setShowPaymentForm(true);
      } else {
        throw new Error('No client secret received');
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentOptionSelect = (option: string) => {
    setSelectedPaymentOption(option);
    setShowCompleteBooking(true);
    // Scroll to complete booking section
    setTimeout(() => {
      document.getElementById('complete-booking')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCompleteBooking = async () => {
    // Validate customer information
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all customer information fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Prepare booking data for payment
      const bookingData = {
        tier: selectedTierData,
        recurring: selectedRecurringData,
        addOns: selectedAddOns.map(id => addOnServices.find(service => service.id === id)),
        membership: addMembership,
        homeDetails: {
          squareFootage,
          bedrooms,
          bathrooms
        },
        paymentOption: selectedPaymentOption,
        pricing,
        termsAgreed
      };
      
      // Update parent component
      if (onBookingUpdate) {
        onBookingUpdate(bookingData);
      }

      // Determine which payment function to use
      const functionName = addMembership ? 'create-membership-checkout' : 'create-payment';
      
      let response;
      
      if (addMembership) {
        // For membership checkout, use the membership function
        response = await supabase.functions.invoke(functionName, {
          body: { 
            bookingData,
            customerInfo: {
              email: customerInfo.email,
              name: customerInfo.name,
              phone: customerInfo.phone
            }
          }
        });
      } else {
        // For regular checkout, format data for the create-payment function
        const paymentData = {
          amount: calculatePaymentAmount(pricing.total, selectedPaymentOption as any),
          payment_method: 'payment_intent', // Request Payment Intent for embedded payments
          paymentType: selectedPaymentOption,
          customerEmail: customerInfo.email,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          cleaningType: selectedTier,
          frequency: selectedRecurring,
          squareFootage: squareFootage,
          addOns: selectedAddOns,
          bedrooms: parseInt(bedrooms) || undefined,
          bathrooms: parseInt(bathrooms) || undefined,
          membershipStatus: existingMember,
          addonMemberDiscount: pricing.addonMemberDiscount
        };
        
        response = await supabase.functions.invoke(functionName, {
          body: paymentData
        });
      }
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      // Handle different response types based on payment method
      if (response.data?.url) {
        // Legacy checkout session - open in new tab
        window.open(response.data.url, '_blank');
      } else if (response.data?.client_secret) {
        // Payment Intent for embedded payment - pass to parent component
        const enhancedBookingData = {
          ...bookingData,
          clientSecret: response.data.client_secret,
          paymentIntentId: response.data.payment_intent_id,
          customerInfo
        };
        
        if (onBookingUpdate) {
          onBookingUpdate(enhancedBookingData);
        }
      } else {
        throw new Error('No valid payment response received');
      }
      
    } catch (error) {
      console.error('Error creating payment session:', error);
      toast({
        title: "Payment Error",
        description: "There was an error processing your request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const steps = [
    { id: 1, title: 'Service', description: 'Choose your service' },
    { id: 2, title: 'Details', description: 'Date & address' },
    { id: 3, title: 'Payment', description: 'Review & pay' },
    { id: 4, title: 'Confirmation', description: 'Complete' }
  ];

  console.log("RecurringBookingInterface rendering, handleApplyReferralCode exists:", typeof handleApplyReferralCode);
  
  return (
    <div className="w-full">
      {/* Progress Indicator */}
      <ProgressIndicator currentStep={1} steps={steps} />
      
      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Form (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Step 1: BACP Club Membership */}
          {!existingMember && (
            <Card className="border-primary/30 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Star className="h-5 w-5" />
                  🌟 BACP Club™ Membership
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Join today and save $20 on every cleaning service
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <div className="font-semibold text-base sm:text-lg">BACP Club™ Membership</div>
                    <div className="text-sm text-muted-foreground">$39/month • Cancel anytime</div>
                  </div>
                  <div className="flex items-center gap-3 justify-end">
                    <Switch 
                      checked={addMembership} 
                      onCheckedChange={(checked) => setAddMembership(checked)} 
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>

                {addMembership && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="col-span-full mb-3">
                      <h4 className="font-semibold text-primary mb-2">Your Membership Benefits:</h4>
                    </div>
                    {membershipPerks.map((perk, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <span className="text-primary bg-primary/10 p-1 rounded">{perk.icon}</span>
                        <span className="font-medium">{perk.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {!addMembership && (
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Turn on membership to see all the amazing benefits and start saving $20 on every clean!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {existingMember && (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">BACP Club™ Member</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 ml-auto">
                    Active
                  </Badge>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Your $20 membership discount has been applied to this booking!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Service Selection */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Home className="h-5 w-5" />
                Choose Your Service
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                All services include professional cleaners and quality supplies
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <RadioGroup value={selectedTier} onValueChange={setSelectedTier}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  {bookingTiers.map((tier) => (
                    <Label key={tier.id} htmlFor={tier.id} className="cursor-pointer w-full">
                      <Card className={`w-full h-full transition-all duration-300 hover:shadow-lg ${
                        selectedTier === tier.id 
                          ? 'ring-2 ring-primary border-primary shadow-lg bg-primary/5' 
                          : 'hover:border-primary/30 hover:shadow-md'
                      } ${tier.popular ? 'ring-1 ring-yellow-400/50' : ''}`}>
                        <CardContent className="p-4 h-full flex flex-col">
                          {/* Header with Radio and Icon */}
                          <div className="flex items-start gap-3 mb-4">
                            <RadioGroupItem value={tier.id} id={tier.id} className="mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {tier.icon === 'home' && <Home className="h-5 w-5 text-blue-600" />}
                                {tier.icon === 'star' && <Star className="h-5 w-5 text-yellow-500" />}
                                {tier.icon === 'sparkles' && <Sparkles className="h-5 w-5 text-purple-600" />}
                                <span className="font-bold text-lg leading-tight">{tier.description}</span>
                              </div>
                              {tier.popular && (
                                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 text-xs mb-2">
                                  Most Popular
                                </Badge>
                              )}
                              <p className="text-xs text-muted-foreground">{tier.shortDescription}</p>
                            </div>
                          </div>

                          {/* Hours and Cleaners */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {tier.hours}h
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {tier.cleaners} cleaners
                            </span>
                          </div>

                          {/* Best For */}
                          <div className="mb-3">
                            <p className="text-xs font-medium text-primary mb-2">Best for: {tier.bestFor}</p>
                          </div>

                          {/* Pricing */}
                          <div className="mt-4 pt-3 border-t">
                            <div className="text-right">
                              <div className="text-xl font-bold text-primary">
                                {newClient && tier.id === 'complete' ? (
                                  <div>
                                    <span className="line-through text-muted-foreground text-sm mr-2">${tier.basePrice}</span>
                                    <span>$349</span>
                                    <div className="text-xs font-normal text-green-600 mt-1">New Client Special!</div>
                                  </div>
                                ) : (existingMember || addMembership) ? (
                                  <div>
                                    <span className="line-through text-muted-foreground text-sm mr-2">${tier.basePrice}</span>
                                    <span>${tier.basePrice - 20}</span>
                                    <div className="text-xs font-normal text-green-600 mt-1">Member Price</div>
                                  </div>
                                ) : selectedRecurring === 'one-time' ? (
                                  <div>
                                    <div className="flex items-center justify-end gap-2 mb-1">
                                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                        {tier.id === 'premium' ? '20% off' : '15% off'}
                                      </Badge>
                                    </div>
                                    <div>
                                      <span className="line-through text-muted-foreground text-sm mr-2">${tier.basePrice}</span>
                                      <span>${tier.id === 'premium' ? Math.round(tier.basePrice * 0.8) : Math.round(tier.basePrice * 0.85)}</span>
                                    </div>
                                    <div className="text-xs font-normal text-green-600 mt-1">
                                      One-Time Discount!
                                    </div>
                                  </div>
                                ) : (
                                  `$${tier.basePrice}`
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Label>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Frequency Selection */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-accent/5 to-accent/10">
              <CardTitle className="flex items-center gap-2 text-accent">
                <RotateCcw className="h-5 w-5" />
                Service Frequency
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose how often you'd like service (recurring saves more!)
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <RadioGroup value={selectedRecurring} onValueChange={setSelectedRecurring}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recurringOptions.map((option) => (
                    <Label key={option.id} htmlFor={option.id} className="cursor-pointer">
                      <Card className={`transition-all duration-300 hover:shadow-md ${
                        selectedRecurring === option.id 
                          ? 'ring-2 ring-accent border-accent shadow-md bg-accent/5' 
                          : 'hover:border-accent/30'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value={option.id} id={option.id} />
                              <div>
                                <div className="font-semibold">{option.name}</div>
                                <div className="text-sm text-muted-foreground">{option.description}</div>
                              </div>
                            </div>
                            {option.discount > 0 && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Save {option.discount}%
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Label>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Home Details */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Building className="h-5 w-5" />
                Home Details
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Tell us about your space to ensure accurate pricing
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="square-footage" className="text-sm font-medium">Square Footage</Label>
                  <Select value={squareFootage.toString()} onValueChange={(value) => setSquareFootage(parseInt(value))}>
                    <SelectTrigger id="square-footage">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {squareFootageTiers.map((tier, index) => (
                        <SelectItem key={index} value={Math.floor((tier.min + tier.max) / 2).toString()}>
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            {tier.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bedrooms" className="text-sm font-medium flex items-center gap-1">
                    <Bed className="h-4 w-4" />
                    Bedrooms
                  </Label>
                  <Select value={bedrooms} onValueChange={setBedrooms}>
                    <SelectTrigger id="bedrooms">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Bedroom</SelectItem>
                      <SelectItem value="2">2 Bedrooms</SelectItem>
                      <SelectItem value="3">3 Bedrooms</SelectItem>
                      <SelectItem value="4">4 Bedrooms</SelectItem>
                      <SelectItem value="5">5 Bedrooms</SelectItem>
                      <SelectItem value="6+">6+ Bedrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bathrooms" className="text-sm font-medium flex items-center gap-1">
                    <Bath className="h-4 w-4" />
                    Bathrooms
                  </Label>
                  <Select value={bathrooms} onValueChange={setBathrooms}>
                    <SelectTrigger id="bathrooms">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Bathroom</SelectItem>
                      <SelectItem value="1.5">1.5 Bathrooms</SelectItem>
                      <SelectItem value="2">2 Bathrooms</SelectItem>
                      <SelectItem value="2.5">2.5 Bathrooms</SelectItem>
                      <SelectItem value="3">3 Bathrooms</SelectItem>
                      <SelectItem value="3.5">3.5 Bathrooms</SelectItem>
                      <SelectItem value="4+">4+ Bathrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add-ons */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-secondary/5 to-secondary/10">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Optional Add-ons
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Enhance your cleaning with these popular extras
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {addOnServices.map((addOn) => (
                  <Label key={addOn.id} htmlFor={addOn.id} className="cursor-pointer w-full">
                    <div className={`w-full transition-all duration-300 hover:shadow-sm border rounded-lg p-4 ${
                      selectedAddOns.includes(addOn.id) 
                        ? 'ring-2 ring-primary border-primary shadow-md bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}>
                      <div className="flex items-center justify-between h-full">
                        <div className="flex items-center space-x-3">
                          <Checkbox 
                            id={addOn.id}
                            checked={selectedAddOns.includes(addOn.id)}
                            onCheckedChange={(checked) => handleAddOnToggle(addOn.id)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <div>
                            <div className="font-semibold">{addOn.name}</div>
                            <div className="text-sm text-muted-foreground">{addOn.description}</div>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-primary">
                          {(existingMember || addMembership) ? (
                            <div className="text-right">
                              <span className="line-through text-muted-foreground text-sm mr-2">${addOn.price}</span>
                              <span>${Math.round(addOn.price * 0.9)}</span>
                              <div className="text-xs text-green-600">Member price</div>
                            </div>
                          ) : (
                            `$${addOn.price}`
                          )}
                        </div>
                      </div>
                    </div>
                  </Label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Terms Agreement */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="terms"
                    checked={termsAgreed}
                    onCheckedChange={(checked) => setTermsAgreed(checked as boolean)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                    I agree to the Terms of Service and understand that this booking is time-based service.
                  </Label>
                </div>

                <Button 
                  onClick={handleSubmitSelection}
                  disabled={!termsAgreed || squareFootage === 0 || !bedrooms || !bathrooms}
                  size="lg"
                  className="w-full flex items-center gap-2"
                >
                  Submit Selection & Scroll Down
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Options */}
          {showPaymentOptions && (
            <Card id="payment-options" className="border-2 border-primary/30 shadow-xl bg-gradient-to-r from-primary/5 to-accent/5">
              <CardHeader className="bg-gradient-to-r from-primary to-accent text-white">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Choose Your Payment Option
                </CardTitle>
                <p className="text-primary-foreground/80 text-sm">
                  Select how you'd like to pay for your service
                </p>
              </CardHeader>
               <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card 
                    className={`cursor-pointer border-2 transition-all duration-200 hover:shadow-lg ${
                      selectedPaymentOption === 'pay_after_service' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handlePaymentOptionSelect('pay_after_service')}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="p-3 rounded-full bg-blue-100">
                          <Shield className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Pay After Service</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            We'll securely save your card and charge after completion
                          </p>
                        </div>
                        <div className="w-full p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 text-blue-700 text-sm">
                            <Lock className="h-4 w-4" />
                            <span className="font-medium">Card authorization only</span>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">
                            No charge until service is complete
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer border-2 transition-all duration-200 hover:shadow-lg ${
                      selectedPaymentOption === '25_percent_with_discount' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-border hover:border-green-500/50'
                    }`}
                    onClick={() => handlePaymentOptionSelect('25_percent_with_discount')}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="p-3 rounded-full bg-green-100">
                          <Tag className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-green-700">Pay 25% Now + Get 5% Discount</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Save money by paying a portion upfront
                          </p>
                        </div>
                        <div className="w-full space-y-2">
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-green-700 text-sm font-medium">
                              Pay Now: ${Math.round(pricing.total * 0.25)}
                            </div>
                            <div className="text-green-600 text-xs">
                              Remaining: ${Math.round(pricing.total * 0.95 - pricing.total * 0.25)} after service
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-1 text-green-600 text-sm font-medium">
                            <Sparkles className="h-4 w-4" />
                            Save ${Math.round(pricing.total * 0.05)} total!
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Complete Booking */}
          {showCompleteBooking && (
            <Card id="complete-booking" className="border-2 border-green-300 shadow-xl bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Ready to Book!
                </CardTitle>
                <p className="text-green-100 text-sm">
                  Your selections are complete. Proceed to schedule your service.
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                   {/* Customer Information Form */}
                   <div className="bg-white rounded-lg p-4 border border-green-200">
                     <h4 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                       <User className="h-4 w-4" />
                       Customer Information
                     </h4>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="space-y-2">
                         <Label htmlFor="customer-name" className="text-sm font-medium">Full Name *</Label>
                         <Input
                           id="customer-name"
                           type="text"
                           placeholder="Enter your full name"
                           value={customerInfo.name}
                           onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                           className="w-full"
                         />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="customer-email" className="text-sm font-medium">Email Address *</Label>
                         <Input
                           id="customer-email"
                           type="email"
                           placeholder="Enter your email"
                           value={customerInfo.email}
                           onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                           className="w-full"
                         />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="customer-phone" className="text-sm font-medium">Phone Number *</Label>
                         <Input
                           id="customer-phone"
                           type="tel"
                           placeholder="Enter your phone number"
                           value={customerInfo.phone}
                           onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                           className="w-full"
                         />
                       </div>
                     </div>
                   </div>

                    {/* See What's Included Section */}
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <ServiceDetailsDialog 
                        cleaningType={selectedTierData?.id === 'premium' ? 'deep' : 'general'}
                        serviceType="recurring"
                      />
                    </div>

                   {/* Referral & Discount Codes Section */}
                   <div className="bg-white rounded-lg p-4 border border-green-200">
                     <h4 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                       <Tag className="h-4 w-4" />
                       Referral & Discount Codes
                     </h4>
                     <div className="space-y-4">
                        {/* Referral Code */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="referral-code" className="text-sm font-medium">
                              Referral Code (10% off)
                            </Label>
                            <ReferralCodeDialog 
                              onCodeGenerated={(code) => handleReferralCodeChange(code)}
                            />
                          </div>
                          <Input
                            id="referral-code"
                            type="text"
                            placeholder="Enter friend's referral code"
                            value={referralCode}
                            onChange={(e) => handleReferralCodeChange(e.target.value)}
                            className="flex-1"
                            disabled={!!appliedDiscount}
                          />
                          {appliedReferral && (
                            <div className="text-sm text-green-600 flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              Referral code applied! 10% discount active.
                            </div>
                          )}
                       </div>

                       {/* Discount Code */}
                       <div className="space-y-2">
                         <Label htmlFor="discount-code" className="text-sm font-medium">
                           Discount Code
                         </Label>
                         <Input
                           id="discount-code"
                           type="text"
                           placeholder="Enter promotional code (e.g., FRIEND50)"
                           value={discountCode}
                           onChange={(e) => handleDiscountCodeChange(e.target.value)}
                           className="flex-1"
                           disabled={!!appliedReferral}
                         />
                         {appliedDiscount && (
                           <div className="text-sm text-green-600 flex items-center gap-1">
                             <Check className="h-3 w-3" />
                             Discount code applied! {appliedDiscount.description}
                           </div>
                         )}
                         {(appliedReferral || appliedDiscount) && (
                           <p className="text-xs text-muted-foreground">
                             Note: Only one discount can be applied per booking.
                           </p>
                         )}
                       </div>
                     </div>
                   </div>

                   {/* Booking Summary */}
                   <div className="bg-white rounded-lg p-4 border border-green-200">
                     <h4 className="font-semibold text-green-800 mb-2">Booking Summary:</h4>
                     <div className="grid grid-cols-2 gap-2 text-sm">
                       <div><strong>Service:</strong> {selectedTierData?.id === 'general' ? 'General Clean' : selectedTierData?.id === 'complete' ? 'Complete Clean' : 'Premium Deep Clean'}</div>
                       <div><strong>Frequency:</strong> {selectedRecurringData?.name || 'Not selected'}</div>
                       <div><strong>Square Footage:</strong> {squareFootageTiers.find(tier => Math.floor((tier.min + tier.max) / 2) === squareFootage)?.label || squareFootage + ' sq ft'}</div>
                       <div><strong>Bedrooms:</strong> {bedrooms}</div>
                       <div><strong>Bathrooms:</strong> {bathrooms}</div>
                        <div><strong>Payment:</strong> {
                          selectedPaymentOption === 'pay_after_service' 
                            ? 'Pay After Service (Card authorized for $' + pricing.total + ')' 
                            : selectedPaymentOption === '25_percent_with_discount' 
                            ? 'Pay 25% Now + 5% Discount ($' + Math.round(pricing.total * 0.25) + ' now, $' + Math.round(pricing.total * 0.95 - pricing.total * 0.25) + ' after)'
                            : 'Payment method not selected'
                        }</div>
                       {customerInfo.name && <div><strong>Customer:</strong> {customerInfo.name}</div>}
                       {customerInfo.email && <div><strong>Email:</strong> {customerInfo.email}</div>}
                       {customerInfo.phone && <div><strong>Phone:</strong> {customerInfo.phone}</div>}
                       {appliedReferral && <div className="col-span-2"><strong className="text-green-600">Referral Applied:</strong> <span className="text-green-600">10% off (Code: {appliedReferral.code})</span></div>}
                       {appliedDiscount && <div className="col-span-2"><strong className="text-green-600">Discount Applied:</strong> <span className="text-green-600">{appliedDiscount.description} (Code: {appliedDiscount.code})</span></div>}
                     </div>
                   </div>
                  
                   {/* Validation feedback */}
                   {(!customerInfo.name || !customerInfo.email || !customerInfo.phone) && (
                     <div className="p-3 bg-amber-50 border border-amber-200 rounded-md mb-4">
                       <div className="flex items-center gap-2 text-amber-700">
                         <AlertCircle className="h-4 w-4" />
                         <span className="font-medium">Complete these steps to proceed to payment:</span>
                       </div>
                       <ul className="mt-2 text-sm text-amber-600 space-y-1">
                         {!customerInfo.name && <li>• Enter your full name</li>}
                         {!customerInfo.email && <li>• Enter your email address</li>}
                         {!customerInfo.phone && <li>• Enter your phone number</li>}
                       </ul>
                     </div>
                   )}

                      {!showPaymentForm ? (
                        <Button 
                          onClick={initializePayment}
                          disabled={!customerInfo.name || !customerInfo.email || !customerInfo.phone || paymentLoading}
                          size="lg"
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {paymentLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Preparing Payment...
                            </>
                          ) : (!customerInfo.name || !customerInfo.email || !customerInfo.phone) ? (
                            <>
                              <Clock className="h-4 w-4" />
                              Complete Information to Continue
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4" />
                              Continue to Secure Payment
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      ) : (
                        // Stripe Payment Form
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <h4 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Secure Payment
                          </h4>
                          {clientSecret && (
                            <Elements 
                              stripe={stripePromise} 
                              options={{
                                clientSecret,
                                appearance: {
                                  theme: 'stripe',
                                  variables: {
                                    colorPrimary: '#16a34a',
                                    colorBackground: '#ffffff',
                                    colorText: '#1f2937',
                                    colorDanger: '#dc2626',
                                    fontFamily: 'system-ui, sans-serif',
                                    spacingUnit: '6px',
                                    borderRadius: '8px'
                                  }
                                }
                              }}
                            >
                              <EmbeddedPaymentForm 
                                amount={calculatePaymentAmount(pricing.total, selectedPaymentOption as any)}
                                onSuccess={() => {
                                  toast({
                                    title: "Payment Successful!",
                                    description: "Your booking has been confirmed. You'll receive an email confirmation shortly."
                                  });
                                  // Reset form or redirect
                                  setShowPaymentForm(false);
                                  setClientSecret(null);
                                }}
                                onCancel={() => {
                                  setShowPaymentForm(false);
                                  setClientSecret(null);
                                }}
                              />
                            </Elements>
                          )}
                        </div>
                      )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Price Summary Sticky Card (1/3 width) */}
        <div className="lg:col-span-1">
          <PriceSummaryCard
            basePrice={pricing.basePrice}
            addOnsTotal={pricing.addOnsTotal}
            subtotal={pricing.subtotal}
            recurringDiscount={pricing.recurringDiscount}
            membershipDiscount={pricing.membershipDiscount}
            referralDiscount={pricing.referralDiscount}
            codeDiscount={pricing.codeDiscount}
            total={pricing.total}
            membershipFee={pricing.membershipFee}
            selectedTier={selectedTierData}
            selectedAddOns={selectedAddOns.map(id => addOnServices.find(service => service.id === id)).filter(Boolean)}
            selectedRecurring={selectedRecurringData}
            membership={addMembership}
            newClient={newClient}
          />
        </div>
      </div>
    </div>
  );
};