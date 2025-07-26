import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Phone, Mail, ArrowLeft } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { useNavigate } from "react-router-dom";

export default function CommercialThankYou() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary to-accent text-white rounded-t-lg text-center">
            <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl">
              Thank You for Your Interest!
            </CardTitle>
            <CardDescription className="text-primary-foreground/90 text-base sm:text-lg">
              Your commercial estimate request has been successfully submitted
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Confirmation Message */}
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                What Happens Next?
              </h2>
              <p className="text-muted-foreground">
                We'll review your request and contact you within 24 hours to schedule your free walkthrough and provide a custom quote.
              </p>
            </div>

            {/* Next Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold">Review & Contact</h3>
                <p className="text-sm text-muted-foreground">
                  Our team will review your requirements and contact you within 24 hours
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold">Schedule Walkthrough</h3>
                <p className="text-sm text-muted-foreground">
                  We'll schedule a convenient time for your free facility walkthrough
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="font-semibold">Receive Custom Quote</h3>
                <p className="text-sm text-muted-foreground">
                  Get a detailed, customized cleaning plan with transparent pricing
                </p>
              </div>
            </div>

            {/* Special Offer Reminder */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">🎉 Don't Forget Your Special Offer!</h3>
              <p className="text-muted-foreground mb-3">
                <strong>15% off the first 3 months</strong> with a 1-year commitment
              </p>
              <p className="text-sm text-muted-foreground">
                We'll include this discount in your custom quote
              </p>
            </div>

            {/* Contact Information */}
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-center">Need Immediate Assistance?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Call Us</p>
                    <p className="text-sm text-muted-foreground">(555) 123-4567</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Email Us</p>
                    <p className="text-sm text-muted-foreground">info@bayareacleaningpros.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => navigate("/")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
              
              <Button 
                onClick={() => navigate("/")}
                className="bg-gradient-to-r from-primary to-accent"
              >
                Explore Our Services
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}