import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCheck, Car, FileText, Shield } from "lucide-react";

export default function SubcontractorApplication() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    has_drivers_license: false,
    has_own_vehicle: false,
    why_join_us: "",
    previous_cleaning_experience: "",
    availability: "",
    preferred_work_areas: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    can_lift_heavy_items: false,
    comfortable_with_chemicals: false,
    reliable_transportation: false,
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
    
    const requiredBooleans = [
      'has_drivers_license', 'has_own_vehicle', 'can_lift_heavy_items', 
      'comfortable_with_chemicals', 'reliable_transportation', 'background_check_consent',
      'brand_shirt_consent', 'subcontractor_agreement_consent'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast({
          title: "Validation Error",
          description: `Please fill in ${field.replace('_', ' ')}`,
          variant: "destructive",
        });
        return false;
      }
    }

    for (const field of requiredBooleans) {
      if (!formData[field as keyof typeof formData]) {
        toast({
          title: "Validation Error", 
          description: `Please confirm ${field.replace('_', ' ')}`,
          variant: "destructive",
        });
        return false;
      }
    }

    if (!formData.email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('subcontractor_applications')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Application Submitted!",
        description: "Thank you for your application. We'll review it and get back to you soon.",
      });

      // Reset form
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        has_drivers_license: false,
        has_own_vehicle: false,
        why_join_us: "",
        previous_cleaning_experience: "",
        availability: "",
        preferred_work_areas: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        can_lift_heavy_items: false,
        comfortable_with_chemicals: false,
        reliable_transportation: false,
        background_check_consent: false,
        brand_shirt_consent: false,
        subcontractor_agreement_consent: false
      });

    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-4">Join Our Cleaning Team</h1>
          <p className="text-xl text-muted-foreground">
            Apply to become a Bay Area Cleaning Pros subcontractor
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-primary to-accent text-white">
            <CardTitle className="text-2xl flex items-center gap-2">
              <UserCheck className="h-6 w-6" />
              Subcontractor Application
            </CardTitle>
            <CardDescription className="text-primary-foreground/90">
              Complete this application to join our network of professional cleaners
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Requirements
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has_drivers_license"
                      checked={formData.has_drivers_license}
                      onCheckedChange={(checked) => handleInputChange('has_drivers_license', checked)}
                    />
                    <Label htmlFor="has_drivers_license" className="text-sm font-medium">
                      I have a valid driver's license *
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has_own_vehicle"
                      checked={formData.has_own_vehicle}
                      onCheckedChange={(checked) => handleInputChange('has_own_vehicle', checked)}
                    />
                    <Label htmlFor="has_own_vehicle" className="text-sm font-medium">
                      I have my own reliable vehicle *
                    </Label>
                  </div>
                </div>
              </div>

              {/* Application Questions */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-primary">Application Questions</h3>
                
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="why_join_us">Why do you want to join Bay Area Cleaning Pros? *</Label>
                    <Textarea
                      id="why_join_us"
                      value={formData.why_join_us}
                      onChange={(e) => handleInputChange('why_join_us', e.target.value)}
                      placeholder="Tell us what motivates you to join our team..."
                      rows={4}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="previous_cleaning_experience">Previous Cleaning Experience (Optional)</Label>
                    <Textarea
                      id="previous_cleaning_experience"
                      value={formData.previous_cleaning_experience}
                      onChange={(e) => handleInputChange('previous_cleaning_experience', e.target.value)}
                      placeholder="Describe any relevant cleaning experience..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="availability">What is your availability? *</Label>
                    <Textarea
                      id="availability"
                      value={formData.availability}
                      onChange={(e) => handleInputChange('availability', e.target.value)}
                      placeholder="e.g., Monday-Friday 9am-5pm, weekends available..."
                      rows={2}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="preferred_work_areas">Preferred Work Areas (Optional)</Label>
                    <Input
                      id="preferred_work_areas"
                      value={formData.preferred_work_areas}
                      onChange={(e) => handleInputChange('preferred_work_areas', e.target.value)}
                      placeholder="e.g., San Francisco, Oakland, San Jose..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="emergency_contact_name">Emergency Contact Name *</Label>
                      <Input
                        id="emergency_contact_name"
                        value={formData.emergency_contact_name}
                        onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                        placeholder="Contact person name"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="emergency_contact_phone">Emergency Contact Phone *</Label>
                      <Input
                        id="emergency_contact_phone"
                        type="tel"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                        placeholder="(555) 123-4567"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Physical Requirements */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Physical & Safety Requirements
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_lift_heavy_items"
                      checked={formData.can_lift_heavy_items}
                      onCheckedChange={(checked) => handleInputChange('can_lift_heavy_items', checked)}
                    />
                    <Label htmlFor="can_lift_heavy_items" className="text-sm font-medium">
                      I can lift up to 25 pounds regularly *
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="comfortable_with_chemicals"
                      checked={formData.comfortable_with_chemicals}
                      onCheckedChange={(checked) => handleInputChange('comfortable_with_chemicals', checked)}
                    />
                    <Label htmlFor="comfortable_with_chemicals" className="text-sm font-medium">
                      I'm comfortable working with cleaning chemicals *
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="reliable_transportation"
                      checked={formData.reliable_transportation}
                      onCheckedChange={(checked) => handleInputChange('reliable_transportation', checked)}
                    />
                    <Label htmlFor="reliable_transportation" className="text-sm font-medium">
                      I have reliable transportation to job sites *
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="background_check_consent"
                      checked={formData.background_check_consent}
                      onCheckedChange={(checked) => handleInputChange('background_check_consent', checked)}
                    />
                    <Label htmlFor="background_check_consent" className="text-sm font-medium">
                      I consent to a background check if selected *
                    </Label>
                  </div>
                </div>
              </div>

              {/* Agreement */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-primary">Agreement</h3>
                
                <div className="space-y-4 p-6 bg-accent/10 rounded-lg border">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="brand_shirt_consent"
                      checked={formData.brand_shirt_consent}
                      onCheckedChange={(checked) => handleInputChange('brand_shirt_consent', checked)}
                    />
                    <Label htmlFor="brand_shirt_consent" className="text-sm font-medium leading-5">
                      I understand that if accepted, I will be onboarded as a partner/subcontractor and must wear the provided Bay Area Cleaning Pros branded shirt during all jobs *
                    </Label>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="subcontractor_agreement_consent"
                      checked={formData.subcontractor_agreement_consent}
                      onCheckedChange={(checked) => handleInputChange('subcontractor_agreement_consent', checked)}
                    />
                    <Label htmlFor="subcontractor_agreement_consent" className="text-sm font-medium leading-5">
                      I agree to the terms and conditions of the subcontractor agreement and understand my role as an independent contractor *
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1"
                >
                  Back to Home
                </Button>
                
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}