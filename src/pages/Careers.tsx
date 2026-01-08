import { Navigation } from "@/components/Navigation";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Star, 
  Users, 
  TrendingUp,
  Smartphone,
  Car,
  Heart,
  Briefcase,
  Leaf,
  Shield,
  Sparkles,
  Home as HomeIcon
} from "lucide-react";

export default function Careers() {
  const handleApply = () => {
    window.open('https://forms.fillout.com/t/2LayVJBbus', '_blank');
  };

  return (
    <>
      <SEOHead 
        title="Join Our Team | AlphaLuxClean Careers"
        description="Join AlphaLuxClean as a House Cleaner earning $20-$25/hr. Flexible scheduling, consistent work, and growth opportunities. Apply today!"
      />
      <div className="min-h-screen bg-background">
        <Navigation minimal />
        
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16 md:py-24">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center space-y-6">
              <Badge variant="secondary" className="text-sm px-4 py-1">
                Now Hiring
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
                House Cleaner / Cleaning Technician
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Join our premium cleaning team and earn <span className="text-primary font-semibold">$20–$25/hr</span>
              </p>
              <Button size="lg" onClick={handleApply} className="text-lg px-8 py-6">
                Apply Now
              </Button>
            </div>
          </div>
        </section>

        {/* Quick Benefits */}
        <section className="py-12 bg-card border-y">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-3 bg-primary/10 rounded-full">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <span className="font-semibold">$20–$25/hr</span>
                <span className="text-sm text-muted-foreground">Competitive Pay</span>
              </div>
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <span className="font-semibold">Flexible Hours</span>
                <span className="text-sm text-muted-foreground">Part or Full-Time</span>
              </div>
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-3 bg-primary/10 rounded-full">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <span className="font-semibold">Growth Path</span>
                <span className="text-sm text-muted-foreground">Lead & Trainer Roles</span>
              </div>
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <span className="font-semibold">Great Team</span>
                <span className="text-sm text-muted-foreground">Respectful Culture</span>
              </div>
            </div>
          </div>
        </section>

        {/* About & Pay Section */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    About AlphaLux Clean
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-4">
                  <p>
                    AlphaLux Clean is a locally owned and operated premium cleaning company 
                    serving major cities in Texas & California. We deliver reliable, high-quality 
                    cleaning services with a focus on detail and customer satisfaction.
                  </p>
                  <p>
                    We're hiring reliable cleaners who take pride in their work and want steady 
                    hours with a respectful team. Every job is handled with care, and every 
                    team member is treated with respect.
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-foreground">Our Mission:</span> Experience a Higher Standard of Clean — 
                    professionalism, precision, and care to every job.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Pay Structure
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                    <span>Entry-Level / Some Experience</span>
                    <Badge variant="secondary" className="text-lg font-bold">$20/hr</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                    <span>Experienced (Speed + Quality + Reliability)</span>
                    <Badge className="text-lg font-bold">$25/hr</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pay is based on experience, skill, and performance after the first couple of shifts.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Why Work With Us - Company Values */}
        <section className="py-16 bg-muted/30">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Work With AlphaLux Clean?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Join a team that values quality, respects your time, and invests in your growth.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="p-3 bg-green-500/10 rounded-full w-fit mb-4">
                    <Leaf className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Eco-Friendly Products</h3>
                  <p className="text-sm text-muted-foreground">
                    We use safe, effective, and eco-friendly cleaning products that are tough on dirt 
                    and gentle on your health. No harsh chemicals — just great results.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="p-3 bg-blue-500/10 rounded-full w-fit mb-4">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Trusted & Professional</h3>
                  <p className="text-sm text-muted-foreground">
                    Our team is thoroughly trained, fully insured, and background-checked. 
                    You'll be part of a team that clients trust and recommend.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="p-3 bg-purple-500/10 rounded-full w-fit mb-4">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Attention to Detail</h3>
                  <p className="text-sm text-muted-foreground">
                    From baseboards to blinds, we leave no area untouched. You'll learn the kind of 
                    deep cleaning that truly transforms a space.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="p-3 bg-orange-500/10 rounded-full w-fit mb-4">
                    <HomeIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Variety of Services</h3>
                  <p className="text-sm text-muted-foreground">
                    Work on diverse projects — regular cleanings, deep cleans, move-in/move-out 
                    services, and occasional office cleanings. Never a dull day.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="p-3 bg-primary/10 rounded-full w-fit mb-4">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Texas & California</h3>
                  <p className="text-sm text-muted-foreground">
                    We serve major cities across Texas (DFW, Dallas, Plano, Fort Worth) and 
                    California (Los Angeles, Pasadena, Santa Monica). Work in your area.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="p-3 bg-pink-500/10 rounded-full w-fit mb-4">
                    <Heart className="h-6 w-6 text-pink-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Respectful Culture</h3>
                  <p className="text-sm text-muted-foreground">
                    We believe a clean space supports well-being — for clients and our team. 
                    You'll be valued, heard, and respected every day.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* What You'll Do */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-10">What You'll Do</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "Perform residential cleanings (standard, deep cleaning, move-in/move-out) and occasional small office cleanings",
                "Follow AlphaLux Clean cleaning checklists + quality standards",
                "Clean kitchens, bathrooms, bedrooms, living areas (dusting, vacuuming, mopping, surfaces, etc.)",
                "Handle trash removal, restocking basics, and job wrap-up photos/notes",
                "Communicate clearly with the team about arrival, job status, and any issues",
                "Maintain a professional appearance and respectful behavior in clients' homes"
              ].map((task, index) => (
                <div key={index} className="flex gap-3 p-4 bg-muted/50 rounded-lg border">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{task}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section className="py-16 bg-muted/30">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { icon: Car, text: "Reliable transportation to jobs (must be able to travel within our service area)" },
                    { icon: Smartphone, text: "Smartphone for job details, navigation, and updates" },
                    { icon: Briefcase, text: "Ability to lift 30–40 lbs, stand/bend for extended periods" },
                    { icon: Star, text: "Strong attention to detail + ability to work efficiently" },
                    { icon: Heart, text: "Professional attitude + dependable attendance" },
                    { icon: Heart, text: "Comfortable working around pets (not required, but helpful)" }
                  ].map((req, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <req.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{req.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preferred (Not Required)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "6+ months professional house cleaning experience",
                    "Experience with deep cleaning / move-outs",
                    "Knowledge of safe cleaning chemicals and best practices",
                    "Bilingual (English/Spanish) is a plus"
                  ].map((pref, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{pref}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section className="py-16 bg-muted/30">
          <div className="container max-w-6xl mx-auto px-4">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex gap-3 items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Flexible scheduling available (part-time or full-time based on demand)</span>
                  </div>
                  <div className="flex gap-3 items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Shifts typically occur Monday–Saturday between 8am–6pm (varies by bookings)</span>
                  </div>
                  <div className="flex gap-3 items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Must be able to work at least 2–4 days/week consistently</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* What You Get */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-10">What You Get</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Competitive Pay", desc: "$20–$25/hr based on experience" },
                { title: "Consistent Work", desc: "Steady hours for high performers" },
                { title: "Clear Standards", desc: "Checklists so you know what 'great' looks like" },
                { title: "Growth Opportunities", desc: "Path to lead cleaner / trainer role" }
              ].map((benefit, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="pt-6">
                    <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Client Testimonials - Show the impact */}
        <section className="py-16 bg-muted/30">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">The Impact You'll Make</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Here's what clients say about our team. You could be part of creating these experiences.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  quote: "The team was punctual, friendly, and left my home looking and feeling fresh. It's a huge relief to know I can count on them every time.",
                  name: "Tara M.",
                  location: "Dallas, TX"
                },
                {
                  quote: "My house has never looked better. They even managed to remove hard water stains I thought were permanent! Highly recommend.",
                  name: "Jason K.",
                  location: "Los Angeles, CA"
                },
                {
                  quote: "They always show up on time, are respectful of our home, and the results are consistently impressive. It's clear they truly care about their work.",
                  name: "Danielle S.",
                  location: "Plano, TX"
                }
              ].map((testimonial, index) => (
                <Card key={index} className="bg-background">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground italic mb-4">"{testimonial.quote}"</p>
                    <p className="text-sm font-medium">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container max-w-4xl mx-auto px-4 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Join Our Team?</h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Apply through our form below. We review applications quickly and will reach out 
              to schedule a short phone interview.
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={handleApply}
              className="text-lg px-8 py-6"
            >
              Apply Now
            </Button>
            <p className="text-sm opacity-75 mt-8">
              AlphaLux Clean is an equal opportunity employer.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
