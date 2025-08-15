import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Building, Calendar, MapPin, Clock, Users, Phone, Mail, FileText, CheckCircle, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trackCommercialEstimateRequest, trackLead } from "@/lib/facebook-pixel";
import { 
  validatePhoneNumber, 
  formatPhoneNumber, 
  validateZipCode, 
  validateEmail, 
  validateBusinessName,
  sanitizeTextInput,
  sanitizeAddress 
} from "@/lib/validation-utils";

interface CommercialEstimateData {
  // Business Information
  businessName: string;
  businessType: string;
  contactPerson: string;
  email: string;
  phone: string;
  
  // Property Information
  address: string;
  city: string;
  state: string;
  zipCode: string;
  squareFootage: string;
  numberOfFloors: number;
  numberOfRestrooms: number;
  numberOfOffices: number;
  
  // Service Requirements
  serviceType: 'commercial' | 'office';
  cleaningType: string;
  frequency: string;
  preferredTime: string;
  specialRequirements: string;
  
  // Walkthrough Scheduling
  preferredWalkthroughDate: string;
  preferredWalkthroughTime: string;
}

interface AvailabilitySlot {
  date: string;
  time: string;
  available: boolean;
}

interface CommercialEstimateFormProps {
  serviceType: 'commercial' | 'office';
  cleaningType?: string;
  frequency?: string;
  squareFootage?: string;
}

