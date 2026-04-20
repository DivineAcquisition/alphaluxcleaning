import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigation } from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { User, LogIn, Monitor, Smartphone, Calendar, DollarSign, Star, TrendingUp } from "lucide-react";

const SubcontractorPortal = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [subcontractorData, setSubcontractorData] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if user is already logged in and is a subcontractor
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: subcontractorData } = await supabase
          .from('subcontractors')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        if (subcontractorData) {
          setSubcontractorData(subcontractorData);
          setActiveTab("dashboard");
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
        // Fetch subcontractor data and show dashboard
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: subcontractorData } = await supabase
            .from('subcontractors')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          if (subcontractorData) {
            setSubcontractorData(subcontractorData);
            setActiveTab("dashboard");
          }
        }
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
            <TabsList className={`grid w-full ${subcontractorData ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {!subcontractorData && (
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Login
                </TabsTrigger>
              )}
              {subcontractorData && (
                <>
                  <TabsTrigger value="dashboard" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger value="platform" className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Choose Platform
                  </TabsTrigger>
                </>
              )}
            </TabsList>
            
            {/* Login Tab */}
            {!subcontractorData && (
              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Subcontractor Login
                    </CardTitle>
                    <CardDescription>
                      Access your subcontractor dashboard. Don't have an account yet?{" "}
                      <Button 
                        variant="link" 
                        className="p-0 h-auto font-medium text-primary hover:underline"
                        onClick={() => navigate('/subcontractor-application')}
                      >
                        Apply to join our team
                      </Button>
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
            )}

            {/* Dashboard Tab */}
            {subcontractorData && (
              <TabsContent value="dashboard">
                <div className="grid gap-6">
                  {/* Welcome Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Welcome back, {subcontractorData.full_name}!</CardTitle>
                      <CardDescription>
                        Your subcontractor portal - choose how you want to access your dashboard
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{subcontractorData.jobs_completed_this_month || 0}</div>
                          <div className="text-sm text-muted-foreground">Jobs This Month</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-success">${subcontractorData.total_earnings || 0}</div>
                          <div className="text-sm text-muted-foreground">Total Earnings</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">{subcontractorData.rating || 5.0}</div>
                          <div className="text-sm text-muted-foreground">Average Rating</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-accent">Tier {subcontractorData.tier_level || 1}</div>
                          <div className="text-sm text-muted-foreground">Current Tier</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Platform Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Access Your Dashboard</CardTitle>
                      <CardDescription>Choose your preferred platform experience</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          size="lg" 
                          className="h-24 flex flex-col gap-2"
                          onClick={() => navigate('/subcontractor-desktop-portal')}
                        >
                          <Monitor className="h-6 w-6" />
                          <div>Desktop Experience</div>
                          <div className="text-xs opacity-75">Full dashboard with all features</div>
                        </Button>
                        <Button 
                          size="lg" 
                          variant="outline"
                          className="h-24 flex flex-col gap-2"
                          onClick={() => navigate('/subcontractor-mobile')}
                        >
                          <Smartphone className="h-6 w-6" />
                          <div>Mobile Experience</div>
                          <div className="text-xs opacity-75">Optimized for mobile devices</div>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button variant="outline" size="sm" onClick={() => navigate('/subcontractor-availability')}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Update Availability
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate('/subcontractor-payments')}>
                          <DollarSign className="h-4 w-4 mr-2" />
                          View Payments
                        </Button>
                        <Button variant="outline" size="sm">
                          <Star className="h-4 w-4 mr-2" />
                          View Reviews
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate('/training-portal')}>
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Training Center
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}

            {/* Platform Selection Tab */}
            {subcontractorData && (
              <TabsContent value="platform">
                <Card>
                  <CardHeader>
                    <CardTitle>Choose Your Experience</CardTitle>
                    <CardDescription>
                      Select the best platform for your current device and needs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      {/* Recommended */}
                      <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
                        <div className="flex items-center gap-2 mb-2">
                          {isMobile ? <Smartphone className="h-5 w-5 text-primary" /> : <Monitor className="h-5 w-5 text-primary" />}
                          <span className="font-semibold text-primary">Recommended for you</span>
                        </div>
                        <Button 
                          className="w-full"
                          onClick={() => navigate(isMobile ? '/subcontractor-mobile' : '/subcontractor-desktop-portal')}
                        >
                          {isMobile ? 'Open Mobile Dashboard' : 'Open Desktop Dashboard'}
                        </Button>
                      </div>

                      {/* All Options */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Monitor className="h-5 w-5" />
                              Desktop Experience
                            </CardTitle>
                            <CardDescription>
                              Full-featured dashboard with comprehensive tools and analytics
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ul className="text-sm space-y-2 mb-4">
                              <li>• Complete job management</li>
                              <li>• Performance analytics</li>
                              <li>• Advanced scheduling tools</li>
                              <li>• Multi-tab interface</li>
                            </ul>
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => navigate('/subcontractor-desktop-portal')}
                            >
                              Open Desktop
                            </Button>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Smartphone className="h-5 w-5" />
                              Mobile Experience
                            </CardTitle>
                            <CardDescription>
                              Touch-optimized interface perfect for on-the-go access
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ul className="text-sm space-y-2 mb-4">
                              <li>• Touch-friendly interface</li>
                              <li>• Quick job actions</li>
                              <li>• GPS integration</li>
                              <li>• Camera for photos</li>
                            </ul>
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => navigate('/subcontractor-mobile')}
                            >
                              Open Mobile
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SubcontractorPortal;