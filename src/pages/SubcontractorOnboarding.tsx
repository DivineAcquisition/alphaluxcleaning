import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard, FileText, UserCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ContractorAgreement from "@/components/ContractorAgreement";

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

export default function SubcontractorOnboarding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [agreedToContract, setAgreedToContract] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [applicantData, setApplicantData] = useState<any>(null);

  const token = searchParams.get('token');
  const applicationId = searchParams.get('application_id');

  useEffect(() => {
    const isDevelopment = import.meta.env.DEV;
    
    if ((!token || !applicationId) && !isDevelopment) {
      toast.error("Invalid onboarding link");
      navigate("/");
      return;
    }

    if (isDevelopment && (!token || !applicationId)) {
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
      return;
    }

    // Fetch application data
    fetchApplicationData();
  }, [token, applicationId]);

  const fetchApplicationData = async () => {
    try {
      const { data, error } = await supabase
        .from("subcontractor_applications")
        .select("*")
        .eq("id", applicationId)
        .eq("status", "approved")
        .single();

      if (error || !data) {
        toast.error("Application not found or not approved");
        navigate("/");
        return;
      }

      setApplicantData(data);
    } catch (error) {
      console.error("Error fetching application:", error);
      toast.error("Failed to load application data");
      navigate("/");
    }
  };

  const handleTierSelection = (tier: string) => {
    setSelectedTier(tier);
    setCurrentStep(2);
  };

  const handleContractAgreement = () => {
    if (!agreedToContract) {
      toast.error("Please read and agree to the Independent Contractor Agreement");
      return;
    }
    if (selectedTier === "60_40") {
      // Free tier - proceed directly to account creation
      createSubcontractorAccount();
    } else {
      setCurrentStep(3);
    }
  };

  const handlePayment = async () => {
    if (!selectedTier || selectedTier === "60_40") return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-subcontractor-subscription', {
        body: {
          splitTier: selectedTier,
          subcontractorData: {
            full_name: applicantData.full_name,
            email: applicantData.email,
            phone: applicantData.phone,
            address: applicantData.address,
            city: applicantData.city,
            state: applicantData.state,
            zip_code: applicantData.zip_code
          }
        }
      });

      if (error) throw error;

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Failed to process payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const createSubcontractorAccount = async () => {
    setIsProcessing(true);
    try {
      // For free tier, we need to create the account directly
      const { data, error } = await supabase.functions.invoke('process-subcontractor-payment', {
        body: {
          session_id: "free_tier_" + applicationId,
          application_data: applicantData,
          split_tier: selectedTier
        }
      });

      if (error) throw error;

      toast.success("Account created successfully! You can now log in to your dashboard.");
      navigate("/auth");
    } catch (error: any) {
      console.error("Account creation error:", error);
      toast.error(error.message || "Failed to create account");
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
              Welcome to AlphaLux Cleaning!
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Congratulations {applicantData.full_name}! Your application has been approved. 
            Complete your onboarding to start accepting jobs.
          </p>
          <Badge variant="outline" className="bg-success/10 border-success/20 text-success">
            Application Approved
          </Badge>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-8 py-6">
          <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
              {currentStep > 1 ? <CheckCircle className="h-5 w-5" /> : '1'}
            </div>
            <span className="text-sm font-medium">Choose Plan</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
              {currentStep > 2 ? <CheckCircle className="h-5 w-5" /> : '2'}
            </div>
            <span className="text-sm font-medium">Agreement</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 3 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
              3
            </div>
            <span className="text-sm font-medium">Payment</span>
          </div>
        </div>

        {/* Step 1: Plan Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Choose Your Revenue Share Plan</h2>
              <p className="text-muted-foreground">Select the plan that works best for your business goals</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {Object.entries(SUBSCRIPTION_TIERS).map(([tier, info]) => (
                <Card 
                  key={tier} 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    tier === "70_30" ? "border-primary shadow-md" : "hover:border-primary/50"
                  }`}
                  onClick={() => handleTierSelection(tier)}
                >
                  <CardHeader className="text-center">
                    {tier === "70_30" && (
                      <Badge className="mb-2 self-center">Most Popular</Badge>
                    )}
                    <CardTitle className="text-xl">{info.name}</CardTitle>
                    <div className="text-3xl font-bold text-primary">{info.split}</div>
                    <CardDescription>{info.description}</CardDescription>
                    <div className="text-2xl font-bold">
                      {info.price === 0 ? "Free" : `$${(info.price / 100).toFixed(2)}/month`}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {info.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-success" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full mt-4" variant={tier === "70_30" ? "default" : "outline"}>
                      Select {info.name}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Contract Agreement */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Independent Contractor Agreement</h2>
              <p className="text-muted-foreground">Please review and agree to the contract terms</p>
            </div>
            
            <ContractorAgreement 
              contractorName={applicantData.full_name}
              onAgreementChange={setAgreedToContract}
              agreed={agreedToContract}
            />
            
            <div className="flex justify-center">
              <Button 
                onClick={handleContractAgreement}
                disabled={!agreedToContract || isProcessing}
                size="lg"
                className="min-w-[200px]"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-background border-t-transparent mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5 mr-2" />
                    Continue
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {currentStep === 3 && selectedTier !== "60_40" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Complete Your Subscription</h2>
              <p className="text-muted-foreground">
                Subscribe to the {SUBSCRIPTION_TIERS[selectedTier as keyof typeof SUBSCRIPTION_TIERS].name} plan 
                to start accepting jobs
              </p>
            </div>
            
            <Card className="max-w-lg mx-auto">
              <CardHeader className="text-center">
                <CardTitle>
                  {SUBSCRIPTION_TIERS[selectedTier as keyof typeof SUBSCRIPTION_TIERS].name} Plan
                </CardTitle>
                <div className="text-3xl font-bold text-primary">
                  ${(SUBSCRIPTION_TIERS[selectedTier as keyof typeof SUBSCRIPTION_TIERS].price / 100).toFixed(2)}/month
                </div>
                <CardDescription>
                  {SUBSCRIPTION_TIERS[selectedTier as keyof typeof SUBSCRIPTION_TIERS].description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {SUBSCRIPTION_TIERS[selectedTier as keyof typeof SUBSCRIPTION_TIERS].features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={handlePayment}
                  disabled={isProcessing}
                  size="lg"
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-background border-t-transparent mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Subscribe Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}