import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, User, Mail, Phone } from "lucide-react";
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

export function PaymentForm({ pricingData, calculatedPrice, priceBreakdown, schedulingData }: PaymentFormProps) {
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: ""
  });
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
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
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

    // Check if scheduling is required and provided
    if (!schedulingData?.scheduledDate || !schedulingData?.scheduledTime) {
      toast.error("Please select a date and time for your service");
      return;
    }

    setIsProcessing(true);

    try {
      const finalPrice = getFinalPrice();
      let paymentAmount = finalPrice;
      
      if (paymentType === "split") {
        paymentAmount = Math.round(finalPrice / 2);
      } else if (paymentType === "prepayment") {
        paymentAmount = 15000; // $150 in cents
      }
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
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
          nextDayUpcharge: schedulingData?.upchargeAmount || 0
        }
      });

      if (error) throw error;

      // Redirect to Stripe checkout
      window.location.href = data.url;
      
      if (paymentType === "split") {
        toast.success("Paying 50% now. Remaining balance will be auto-billed after service completion.");
      } else if (paymentType === "prepayment") {
        toast.success("Paying $150 prepayment. Remaining balance will be charged after job completion.");
      } else {
        toast.success("Redirecting to secure checkout...");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to create payment. Please try again.");
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
      <CardContent className="p-6 space-y-6">
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
            
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                paymentType === "prepayment" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              }`}
              onClick={() => setPaymentType("prepayment")}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  paymentType === "prepayment" ? "border-primary bg-primary" : "border-border"
                }`}>
                  {paymentType === "prepayment" && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>}
                </div>
                <div>
                  <div className="font-medium">$150 Prepayment</div>
                  <div className="text-sm text-muted-foreground">
                    Pay $150.00 now, remaining ${(getFinalPrice() - 150).toFixed(2)} charged after job completion
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
            {(paymentType === "split" || paymentType === "prepayment") && (
              <div className="space-y-1 mt-3 pt-3 border-t border-dashed">
                <div className="flex justify-between text-green-600">
                  <span>Paying Now:</span>
                  <span className="font-bold">
                    ${paymentType === "prepayment" ? "150.00" : Math.round(getFinalPrice() / 2).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>Charged After Service:</span>
                  <span className="font-bold">
                    ${paymentType === "prepayment" 
                      ? (getFinalPrice() - 150).toFixed(2) 
                      : (getFinalPrice() - Math.round(getFinalPrice() / 2)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline">{pricingData.squareFootage} sq ft</Badge>
              <Badge variant="outline">
                {pricingData.cleaningType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Cleaning
              </Badge>
              <Badge variant="outline">
                {pricingData.frequency?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
              {schedulingData?.nextDayBooking && (
                <Badge variant="default" className="bg-orange-500">
                  Next Day Priority
                </Badge>
              )}
            </div>
            {pricingData.addOns.length > 0 && (
              <div className="mt-2">
                <div className="text-sm text-muted-foreground mb-1">Add-ons:</div>
                <div className="flex flex-wrap gap-1">
                  {pricingData.addOns.map(addOn => (
                    <Badge key={addOn} variant="secondary" className="text-xs">
                      {addOn.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {schedulingData?.nextDayBooking && schedulingData?.scheduledTime && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-sm text-muted-foreground mb-1">Scheduled Service:</div>
                <div className="text-sm">
                  <strong>Tomorrow</strong> at <strong>{schedulingData.scheduledTime}</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer Information */}
        <div className="space-y-4">
          <h4 className="font-semibold">Contact Information</h4>
          
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
              Phone Number *
            </Label>
            <Input
              id="customerPhone"
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="Enter your phone number"
              required
            />
          </div>
        </div>

        {/* Book Service Button */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={handleBookService}
            disabled={
            isProcessing || 
            !customerInfo.name || 
            !customerInfo.email ||
            !customerInfo.phone ||
            !pricingData.cleaningType ||
            !schedulingData?.scheduledDate ||
            !schedulingData?.scheduledTime
          }
        >
          {isProcessing ? "Processing..." : (
            paymentType === "split" 
              ? `Pay 50% Now - $${Math.round(getFinalPrice() / 2).toFixed(2)}`
              : paymentType === "prepayment"
              ? `Pay $150 Prepayment`
              : `Book Service - $${getFinalPrice().toFixed(2)}`
          )}
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          {paymentType === "split" 
            ? "Remaining balance will be automatically charged after service completion"
            : paymentType === "prepayment"
            ? `Remaining $${(getFinalPrice() - 150).toFixed(2)} will be charged after job completion`
            : "You will be redirected to our secure payment processor to complete your booking"
          }
        </div>
      </CardContent>
    </Card>
  );
}