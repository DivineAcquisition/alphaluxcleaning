import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, CheckCircle, MapPin, Clock, User, Phone, Mail, Briefcase, FileImage, AlertCircle, Sparkles, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import FileUpload from "@/components/FileUpload";
import ProgressIndicator from "@/components/ProgressIndicator";
import { applicationToasts } from "@/lib/toast-messages";
import { 
  validatePhoneNumber, 
  formatPhoneNumber, 
  validateZipCode, 
  validateEmail, 
  validateName,
  sanitizeTextInput,
  sanitizeAddress 
} from "@/lib/validation-utils";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { ErrorRecovery } from "@/components/ErrorRecovery";
import { FormFieldError } from "@/components/FormFieldError";
import { US_STATES } from "@/lib/states";

export default function SubcontractorApplication() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSection, setCurrentSection] = useState(1);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  // Initialize form with persistence
  const initialFormData = {
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
    drivers_license_image_url: "",
    background_check_consent: false,
    brand_shirt_consent: false,
    subcontractor_agreement_consent: false
  };

  const { 
    data: formData, 
    updateField, 
    clearData, 
    lastSaved,
    isLoading: isLoadingForm 
  } = useFormPersistence(initialFormData, {
    storageKey: 'subcontractor-application-draft'
  });

  const { 
    validateField, 
    validateForm, 
    hasError, 
    getError, 
    clearErrors 
  } = useFormValidation();

  // Show save confirmation when form is loaded from storage
  useEffect(() => {
    if (!isLoadingForm && lastSaved) {
      toast.info("Draft Restored", {
        description: `Your previous work from ${lastSaved.toLocaleString()} has been restored.`,
        action: {
          label: "Clear Draft",
          onClick: () => {
            clearData();
            clearErrors();
            toast.success("Draft cleared");
          }
        }
      });
    }
  }, [isLoadingForm, lastSaved, clearData, clearErrors]);

  const handleInputChange = (field: string, value: any) => {
    updateField(field as keyof typeof formData, value);
    
    // Real-time validation for immediate feedback
    if (value !== formData[field as keyof typeof formData]) {
      validateField(field, value, { ...formData, [field]: value });
    }
  };

  const handleSubmit = async () => {
    // Clear any previous submission errors
    setSubmissionError(null);
    
    // Validate the entire form using the hook
    if (!validateForm(formData)) {
      toast.error("Please fix the errors below before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Submitting application with data:", {
        ...formData,
        // Don't log sensitive info in production
        email: formData.email ? '***@***.***' : 'empty',
        phone: formData.phone ? '(***) ***-****' : 'empty'
      });

      const { data, error } = await supabase.functions.invoke('submit-subcontractor-application', {
        body: {
          ...formData,
          full_name: sanitizeTextInput(formData.full_name),
          email: formData.email.trim().toLowerCase(),
          phone: formatPhoneNumber(formData.phone),
          address: sanitizeAddress(formData.address),
          city: sanitizeTextInput(formData.city),
          zip_code: formData.zip_code.trim(),
          emergency_contact_name: sanitizeTextInput(formData.emergency_contact_name),
          emergency_contact_phone: formatPhoneNumber(formData.emergency_contact_phone)
        }
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || "Submission failed");
      }

      if (!data?.success) {
        console.error("Submission failed, response:", data);
        throw new Error(data?.error || "Submission failed");
      }

      // Clear the draft on successful submission
      clearData();
      
      // Redirect to thank you page with application ID
      navigate(`/subcontractor-application-thank-you?applicationId=${data.application_id}`);

    } catch (error: any) {
      console.error('Application submission error:', error);
      
      // Set submission error for error recovery component
      setSubmissionError(error.message || "Application submission failed. Please try again.");
      
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetrySubmission = () => {
    setSubmissionError(null);
    handleSubmit();
  };

  const handleSaveDraft = () => {
    toast.success("Draft Saved", {
      description: "Your application has been saved and you can continue later."
    });
  };

  if (isLoadingForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto p-6 space-y-8 max-w-4xl">
        {/* Show error recovery if there's a submission error */}
        {submissionError && (
          <ErrorRecovery
            error={submissionError}
            onRetry={handleRetrySubmission}
            onSaveDraft={handleSaveDraft}
            lastSaved={lastSaved}
            isRetrying={isSubmitting}
          />
        )}

        {/* Auto-save indicator */}
        {lastSaved && !submissionError && (
          <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Save className="h-4 w-4" />
              <span>Auto-saved {lastSaved.toLocaleString()}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearData();
                clearErrors();
                toast.success("Draft cleared");
              }}
            >
              Clear Draft
            </Button>
          </div>
        )}
        {/* Header with Enhanced Styling */}
        <div className="text-center space-y-6 animate-fade-in">
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <UserPlus className="h-10 w-10 text-primary" />
              <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Join Our Professional Team
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            Become a professional cleaning contractor with Bay Area Cleaning Professionals. 
            Build your own business with our support, established client base, and flexible revenue sharing plans.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary">
              Bay Area Cleaning Professionals
            </Badge>
            <Badge variant="outline" className="bg-success/10 border-success/20 text-success">
              Now Hiring
            </Badge>
          </div>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator
          steps={[
            { id: 1, title: "Personal Info", description: "Basic details", status: currentSection >= 1 ? 'completed' : 'upcoming' },
            { id: 2, title: "Requirements", description: "Capabilities", status: currentSection >= 4 ? 'completed' : currentSection === 2 || currentSection === 3 ? 'current' : 'upcoming' },
            { id: 3, title: "Documentation", description: "Upload files", status: currentSection >= 5 ? 'completed' : currentSection === 4 ? 'current' : 'upcoming' },
            { id: 4, title: "Final Review", description: "Submit app", status: currentSection >= 6 ? 'completed' : currentSection === 5 ? 'current' : 'upcoming' }
          ]}
          currentStep={currentSection}
          className="my-8"
        />

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
                    className={hasError('full_name') ? 'border-destructive' : ''}
                  />
                  <FormFieldError error={getError('full_name')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                    className={hasError('email') ? 'border-destructive' : ''}
                  />
                  <FormFieldError error={getError('email')} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      handleInputChange('phone', formatted);
                    }}
                    placeholder="(555) 123-4567"
                    className={hasError('phone') ? 'border-destructive' : ''}
                  />
                  <FormFieldError error={getError('phone')} />
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
                      {US_STATES.map(state => (
                        <SelectItem key={state.abbreviation} value={state.abbreviation}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => handleInputChange('zip_code', e.target.value)}
                    placeholder="12345 or 12345-6789"
                    pattern="^\d{5}(-\d{4})?$"
                    title="Please enter a valid ZIP code"
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
                    className={hasError('why_join_us') ? 'border-destructive' : ''}
                  />
                  <FormFieldError error={getError('why_join_us')} />
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
                  <SelectTrigger className={hasError('availability') ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select your availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time (30+ hours/week)</SelectItem>
                    <SelectItem value="part-time">Part-time (15-30 hours/week)</SelectItem>
                    <SelectItem value="weekends">Weekends only</SelectItem>
                    <SelectItem value="flexible">Flexible schedule</SelectItem>
                  </SelectContent>
                </Select>
                <FormFieldError error={getError('availability')} />
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
                    className={hasError('emergency_contact_name') ? 'border-destructive' : ''}
                  />
                  <FormFieldError error={getError('emergency_contact_name')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">Emergency Contact Phone *</Label>
                  <Input
                    id="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      handleInputChange('emergency_contact_phone', formatted);
                    }}
                    placeholder="(555) 123-4567"
                    className={hasError('emergency_contact_phone') ? 'border-destructive' : ''}
                  />
                  <FormFieldError error={getError('emergency_contact_phone')} />
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
            <CardContent className="p-6 space-y-6">
              {/* Warning Message */}
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-warning mb-1">Required for Application</h4>
                    <p className="text-sm text-warning/80">
                      You must have a valid driver's license AND own reliable vehicle to be eligible for this position. 
                      Applications without both requirements will be automatically rejected.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="has_drivers_license"
                      checked={formData.has_drivers_license}
                      onCheckedChange={(checked) => handleInputChange('has_drivers_license', checked)}
                    />
                    <label htmlFor="has_drivers_license" className="text-sm font-medium">
                      I have a valid driver's license *
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="has_own_vehicle"
                      checked={formData.has_own_vehicle}
                      onCheckedChange={(checked) => handleInputChange('has_own_vehicle', checked)}
                    />
                    <label htmlFor="has_own_vehicle" className="text-sm font-medium">
                      I have my own reliable vehicle *
                    </label>
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

          {/* Driver's License Documentation */}
          <Card className="shadow-lg border-border/50">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <FileImage className="h-5 w-5" />
                Driver's License Documentation
              </CardTitle>
              <CardDescription>
                Upload a clear photo of your valid driver's license
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <FileUpload
                label="Driver's License Photo"
                description="Please upload a clear, readable photo of your driver's license (front side only)"
                onUpload={(url) => handleInputChange('drivers_license_image_url', url)}
                currentUrl={formData.drivers_license_image_url}
                accept="image/*"
                required
              />
            </CardContent>
          </Card>

          {/* Professional Background - Enhanced */}
          <Card className="shadow-lg border-border/50">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Why Work With Us?
              </CardTitle>
              <CardDescription>
                Tell us what motivates you to join our professional cleaning team
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="why_join_us_enhanced">Why do you want to work with us? *</Label>
                <Textarea
                  id="why_join_us_enhanced"
                  value={formData.why_join_us}
                  onChange={(e) => handleInputChange('why_join_us', e.target.value)}
                  placeholder="Share your motivation for joining our team, your career goals, and what you hope to achieve as a professional cleaning contractor..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  This helps us understand your commitment and fit for our team culture.
                </p>
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