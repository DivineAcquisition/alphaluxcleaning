import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, Clock, MessageSquare, User, Home, CheckCircle, Gift, Tag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
const sb = supabase as any;
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
    
    // Marketing Source
    hearAboutUs: "",
    customerEmail: "",
    customerName: "",
    customerPhone: "",
    
    // Contact Preferences
    contactMethod: "",
    contactTime: "",
    accessInstructions: "",
    parkingInstructions: "",
    specialRequests: "",
    petsPresent: false,
    alarmCode: "",
  });

  const [referralCode, setReferralCode] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedReferral, setAppliedReferral] = useState<any>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch order details and autofill service address
  React.useEffect(() => {
    const fetchOrderDetails = async () => {
      if (sessionId) {
        try {
          const { data, error } = await sb
            .from("bookings")
            .select("frequency, property_details, customer_id")
            .eq("stripe_checkout_session_id", sessionId)
            .maybeSingle();

          if (data && !error) {
            console.log("Order data fetched:", data);
            
            // Get customer info
            if (data.customer_id) {
              const { data: customer } = await sb.from("customers").select("*").eq("id", data.customer_id).maybeSingle();
              if (customer) {
                handleInputChange("customerName", customer.name || "");
                handleInputChange("customerEmail", customer.email || "");
                handleInputChange("customerPhone", customer.phone || "");
              }
            }
            
            // Autofill service address if available
            if (data.property_details && typeof data.property_details === 'object') {
              const serviceDetails = data.property_details as any;
              
              // Check for service address in the new structure
              if (serviceDetails.serviceAddress) {
                const addr = serviceDetails.serviceAddress;
                console.log("Auto-filling address from serviceAddress:", addr);
                
                if (addr.street) handleInputChange("streetAddress", addr.street);
                if (addr.apartment) handleInputChange("apartmentUnit", addr.apartment);
                if (addr.city) handleInputChange("city", addr.city);
                if (addr.state) handleInputChange("state", addr.state);
                if (addr.zipCode) handleInputChange("zipCode", addr.zipCode);
              }
              // Also check for address in the old address structure (fallback)
              else if (serviceDetails.address) {
                const addr = serviceDetails.address;
                console.log("Auto-filling address from address field:", addr);
                
                if (addr.street) handleInputChange("streetAddress", addr.street);
                if (addr.apartment) handleInputChange("apartmentUnit", addr.apartment);
                if (addr.city) handleInputChange("city", addr.city);
                if (addr.state) handleInputChange("state", addr.state);
                if (addr.zipCode) handleInputChange("zipCode", addr.zipCode);
              }
            }
          } else {
            console.log("No order data found or error:", error);
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

  const handleApplyReferralCode = async () => {
    toast.error("Referral codes are not available at this time");
  };

  const handleApplyDiscountCode = async () => {
    if (!discountCode.trim()) {
      toast.error("Please enter a discount code");
      return;
    }

    // Check if this is a reward code (starts with FRIEND50)
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

    if (!formData.customerName) {
      toast.error("Please enter your name");
      return;
    }

    console.log('Starting form submission with data:', formData);
    setIsSubmitting(true);

    try {
      // First, get the complete booking data
      const { data: bookingData, error: fetchError } = await supabase
        .from("bookings")
        .select("*")
        .eq("stripe_checkout_session_id", sessionId)
        .single();

      if (fetchError) throw fetchError;

      // Merge new property details with existing ones
      const existingPropertyDetails = (bookingData.property_details && typeof bookingData.property_details === 'object') ? bookingData.property_details : {};
      const updatedPropertyDetails = {
        ...existingPropertyDetails,
        serviceAddress: {
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
        source: formData.hearAboutUs,
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
      };

      // Update customer info
      if (bookingData.customer_id) {
        await supabase
          .from("customers")
          .update({
            email: formData.customerEmail,
            name: formData.customerName,
            phone: formData.customerPhone
          })
          .eq("id", bookingData.customer_id);
      }

      // Update the booking with additional information
      const { error } = await supabase
        .from("bookings")
        .update({
          property_details: updatedPropertyDetails
        })
        .eq("stripe_checkout_session_id", sessionId);

      if (error) throw error;


      // Create booking in GoHighLevel if scheduling data exists
      try {
        if (formData.streetAddress && formData.customerEmail) {
          await supabase.functions.invoke('create-gohighlevel-booking', {
            body: {
              customerName: formData.customerName,
              customerEmail: formData.customerEmail,
              customerPhone: formData.customerPhone || '',
              scheduledDate: '',
              scheduledTime: '',
              serviceType: bookingData.service_type,
              address: {
                street: formData.streetAddress,
                city: formData.city,
                state: formData.state,
                zipCode: formData.zipCode
              },
              serviceDetails: {
                squareFootage: bookingData.sqft_or_bedrooms,
                addOns: bookingData.addons,
                frequency: bookingData.frequency,
                instructions: {
                  special: formData.specialRequests,
                  access: formData.accessInstructions,
                  parking: formData.parkingInstructions,
                  pets: formData.petsPresent
                }
              }
            }
          });
          console.log("Booking created in GoHighLevel successfully");
        }
      } catch (ghlError) {
        console.error('Error creating GoHighLevel booking:', ghlError);
        // Don't fail the main flow if GoHighLevel fails
      }

      toast.success("Information saved successfully!");
      
      // Call the completion callback instead of redirecting
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error saving information:", error);
      toast.error("Failed to save information. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate completion percentage
  const calculateCompletion = () => {
    const requiredFields = ['streetAddress', 'city', 'zipCode', 'customerEmail', 'customerName'];
    const optionalFields = ['dwellingType', 'flooringType', 'hearAboutUs', 'contactMethod'];
    
    const requiredComplete = requiredFields.filter(field => formData[field as keyof typeof formData]).length;
    const optionalComplete = optionalFields.filter(field => formData[field as keyof typeof formData]).length;
    
    const totalRequired = requiredFields.length;
    const totalOptional = optionalFields.length;
    
    const completion = ((requiredComplete * 2 + optionalComplete) / (totalRequired * 2 + totalOptional)) * 100;
    return Math.round(completion);
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
          
          {/* Completion Progress */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Form Completion</span>
              <span className="flex items-center gap-1">
                {calculateCompletion() === 100 && <CheckCircle className="h-4 w-4" />}
                {calculateCompletion()}%
              </span>
            </div>
            <div className="w-full bg-primary-foreground/20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300" 
                style={{ width: `${calculateCompletion()}%` }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="details">Complete Booking</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 sm:space-y-8 mt-6">
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone Number</Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                      placeholder="(857) 754-4557"
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>

          {/* How You Found Us */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-base sm:text-lg font-semibold">
              <User className="h-5 w-5 text-primary" />
              How did you hear about us?
            </div>
            
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={formData.hearAboutUs} onValueChange={(value) => handleInputChange("hearAboutUs", value)}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Select how you found us" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google Search</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="nextdoor">Nextdoor</SelectItem>
                  <SelectItem value="friend_referral">Friend Referral</SelectItem>
                  <SelectItem value="family_referral">Family Referral</SelectItem>
                  <SelectItem value="online_ad">Online Advertisement</SelectItem>
                  <SelectItem value="flyer">Flyer/Door Hanger</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
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
                    <SelectValue placeholder="Select here" />
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
                    <SelectValue placeholder="Select here" />
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
                    <SelectValue placeholder="Select here" />
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
                    <SelectValue placeholder="Select here" />
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}