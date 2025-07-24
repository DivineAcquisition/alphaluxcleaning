import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, Phone, Mail } from "lucide-react";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-2 sm:p-4">
      <div className="container mx-auto max-w-7xl py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Success Card */}
          <Card className="shadow-xl">
            <CardHeader className="text-center bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">Payment Successful!</CardTitle>
              <CardDescription className="text-green-50 text-sm sm:text-base">
                Your cleaning service has been booked with Bay Area Cleaning Pros
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-8 space-y-4 sm:space-y-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  Thank you for choosing Bay Area Cleaning Pros!
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  We've received your booking and payment. Complete the form to finalize your service details.
                </p>
                
                {sessionId && (
                  <div className="p-3 sm:p-4 bg-muted rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      <strong>Confirmation ID:</strong> {sessionId.slice(-12)}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 sm:pt-6 space-y-4">
                <h4 className="font-semibold text-sm sm:text-base">What happens next?</h4>
                <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-primary text-xs sm:text-sm">1.</span>
                    Complete your service details to finalize your booking
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-primary text-xs sm:text-sm">2.</span>
                    You'll receive a confirmation email with your booking details
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-primary text-xs sm:text-sm">3.</span>
                    Our team will call you to schedule the cleaning appointment
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-primary text-xs sm:text-sm">4.</span>
                    Our professional cleaners will arrive ready to transform your space
                  </li>
                </ul>
              </div>

              <div className="border-t pt-4 sm:pt-6 space-y-4">
                <h4 className="font-semibold text-sm sm:text-base">Need to reach us?</h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    <span>(281) 201-6112</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    <span>info@bayareacleaningpros.com</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 sm:pt-6">
                <Button asChild className="flex-1 text-sm">
                  <Link to={`/service-details?session_id=${sessionId}`}>
                    Complete Your Service Details
                  </Link>
                </Button>
                <Button variant="outline" asChild className="flex-1 text-sm">
                  <Link to="/">
                    <Home className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Back to Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}