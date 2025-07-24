import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, User, Mail, Phone, Calendar, Clock, CheckCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentFormProps {
  pricingData: {
    squareFootage: number;
    cleaningType: string;
    frequency: string;
    addOns: string[];
  };
  calculatedPrice: number;
  priceBreakdown: any;
}

interface AvailabilitySlot {
  date: string;
  time: string;
  available: boolean;
}

export function PaymentForm({ pricingData, calculatedPrice, priceBreakdown }: PaymentFormProps) {
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    scheduledDate: "",
    scheduledTime: "",
    nextDayBooking: false
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const timeSlots = [
    "Early Morning (6-9 AM)",
    "Morning (9 AM-12 PM)",
    "Afternoon (12-5 PM)", 
    "Evening (5-8 PM)",
    "After Hours (8 PM+)"
  ];

  // Check calendar availability when date changes
  const checkAvailability = async (date: string) => {
    if (!date) return;
    
    setIsCheckingAvailability(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-calendar-availability', {
        body: { date, timeSlots }
      });

      if (error) throw error;
      setAvailability(data.availability || []);
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error("Unable to check calendar availability. Please try again.");
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Check availability when scheduled date changes
  useEffect(() => {
    if (customerInfo.scheduledDate) {
      checkAvailability(customerInfo.scheduledDate);
    }
  }, [customerInfo.scheduledDate]);

  // Get availability status for a time slot
  const getTimeSlotAvailability = (timeSlot: string) => {
    const slot = availability.find(a => a.time === timeSlot);
    return slot ? slot.available : true; // Default to available if not checked
  };

  // Check if selected date is next day
  const isNextDay = () => {
    if (!customerInfo.scheduledDate) return false;
    const selectedDate = new Date(customerInfo.scheduledDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return selectedDate.toDateString() === tomorrow.toDateString();
  };

  // Calculate final price with next day upcharge
  const getFinalPrice = () => {
    let finalPrice = calculatedPrice;
    if (customerInfo.nextDayBooking && isNextDay()) {
      finalPrice += 20;
    }
    return finalPrice;
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleBookService = async () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.scheduledDate || !customerInfo.scheduledTime) {
      toast.error("Please fill in all required fields including service date and time");
      return;
    }

    if (calculatedPrice <= 0) {
      toast.error("Please complete the pricing calculator first");
      return;
    }

    setIsProcessing(true);

    try {
      const finalPrice = getFinalPrice();
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: finalPrice,
          squareFootage: pricingData.squareFootage,
          cleaningType: pricingData.cleaningType,
          frequency: pricingData.frequency,
          addOns: pricingData.addOns,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          scheduledDate: customerInfo.scheduledDate,
          scheduledTime: customerInfo.scheduledTime,
          nextDayUpcharge: customerInfo.nextDayBooking && isNextDay() ? 20 : 0
        }
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      
      toast.success("Redirecting to secure checkout...");
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
        {/* Service Summary */}
        <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
          <h4 className="font-semibold mb-3">Service Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Service Amount:</span>
              <span className="font-bold text-primary">${calculatedPrice.toFixed(2)}</span>
            </div>
            {customerInfo.nextDayBooking && isNextDay() && (
              <div className="flex justify-between text-orange-600">
                <span>Next Day Booking Upcharge:</span>
                <span className="font-bold">+$20.00</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total Amount:</span>
              <span className="text-primary">${getFinalPrice().toFixed(2)}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline">{pricingData.squareFootage} sq ft</Badge>
              <Badge variant="outline">
                {pricingData.cleaningType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Cleaning
              </Badge>
              <Badge variant="outline">
                {pricingData.frequency?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
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
              Phone Number
            </Label>
            <Input
              id="customerPhone"
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="(optional)"
            />
          </div>
        </div>

        {/* Service Scheduling */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Your Service
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Service Date *</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={customerInfo.scheduledDate}
                onChange={(e) => {
                  handleInputChange("scheduledDate", e.target.value);
                  // Check if next day booking
                  const selectedDate = new Date(e.target.value);
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const isNextDayBooking = selectedDate.toDateString() === tomorrow.toDateString();
                  handleInputChange("nextDayBooking", isNextDayBooking);
                }}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              {isNextDay() && (
                <div className="text-sm text-orange-600 flex items-center gap-1">
                  <span>⚡ Next day booking - $20 upcharge applies</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="scheduledTime">
                Service Time * 
                {isCheckingAvailability && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    <Clock className="inline h-3 w-3 animate-spin mr-1" />
                    Checking availability...
                  </span>
                )}
              </Label>
              <Select 
                value={customerInfo.scheduledTime} 
                onValueChange={(value) => handleInputChange("scheduledTime", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg z-50">
                  {timeSlots.map(slot => {
                    const isAvailable = getTimeSlotAvailability(slot);
                    return (
                      <SelectItem key={slot} value={slot} disabled={!isAvailable}>
                        <div className="flex items-center justify-between w-full">
                          <span className={!isAvailable ? 'text-muted-foreground' : ''}>{slot}</span>
                          {customerInfo.scheduledDate && (
                            <span className="ml-2">
                              {isAvailable ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <X className="h-4 w-4 text-red-500" />
                              )}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {customerInfo.scheduledDate && availability.length > 0 && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <h5 className="text-sm font-medium mb-2">Available Time Slots</h5>
              <div className="grid grid-cols-1 gap-2">
                {timeSlots.map(slot => {
                  const isAvailable = getTimeSlotAvailability(slot);
                  return (
                    <div key={slot} className="flex items-center justify-between text-sm">
                      <span className={!isAvailable ? 'text-muted-foreground' : ''}>{slot}</span>
                      <span className="flex items-center gap-1">
                        {isAvailable ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-green-600">Available</span>
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 text-red-500" />
                            <span className="text-red-600">Unavailable</span>
                          </>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Book Service Button */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={handleBookService}
          disabled={isProcessing || !customerInfo.name || !customerInfo.email || !customerInfo.scheduledDate || !customerInfo.scheduledTime}
        >
          {isProcessing ? "Processing..." : `Book Service - $${getFinalPrice().toFixed(2)}`}
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          You will be redirected to our secure payment processor to complete your booking
        </div>
      </CardContent>
    </Card>
  );
}