export function CommercialEstimateForm({ serviceType, cleaningType = '', frequency = '', squareFootage = '' }: CommercialEstimateFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [formData, setFormData] = useState<CommercialEstimateData>({
    businessName: "",
    businessType: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "California",
    zipCode: "",
    squareFootage: squareFootage,
    numberOfFloors: 1,
    numberOfRestrooms: 1,
    numberOfOffices: 1,
    serviceType: serviceType,
    cleaningType: cleaningType,
    frequency: frequency,
    preferredTime: "",
    specialRequirements: "",
    preferredWalkthroughDate: "",
    preferredWalkthroughTime: ""
  });

  const businessTypes = [
    "Office Building",
    "Medical Facility", 
    "Retail Store",
    "Restaurant",
    "Warehouse",
    "Manufacturing",
    "School/Educational",
    "Government",
    "Non-Profit",
    "Other"
  ];

  const states = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", 
    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", 
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", 
    "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", 
    "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", 
    "New Hampshire", "New Jersey", "New Mexico", "New York", 
    "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", 
    "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", 
    "West Virginia", "Wisconsin", "Wyoming"
  ];

  const squareFootageRanges = [
    "500-1,000 sq ft",
    "1,000-2,500 sq ft",
    "2,500-5,000 sq ft",
    "5,000-10,000 sq ft",
    "10,000-15,000 sq ft",
    "15,000-20,000 sq ft",
    "20,000+ sq ft"
  ];

  const frequencyOptions = [
    "Daily",
    "Weekly", 
    "Bi-weekly",
    "Monthly",
    "Quarterly",
    "One-time",
    "As needed"
  ];

  const cleaningTypes = [
    "Standard",
    "Deep"
  ];

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
      toast({
        title: "Availability Check Failed",
        description: "Unable to check calendar availability. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Check availability when preferred date changes
  useEffect(() => {
    if (formData.preferredWalkthroughDate) {
      checkAvailability(formData.preferredWalkthroughDate);
    }
  }, [formData.preferredWalkthroughDate]);

  // Get availability status for a time slot
  const getTimeSlotAvailability = (timeSlot: string) => {
    const slot = availability.find(a => a.time === timeSlot);
    return slot ? slot.available : true; // Default to available if not checked
  };

  // Enhanced form validation
  const validateForm = (): boolean => {
    // Validate business name
    const businessNameValidation = validateBusinessName(formData.businessName);
    if (!businessNameValidation.isValid) {
      toast({
        title: "Validation Error",
        description: businessNameValidation.message,
        variant: "destructive",
      });
      return false;
    }

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      toast({
        title: "Validation Error", 
        description: emailValidation.message,
        variant: "destructive",
      });
      return false;
    }

    // Validate phone number
    const phoneValidation = validatePhoneNumber(formData.phone);
    if (!phoneValidation.isValid) {
      toast({
        title: "Validation Error",
        description: phoneValidation.message,
        variant: "destructive",
      });
      return false;
    }

    // Validate ZIP code
    if (formData.zipCode) {
      const zipValidation = validateZipCode(formData.zipCode);
      if (!zipValidation.isValid) {
        toast({
          title: "Validation Error",
          description: zipValidation.message,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('commercial_estimates')
        .insert([{
          business_name: sanitizeTextInput(formData.businessName),
          business_type: formData.businessType,
          contact_person: sanitizeTextInput(formData.contactPerson),
          email: formData.email.trim().toLowerCase(),
          phone: formatPhoneNumber(formData.phone),
          address: sanitizeAddress(formData.address),
          city: sanitizeTextInput(formData.city),
          state: formData.state,
          zip_code: formData.zipCode.trim(),
          square_footage: parseInt(formData.squareFootage.replace(/[^\d]/g, '')) || 0,
          number_of_floors: formData.numberOfFloors,
          number_of_restrooms: formData.numberOfRestrooms,
          number_of_offices: formData.numberOfOffices,
          service_type: formData.serviceType,
          cleaning_type: formData.cleaningType,
          frequency: formData.frequency,
          preferred_time: formData.preferredTime,
          special_requirements: formData.specialRequirements,
          preferred_walkthrough_date: formData.preferredWalkthroughDate,
          preferred_walkthrough_time: formData.preferredWalkthroughTime,
          status: 'pending'
        }]);

      if (error) throw error;

      // Track Facebook Pixel events
      trackCommercialEstimateRequest(
        formData.serviceType,
        parseInt(formData.squareFootage.replace(/[^\d]/g, '')) || undefined
      );
      
      trackLead(
        `${formData.serviceType} - ${formData.cleaningType}`,
        undefined // No monetary value for estimate requests
      );

      // Redirect to thank you page
      window.location.href = "/commercial-thank-you";

    } catch (error) {
      console.error('Error submitting estimate request:', error);
      toast({
        title: "Error",
        description: "Failed to submit estimate request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary to-accent text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          {serviceType === 'commercial' ? 'Commercial' : 'Office'} Estimate Request
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Request a walkthrough and custom quote for your {serviceType} space
        </CardDescription>
        <div className="mt-4 p-3 bg-white/10 rounded-lg">
          <p className="text-sm font-medium">🎉 Special Offer: 15% off the first 3 months with 1-year commitment!</p>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building className="h-5 w-5" />
              Business Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type *</Label>
                <Select 
                  value={formData.businessType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, businessType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select here" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {businessTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person *</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setFormData(prev => ({ ...prev, phone: formatted }));
                  }}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
            </div>
          </div>

          {/* Property Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Property Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select 
                  value={formData.state} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select here" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50 max-h-48">
                    {states.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                  placeholder="12345 or 12345-6789"
                  pattern="^\d{5}(-\d{4})?$"
                  title="Please enter a valid ZIP code"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="squareFootage">Square Footage *</Label>
                <Select 
                  value={formData.squareFootage} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, squareFootage: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select here" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {squareFootageRanges.map(range => (
                      <SelectItem key={range} value={range}>{range}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="numberOfFloors">Number of Floors</Label>
                <Input
                  id="numberOfFloors"
                  type="number"
                  min="1"
                  value={formData.numberOfFloors}
                  onChange={(e) => setFormData(prev => ({ ...prev, numberOfFloors: parseInt(e.target.value) || 1 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="numberOfRestrooms">Restrooms</Label>
                <Input
                  id="numberOfRestrooms"
                  type="number"
                  min="1"
                  value={formData.numberOfRestrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, numberOfRestrooms: parseInt(e.target.value) || 1 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="numberOfOffices">Offices/Rooms</Label>
                <Input
                  id="numberOfOffices"
                  type="number"
                  min="1"
                  value={formData.numberOfOffices}
                  onChange={(e) => setFormData(prev => ({ ...prev, numberOfOffices: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
          </div>

          {/* Service Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Service Requirements
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Service Type</Label>
                <Input value={serviceType === 'commercial' ? 'Commercial Cleaning' : 'Office Cleaning'} disabled />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cleaningType">Cleaning Type *</Label>
                <Select 
                  value={formData.cleaningType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, cleaningType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select here" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {cleaningTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency *</Label>
                <Select 
                  value={formData.frequency} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select here" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {frequencyOptions.map(freq => (
                      <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preferredTime">Preferred Cleaning Time</Label>
                <Select 
                  value={formData.preferredTime} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, preferredTime: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select here" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {timeSlots.map(slot => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialRequirements">Special Requirements / Notes</Label>
              <Textarea
                id="specialRequirements"
                value={formData.specialRequirements}
                onChange={(e) => setFormData(prev => ({ ...prev, specialRequirements: e.target.value }))}
                placeholder="Any special cleaning requirements, access instructions, or other important details..."
                rows={3}
              />
            </div>
          </div>

          {/* Walkthrough Scheduling */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Walkthrough
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preferredWalkthroughDate">Preferred Date *</Label>
                <Input
                  id="preferredWalkthroughDate"
                  type="date"
                  value={formData.preferredWalkthroughDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredWalkthroughDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="preferredWalkthroughTime">
                  Preferred Time * 
                  {isCheckingAvailability && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      <Clock className="inline h-3 w-3 animate-spin mr-1" />
                      Checking availability...
                    </span>
                  )}
                </Label>
                <Select 
                  value={formData.preferredWalkthroughTime} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, preferredWalkthroughTime: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select here" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {timeSlots.map(slot => {
                      const isAvailable = getTimeSlotAvailability(slot);
                      return (
                        <SelectItem 
                          key={slot} 
                          value={slot}
                          className={`flex items-center justify-between ${!isAvailable ? 'opacity-50' : ''}`}
                        >
                          <span className="flex items-center gap-2">
                            {isAvailable ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                            {slot}
                            {!isAvailable && <span className="text-xs text-muted-foreground">(Unavailable)</span>}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

          </div>

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Request Walkthrough & Estimate
              </>
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>We'll contact you within 24 hours to confirm your walkthrough appointment.</p>
            <p className="mt-1">
              <Phone className="inline h-4 w-4 mr-1" />
              Have questions? Call us: (281) 201-6112
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}