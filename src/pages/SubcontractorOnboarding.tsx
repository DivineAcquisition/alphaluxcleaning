import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Zap } from "lucide-react";

const SubcontractorOnboarding = () => {
  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    splitTier: "60_40" as "60_40" | "50_50" | "35_65"
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/subcontractor-auth');
        return;
      }
      
      setUser(session.user);
      
      // Check if already onboarded
      const { data: subcontractorData } = await supabase
        .from('subcontractors')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
      
      if (subcontractorData) {
        navigate('/subcontractor-dashboard');
      }
    };

    checkAuth();
  }, [navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.fullName || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.zipCode) {
        toast({
          variant: "destructive",
          title: "Required Fields Missing",
          description: "Please fill in all required fields.",
        });
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from('subcontractors')
        .insert({
          user_id: user.id,
          full_name: formData.fullName,
          email: user.email!,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          split_tier: formData.splitTier,
          subscription_status: formData.splitTier === '60_40' ? 'active' : 'pending'
        });

      if (error) {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Welcome to the Network!",
          description: "Your subcontractor account has been created successfully.",
        });
        navigate('/subcontractor-dashboard');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const SplitTierCard = ({ tier, title, description, features, isPopular = false }: {
    tier: "60_40" | "50_50" | "35_65";
    title: string;
    description: string;
    features: string[];
    isPopular?: boolean;
  }) => (
    <Card 
      className={`cursor-pointer transition-all ${
        formData.splitTier === tier 
          ? 'ring-2 ring-primary bg-primary/5' 
          : 'hover:shadow-md'
      } ${isPopular ? 'border-primary' : ''}`}
      onClick={() => handleInputChange('splitTier', tier)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={tier} checked={formData.splitTier === tier} />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          {isPopular && <Badge variant="default" className="bg-primary">Popular</Badge>}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome to Our Network!</h1>
          <p className="text-muted-foreground">Let's get you set up as a subcontractor</p>
          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i <= step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Tell us about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main Street"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="San Francisco"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select onValueChange={(value) => handleInputChange('state', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CA">California</SelectItem>
                      <SelectItem value="TX">Texas</SelectItem>
                      <SelectItem value="NY">New York</SelectItem>
                      <SelectItem value="FL">Florida</SelectItem>
                      {/* Add more states as needed */}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder="94102"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleNext}>Next</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5" />
                <span>Choose Your Split Tier</span>
              </CardTitle>
              <CardDescription>
                Select the revenue split that works best for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={formData.splitTier} 
                onValueChange={(value) => handleInputChange('splitTier', value)}
                className="space-y-4"
              >
                <SplitTierCard
                  tier="60_40"
                  title="60/40 Split - FREE"
                  description="Perfect for getting started"
                  features={[
                    "You keep 40% of each job",
                    "No monthly fees",
                    "Accept jobs when available",
                    "Flexible schedule"
                  ]}
                />
                
                <SplitTierCard
                  tier="50_50"
                  title="50/50 Split - $10/month"
                  description="More earnings with guaranteed work"
                  features={[
                    "You keep 50% of each job",
                    "Guaranteed 10 jobs per month",
                    "Priority job assignments",
                    "Higher earning potential"
                  ]}
                  isPopular
                />
                
                <SplitTierCard
                  tier="35_65"
                  title="35/65 Split - $50/month"
                  description="Maximum earnings for professionals"
                  features={[
                    "You keep 65% of each job",
                    "Guaranteed 15 jobs per month",
                    "Highest priority assignments",
                    "Maximum earning potential",
                    "Dedicated support"
                  ]}
                />
              </RadioGroup>
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={handleBack}>Back</Button>
                <Button onClick={handleNext}>Continue</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Review & Confirm</span>
              </CardTitle>
              <CardDescription>
                Please review your information before submitting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Personal Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Name:</strong> {formData.fullName}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Phone:</strong> {formData.phone}</p>
                    <p><strong>Address:</strong> {formData.address}</p>
                    <p><strong>City:</strong> {formData.city}, {formData.state} {formData.zipCode}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Split Tier</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Plan:</strong> {
                      formData.splitTier === '60_40' ? '60/40 Split (FREE)' : 
                      formData.splitTier === '50_50' ? '50/50 Split ($10/month)' : 
                      '35/65 Split ($50/month)'
                    }</p>
                    <p><strong>Your Share:</strong> {
                      formData.splitTier === '60_40' ? '40%' : 
                      formData.splitTier === '50_50' ? '50%' : '65%'
                    }</p>
                    {formData.splitTier === '50_50' && (
                      <p><strong>Guaranteed Jobs:</strong> 10 per month</p>
                    )}
                    {formData.splitTier === '35_65' && (
                      <p><strong>Guaranteed Jobs:</strong> 15 per month</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Important Disclaimer</h4>
                <p className="text-sm text-muted-foreground">
                  By joining our network, you agree to our terms of service. Please note that dropping more than 2 jobs within 48 hours of the scheduled service in any given month will result in temporary restrictions from accepting new jobs for 30 days. You will still be able to complete assigned jobs during this period.
                </p>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>Back</Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? "Creating Account..." : "Complete Registration"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SubcontractorOnboarding;