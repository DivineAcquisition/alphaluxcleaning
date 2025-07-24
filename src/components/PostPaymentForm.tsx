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
    
    // Scheduling Preferences
    preferredTimeSlot: "",
    preferredDays: [] as string[],
    urgency: "",
    
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

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDayToggle = (day: string) => {
    const newDays = formData.preferredDays.includes(day)
      ? formData.preferredDays.filter(d => d !== day)
      : [...formData.preferredDays, day];
    handleInputChange("preferredDays", newDays);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.streetAddress || !formData.city || !formData.zipCode) {
      toast.error("Please fill in all required address fields");
      return;
    }

    setIsSubmitting(true);

    try {
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
              source: formData.hearAboutUs
            },
            scheduling: {
              preferredTimeSlot: formData.preferredTimeSlot,
              preferredDays: formData.preferredDays,
              urgency: formData.urgency
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
          }
        })
        .eq("stripe_session_id", sessionId);

      if (error) throw error;

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
        {/* Referral & Marketing */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-base sm:text-lg font-semibold">
            <User className="h-5 w-5 text-primary" />
            Referral & How You Found Us
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="referralCode">Referral Code (Optional)</Label>
              <Input
                id="referralCode"
                value={formData.referralCode}
                onChange={(e) => handleInputChange("referralCode", e.target.value)}
                placeholder="Enter referral code"
                className="text-sm sm:text-base"
              />
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preferred Time Slot</Label>
              <Select value={formData.preferredTimeSlot} onValueChange={(value) => handleInputChange("preferredTimeSlot", value)}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Select time preference" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="morning">Morning (8 AM - 12 PM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                  <SelectItem value="evening">Evening (5 PM - 8 PM)</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Service Urgency</Label>
              <Select value={formData.urgency} onValueChange={(value) => handleInputChange("urgency", value)}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="How soon do you need service?" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="asap">ASAP (within 24-48 hours)</SelectItem>
                  <SelectItem value="week">Within this week</SelectItem>
                  <SelectItem value="flexible">Flexible scheduling</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Preferred Days (select all that work)</Label>
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

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.streetAddress || !formData.city || !formData.zipCode}
          className="w-full text-sm sm:text-base"
          size="lg"
        >
          {isSubmitting ? "Saving Information..." : "Complete Booking Setup"}
        </Button>
        
        <p className="text-xs sm:text-sm text-muted-foreground text-center">
          This information helps us provide the best possible service experience
        </p>
      </CardContent>
    </Card>
    </div>
  );
}