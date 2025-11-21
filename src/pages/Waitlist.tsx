import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { Users, CheckCircle, Shield, Sparkles, Clock, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Waitlist() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
    phone: "",
    zipCode: "",
    homeSize: "",
    preferredContact: "email",
    readyTimeline: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("waitlist-signup", {
        body: {
          first_name: formData.firstName,
          email: formData.email,
          phone: formData.phone || null,
          zip_code: formData.zipCode || null,
          home_size: formData.homeSize || null,
          preferred_contact: formData.preferredContact,
          ready_timeline: formData.readyTimeline || null,
          notes: formData.notes || null,
        },
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("You're on the waitlist! Check your email for the $60 off offer.");
    } catch (error: any) {
      console.error("Waitlist signup error:", error);
      toast.error("Failed to join waitlist. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookNow = () => {
    navigate("/book/zip?promo=DEEPCLEAN60&source=waitlist&lock_service=deep");
  };

  if (submitted) {
    return (
      <>
        <SEOHead
          title="Waitlist Confirmation - AlphaLux Clean"
          description="You're on our waitlist! We'll remind you when you're ready to book."
        />
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">You're on the List! 🎉</h1>
            <p className="text-lg text-muted-foreground">
              We've sent a confirmation email to <strong>{formData.email}</strong>
            </p>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-4">
              <p className="text-sm font-medium text-primary">Don't forget your exclusive offer!</p>
              <p className="text-2xl font-bold">Save $60 on Deep Clean</p>
              <p className="text-sm text-muted-foreground">Offer valid for 48 hours</p>
              <Button size="lg" onClick={handleBookNow} className="w-full">
                Book Now & Save $60
              </Button>
            </div>
            <Button variant="ghost" onClick={() => navigate("/")}>
              Return to Home
            </Button>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead
        title="Join Our Waitlist - AlphaLux Clean"
        description="Not ready to book? Join our waitlist and get $60 off your first deep clean when you're ready."
      />
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-12 text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">
            Not Ready to Book? We'll Remind You Later
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join our waitlist and we'll send you a friendly reminder when you're ready
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> No obligation
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Unsubscribe anytime
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> We respect your inbox
            </span>
          </div>
        </div>

        {/* Upsell Card */}
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 overflow-hidden">
            <div className="p-8 md:p-12 space-y-8">
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="inline-block animate-pulse">
                  <span className="text-2xl">🎉</span>
                  <span className="text-lg font-bold text-primary mx-2">LIMITED TIME OFFER</span>
                  <span className="text-2xl">🎉</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Book Your Deep Clean Today & Save $60!
                </h2>
                <p className="text-lg text-muted-foreground">
                  Ready to experience our premium service right now?
                </p>
              </div>

              {/* What's Included */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                  What's Included in Your Deep Clean
                </h3>

                {/* Professional Crew */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Professional Crew & Equipment:
                  </h4>
                  <ul className="grid md:grid-cols-2 gap-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>2-3 certified cleaning professionals</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Industrial-grade equipment & eco-friendly products</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>All supplies included - you provide nothing</span>
                    </li>
                  </ul>
                </div>

                {/* 40-Point Checklist */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    40-Point Deep Clean Checklist:
                  </h4>
                  <ul className="grid md:grid-cols-2 gap-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Detailed dusting of all surfaces & ceiling fans</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Kitchen: Cabinet fronts, microwave, oven, backsplash</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Bathrooms: Tile & grout scrubbing, toilet sanitization</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Floors: Vacuum carpets, mop hard floors, under furniture</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Windows: Interior cleaning & track detailing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Baseboards & door frames thoroughly wiped</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Light fixtures & switch plates cleaned</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Cobweb removal from corners & ceilings</span>
                    </li>
                  </ul>
                </div>

                {/* Guarantees */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Premium Service Guarantees:
                  </h4>
                  <ul className="grid md:grid-cols-2 gap-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Award className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>48-hour satisfaction guarantee</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Bonded & insured professionals</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Background-checked team members</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Same-day service available</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground line-through">
                    Regular: $300-550
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    Today: $240-490
                  </p>
                  <p className="text-sm text-muted-foreground">
                    25% deposit to secure your spot
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={handleBookNow}
                  className="w-full md:w-auto text-lg px-12 py-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Book Now - Save $60 on Deep Clean
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Waitlist Form */}
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Or Join the Waitlist
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code (Optional)</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) =>
                      setFormData({ ...formData, zipCode: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="homeSize">Home Size (Optional)</Label>
                <Select
                  value={formData.homeSize}
                  onValueChange={(value) =>
                    setFormData({ ...formData, homeSize: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your home size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1000-1499">1,000-1,499 sq ft</SelectItem>
                    <SelectItem value="1500-1999">1,500-1,999 sq ft</SelectItem>
                    <SelectItem value="2000-2499">2,000-2,499 sq ft</SelectItem>
                    <SelectItem value="2500-2999">2,500-2,999 sq ft</SelectItem>
                    <SelectItem value="3000-3999">3,000-3,999 sq ft</SelectItem>
                    <SelectItem value="4000-4999">4,000-4,999 sq ft</SelectItem>
                    <SelectItem value="5000+">5,000+ sq ft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Preferred Contact Method</Label>
                <RadioGroup
                  value={formData.preferredContact}
                  onValueChange={(value) =>
                    setFormData({ ...formData, preferredContact: value })
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="contact-email" />
                    <Label htmlFor="contact-email">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="phone" id="contact-phone" />
                    <Label htmlFor="contact-phone">Phone</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text" id="contact-text" />
                    <Label htmlFor="contact-text">Text</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="readyTimeline">When are you thinking?</Label>
                <Select
                  value={formData.readyTimeline}
                  onValueChange={(value) =>
                    setFormData({ ...formData, readyTimeline: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="next-week">Next week</SelectItem>
                    <SelectItem value="this-month">This month</SelectItem>
                    <SelectItem value="next-month">Next month</SelectItem>
                    <SelectItem value="just-browsing">Just browsing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Any special requests or questions?"
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Joining..." : "Add Me to the Waitlist"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
