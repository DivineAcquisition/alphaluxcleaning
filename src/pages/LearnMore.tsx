import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  Shield, 
  Clock, 
  Star, 
  ArrowRight, 
  Phone,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HOME_SIZE_RANGES, DEFAULT_PRICING_CONFIG } from "@/lib/new-pricing-system";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useNavigate } from "react-router-dom";

export default function LearnMore() {
  const [step, setStep] = useState<"form" | "results">("form");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const navigate = useNavigate();
  const { validateForm, getError, hasError } = useFormValidation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const isValid = validateForm(formData);
    if (!isValid) {
      toast.error("Please check your information and try again");
      return;
    }

    setLoading(true);

    try {
      // Split name into first and last
      const nameParts = formData.name.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || "";

      // Insert into customers table
      const { error } = await supabase
        .from('customers')
        .insert({
          name: formData.name,
          first_name: firstName,
          last_name: lastName,
          email: formData.email,
          phone: formData.phone,
          metadata: {
            source_channel: "LEARN_MORE_PAGE",
            captured_at: new Date().toISOString(),
          },
        });

      if (error) throw error;

      setStep("results");
      toast.success("Thanks for your interest! Here's our pricing:");
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    navigate(`/?email=${encodeURIComponent(formData.email)}`);
  };

  if (step === "results") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Thank You Header */}
          <Card className="shadow-elegant border-primary/20">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <div>
                <CardTitle className="text-3xl md:text-4xl">
                  Thanks, {formData.name.split(" ")[0]}!
                </CardTitle>
                <CardDescription className="text-lg mt-2">
                  Here's our transparent, size-based pricing
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          {/* Company Info */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Why Choose AlphaLux Cleaning?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    AlphaLux Cleaning provides premium residential cleaning services with a focus on professionalism, 
                    reliability, and customer satisfaction. Our background-checked, bonded, and insured teams 
                    deliver consistent, high-quality results that exceed expectations.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Bonded & Insured
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Background Checked
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      100% Satisfaction Guarantee
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Core Values</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span><strong>Professional:</strong> Trained, uniformed teams</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span><strong>Reliable:</strong> On-time service with flexible scheduling</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span><strong>Quality:</strong> Detailed cleaning, every corner</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span><strong>Transparent:</strong> Clear, upfront pricing with no hidden fees</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Display */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="text-2xl">Transparent Pricing by Home Size</CardTitle>
              <CardDescription>
                One-time pricing shown. Save up to 15% with recurring services!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {HOME_SIZE_RANGES.map((range) => (
                  <div 
                    key={range.id}
                    className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{range.label}</h3>
                        <p className="text-sm text-muted-foreground">
                          {range.minSqft.toLocaleString()} - {range.maxSqft < 999999 ? `${range.maxSqft.toLocaleString()} sq ft` : '+ sq ft'}
                          {range.bedroomRange && ` • ${range.bedroomRange}`}
                        </p>
                      </div>
                      
                      {range.requiresEstimate ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-primary border-primary">
                            Custom Quote Required
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Phone className="w-4 h-4 mr-2" />
                            Call for Pricing
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Regular</div>
                            <div className="font-bold text-lg">
                              ${range.regularPrice.toLocaleString()}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Deep Clean</div>
                            <div className="font-bold text-lg">
                              ${range.deepPrice.toLocaleString()}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Move-In/Out</div>
                            <div className="font-bold text-lg">
                              ${range.moveInOutPrice.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Frequency Discounts */}
              <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Save More with Recurring Services
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {DEFAULT_PRICING_CONFIG.frequencies
                    .filter(f => f.recurringMultiplier !== undefined)
                    .map((freq) => (
                      <div key={freq.id} className="space-y-1">
                        <div className="font-semibold">{freq.name}</div>
                        <div className="text-2xl font-bold text-primary">
                          {((freq.discount || 0) * 100).toFixed(0)}% OFF
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Types */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="text-xl">Our Service Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Regular Clean</h3>
                  <p className="text-sm text-muted-foreground">
                    Routine maintenance cleaning including kitchen, bathrooms, living areas, dusting, and vacuuming
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Deep Cleaning</h3>
                  <p className="text-sm text-muted-foreground">
                    Intensive cleaning with baseboards, inside appliances, and detailed work in every room
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Move-In/Out</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete cleaning for vacant properties, perfect for moving transitions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="shadow-elegant border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="py-8 text-center space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold">Ready to Book Your Cleaning?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Get started with our easy online booking. Your information is already filled in!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" onClick={handleBookNow} className="text-lg">
                  Book Your Cleaning Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="tel:+1234567890">
                    <Phone className="w-5 h-5 mr-2" />
                    Have Questions? Call Us
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Service Areas */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Serving Texas, California, and New York • Licensed, Bonded & Insured</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-elegant">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl md:text-4xl">See Our Pricing</CardTitle>
          <CardDescription className="text-base">
            Professional cleaning services with transparent, size-based pricing
          </CardDescription>
          <p className="text-sm text-muted-foreground pt-2">
            No hidden fees. No surprises. Just clean homes.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-2 p-4 bg-muted/50 rounded-lg">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Bonded & Insured
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Background Checked
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                Satisfaction Guaranteed
              </Badge>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Full Name *
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  maxLength={100}
                  className={hasError("name") ? "border-destructive" : ""}
                />
                {hasError("name") && (
                  <p className="text-sm text-destructive">{getError("name")}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address *
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className={hasError("email") ? "border-destructive" : ""}
                />
                {hasError("email") && (
                  <p className="text-sm text-destructive">{getError("email")}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone Number *
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(857) 754-4557"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className={hasError("phone") ? "border-destructive" : ""}
                />
                {hasError("phone") && (
                  <p className="text-sm text-destructive">{getError("phone")}</p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                "Loading..."
              ) : (
                <>
                  Show Me Pricing
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            {/* Value Props */}
            <div className="space-y-2 text-sm text-muted-foreground pt-2">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                Transparent pricing with no hidden fees
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                Professional, trained cleaning teams
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                Flexible scheduling that fits your life
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
