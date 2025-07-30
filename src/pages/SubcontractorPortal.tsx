import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Navigation } from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { User, LogIn, UserPlus, FileCheck, Truck, Shield, Shirt, Users } from "lucide-react";

const SubcontractorPortal = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Application form state
  const [applicationData, setApplicationData] = useState({
    full_name: "",
    email: "",
    phone: "",
    why_join_us: "",
    previous_cleaning_experience: "",
    availability: "",
    preferred_work_areas: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    has_drivers_license: false,
    has_own_vehicle: false,
    can_lift_heavy_items: false,
    comfortable_with_chemicals: false,
    reliable_transportation: false,
    background_check_consent: false,
    brand_shirt_consent: false,
    subcontractor_agreement_consent: false
  });

  useEffect(() => {
    // Check if user is already logged in and is a subcontractor
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: subcontractorData } = await supabase
          .from('subcontractors')
          .select('id')
          .eq('user_id', session.user.id)
          .single();
        
        if (subcontractorData) {
          navigate('/subcontractor-dashboard');
        }
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        navigate('/subcontractor-dashboard');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/subcontractor-dashboard`
        }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Sign Up Failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Check Your Email",
          description: "Please check your email and click the confirmation link to complete your registration.",
        });
        setActiveTab("application");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign Up Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate required consents
    if (!applicationData.background_check_consent || 
        !applicationData.brand_shirt_consent || 
        !applicationData.subcontractor_agreement_consent) {
      toast({
        variant: "destructive",
        title: "Required Consents Missing",
        description: "Please agree to all required terms to proceed.",
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('subcontractor_applications')
        .insert([applicationData]);

      if (error) throw error;

      toast({
        title: "Application Submitted!",
        description: "Your application has been submitted successfully. We'll review it and get back to you soon.",
      });

      // Reset form
      setApplicationData({
        full_name: "",
        email: "",
        phone: "",
        why_join_us: "",
        previous_cleaning_experience: "",
        availability: "",
        preferred_work_areas: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        has_drivers_license: false,
        has_own_vehicle: false,
        can_lift_heavy_items: false,
        comfortable_with_chemicals: false,
        reliable_transportation: false,
        background_check_consent: false,
        brand_shirt_consent: false,
        subcontractor_agreement_consent: false
      });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Subcontractor Portal</h1>
            <p className="text-xl text-muted-foreground">
              Join our network of professional cleaning contractors
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Sign Up
              </TabsTrigger>
              <TabsTrigger value="application" className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Apply Now
              </TabsTrigger>
            </TabsList>
            
            {/* Login Tab */}
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Subcontractor Login
                  </CardTitle>
                  <CardDescription>
                    Access your subcontractor dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Sign Up Tab */}
            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Create Account
                  </CardTitle>
                  <CardDescription>
                    Create your subcontractor account to get started
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password (min 6 characters)"
                        minLength={6}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Password must be at least 6 characters long
                      </p>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Application Tab */}
            <TabsContent value="application">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5" />
                    Subcontractor Application
                  </CardTitle>
                  <CardDescription>
                    Complete this application to join our team of professional cleaners
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleApplicationSubmit} className="space-y-6">
                    
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Personal Information</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="full_name">Full Name *</Label>
                          <Input
                            id="full_name"
                            value={applicationData.full_name}
                            onChange={(e) => setApplicationData({...applicationData, full_name: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="app_email">Email *</Label>
                          <Input
                            id="app_email"
                            type="email"
                            value={applicationData.email}
                            onChange={(e) => setApplicationData({...applicationData, email: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={applicationData.phone}
                            onChange={(e) => setApplicationData({...applicationData, phone: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Experience & Motivation */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Experience & Motivation</h3>
                      <div className="space-y-2">
                        <Label htmlFor="why_join_us">Why do you want to join our team? *</Label>
                        <Textarea
                          id="why_join_us"
                          value={applicationData.why_join_us}
                          onChange={(e) => setApplicationData({...applicationData, why_join_us: e.target.value})}
                          placeholder="Tell us what motivates you to work with us..."
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="previous_experience">Previous Cleaning Experience</Label>
                        <Textarea
                          id="previous_experience"
                          value={applicationData.previous_cleaning_experience}
                          onChange={(e) => setApplicationData({...applicationData, previous_cleaning_experience: e.target.value})}
                          placeholder="Describe any previous cleaning or related experience..."
                        />
                      </div>
                    </div>

                    {/* Availability & Preferences */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Availability & Preferences</h3>
                      <div className="space-y-2">
                        <Label htmlFor="availability">Availability *</Label>
                        <Textarea
                          id="availability"
                          value={applicationData.availability}
                          onChange={(e) => setApplicationData({...applicationData, availability: e.target.value})}
                          placeholder="What days and times are you available to work?"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="preferred_areas">Preferred Work Areas</Label>
                        <Input
                          id="preferred_areas"
                          value={applicationData.preferred_work_areas}
                          onChange={(e) => setApplicationData({...applicationData, preferred_work_areas: e.target.value})}
                          placeholder="Which areas would you prefer to work in?"
                        />
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Emergency Contact</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="emergency_name">Emergency Contact Name *</Label>
                          <Input
                            id="emergency_name"
                            value={applicationData.emergency_contact_name}
                            onChange={(e) => setApplicationData({...applicationData, emergency_contact_name: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emergency_phone">Emergency Contact Phone *</Label>
                          <Input
                            id="emergency_phone"
                            type="tel"
                            value={applicationData.emergency_contact_phone}
                            onChange={(e) => setApplicationData({...applicationData, emergency_contact_phone: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Requirements Checklist */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Requirements</h3>
                      <div className="space-y-3">
                        {[
                          { key: 'has_drivers_license', label: 'I have a valid driver\'s license', icon: FileCheck },
                          { key: 'has_own_vehicle', label: 'I have my own reliable vehicle', icon: Truck },
                          { key: 'can_lift_heavy_items', label: 'I can lift heavy items (up to 50 lbs)', icon: Users },
                          { key: 'comfortable_with_chemicals', label: 'I am comfortable working with cleaning chemicals', icon: Shield },
                          { key: 'reliable_transportation', label: 'I have reliable transportation', icon: Truck }
                        ].map(({ key, label, icon: Icon }) => (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox
                              id={key}
                              checked={applicationData[key as keyof typeof applicationData] as boolean}
                              onCheckedChange={(checked) => 
                                setApplicationData({...applicationData, [key]: checked})
                              }
                            />
                            <Label htmlFor={key} className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Required Consents */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Required Agreements *</h3>
                      <div className="space-y-3">
                        {[
                          { key: 'background_check_consent', label: 'I consent to a background check', icon: Shield },
                          { key: 'brand_shirt_consent', label: 'I agree to wear company branded shirts', icon: Shirt },
                          { key: 'subcontractor_agreement_consent', label: 'I agree to the subcontractor terms and conditions', icon: FileCheck }
                        ].map(({ key, label, icon: Icon }) => (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox
                              id={key}
                              checked={applicationData[key as keyof typeof applicationData] as boolean}
                              onCheckedChange={(checked) => 
                                setApplicationData({...applicationData, [key]: checked})
                              }
                              required
                            />
                            <Label htmlFor={key} className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {label} *
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading} size="lg">
                      {loading ? "Submitting Application..." : "Submit Application"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SubcontractorPortal;