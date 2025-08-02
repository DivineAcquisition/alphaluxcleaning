import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, User, Mail, Phone, Gift, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
interface PaymentFormProps {
  pricingData: {
    squareFootage: number;
    cleaningType: string;
    frequency: string;
    addOns: string[];
    bedrooms?: number;
    bathrooms?: number;
    membership?: boolean;
    hours?: number;
  };
  calculatedPrice: number;
  priceBreakdown: any;
  schedulingData?: {
    scheduledDate: string;
    scheduledTime: string;
    nextDayBooking?: boolean;
    upchargeAmount?: number;
  };
}
export function PaymentForm({
  pricingData,
  calculatedPrice,
  priceBreakdown,
  schedulingData
}: PaymentFormProps) {
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: ""
  });
  const [referralCode, setReferralCode] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedReferral, setAppliedReferral] = useState<any>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentType, setPaymentType] = useState<"full" | "split" | "prepayment">("full");

  // Calculate final price with scheduling upcharge (for legacy next-day booking)
  const getFinalPrice = () => {
    let finalPrice = calculatedPrice;
    if (schedulingData?.nextDayBooking && schedulingData?.upchargeAmount) {
      finalPrice += schedulingData.upchargeAmount;
    }
    return finalPrice;
  };
  const handleInputChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleApplyReferralCode = async () => {
    if (!referralCode.trim()) {
      toast.error("Please enter a referral code");
      return;
    }
    if (!customerInfo.email || !customerInfo.name) {
      toast.error("Please fill in your name and email first");
      return;
    }
    try {
      const {
        data,
        error
      } = await supabase.rpc('validate_and_use_referral_code', {
        p_code: referralCode.trim(),
        p_user_email: customerInfo.email,
        p_user_name: customerInfo.name,
        p_order_id: null
      });
      if (error) throw error;
      const result = data as any;
      if (result?.success) {
        setAppliedReferral(result);
        toast.success(`Referral code applied! You get 10% off your service.`);

        // Get referrer's email and send reward email
        const {
          data: referrerData
        } = await supabase.from('referral_codes').select('owner_email').eq('code', referralCode.trim()).single();
        if (referrerData?.owner_email) {
          await supabase.functions.invoke('send-service-notification', {
            body: {
              type: 'referral_reward',
              referrerEmail: referrerData.owner_email,
              referrerName: result.owner_name,
              friendName: customerInfo.name,
              rewardCode: `FRIEND50-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
              rewardAmount: '50%'
            }
          });
        }
      } else {
        toast.error(result?.error || "Invalid referral code");
      }
    } catch (error) {
      console.error("Error applying referral code:", error);
      toast.error("Failed to apply referral code");
    }
  };
  const handleApplyDiscountCode = async () => {
    if (!discountCode.trim()) {
      toast.error("Please enter a discount code");
      return;
    }
    if (discountCode.startsWith('FRIEND50')) {
      if (appliedReferral) {
        toast.error("Cannot combine discount codes with referral codes");
        return;
      }
      setAppliedDiscount({
        code: discountCode,
        type: 'deep_clean_50_percent',
        description: '50% off deep cleaning service'
      });
      toast.success("Discount code applied! 50% off your deep cleaning service.");
    } else {
      toast.error("Invalid discount code");
    }
  };
  const handleBookService = async () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (calculatedPrice <= 0) {
      toast.error("Please complete the pricing calculator first");
      return;
    }

    // Check if service type is selected (required for proper scheduling)
    if (!pricingData.cleaningType) {
      toast.error("Please select a service type first");
      return;
    }
    setIsProcessing(true);
    try {
      // Check if membership is enabled from pricingData
      if (pricingData.membership) {
        // Handle membership booking with both service payment and recurring subscription
        const {
          data,
          error
        } = await supabase.functions.invoke('create-membership-checkout', {
          body: {
            bookingData: {
              tier: {
                hours: pricingData.hours,
                price: calculatedPrice,
                membershipPrice: calculatedPrice // Already discounted
              },
              membership: true,
              addOns: pricingData.addOns || [],
              subtotal: calculatedPrice
            }
          }
        });
        if (error) throw error;

        // Redirect to Stripe checkout
        if (data.url) {
          window.open(data.url, '_blank');
        } else {
          throw new Error('No checkout URL received');
        }
        toast.success("Redirecting to membership checkout...");
      } else {
        // Handle regular service booking (existing flow)
        const finalPrice = getFinalPrice();
        let paymentAmount = finalPrice;
        if (paymentType === "split") {
          paymentAmount = Math.round(finalPrice / 2);
        } else if (paymentType === "prepayment") {
          paymentAmount = 15000; // $150 in cents
        }
        const {
          data,
          error
        } = await supabase.functions.invoke('create-payment', {
          body: {
            amount: paymentAmount,
            fullAmount: finalPrice,
            paymentType: paymentType,
            squareFootage: pricingData.squareFootage,
            cleaningType: pricingData.cleaningType,
            frequency: pricingData.frequency,
            addOns: pricingData.addOns,
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            customerPhone: customerInfo.phone,
            bedrooms: pricingData.bedrooms,
            bathrooms: pricingData.bathrooms,
            scheduledDate: schedulingData?.scheduledDate || "",
            scheduledTime: schedulingData?.scheduledTime || "",
            nextDayUpcharge: schedulingData?.upchargeAmount || 0,
            newClientSpecial: priceBreakdown?.basePrice === 349 && pricingData.hours === 4
          }
        });
        if (error) throw error;

        // Redirect to Stripe checkout
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL received');
        }
        if (paymentType === "split") {
          toast.success("Paying 50% now. Remaining balance will be auto-billed after service completion.");
        } else if (paymentType === "prepayment") {
          toast.success("Paying $150 prepayment. Remaining balance will be charged after job completion.");
        } else {
          toast.success("Redirecting to secure checkout...");
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to create payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };
  if (calculatedPrice <= 0) {
    return <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-muted to-accent/20 rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Book Your Service
          </CardTitle>
          <CardDescription>
            Complete the pricing calculator to book your cleaning service
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            Please complete the pricing form to proceed with booking
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary to-accent text-white rounded-t-lg text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <CreditCard className="h-6 w-6" />
          Book Your Service
        </CardTitle>
        <CardDescription className="text-primary-foreground/80 text-center">
          Secure booking with Bay Area Cleaning Pros
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Payment Type Selection */}
          <div className="space-y-8">
            {pricingData.hours === 6 ? <>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-primary">Choose Your Payment Option</h3>
                  <p className="text-muted-foreground">Select how you'd like to pay for your cleaning service</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                  {/* Full Payment Option */}
                  <div className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${paymentType === "full" ? "border-primary bg-primary/5 shadow-lg scale-105" : "border-border hover:border-primary/50"}`} onClick={() => setPaymentType("full")}>
                    {paymentType === "full" && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground px-3 py-1">
                          Most Popular
                        </Badge>
                      </div>}
                    <div className="text-center space-y-4">
                      <div className={`w-8 h-8 rounded-full mx-auto border-2 flex items-center justify-center ${paymentType === "full" ? "border-primary bg-primary" : "border-border"}`}>
                        {paymentType === "full" && <div className="w-3 h-3 bg-white rounded-full"></div>}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold mb-2">Pay Full Amount</h4>
                        <div className="text-3xl font-bold text-primary mb-2">
                          ${getFinalPrice().toFixed(2)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Complete payment today and you're all set
                        </p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-center text-green-600">
                          ✓ No future charges
                        </div>
                        <div className="flex items-center justify-center text-green-600">
                          ✓ Simplest option
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Split Payment Option */}
                  <div className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${paymentType === "split" ? "border-primary bg-primary/5 shadow-lg scale-105" : "border-border hover:border-primary/50"}`} onClick={() => setPaymentType("split")}>
                    <div className="text-center space-y-4">
                      <div className={`w-8 h-8 rounded-full mx-auto border-2 flex items-center justify-center ${paymentType === "split" ? "border-primary bg-primary" : "border-border"}`}>
                        {paymentType === "split" && <div className="w-3 h-3 bg-white rounded-full"></div>}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold mb-2">Split Payment</h4>
                        <div className="text-3xl font-bold text-primary mb-1">
                          ${Math.round(getFinalPrice() / 2).toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          now, then ${(getFinalPrice() - Math.round(getFinalPrice() / 2)).toFixed(2)} later
                        </div>
                        <p className="text-sm text-muted-foreground">
                          50% now, 50% auto-billed after service
                        </p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-center text-green-600">
                          ✓ Lower upfront cost
                        </div>
                        <div className="flex items-center justify-center text-green-600">
                          ✓ Automatic billing
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Prepayment Option */}
                  <div className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${paymentType === "prepayment" ? "border-primary bg-primary/5 shadow-lg scale-105" : "border-border hover:border-primary/50"}`} onClick={() => setPaymentType("prepayment")}>
                    <div className="text-center space-y-4">
                      <div className={`w-8 h-8 rounded-full mx-auto border-2 flex items-center justify-center ${paymentType === "prepayment" ? "border-primary bg-primary" : "border-border"}`}>
                        {paymentType === "prepayment" && <div className="w-3 h-3 bg-white rounded-full"></div>}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold mb-2">Prepayment</h4>
                        <div className="text-3xl font-bold text-primary mb-1">
                          $150.00
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          now, then ${(getFinalPrice() - 150).toFixed(2)} later
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Minimal upfront payment to secure booking
                        </p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-center text-green-600">
                          ✓ Lowest upfront cost
                        </div>
                        <div className="flex items-center justify-center text-green-600">
                          ✓ Secures your slot
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </> : <div className="text-center space-y-4">
                
                
              </div>}
          </div>

            {/* Service Summary */}
            <div className="space-y-8">
              <div className="text-center space-y-2">
                
                
              </div>
              
              
            </div>

            {/* Customer Information */}
             <div className="space-y-6 text-left">
               <div className="space-y-2 text-left">
                 <div className="flex items-start gap-2 text-left">
                   <User className="h-5 w-5 text-primary mt-0.5" />
                   <div className="text-left">
                     <h4 className="text-lg font-semibold text-primary text-left">Contact Information</h4>
                     <p className="text-sm text-muted-foreground text-left">We'll use this information to contact you about your service</p>
                   </div>
                 </div>
               </div>
               
               <div className="space-y-6 text-left">
                 <div className="space-y-4 text-left">
                   <div className="space-y-1 text-left">
                     <h5 className="font-medium text-foreground text-left">Personal Details</h5>
                     <p className="text-sm text-muted-foreground text-left">Your name as it appears on official documents</p>
                   </div>
                   <div className="space-y-2 text-left">
                     <Label htmlFor="customerName" className="text-left">Full Name *</Label>
                     <Input id="customerName" value={customerInfo.name} onChange={e => handleInputChange("name", e.target.value)} placeholder="Enter your full name" className="text-left" required />
                   </div>
                 </div>

                 <div className="space-y-4 text-left">
                   <div className="space-y-1 text-left">
                     <h5 className="font-medium text-foreground text-left">Contact Details</h5>
                     <p className="text-sm text-muted-foreground text-left">How we'll reach you for updates and confirmations</p>
                   </div>
                   <div className="space-y-4 text-left">
                     <div className="space-y-2 text-left">
                       <Label htmlFor="customerPhone" className="text-left">Phone Number *</Label>
                       <Input id="customerPhone" type="tel" value={customerInfo.phone} onChange={e => handleInputChange("phone", e.target.value)} placeholder="Enter your phone number" className="text-left" required />
                     </div>

                     <div className="space-y-2 text-left">
                       <Label htmlFor="customerEmail" className="text-left">Email Address *</Label>
                       <Input id="customerEmail" type="email" value={customerInfo.email} onChange={e => handleInputChange("email", e.target.value)} placeholder="Enter your email address" className="text-left" required />
                     </div>
                   </div>
                 </div>
               </div>
            </div>

            {/* Referral and Discount Codes Section */}
             <div className="space-y-6">
               <div className="space-y-2">
                 <div className="flex items-start gap-2">
                   <Gift className="h-5 w-5 text-primary mt-0.5" />
                   <div className="text-left">
                     <h4 className="text-lg font-semibold text-primary text-left">Promo Codes</h4>
                     <p className="text-sm text-muted-foreground text-left">Have a referral or discount code? Apply it here to save money</p>
                   </div>
                 </div>
               </div>
               
               {/* Referral Code */}
               <div className="space-y-4">
                 <div className="space-y-1 text-left">
                   <h5 className="font-medium text-foreground text-left">Referral Code</h5>
                   <p className="text-sm text-muted-foreground text-left">Got referred by a friend? Use their code for instant savings</p>
                 </div>
                 <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                   {appliedReferral && <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-left">
                       <p className="text-green-800 font-medium text-sm text-left">✓ Referral code applied!</p>
                       <p className="text-green-600 text-xs text-left">You get 10% off your service.</p>
                     </div>}
                   
                   {!appliedReferral && <div className="text-left">
                       <div className="flex gap-2">
                         <Input value={referralCode} onChange={e => setReferralCode(e.target.value)} placeholder="Enter your friend's referral code" className="flex-1 text-left" />
                         <Button onClick={handleApplyReferralCode} disabled={!referralCode.trim() || !customerInfo.email || !customerInfo.name} variant="outline" size="sm">
                           Apply
                         </Button>
                       </div>
                       <p className="text-xs text-muted-foreground text-left mt-2">
                         Get 10% off your service with a friend's referral code
                       </p>
                       {(!customerInfo.email || !customerInfo.name) && <p className="text-xs text-orange-600 text-left mt-1">
                           Please fill in your name and email first
                         </p>}
                     </div>}
                 </div>
               </div>

               {/* Discount Code */}
               <div className="space-y-4">
                 <div className="space-y-1 text-left">
                   <h5 className="font-medium text-foreground text-left">Discount Code</h5>
                   <p className="text-sm text-muted-foreground text-left">Have a special promotion code? Enter it for additional discounts</p>
                 </div>
                 <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                   {appliedDiscount && <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-left">
                       <p className="text-green-800 font-medium text-sm text-left">✓ Discount code applied!</p>
                       <p className="text-green-600 text-xs text-left">{appliedDiscount.description}</p>
                     </div>}
                   
                   {!appliedDiscount && !appliedReferral && <div className="text-left">
                       <div className="flex gap-2">
                         <Input value={discountCode} onChange={e => setDiscountCode(e.target.value)} placeholder="Enter discount code (e.g., FRIEND50-ABC123)" className="flex-1 text-left" />
                         <Button onClick={handleApplyDiscountCode} disabled={!discountCode.trim()} variant="outline" size="sm">
                           Apply
                         </Button>
                       </div>
                       <p className="text-xs text-muted-foreground text-left mt-2">
                         Have a discount code from a referral reward? Get 50% off deep cleaning
                       </p>
                     </div>}
                   
                   {appliedReferral && <p className="text-xs text-muted-foreground text-orange-600 text-left">
                       Cannot apply discount code when referral code is already applied
                     </p>}
                 </div>
               </div>
            </div>

            {/* Book Service Button */}
            <Button className="w-full" size="lg" onClick={handleBookService} disabled={isProcessing || !customerInfo.name || !customerInfo.email || !customerInfo.phone || !pricingData.cleaningType}>
              {isProcessing ? "Processing..." : paymentType === "split" ? `Pay 50% Now - $${Math.round(getFinalPrice() / 2).toFixed(2)}` : paymentType === "prepayment" ? `Pay $150 Prepayment` : `Book Service - $${getFinalPrice().toFixed(2)}`}
            </Button>

            <div className="text-xs text-muted-foreground text-center">
              {paymentType === "split" ? "Remaining balance will be automatically charged after service completion" : paymentType === "prepayment" ? `Remaining $${(getFinalPrice() - 150).toFixed(2)} will be charged after job completion` : "You will be redirected to our secure payment processor to complete your booking"}
            </div>
        </div>
      </CardContent>
    </Card>;
}