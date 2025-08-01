import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export function ZapierTestButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<any>(null);
  const { toast } = useToast();

  const sendSampleBookingTransaction = async () => {
    setIsLoading(true);
    try {
      console.log("Sending sample booking transaction to Zapier...");
      
      const { data, error } = await supabase.functions.invoke('send-booking-transaction-to-zapier', {
        body: { 
          send_sample_data: true
        }
      });

      if (error) {
        throw error;
      }

      console.log("Zapier response:", data);
      setLastTestResult(data);
      
      toast({
        title: "Success!",
        description: "Sample booking transaction sent to Zapier webhook successfully",
      });
    } catch (error) {
      console.error("Error sending to Zapier:", error);
      setLastTestResult({ error: error.message, success: false });
      
      toast({
        title: "Error",
        description: "Failed to send booking transaction to Zapier",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendRealBookingTransaction = async () => {
    setIsLoading(true);
    try {
      // Get the current session ID from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      
      if (!sessionId) {
        throw new Error('No session ID found in URL');
      }

      console.log("Sending real booking transaction to Zapier...");
      
      const { data, error } = await supabase.functions.invoke('send-booking-transaction-to-zapier', {
        body: { 
          session_id: sessionId,
          send_sample_data: false
        }
      });

      if (error) {
        throw error;
      }

      console.log("Zapier response:", data);
      setLastTestResult(data);
      
      toast({
        title: "Success!",
        description: "Real booking transaction sent to Zapier webhook successfully",
      });
    } catch (error) {
      console.error("Error sending to Zapier:", error);
      setLastTestResult({ error: error.message, success: false });
      
      toast({
        title: "Error",
        description: "Failed to send real booking transaction to Zapier",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Zapier Integration Test
        </CardTitle>
        <CardDescription>
          Send complete booking transaction data to your Zapier webhook
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={sendSampleBookingTransaction}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send Sample Data
          </Button>
          
          <Button
            onClick={sendRealBookingTransaction}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send Current Booking
          </Button>
        </div>
        
        {lastTestResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {lastTestResult.success ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                    Success
                  </Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <Badge variant="destructive">
                    Failed
                  </Badge>
                </>
              )}
            </div>
            
            {lastTestResult.success && (
              <div className="text-sm space-y-2">
                <p><strong>Transaction ID:</strong> {lastTestResult.transaction_id}</p>
                <p><strong>Webhook Status:</strong> {lastTestResult.webhook_status}</p>
                <p><strong>Message:</strong> {lastTestResult.message}</p>
              </div>
            )}
            
            {lastTestResult.error && (
              <div className="text-sm text-red-600">
                <p><strong>Error:</strong> {lastTestResult.error}</p>
              </div>
            )}
            
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                View Full Response
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded-md overflow-auto max-h-40">
                {JSON.stringify(lastTestResult, null, 2)}
              </pre>
            </details>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          <p><strong>Webhook URL:</strong> https://hooks.zapier.com/hooks/catch/5011258/u4d3bsb/</p>
          <p>This sends comprehensive booking data including order details, payment info, service requirements, and analytics.</p>
        </div>
      </CardContent>
    </Card>
  );
}