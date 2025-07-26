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

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch order details and autofill service address
  React.useEffect(() => {
    const fetchOrderDetails = async () => {
      if (sessionId) {
        try {
          const { data, error } = await supabase
            .from("orders")
            .select("frequency, service_details, customer_name, customer_email, customer_phone")
            .eq("stripe_session_id", sessionId)
            .single();

          if (data && !error) {
            console.log("Order data fetched:", data);
            
            // Autofill customer info
            if (data.customer_name) {
              handleInputChange("customerName", data.customer_name);
            }
            if (data.customer_email) {
              handleInputChange("customerEmail", data.customer_email);
            }
            if (data.customer_phone) {
              handleInputChange("customerPhone", data.customer_phone);
            }
            
            // Autofill service address if available
            if (data.service_details && typeof data.service_details === 'object') {
              const serviceDetails = data.service_details as any;
              
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

      // Create booking in GoHighLevel if scheduling data exists
      try {
        const { data: orderData, error: orderFetchError } = await supabase
          .from("orders")
          .select("*")
          .eq("stripe_session_id", sessionId)
          .single();

        if (!orderFetchError && orderData) {
          // Check if this order has scheduling data from the visual scheduler
          const serviceDetails = orderData.service_details as any;
          const hasSchedulingInfo = serviceDetails?.scheduling;
          
          if (hasSchedulingInfo || (formData.streetAddress && formData.customerEmail)) {
            await supabase.functions.invoke('create-gohighlevel-booking', {
              body: {
                customerName: formData.customerName,
                customerEmail: formData.customerEmail,
                customerPhone: formData.customerPhone || '',
                scheduledDate: hasSchedulingInfo?.scheduledDate || '',
                scheduledTime: hasSchedulingInfo?.scheduledTime || '',
                serviceType: orderData.cleaning_type,
                address: {
                  street: formData.streetAddress,
                  city: formData.city,
                  state: formData.state,
                  zipCode: formData.zipCode
                },
                serviceDetails: {
                  squareFootage: orderData.square_footage,
                  addOns: orderData.add_ons,
                  frequency: orderData.frequency,
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
        }
      } catch (ghlError) {
        console.error('Error creating GoHighLevel booking:', ghlError);
        // Don't fail the main flow if GoHighLevel fails
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
              
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                  placeholder="(555) 123-4567"
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
        </CardContent>
      </Card>
    </div>
  );
}