import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { CheckCircle, DollarSign, Calendar, Users, Shield, Star, ArrowRight, Home } from "lucide-react";

const SubcontractorHome = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Check if already a subcontractor
        const { data: subcontractorData } = await supabase
          .from('subcontractors')
          .select('id')
          .eq('user_id', session.user.id)
          .single();
        
        if (subcontractorData) {
          navigate('/subcontractor-dashboard');
          return;
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleGetStarted = () => {
    if (user) {
      navigate('/subcontractor-onboarding');
    } else {
      navigate('/subcontractor-auth');
    }
  };

  const features = [
    {
      icon: DollarSign,
      title: "Flexible Earnings",
      description: "Choose from multiple revenue split tiers based on your commitment level"
    },
    {
      icon: Calendar,
      title: "Flexible Schedule",
      description: "Work when you want, where you want. You control your availability"
    },
    {
      icon: Users,
      title: "Steady Clients",
      description: "Access to our established customer base with guaranteed work opportunities"
    },
    {
      icon: Shield,
      title: "Full Support",
      description: "Complete training, equipment recommendations, and ongoing support"
    }
  ];

  const plans = [
    {
      name: "Starter",
      tier: "60/40 Split",
      price: "FREE",
      description: "Perfect for getting started",
      features: [
        "Keep 40% of each job",
        "No monthly fees",
        "Accept jobs when available",
        "Flexible schedule",
        "Basic support"
      ],
      popular: false
    },
    {
      name: "Professional",
      tier: "50/50 Split",
      price: "$10/month",
      description: "More earnings with guaranteed work",
      features: [
        "Keep 50% of each job",
        "Guaranteed 10 jobs per month",
        "Priority job assignments",
        "Higher earning potential",
        "Enhanced support"
      ],
      popular: true
    },
    {
      name: "Premium",
      tier: "35/65 Split",
      price: "$50/month",
      description: "Maximum earnings for professionals",
      features: [
        "Keep 65% of each job",
        "Guaranteed 15 jobs per month",
        "Highest priority assignments",
        "Maximum earning potential",
        "Dedicated support",
        "Premium training resources"
      ],
      popular: false
    }
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Home className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold">Bay Area Cleaning Professionals</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/')}>
                Main Site
              </Button>
              {user ? (
                <Button onClick={handleGetStarted}>
                  Continue Onboarding
                </Button>
              ) : (
                <Button onClick={handleGetStarted}>
                  Get Started
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            Now Hiring Cleaning Professionals
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
            Join Our Elite
            <span className="text-primary"> Cleaning Network</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Start earning with the Bay Area's most trusted cleaning service. We provide the clients, 
            you provide the exceptional service. Choose your commitment level and start making money today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6">
              Join the Network
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-background/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Network?</h2>
            <p className="text-xl text-muted-foreground">
              We've built the perfect platform for professional cleaners to thrive
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Choose Your Revenue Split</h2>
            <p className="text-xl text-muted-foreground">
              Select the plan that matches your availability and earning goals
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-primary">{plan.price}</div>
                  <div className="text-lg font-semibold">{plan.tier}</div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-6" 
                    variant={plan.popular ? "default" : "outline"}
                    onClick={handleGetStarted}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-background/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What Our Subcontractors Say</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah M.",
                role: "Professional Cleaner",
                text: "The flexible schedule allows me to work around my family commitments while earning great money.",
                rating: 5
              },
              {
                name: "Mike R.",
                role: "Premium Member",
                text: "The guaranteed jobs give me financial security. I know exactly what I'll earn each month.",
                rating: 5
              },
              {
                name: "Jessica L.",
                role: "Starter Plan",
                text: "Started with the free plan and quickly moved up. The support team is fantastic!",
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.text}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of cleaning professionals already earning with our network
          </p>
          <Button size="lg" variant="secondary" onClick={handleGetStarted} className="text-lg px-8 py-6">
            Join Now - It's Free to Start
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <Home className="h-6 w-6 text-primary" />
            <span className="ml-2 text-lg font-semibold">Bay Area Cleaning Professionals</span>
          </div>
          <p className="text-muted-foreground">
            Professional cleaning services throughout the Bay Area
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SubcontractorHome;