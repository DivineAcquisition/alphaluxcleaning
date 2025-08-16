import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard, FileText, UserCheck, ArrowRight, User, Camera, CreditCard as CreditCardIcon, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ContractorAgreement from "@/components/ContractorAgreement";
import FileUpload from "@/components/FileUpload";
import ProgressIndicator from "@/components/ProgressIndicator";
import { applicationToasts } from "@/lib/toast-messages";
import WelcomePopup from "@/components/WelcomePopup";

const SUBSCRIPTION_TIERS = {
  "60_40": {
    name: "Basic",
    split: "60/40",
    description: "Company 60%, You 40%",
    price: 0,
    features: ["Basic job matching", "Customer support", "Payment processing", "Free to start"]
  },
  "50_50": {
    name: "Standard", 
    split: "50/50",
    description: "Company 50%, You 50%",
    price: 2000, // $20.00 in cents
    features: ["Enhanced job matching", "Priority scheduling", "Customer support", "Marketing support"]
  },
  "40_60": {
    name: "Professional",
    split: "40/60", 
    description: "Company 40%, You 60%",
    price: 5000, // $50.00 in cents
    features: ["High priority jobs", "Advanced scheduling", "Premium marketing", "Dedicated support"]
  },
  "30_70": {
    name: "Elite",
    split: "30/70", 
    description: "Company 30%, You 70%",
    price: 10000, // $100.00 in cents
    features: ["Highest priority jobs", "Premium marketing", "VIP support", "Performance bonuses", "Exclusive opportunities"]
  }
};

export default function SubcontractorOnboardingV2() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentPhase, setCurrentPhase] = useState(1);
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [agreedToContract, setAgreedToContract] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [applicantData, setApplicantData] = useState<any>(null);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [completedSubcontractor, setCompletedSubcontractor] = useState<any>(null);

  // Phase 2 - Profile Setup
  const [profileData, setProfileData] = useState({
    profile_image_url: "",
    biography: ""
  });

  // Phase 3 - Banking & Legal Info
  const [bankingData, setBankingData] = useState({
    legal_name: "",
    date_of_birth: "",
    ssn: "",
    account_number: "",
    routing_number: "",
    background_check_consent: false,
    background_check_copy_consent: false
  });

  const token = searchParams.get('token');
  const applicationId = searchParams.get('application_id');

  useEffect(() => {
    const isDevelopment = import.meta.env.DEV;
    
    if (!token && !isDevelopment) {
      toast.error("Invalid onboarding link - missing token");
      navigate("/");
      return;
    }
    
    if (isDevelopment && !token) {
      // Development mode - create mock applicant data
      setApplicantData({
        id: 'dev-test-001',
        full_name: 'Test Subcontractor User',
        email: 'test-subcontractor@example.com',
        phone: '555-0123',
        address: '123 Test Street',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94102',
        status: 'approved'
      });
      setBankingData(prev => ({ 
        ...prev, 
        legal_name: 'Test Subcontractor User' 
      }));
      return;
    }
    
    validateTokenAndFetchData();
  }, [token]);

  const validateTokenAndFetchData = async () => {
    if (!token) return;
    
    try {
      // Validate token using the secure function
      const { data: tokenValidation, error: tokenError } = await supabase
        .rpc('validate_onboarding_token', { p_token: token });

      if (tokenError) {
        console.error("Token validation error:", tokenError);
        toast.error("Failed to validate onboarding link");
        navigate("/");
        return;
      }

      const validation = tokenValidation as any;
      if (!validation?.valid) {
        toast.error(validation?.error || "Invalid or expired onboarding link");
        navigate("/");
        return;
      }

      // Set application data from the token validation
      setApplicantData(validation.application_data);
      setBankingData(prev => ({ 
        ...prev, 
        legal_name: validation.application_data.full_name 
      }));
    } catch (error) {
      console.error("Error validating token:", error);
      toast.error("Failed to validate onboarding link");
      navigate("/");
    }
  };

  const handleTierSelection = (tier: string) => {
    setSelectedTier(tier);
    setCurrentPhase(2);
  };

  const validateProfileSetup = () => {
    if (!profileData.profile_image_url) {
      applicationToasts.onboarding.profileRequired();
      return false;
    }
    if (!profileData.biography.trim()) {
      applicationToasts.onboarding.profileRequired();
      return false;
    }
    if (profileData.biography.length < 50) {
      toast.error("Biography should be at least 50 characters long");
      return false;
    }
    return true;
  };

  const handleProfileSetup = () => {
    if (!validateProfileSetup()) return;
    setCurrentPhase(3);
  };

  const validateBankingInfo = () => {
    const required = ['legal_name', 'date_of_birth', 'ssn', 'account_number', 'routing_number'];
    
    for (const field of required) {
      if (!bankingData[field as keyof typeof bankingData]) {
        applicationToasts.onboarding.bankingRequired();
        return false;
      }
    }

    if (!bankingData.background_check_consent) {
      toast.error("You must consent to a background check to proceed");
      return false;
    }

    if (bankingData.ssn.length !== 9) {
      toast.error("Please enter your full 9-digit Social Security Number");
      return false;
    }

    if (bankingData.account_number.length < 8) {
      toast.error("Please enter your full bank account number");
      return false;
    }

    if (bankingData.routing_number.length !== 9) {
      toast.error("Routing number must be exactly 9 digits");
      return false;
    }

    return true;
  };

  const completeOnboarding = async () => {
    if (!validateBankingInfo()) return;

    setIsProcessing(true);
    try {
      // Create subcontractor account with all collected data
      const { data, error } = await supabase.functions.invoke('complete-subcontractor-onboarding', {
        body: {
          token: token,
          selected_tier: selectedTier,
          profile_data: profileData,
          banking_data: bankingData,
          application_data: applicantData
        }
      });

      if (error) throw error;

      // Show welcome popup with training and supplies info
      if (data.show_welcome_popup) {
        setCompletedSubcontractor(data.subcontractor);
        setShowWelcomePopup(true);
        applicationToasts.onboarding.welcomeSuccess();
      } else if (data.redirect_to_dashboard) {
        // Direct redirect without popup
        navigate("/subcontractor-dashboard");
      } else if (data.url) {
        // Redirect to Stripe checkout for paid tiers
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Onboarding completion error:", error);
      toast.error(error.message || "Failed to complete onboarding");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!applicantData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <UserCheck className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Welcome to Bay Area Cleaning Professionals!
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Congratulations {applicantData.full_name}! Your application has been approved. 
            Complete your 3-phase onboarding to start accepting jobs.
          </p>
          <Badge variant="outline" className="bg-success/10 border-success/20 text-success">
            Application Approved
          </Badge>
        </div>

        {/* Enhanced Progress Steps */}
        <ProgressIndicator
          steps={[
            { 
              id: 1, 
              title: "Plan & Account", 
              description: "Choose your revenue share", 
              status: currentPhase > 1 ? 'completed' : currentPhase === 1 ? 'current' : 'upcoming' 
            },
            { 
              id: 2, 
              title: "Profile Setup", 
              description: "Photo & biography", 
              status: currentPhase > 2 ? 'completed' : currentPhase === 2 ? 'current' : 'upcoming' 
            },
            { 
              id: 3, 
              title: "Payment & Legal", 
              description: "Banking & background check", 
              status: currentPhase >= 3 ? 'current' : 'upcoming' 
            }
          ]}
          currentStep={currentPhase}
          className="my-8"
        />

        {/* Phase 1: Plan Selection */}
        {currentPhase === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Choose Your Revenue Share Plan</h2>
              <p className="text-muted-foreground">Select the plan that works best for your business goals</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(SUBSCRIPTION_TIERS).map(([tier, info]) => (
                <Card 
                  key={tier} 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    tier === "50_50" ? "border-primary shadow-md" : "hover:border-primary/50"
                  }`}
                  onClick={() => handleTierSelection(tier)}
                >
                  <CardHeader className="text-center">
                    {tier === "50_50" && (
                      <Badge className="mb-2 self-center">Most Popular</Badge>
                    )}
                    <CardTitle className="text-lg">{info.name}</CardTitle>
                    <div className="text-2xl font-bold text-primary">{info.split}</div>
                    <CardDescription className="text-xs">{info.description}</CardDescription>
                    <div className="text-xl font-bold">
                      {info.price === 0 ? "Free" : `$${(info.price / 100).toFixed(0)}/mo`}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {info.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-xs">
                          <CheckCircle className="h-3 w-3 text-success" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full mt-3 text-xs" variant={tier === "50_50" ? "default" : "outline"}>
                      Select {info.name}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Phase 2: Profile Setup */}
        {currentPhase === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Create Your Professional Profile</h2>
              <p className="text-muted-foreground">This information will be displayed to customers when you're assigned jobs</p>
            </div>
            
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Profile Photo & Biography
                </CardTitle>
                <CardDescription>
                  Upload a professional photo and write a brief biography for customers to see
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FileUpload
                  label="Profile Photo"
                  description="Upload a professional headshot that customers will see when you're assigned to their job"
                  onUpload={(url) => setProfileData(prev => ({ ...prev, profile_image_url: url }))}
                  currentUrl={profileData.profile_image_url}
                  accept="image/*"
                  required
                />
                
                <div className="space-y-2">
                  <Label htmlFor="biography">Professional Biography *</Label>
                  <Textarea
                    id="biography"
                    value={profileData.biography}
                    onChange={(e) => setProfileData(prev => ({ ...prev, biography: e.target.value }))}
                    placeholder="Write a brief professional biography that customers will see. Include your experience, work style, and what makes you special as a cleaning professional..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    {profileData.biography.length}/200+ characters (minimum 50 characters required)
                  </p>
                </div>

                <Button 
                  onClick={handleProfileSetup}
                  disabled={!profileData.profile_image_url || !profileData.biography.trim()}
                  size="lg"
                  className="w-full"
                >
                  <User className="h-5 w-5 mr-2" />
                  Continue to Payment Setup
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Phase 3: Banking & Legal Information */}
        {currentPhase === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Banking & Legal Information</h2>
              <p className="text-muted-foreground">Set up direct deposit and complete background check requirements</p>
            </div>
            
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCardIcon className="h-5 w-5" />
                  Direct Deposit & Legal Details
                </CardTitle>
                <CardDescription>
                  Provide banking information for payments and legal details for background verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Legal Name Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Legal Name Required</h4>
                      <p className="text-sm text-blue-800">
                        Your background check requires your legal name. If you prefer a nickname, 
                        you can change it after your background check clears.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="legal_name">Legal Name *</Label>
                    <Input
                      id="legal_name"
                      value={bankingData.legal_name}
                      onChange={(e) => setBankingData(prev => ({ ...prev, legal_name: e.target.value }))}
                      placeholder="Full legal name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={bankingData.date_of_birth}
                      onChange={(e) => setBankingData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ssn">Social Security Number *</Label>
                    <Input
                      id="ssn"
                      value={bankingData.ssn}
                      onChange={(e) => setBankingData(prev => ({ ...prev, ssn: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                      placeholder="123456789"
                      maxLength={9}
                      type="password"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your 9-digit SSN (no spaces or dashes)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="routing_number">Bank Routing Number *</Label>
                    <Input
                      id="routing_number"
                      value={bankingData.routing_number}
                      onChange={(e) => setBankingData(prev => ({ ...prev, routing_number: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                      placeholder="123456789"
                      maxLength={9}
                    />
                    <p className="text-xs text-muted-foreground">
                      9-digit routing number found on your checks
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_number">Bank Account Number *</Label>
                  <Input
                    id="account_number"
                    value={bankingData.account_number}
                    onChange={(e) => setBankingData(prev => ({ ...prev, account_number: e.target.value.replace(/\D/g, '') }))}
                    placeholder="1234567890"
                    type="password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your full bank account number for direct deposit
                  </p>
                </div>

                {/* Consent Checkboxes */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="background_check_consent"
                      checked={bankingData.background_check_consent}
                      onChange={(e) => setBankingData(prev => ({ ...prev, background_check_consent: e.target.checked }))}
                      className="mt-1"
                    />
                    <label htmlFor="background_check_consent" className="text-sm leading-relaxed">
                      I consent to a background check being performed as part of the hiring process *
                    </label>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="background_check_copy_consent"
                      checked={bankingData.background_check_copy_consent}
                      onChange={(e) => setBankingData(prev => ({ ...prev, background_check_copy_consent: e.target.checked }))}
                      className="mt-1"
                    />
                    <label htmlFor="background_check_copy_consent" className="text-sm leading-relaxed">
                      I would like to receive a copy of my background check results if hired
                    </label>
                  </div>
                </div>

                <Button 
                  onClick={completeOnboarding}
                  disabled={isProcessing || !validateBankingInfo()}
                  size="lg"
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-background border-t-transparent mr-2" />
                      Processing...
                    </>
                  ) : selectedTier === "60_40" ? (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Complete Onboarding
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Continue to Payment
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Welcome Popup */}
        <WelcomePopup
          isOpen={showWelcomePopup}
          onClose={() => setShowWelcomePopup(false)}
          subcontractorName={completedSubcontractor?.full_name || applicantData?.full_name || ""}
          onProceedToDashboard={() => {
            setShowWelcomePopup(false);
            navigate("/subcontractor-dashboard");
          }}
        />
      </div>
    </div>
  );
}