import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { Calendar, TestTube } from "lucide-react";
import { GoogleCalendarConnect } from "@/components/GoogleCalendarConnect";
import { ZapierTestButton } from "@/components/ZapierTestButton";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const TestingPortal = () => {
  const { userRole } = useAuth();

  // Only allow admin users to access this page
  if (userRole !== 'super_admin' && userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary to-accent text-white">
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Testing Portal
              </CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Test integrations and API connections
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Zapier Integration Test */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Zapier Integration Test
              </CardTitle>
              <CardDescription>
                Test sending booking transaction data to Zapier webhooks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ZapierTestButton />
            </CardContent>
          </Card>

          {/* Google Calendar Connection */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendar Integration
              </CardTitle>
              <CardDescription>
                Connect and test Google Calendar integration for live availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleCalendarConnect />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestingPortal;