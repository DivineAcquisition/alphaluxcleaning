import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Building, Calendar, MapPin, Clock, Users, Phone, Mail, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  squareFootage: number;
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
  alternativeDate: string;
  alternativeTime: string;
}

interface CommercialEstimateFormProps {
  serviceType: 'commercial' | 'office';
  cleaningType: string;
  frequency: string;
  squareFootage: number;
}

export function CommercialEstimateForm({ serviceType, cleaningType, frequency, squareFootage }: CommercialEstimateFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    preferredWalkthroughTime: "",
    alternativeDate: "",
    alternativeTime: ""
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

  const timeSlots = [
    "Early Morning (6-9 AM)",
    "Morning (9 AM-12 PM)",
    "Afternoon (12-5 PM)",
    "Evening (5-8 PM)",
    "After Hours (8 PM+)"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('commercial_estimates')
        .insert([{
          business_name: formData.businessName,
          business_type: formData.businessType,
          contact_person: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          square_footage: formData.squareFootage,
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
          alternative_date: formData.alternativeDate,
          alternative_time: formData.alternativeTime,
          status: 'pending'
        }]);

      if (error) throw error;

      toast({
        title: "Estimate Request Submitted!",
        description: "We'll contact you within 24 hours to schedule your walkthrough.",
        duration: 5000,
      });

      // Reset form
      setFormData({
        ...formData,
        businessName: "",
        businessType: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        zipCode: "",
        specialRequirements: "",
        preferredWalkthroughDate: "",
        preferredWalkthroughTime: "",
        alternativeDate: "",
        alternativeTime: ""
      });

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
                    <SelectValue placeholder="Select business type" />
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
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
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
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="squareFootage">Square Footage</Label>
                <Input
                  id="squareFootage"
                  type="number"
                  value={formData.squareFootage}
                  onChange={(e) => setFormData(prev => ({ ...prev, squareFootage: parseInt(e.target.value) || 0 }))}
                />
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service Type</Label>
                <Input value={serviceType === 'commercial' ? 'Commercial Cleaning' : 'Office Cleaning'} disabled />
              </div>
              
              <div className="space-y-2">
                <Label>Cleaning Type</Label>
                <Input value={cleaningType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} disabled />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Input value={frequency?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} disabled />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="preferredTime">Preferred Cleaning Time</Label>
                <Select 
                  value={formData.preferredTime} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, preferredTime: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select preferred time" />
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
                <Label htmlFor="preferredWalkthroughTime">Preferred Time *</Label>
                <Select 
                  value={formData.preferredWalkthroughTime} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, preferredWalkthroughTime: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select preferred time" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {timeSlots.map(slot => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alternativeDate">Alternative Date</Label>
                <Input
                  id="alternativeDate"
                  type="date"
                  value={formData.alternativeDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, alternativeDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="alternativeTime">Alternative Time</Label>
                <Select 
                  value={formData.alternativeTime} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, alternativeTime: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select alternative time" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {timeSlots.map(slot => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
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