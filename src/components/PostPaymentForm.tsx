import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Calendar, Clock, MessageSquare, User, Home } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import React from "react";

interface PostPaymentFormProps {
  sessionId?: string;
  onComplete?: () => void;
}

export function PostPaymentForm({ sessionId, onComplete }: PostPaymentFormProps) {
  const [formData, setFormData] = useState({
    // Service Address
    streetAddress: "",
    apartmentUnit: "",
    city: "",
    state: "",
    zipCode: "",
    
    // Property Details
    dwellingType: "",
    flooringType: "",
    
    // Referral & Marketing
    referralCode: "",
    hearAboutUs: "",
    generatedReferralCode: "",
    customerEmail: "",
    customerName: "",
    
    // Scheduling Preferences
    preferredTimeSlot: "",
    preferredDays: [] as string[],
    serviceType: "", // one-time, weekly, bi-weekly, monthly
    
    // Access & Special Instructions
    accessInstructions: "",
    parkingInstructions: "",
    specialRequests: "",
    petsPresent: false,
    alarmCode: "",
    
    // Contact Preferences
    contactMethod: "",
    contactTime: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referralValidation, setReferralValidation] = useState<{
    isValid: boolean;
    message: string;
    isChecking: boolean;
  }>({
    isValid: false,
    message: "",
    isChecking: false
  });

  // Fetch order details to get service type
  React.useEffect(() => {
    const fetchOrderDetails = async () => {
      if (sessionId) {
        try {
          const { data, error } = await supabase
            .from("orders")
            .select("frequency")
            .eq("stripe_session_id", sessionId)
            .single();

          if (data && !error) {
            handleInputChange("serviceType", data.frequency || "one-time");
          }
        } catch (error) {
          console.error("Error fetching order details:", error);
        }
      }
    };
    fetchOrderDetails();
  }, [sessionId]);

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDayToggle = (day: string) => {
    // For one-time services, only allow one day selection
    if (formData.serviceType === "one-time") {
      handleInputChange("preferredDays", [day]);
    } else {
      // For recurring services, allow multiple days
      const newDays = formData.preferredDays.includes(day)
        ? formData.preferredDays.filter(d => d !== day)
        : [...formData.preferredDays, day];
      handleInputChange("preferredDays", newDays);
    }
  };

  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralValidation({ isValid: false, message: "", isChecking: false });
      return;
    }

    setReferralValidation({ isValid: false, message: "", isChecking: true });

    try {
      const { data, error } = await supabase.rpc('validate_and_use_referral_code', {
        p_code: code.trim().toUpperCase(),
        p_user_email: formData.customerEmail || 'guest@example.com',
        p_user_name: formData.customerName || null,
        p_order_id: null // We'll update this later when the order is processed
      });

      if (error) throw error;

      const result = data as { success: boolean; reward_type?: string; message?: string; error?: string };

      if (result.success) {
        setReferralValidation({
          isValid: true,
          message: `✅ Valid referral code! You'll receive ${result.reward_type?.replace('_', ' ')} discount.`,
          isChecking: false
        });
        toast.success(result.message || "Referral code applied successfully!");
      } else {
        setReferralValidation({
          isValid: false,
          message: `❌ ${result.error}`,
          isChecking: false
        });
        toast.error(result.error || "Invalid referral code");
      }
    } catch (error) {
      console.error("Error validating referral code:", error);
      setReferralValidation({
        isValid: false,
        message: "❌ Error validating referral code",
        isChecking: false
      });
      toast.error("Error validating referral code");
    }
  };

  const generateReferralCode = async () => {
    if (!formData.customerEmail) {
      toast.error("Please enter your email first to generate a referral code");
      return;
    }

    try {
      const { data, error } = await supabase.rpc('create_referral_code', {
        p_owner_email: formData.customerEmail,
        p_owner_name: formData.customerName || null
      });

      if (error) throw error;

      const result = data as { success: boolean; code?: string; message?: string; error?: string };

      if (result.success && result.code) {
        handleInputChange("generatedReferralCode", result.code);
        navigator.clipboard.writeText(result.code);
        toast.success("Referral code generated and copied to clipboard!");
      } else {
        toast.error(result.error || "Failed to generate referral code");
      }
    } catch (error) {
      console.error("Error generating referral code:", error);
      toast.error("Error generating referral code");
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.streetAddress || !formData.city || !formData.zipCode) {
      toast.error("Please fill in all required address fields");
      return;
    }

    if (!formData.customerEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setIsSubmitting(true);

    try {
      // First, get the complete order data
      const { data: orderData, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("stripe_session_id", sessionId)
        .single();

      if (fetchError) throw fetchError;

      // Update the order with additional information
      const { error } = await supabase
        .from("orders")
        .update({
          service_details: {
            address: {
              street: formData.streetAddress,
              apartment: formData.apartmentUnit,
              city: formData.city,
              state: formData.state,
              zipCode: formData.zipCode
            },
            property: {
              dwellingType: formData.dwellingType,
              flooringType: formData.flooringType
            },
            referral: {
              code: formData.referralCode,
              source: formData.hearAboutUs,
              isValid: referralValidation.isValid
            },
            scheduling: {
              preferredTimeSlot: formData.preferredTimeSlot,
              preferredDays: formData.preferredDays
            },
            instructions: {
              access: formData.accessInstructions,
              parking: formData.parkingInstructions,
              special: formData.specialRequests,
              pets: formData.petsPresent,
              alarmCode: formData.alarmCode
            },
            contact: {
              method: formData.contactMethod,
              time: formData.contactTime
            }
          },
          customer_email: formData.customerEmail,
          customer_name: formData.customerName
        })
        .eq("stripe_session_id", sessionId);

      if (error) throw error;

      // Send transaction data to Zapier webhook
      try {
        const transactionData = {
          ...orderData,
          service_details: {
            address: {
              street: formData.streetAddress,
              apartment: formData.apartmentUnit,
              city: formData.city,
              state: formData.state,
              zipCode: formData.zipCode
            },
            property: {
              dwellingType: formData.dwellingType,
              flooringType: formData.flooringType
            },
            referral: {
              code: formData.referralCode,
              source: formData.hearAboutUs,
              isValid: referralValidation.isValid
            },
            scheduling: {
              preferredTimeSlot: formData.preferredTimeSlot,
              preferredDays: formData.preferredDays
            },
            instructions: {
              access: formData.accessInstructions,
              parking: formData.parkingInstructions,
              special: formData.specialRequests,
              pets: formData.petsPresent,
              alarmCode: formData.alarmCode
            },
            contact: {
              method: formData.contactMethod,
              time: formData.contactTime
            }
          },
          customer_email: formData.customerEmail,
          customer_name: formData.customerName
        };

        await supabase.functions.invoke('send-transaction-to-zapier', {
          body: {
            transactionData,
            type: 'residential_booking'
          }
        });
      } catch (zapierError) {
        console.error('Error sending to Zapier:', zapierError);
        // Don't fail the main flow if Zapier fails
      }

      toast.success("Information saved successfully!");
      onComplete?.();
    } catch (error) {
      console.error("Error saving information:", error);
      toast.error("Failed to save information. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary to-accent text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Home className="h-5 w-5" />
            Complete Your Service Details
          </CardTitle>
          <CardDescription className="text-primary-foreground/80 text-sm sm:text-base">
            Help us provide the best cleaning service by sharing a few more details
          </CardDescription>
      </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Customer Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-base sm:text-lg font-semibold">
              <User className="h-5 w-5 text-primary" />
              Customer Information
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Full Name</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange("customerName", e.target.value)}
                  placeholder="John Doe"
                  className="text-sm sm:text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email Address *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                  placeholder="john@example.com"
                  className="text-sm sm:text-base"
                  required
                />
              </div>
            </div>
          </div>

          {/* Referral & Marketing */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-base sm:text-lg font-semibold">
            <User className="h-5 w-5 text-primary" />
            Referral & How You Found Us
          </div>
          
          {/* Referral Incentive Banner */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600 font-semibold">🎉 Referral Reward!</span>
            </div>
            <p className="text-green-700 text-sm mb-3">
              Refer someone and when they book a deep clean or recurring service, you'll get <strong>50% off your next deep clean</strong>!
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={generateReferralCode}
              disabled={!formData.customerEmail}
              className="bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
            >
              Generate My Referral Code
            </Button>
            {formData.generatedReferralCode && (
              <div className="mt-2 p-2 bg-white rounded border">
                <span className="text-sm text-muted-foreground">Your referral code: </span>
                <span className="font-mono font-bold text-green-600">{formData.generatedReferralCode}</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="referralCode">Referral Code (Optional)</Label>
              <div className="space-y-2">
                <Input
                  id="referralCode"
                  value={formData.referralCode}
                  onChange={(e) => {
                    handleInputChange("referralCode", e.target.value);
                    // Auto-validate when user stops typing
                    const timeoutId = setTimeout(() => {
                      validateReferralCode(e.target.value);
                    }, 1000);
                    return () => clearTimeout(timeoutId);
                  }}
                  placeholder="Enter referral code"
                  className="text-sm sm:text-base"
                />
                {referralValidation.isChecking && (
                  <p className="text-sm text-muted-foreground">🔄 Checking referral code...</p>
                )}
                {referralValidation.message && (
                  <p className={`text-sm ${referralValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {referralValidation.message}
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>How did you hear about us?</Label>
              <Select value={formData.hearAboutUs} onValueChange={(value) => handleInputChange("hearAboutUs", value)}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="google">Google Search</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="friend_family">Friend/Family Referral</SelectItem>
                  <SelectItem value="online_ad">Online Advertisement</SelectItem>
                  <SelectItem value="flyer">Flyer/Direct Mail</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Service Address */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-base sm:text-lg font-semibold">
            <MapPin className="h-5 w-5 text-primary" />
            Service Address
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="streetAddress">Street Address *</Label>
              <Input
                id="streetAddress"
                value={formData.streetAddress}
                onChange={(e) => handleInputChange("streetAddress", e.target.value)}
                placeholder="123 Main Street"
                className="text-sm sm:text-base"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apartmentUnit">Apartment/Unit</Label>
                <Input
                  id="apartmentUnit"
                  value={formData.apartmentUnit}
                  onChange={(e) => handleInputChange("apartmentUnit", e.target.value)}
                  placeholder="Apt 4B (optional)"
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="San Francisco"
                  className="text-sm sm:text-base"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  placeholder="CA"
                  className="text-sm sm:text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange("zipCode", e.target.value)}
                  placeholder="94102"
                  className="text-sm sm:text-base"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-base sm:text-lg font-semibold">
            <Home className="h-5 w-5 text-primary" />
            Property Details
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dwelling Type</Label>
              <Select value={formData.dwellingType} onValueChange={(value) => handleInputChange("dwellingType", value)}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Select dwelling type" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="single_family">Single-Family Home</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="condo">Condominium</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="duplex">Duplex</SelectItem>
                  <SelectItem value="mobile_home">Mobile Home</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Primary Flooring Type</Label>
              <Select value={formData.flooringType} onValueChange={(value) => handleInputChange("flooringType", value)}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Select flooring type" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="hardwood">Hardwood</SelectItem>
                  <SelectItem value="laminate">Laminate</SelectItem>
                  <SelectItem value="tile">Tile</SelectItem>
                  <SelectItem value="carpet">Carpet</SelectItem>
                  <SelectItem value="vinyl">Vinyl/LVP</SelectItem>
                  <SelectItem value="concrete">Concrete</SelectItem>
                  <SelectItem value="mixed">Mixed Types</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Scheduling Preferences */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-base sm:text-lg font-semibold">
            <Calendar className="h-5 w-5 text-primary" />
            Scheduling Preferences
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Preferred Time Slot</Label>
              <Select value={formData.preferredTimeSlot} onValueChange={(value) => handleInputChange("preferredTimeSlot", value)}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Select time preference" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="morning" className="text-muted-foreground">Morning (8 AM - 12 PM) - Unavailable</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                  <SelectItem value="evening" className="text-muted-foreground">Evening (5 PM - 8 PM) - Unavailable</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>
              Preferred Days {formData.serviceType === "one-time" ? "(select one)" : "(select all that work)"}
            </Label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                <Button
                  key={day}
                  variant={formData.preferredDays.includes(day) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDayToggle(day)}
                  className="text-xs sm:text-sm px-2 py-1"
                >
                  {day.slice(0, 3)}
                </Button>
              ))}
            </div>
            {formData.serviceType === "one-time" && (
              <p className="text-xs text-muted-foreground">
                For one-time services, please select your preferred day for the cleaning.
              </p>
            )}
          </div>
        </div>

        {/* Access & Special Instructions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-base sm:text-lg font-semibold">
            <MessageSquare className="h-5 w-5 text-primary" />
            Access & Special Instructions
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessInstructions">Access Instructions</Label>
              <Textarea
                id="accessInstructions"
                value={formData.accessInstructions}
                onChange={(e) => handleInputChange("accessInstructions", e.target.value)}
                placeholder="How should our team access your property? (gate codes, key location, buzzer instructions, etc.)"
                className="text-sm sm:text-base"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="parkingInstructions">Parking Instructions</Label>
              <Textarea
                id="parkingInstructions"
                value={formData.parkingInstructions}
                onChange={(e) => handleInputChange("parkingInstructions", e.target.value)}
                placeholder="Any specific parking instructions for our team?"
                className="text-sm sm:text-base"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="specialRequests">Special Requests or Areas of Focus</Label>
              <Textarea
                id="specialRequests"
                value={formData.specialRequests}
                onChange={(e) => handleInputChange("specialRequests", e.target.value)}
                placeholder="Any specific areas you'd like us to focus on or special cleaning requests?"
                className="text-sm sm:text-base"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alarmCode">Alarm Code (if applicable)</Label>
                <Input
                  id="alarmCode"
                  type="password"
                  value={formData.alarmCode}
                  onChange={(e) => handleInputChange("alarmCode", e.target.value)}
                  placeholder="Security system code"
                  className="text-sm sm:text-base"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="petsPresent"
                  checked={formData.petsPresent}
                  onCheckedChange={(checked) => handleInputChange("petsPresent", checked as boolean)}
                />
                <Label htmlFor="petsPresent" className="text-sm sm:text-base">Pets will be present during cleaning</Label>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Preferences */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-base sm:text-lg font-semibold">
            <Clock className="h-5 w-5 text-primary" />
            Contact Preferences
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preferred Contact Method</Label>
              <Select value={formData.contactMethod} onValueChange={(value) => handleInputChange("contactMethod", value)}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="How should we contact you?" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="text">Text Message</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Best Time to Contact</Label>
              <Select value={formData.contactTime} onValueChange={(value) => handleInputChange("contactTime", value)}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="When can we reach you?" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="morning">Morning (8 AM - 12 PM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                  <SelectItem value="evening">Evening (5 PM - 8 PM)</SelectItem>
                  <SelectItem value="anytime">Anytime</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.streetAddress || !formData.city || !formData.zipCode || !formData.customerEmail}
            className="w-full text-sm sm:text-base"
            size="lg"
          >
            {isSubmitting ? "Saving..." : "Complete Service Details"}
          </Button>
        
        <p className="text-xs sm:text-sm text-muted-foreground text-center">
          This information helps us provide the best possible service experience
        </p>
      </CardContent>
    </Card>
    </div>
  );
}