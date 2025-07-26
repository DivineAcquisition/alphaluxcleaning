import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, Phone, Mail } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [emailSent, setEmailSent] = useState(false);

  // Send order confirmation email when component loads
  useEffect(() => {
    const sendConfirmationEmail = async () => {
      if (sessionId && !emailSent) {
        try {
          const { data, error } = await supabase.functions.invoke('send-order-confirmation', {
            body: { sessionId }
          });

          if (error) throw error;

          console.log("Confirmation email sent:", data);
          setEmailSent(true);
        } catch (error) {
          console.error("Error sending confirmation email:", error);
          toast.error("Failed to send confirmation email. We'll contact you shortly.");
        }
      }
    };

    sendConfirmationEmail();
  }, [sessionId, emailSent]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Card - Full Width */}
          <Card className="shadow-xl">
            <CardHeader className="text-center bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg py-12">
              <div className="flex justify-center mb-6">
                <CheckCircle className="h-20 w-20" />
              </div>
              <CardTitle className="text-4xl mb-4">Payment Successful!</CardTitle>
              <CardDescription className="text-green-50 text-xl">
                Your cleaning service has been booked with Bay Area Cleaning Pros
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-12 space-y-8">
              <div className="text-center space-y-6">
                <h3 className="text-2xl font-semibold text-foreground">
                  Thank you for choosing Bay Area Cleaning Pros!
                </h3>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  We've received your booking and payment. Complete the form to finalize your service details.
                </p>
                
                {sessionId && (
                  <div className="p-6 bg-muted rounded-lg max-w-md mx-auto">
                    <p className="text-muted-foreground">
                      <strong>Confirmation ID:</strong> {sessionId.slice(-12)}
                    </p>
                  </div>
                )}

                <div className="flex justify-center pt-8 max-w-2xl mx-auto">
                  <Button asChild className="text-lg py-6" size="lg">
                    <Link to={`/service-details?session_id=${sessionId}`}>
                      Complete Your Service Details
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="border-t pt-8 space-y-6">
                <h4 className="font-semibold text-xl text-center">What happens next?</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  <div className="flex items-start gap-4 p-6 bg-muted/50 rounded-lg">
                    <span className="font-semibold text-primary text-xl bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center">1</span>
                    <p className="text-muted-foreground">Complete your service details to finalize your booking</p>
                  </div>
                  <div className="flex items-start gap-4 p-6 bg-muted/50 rounded-lg">
                    <span className="font-semibold text-primary text-xl bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center">2</span>
                    <p className="text-muted-foreground">You'll receive a confirmation email with your booking details</p>
                  </div>
                  <div className="flex items-start gap-4 p-6 bg-muted/50 rounded-lg">
                    <span className="font-semibold text-primary text-xl bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center">3</span>
                    <p className="text-muted-foreground">Our team will call you to schedule the cleaning appointment</p>
                  </div>
                  <div className="flex items-start gap-4 p-6 bg-muted/50 rounded-lg">
                    <span className="font-semibold text-primary text-xl bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center">4</span>
                    <p className="text-muted-foreground">Our professional cleaners will arrive ready to transform your space</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-8 space-y-6">
                <h4 className="font-semibold text-xl text-center">Need to reach us?</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  <div className="flex items-center justify-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <Phone className="h-6 w-6 text-primary" />
                    <span className="text-lg">(281) 201-6112</span>
                  </div>
                  <div className="flex items-center justify-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <Mail className="h-6 w-6 text-primary" />
                    <span className="text-lg">support@bayareacleaningpros.com</span>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}