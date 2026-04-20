import { Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";

export default function CallPage() {
  const phoneNumber = "(857) 754-4557";
  const phoneLink = "tel:+18577544557";
  const smsLink = "sms:+18577544557";

  return (
    <>
      <SEOHead 
        title="Call Us - AlphaLux Cleaning"
        description="Call AlphaLux Cleaning to book your cleaning service or get answers to your questions. Our team is ready to help."
      />
      
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Logo/Brand */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              AlphaLux Cleaning
            </h1>
            <p className="text-xl text-muted-foreground">
              Premium Cleaning Services
            </p>
          </div>

          {/* Main CTA */}
          <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-lg">
            <div className="space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                <Phone className="w-10 h-10 text-primary" />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                Ready to Book?
              </h2>
              
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Call us now to schedule your cleaning service or get answers to any questions
              </p>

              {/* Phone Number Display */}
              <div className="py-6">
                <a 
                  href={phoneLink}
                  className="text-4xl md:text-5xl font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  {phoneNumber}
                </a>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="text-lg px-12 py-6"
                  onClick={() => window.location.href = phoneLink}
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Call Now
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-12 py-6"
                  onClick={() => window.location.href = smsLink}
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Text Us
                </Button>
              </div>
            </div>
          </div>

          {/* Hours or Additional Info */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Available 7 days a week</p>
            <p>We're here to help you get the cleaning service you need</p>
          </div>

          {/* Alternative Options */}
          <div className="pt-8 border-t border-border">
            <p className="text-muted-foreground mb-4">
              Prefer to book online?
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.location.href = '/book/zip'}
            >
              Start Online Booking
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
