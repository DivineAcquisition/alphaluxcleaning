import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, CheckCircle, MapPin, Clock, User, Phone, Mail, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function SubcontractorApplication() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    why_join_us: "",
    previous_cleaning_experience: "",
    availability: "",
    preferred_work_areas: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    has_drivers_license: false,
    has_own_vehicle: false,
    reliable_transportation: false,
    can_lift_heavy_items: false,
    comfortable_with_chemicals: false,
    background_check_consent: false,
    brand_shirt_consent: false,
    subcontractor_agreement_consent: false
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const requiredFields = [
      'full_name', 'email', 'phone', 'why_join_us', 'availability',
      'emergency_contact_name', 'emergency_contact_phone'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast.error(`Please fill in ${field.replace('_', ' ')}`);
        return false;
      }
    }

    const requiredConsents = [
      'background_check_consent', 'brand_shirt_consent', 'subcontractor_agreement_consent'
    ];

    for (const consent of requiredConsents) {
      if (!formData[consent as keyof typeof formData]) {
        toast.error(`Please provide all required consents`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-subcontractor-application', {
        body: formData
      });

      if (error) throw error;

      toast.success(data.message || "Application submitted successfully!");
      
      // Reset form
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        why_join_us: "",
        previous_cleaning_experience: "",
        availability: "",
        preferred_work_areas: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        has_drivers_license: false,
        has_own_vehicle: false,
        reliable_transportation: false,
        can_lift_heavy_items: false,
        comfortable_with_chemicals: false,
        background_check_consent: false,
        brand_shirt_consent: false,
        subcontractor_agreement_consent: false
      });

    } catch (error: any) {
      console.error('Application submission error:', error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <UserPlus className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Subcontractor Application
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join our team of professional cleaning contractors and build your own business with our support and established client base.
          </p>
          <Badge variant="outline" className="bg-primary/10">
            Bay Area Cleaning Professionals
          </Badge>
        </div>

        {/* Application Form */}
        <div className="grid gap-6">
          {/* Personal Information */}
          <Card className="shadow-lg border-border/50">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Tell us about yourself and your contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Main Street"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="San Francisco"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CA">California</SelectItem>
                      <SelectItem value="NV">Nevada</SelectItem>
                      <SelectItem value="OR">Oregon</SelectItem>
                      <SelectItem value="WA">Washington</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => handleInputChange('zip_code', e.target.value)}
                    placeholder="94102"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Background */}
          <Card className="shadow-lg border-border/50">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Professional Background
              </CardTitle>
              <CardDescription>
                Share your experience and motivation for joining our team
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="why_join_us">Why do you want to join our team? *</Label>
                <Textarea
                  id="why_join_us"
                  value={formData.why_join_us}
                  onChange={(e) => handleInputChange('why_join_us', e.target.value)}
                  placeholder="Tell us what motivates you to work with us..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="previous_cleaning_experience">Previous Cleaning Experience</Label>
                <Textarea
                  id="previous_cleaning_experience"
                  value={formData.previous_cleaning_experience}
                  onChange={(e) => handleInputChange('previous_cleaning_experience', e.target.value)}
                  placeholder="Describe any relevant cleaning or service experience..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Availability & Preferences */}
          <Card className="shadow-lg border-border/50">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Availability & Preferences
              </CardTitle>
              <CardDescription>
                Let us know when you're available and your preferred work areas
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="availability">Availability *</Label>
                <Select value={formData.availability} onValueChange={(value) => handleInputChange('availability', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time (30+ hours/week)</SelectItem>
                    <SelectItem value="part-time">Part-time (15-30 hours/week)</SelectItem>
                    <SelectItem value="weekends">Weekends only</SelectItem>
                    <SelectItem value="flexible">Flexible schedule</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferred_work_areas">Preferred Work Areas</Label>
                <Textarea
                  id="preferred_work_areas"
                  value={formData.preferred_work_areas}
                  onChange={(e) => handleInputChange('preferred_work_areas', e.target.value)}
                  placeholder="List cities or areas where you prefer to work..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="shadow-lg border-border/50">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Emergency Contact
              </CardTitle>
              <CardDescription>
                Provide emergency contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Emergency Contact Name *</Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">Emergency Contact Phone *</Label>
                  <Input
                    id="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements & Capabilities */}
          <Card className="shadow-lg border-border/50">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Requirements & Capabilities
              </CardTitle>
              <CardDescription>
                Please confirm your capabilities and qualifications
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="has_drivers_license"
                      checked={formData.has_drivers_license}
                      onCheckedChange={(checked) => handleInputChange('has_drivers_license', checked)}
                    />
                    <label htmlFor="has_drivers_license" className="text-sm">I have a valid driver's license</label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="has_own_vehicle"
                      checked={formData.has_own_vehicle}
                      onCheckedChange={(checked) => handleInputChange('has_own_vehicle', checked)}
                    />
                    <label htmlFor="has_own_vehicle" className="text-sm">I have my own reliable vehicle</label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="reliable_transportation"
                      checked={formData.reliable_transportation}
                      onCheckedChange={(checked) => handleInputChange('reliable_transportation', checked)}
                    />
                    <label htmlFor="reliable_transportation" className="text-sm">I have reliable transportation to job sites</label>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="can_lift_heavy_items"
                      checked={formData.can_lift_heavy_items}
                      onCheckedChange={(checked) => handleInputChange('can_lift_heavy_items', checked)}
                    />
                    <label htmlFor="can_lift_heavy_items" className="text-sm">I can lift heavy items (up to 50 lbs)</label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="comfortable_with_chemicals"
                      checked={formData.comfortable_with_chemicals}
                      onCheckedChange={(checked) => handleInputChange('comfortable_with_chemicals', checked)}
                    />
                    <label htmlFor="comfortable_with_chemicals" className="text-sm">I'm comfortable working with cleaning chemicals</label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agreements & Consents */}
          <Card className="shadow-lg border-border/50">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Required Agreements
              </CardTitle>
              <CardDescription>
                Please review and agree to the following terms
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="background_check_consent"
                    checked={formData.background_check_consent}
                    onCheckedChange={(checked) => handleInputChange('background_check_consent', checked)}
                    className="mt-1"
                  />
                  <label htmlFor="background_check_consent" className="text-sm leading-relaxed">
                    I consent to a background check being performed as part of the application process *
                  </label>
                </div>
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="brand_shirt_consent"
                    checked={formData.brand_shirt_consent}
                    onCheckedChange={(checked) => handleInputChange('brand_shirt_consent', checked)}
                    className="mt-1"
                  />
                  <label htmlFor="brand_shirt_consent" className="text-sm leading-relaxed">
                    I agree to wear Bay Area Cleaning Professionals branded shirts during work *
                  </label>
                </div>
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="subcontractor_agreement_consent"
                    checked={formData.subcontractor_agreement_consent}
                    onCheckedChange={(checked) => handleInputChange('subcontractor_agreement_consent', checked)}
                    className="mt-1"
                  />
                  <label htmlFor="subcontractor_agreement_consent" className="text-sm leading-relaxed">
                    I understand that if approved, I will need to sign a 1099 Independent Contractor Agreement *
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="lg"
              className="min-w-[250px]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-background border-t-transparent mr-2" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}