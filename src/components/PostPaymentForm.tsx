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
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary to-accent text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Complete Your Service Details
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Help us provide the best cleaning service by sharing a few more details
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        {/* Service Address */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <MapPin className="h-5 w-5 text-primary" />
            Service Address
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="streetAddress">Street Address *</Label>
              <Input
                id="streetAddress"
                value={formData.streetAddress}
                onChange={(e) => handleInputChange("streetAddress", e.target.value)}
                placeholder="123 Main Street"
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
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="San Francisco"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                placeholder="CA"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => handleInputChange("zipCode", e.target.value)}
                placeholder="94102"
                required
              />
            </div>
          </div>
        </div>

        {/* Scheduling Preferences */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Calendar className="h-5 w-5 text-primary" />
            Scheduling Preferences
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preferred Time Slot</Label>
              <Select value={formData.preferredTimeSlot} onValueChange={(value) => handleInputChange("preferredTimeSlot", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time preference" />
                </SelectTrigger>
                <SelectContent>
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
                <SelectTrigger>
                  <SelectValue placeholder="How soon do you need service?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asap">ASAP (within 24-48 hours)</SelectItem>
                  <SelectItem value="week">Within this week</SelectItem>
                  <SelectItem value="flexible">Flexible scheduling</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Preferred Days (select all that work)</Label>
            <div className="grid grid-cols-4 gap-2">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                <Button
                  key={day}
                  variant={formData.preferredDays.includes(day) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDayToggle(day)}
                  className="text-xs"
                >
                  {day.slice(0, 3)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Access & Special Instructions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
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
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alarmCode">Alarm Code (if applicable)</Label>
                <Input
                  id="alarmCode"
                  type="password"
                  value={formData.alarmCode}
                  onChange={(e) => handleInputChange("alarmCode", e.target.value)}
                  placeholder="Security system code"
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="petsPresent"
                  checked={formData.petsPresent}
                  onCheckedChange={(checked) => handleInputChange("petsPresent", checked as boolean)}
                />
                <Label htmlFor="petsPresent">Pets will be present during cleaning</Label>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Preferences */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="h-5 w-5 text-primary" />
            Contact Preferences
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preferred Contact Method</Label>
              <Select value={formData.contactMethod} onValueChange={(value) => handleInputChange("contactMethod", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="How should we contact you?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="text">Text Message</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Best Time to Contact</Label>
              <Select value={formData.contactTime} onValueChange={(value) => handleInputChange("contactTime", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="When can we reach you?" />
                </SelectTrigger>
                <SelectContent>
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
          className="w-full"
          size="lg"
        >
          {isSubmitting ? "Saving Information..." : "Complete Booking Setup"}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          This information helps us provide the best possible service experience
        </p>
      </CardContent>
    </Card>
  );
}