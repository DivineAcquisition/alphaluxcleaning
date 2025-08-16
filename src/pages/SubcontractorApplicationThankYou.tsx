import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Mail, Phone, Home, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SubcontractorApplicationThankYou() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId');
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    // Redirect to home after 15 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Card className="max-w-2xl w-full shadow-lg border-border/50 animate-fade-in">
          <CardHeader className="text-center space-y-6 bg-muted/30">
            <div className="flex items-center justify-center">
              <div className="relative">
                <CheckCircle className="h-16 w-16 text-success animate-pulse" />
                <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-2 -right-2 animate-bounce" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                Application Submitted Successfully!
              </CardTitle>
              <p className="text-muted-foreground text-lg">
                Thank you for your interest in joining Bay Area Cleaning Professionals
              </p>
            </div>
            {applicationId && (
              <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary">
                Application ID: {applicationId}
              </Badge>
            )}
          </CardHeader>
          
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold">What Happens Next?</h3>
              <div className="grid gap-4 text-left">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Review Process</h4>
                    <p className="text-sm text-muted-foreground">
                      Our team will review your application within 24-48 hours
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Email Notification</h4>
                    <p className="text-sm text-muted-foreground">
                      You'll receive an email with the review results and next steps
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Interview Process</h4>
                    <p className="text-sm text-muted-foreground">
                      If approved, we'll schedule a brief phone interview to discuss opportunities
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-6 space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Questions about your application? Contact our team:
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Badge variant="outline" className="px-4 py-2">
                    Email: careers@bayareacleaningpros.com
                  </Badge>
                  <Badge variant="outline" className="px-4 py-2">
                    Phone: (555) 123-4567
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                onClick={() => navigate('/')}
                className="w-full sm:w-auto"
              >
                <Home className="h-4 w-4 mr-2" />
                Return to Home
              </Button>
              <p className="text-sm text-muted-foreground">
                Redirecting in {countdown} seconds
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}