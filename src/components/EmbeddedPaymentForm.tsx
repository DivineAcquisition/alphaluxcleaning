import { useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, User, Mail, Phone, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Initialize Stripe with additional payment methods
const stripePromise = loadStripe("pk_test_51QVA9IB9OZpT3vVZnLUVVlCdM2L0y1rvQJC9wlWL4K89aaJKMnz9zfU7rYJmKy4D8JVTBpQOr5qKOgBfLCNdFZpZ00UrGNcBRk", {
  stripeAccount: undefined,
});

interface PaymentFormProps {
  pricingData: {
    squareFootage: number;
    cleaningType: string;
    frequency: string;
    addOns: string[];
  };
  calculatedPrice: number;
  priceBreakdown: any;
  schedulingData?: {
    scheduledDate: string;
    scheduledTime: string;
    nextDayBooking: boolean;
    upchargeAmount: number;
  };
}

function PaymentFormInner({ pricingData, calculatedPrice, priceBreakdown, schedulingData }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: ""
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentType, setPaymentType] = useState<"full" | "split">("full");

  // Calculate final price with scheduling upcharge
  const getFinalPrice = () => {
    let finalPrice = calculatedPrice;
    if (schedulingData?.nextDayBooking && schedulingData?.upchargeAmount) {
      finalPrice += schedulingData.upchargeAmount;
    }
    return finalPrice;
  };

  const handleInputChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      toast.error("Stripe is not ready. Please refresh and try again.");
      return;
    }

    if (!customerInfo.name || !customerInfo.email || !customerInfo.address || !customerInfo.city || !customerInfo.state || !customerInfo.zipCode) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (calculatedPrice <= 0) {
      toast.error("Please complete the pricing calculator first");
      return;
    }

    setIsProcessing(true);

    try {
      const finalPrice = getFinalPrice();
      const paymentAmount = paymentType === "split" ? Math.round(finalPrice / 2) : finalPrice;
      
      // Create payment intent
      const { data: paymentIntentData, error: intentError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: paymentAmount * 100, // Convert to cents
          fullAmount: finalPrice,
          paymentType: paymentType,
          squareFootage: pricingData.squareFootage,
          cleaningType: pricingData.cleaningType,
          frequency: pricingData.frequency,
          addOns: pricingData.addOns,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          customerAddress: customerInfo.address,
          customerCity: customerInfo.city,
          customerState: customerInfo.state,
          customerZipCode: customerInfo.zipCode,
          scheduledDate: schedulingData?.scheduledDate || "",
          scheduledTime: schedulingData?.scheduledTime || "",
          nextDayUpcharge: schedulingData?.upchargeAmount || 0
        }
      });

      if (intentError) throw intentError;

      // Confirm payment using PaymentElement (supports multiple payment methods)
      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?payment_intent=${paymentIntentData.payment_intent_id}`,
        },
        redirect: 'if_required',
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        toast.success("Payment successful! Redirecting...");
        
        // Redirect to success page
        setTimeout(() => {
          window.location.href = `/payment-success?payment_intent=${paymentIntent.id}`;
        }, 1000);
      }
      
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (calculatedPrice <= 0) {
    return (
      <Card className="shadow-lg">
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
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary to-accent text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Book Your Service
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Secure booking with Bay Area Cleaning Pros
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmitPayment} className="space-y-6">
          {/* Payment Type Selection */}
          <div className="space-y-4">
            <h4 className="font-semibold">Payment Options</h4>
            <div className="grid grid-cols-1 gap-3">
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  paymentType === "full" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
                onClick={() => setPaymentType("full")}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    paymentType === "full" ? "border-primary bg-primary" : "border-border"
                  }`}>
                    {paymentType === "full" && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>}
                  </div>
                  <div>
                    <div className="font-medium">Pay Full Amount</div>
                    <div className="text-sm text-muted-foreground">Pay ${getFinalPrice().toFixed(2)} now</div>
                  </div>
                </div>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  paymentType === "split" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
                onClick={() => setPaymentType("split")}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    paymentType === "split" ? "border-primary bg-primary" : "border-border"
                  }`}>
                    {paymentType === "split" && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>}
                  </div>
                  <div>
                    <div className="font-medium">Split Payment (50/50)</div>
                    <div className="text-sm text-muted-foreground">
                      Pay ${Math.round(getFinalPrice() / 2).toFixed(2)} now, remaining ${(getFinalPrice() - Math.round(getFinalPrice() / 2)).toFixed(2)} auto-billed after completion
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Summary */}
          <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
            <h4 className="font-semibold mb-3">Service Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Service Amount:</span>
                <span className="font-bold text-primary">${calculatedPrice.toFixed(2)}</span>
              </div>
              {schedulingData?.nextDayBooking && schedulingData?.upchargeAmount > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Next Day Priority Booking:</span>
                  <span className="font-bold">+${schedulingData.upchargeAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total Amount:</span>
                <span className="text-primary">${getFinalPrice().toFixed(2)}</span>
              </div>
              {paymentType === "split" && (
                <div className="space-y-1 mt-3 pt-3 border-t border-dashed">
                  <div className="flex justify-between text-green-600">
                    <span>Paying Now (50%):</span>
                    <span className="font-bold">${Math.round(getFinalPrice() / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span>Auto-billed After Service:</span>
                    <span className="font-bold">${(getFinalPrice() - Math.round(getFinalPrice() / 2)).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contact Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name *
                </Label>
                <Input
                  id="customerName"
                  value={customerInfo.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address *
                </Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Billing Address
            </h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  value={customerInfo.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="123 Main Street"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={customerInfo.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="San Francisco"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={customerInfo.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="CA"
                    maxLength={2}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    value={customerInfo.zipCode}
                    onChange={(e) => handleInputChange("zipCode", e.target.value)}
                    placeholder="94105"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Information
            </h4>
            <div className="border rounded-lg p-4 bg-background">
              <PaymentElement
                options={{
                  layout: 'tabs',
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit"
            className="w-full" 
            size="lg"
            disabled={
              isProcessing || 
              !stripe ||
              !customerInfo.name || 
              !customerInfo.email ||
              !customerInfo.address ||
              !customerInfo.city ||
              !customerInfo.state ||
              !customerInfo.zipCode ||
              (schedulingData?.nextDayBooking && (!schedulingData?.scheduledDate || !schedulingData?.scheduledTime))
            }
          >
            {isProcessing ? "Processing Payment..." : (
              paymentType === "split" 
                ? `Pay 50% Now - $${Math.round(getFinalPrice() / 2).toFixed(2)}`
                : `Complete Payment - $${getFinalPrice().toFixed(2)}`
            )}
          </Button>

          <div className="text-xs text-muted-foreground text-center">
            {paymentType === "split" 
              ? "Remaining balance will be automatically charged after service completion"
              : "Your payment information is secure and encrypted"
            }
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function EmbeddedPaymentForm(props: PaymentFormProps) {
  // Don't initialize Elements if amount is 0 or invalid
  if (props.calculatedPrice <= 0) {
    return <PaymentFormInner {...props} />;
  }

  const finalPrice = props.schedulingData?.nextDayBooking && props.schedulingData?.upchargeAmount 
    ? props.calculatedPrice + props.schedulingData.upchargeAmount 
    : props.calculatedPrice;

  return (
    <Elements 
      stripe={stripePromise}
      options={{
        mode: 'payment',
        amount: Math.round(finalPrice * 100),
        currency: 'usd',
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: 'hsl(var(--primary))',
            colorBackground: 'hsl(var(--background))',
            colorText: 'hsl(var(--foreground))',
            colorDanger: 'hsl(var(--destructive))',
            fontFamily: 'system-ui, sans-serif',
            borderRadius: '8px',
          },
        },
        payment_method_types: ['card'],
      }}
    >
      <PaymentFormInner {...props} />
    </Elements>
  );
}