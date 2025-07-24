import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, Phone, Mail } from "lucide-react";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="container mx-auto max-w-2xl py-12">
        <Card className="shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16" />
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            <CardDescription className="text-green-50">
              Your cleaning service has been booked with Bay Area Cleaning Pros
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                Thank you for choosing Bay Area Cleaning Pros!
              </h3>
              <p className="text-muted-foreground">
                We've received your booking and payment. Our team will contact you within 24 hours to schedule your cleaning service.
              </p>
              
              {sessionId && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Confirmation ID:</strong> {sessionId.slice(-12)}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t pt-6 space-y-4">
              <h4 className="font-semibold">What happens next?</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary">1.</span>
                  You'll receive a confirmation email with your booking details
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary">2.</span>
                  Our team will call you to schedule the cleaning appointment
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary">3.</span>
                  We'll provide a 1-hour arrival window before your appointment
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary">4.</span>
                  Our professional cleaners will arrive ready to transform your space
                </li>
              </ul>
            </div>

            <div className="border-t pt-6 space-y-4">
              <h4 className="font-semibold">Need to reach us?</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>(281) 201-6112</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>info@bayareacleaningpros.com</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button asChild className="flex-1">
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <a href="https://bayareacleaningpros.com" target="_blank" rel="noopener noreferrer">
                  Visit Our Website
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}