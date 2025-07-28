import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";

export default function TestEmail() {
  const [sessionId, setSessionId] = useState("cs_live_a1IVTHRlvD3N7nzW1mjGhGmKop3z620rxFUMZzTGdkBUnspD6JSh7HLM67");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testOrderConfirmation = async () => {
    if (!sessionId.trim()) {
      toast.error("Please enter a session ID");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log("Testing order confirmation with session ID:", sessionId);
      
      const { data, error } = await supabase.functions.invoke('send-order-confirmation', {
        body: { sessionId: sessionId.trim() }
      });

      if (error) {
        console.error("Error calling function:", error);
        throw error;
      }

      console.log("Function response:", data);
      setResult(data);
      toast.success("Order confirmation email test completed! Check the result below.");
      
    } catch (error: any) {
      console.error("Error testing order confirmation:", error);
      setResult({ error: error.message || "Unknown error occurred" });
      toast.error(`Failed to send test email: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary to-accent text-white rounded-t-lg">
            <CardTitle className="text-xl">
              🧪 Test Order Confirmation Email
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Test the order confirmation email system with a real order
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="sessionId">Session ID</Label>
              <Input
                id="sessionId"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Enter Stripe session ID"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Pre-filled with a recent confirmed order for testing
              </p>
            </div>

            <Button 
              onClick={testOrderConfirmation}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Sending Test Email..." : "🚀 Send Test Confirmation Email"}
            </Button>

            {result && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {result.error ? "❌ Error Result" : "✅ Success Result"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Test Details:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Customer: Malik (asannie74@gmail.com)</li>
                  <li>• Service: Deep Cleaning - Weekly</li>
                  <li>• Amount: $49.00</li>
                  <li>• Order ID: 6a8e247a-0393-4698-8959-131ae7261171</li>
                </ul>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}