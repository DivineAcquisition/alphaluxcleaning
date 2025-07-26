import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";

export default function TestEmail() {
  const [email, setEmail] = useState("divineacquisition.io@gmail.com");
  const [isLoading, setIsLoading] = useState(false);

  const sendTestEmail = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-email-confirmation', {
        body: { testEmail: email }
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw error;
      }

      console.log("Test email response:", data);
      
      if (data.success) {
        toast.success(`Test email sent successfully to ${email}!`);
      } else {
        console.error("Function returned error:", data);
        toast.error(`Failed to send test email: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error("Error sending test email:", error);
      
      // Try to get more details from the error
      let errorMessage = error.message;
      if (error.details) {
        errorMessage += `: ${error.details}`;
      }
      
      toast.error(`Failed to send test email: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-4">🧪 Test Email System</CardTitle>
              <CardDescription className="text-lg">
                Test the booking confirmation email system
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                
                <Button 
                  onClick={sendTestEmail}
                  disabled={isLoading || !email}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? "Sending..." : "Send Test Email"}
                </Button>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">What this test does:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Sends a sample booking confirmation email</li>
                  <li>• Tests the Resend email service integration</li>
                  <li>• Shows you exactly how customer emails will look</li>
                  <li>• Verifies email delivery is working</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}