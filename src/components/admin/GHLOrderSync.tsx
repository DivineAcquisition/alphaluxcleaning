import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const GHLOrderSync = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [limit, setLimit] = useState(5);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [syncResults, setSyncResults] = useState<Array<{
    timestamp: string;
    success: boolean;
    message: string;
    details?: any;
  }>>([]);

  const sendRecentOrders = async () => {
    setIsLoading(true);
    
    try {
      console.log(`Sending ${limit} recent orders to GHL webhook`);

      const { data, error } = await supabase.functions.invoke('send-recent-orders-to-ghl', {
        body: { limit }
      });

      if (error) {
        throw error;
      }

      setLastResponse(data);
      
      const result = {
        timestamp: new Date().toLocaleString(),
        success: true,
        message: `Successfully sent ${data.successCount} of ${data.totalOrders} orders`,
        details: data
      };
      
      setSyncResults(prev => [result, ...prev.slice(0, 4)]);
      
      toast.success(`Orders sync completed! ${data.successCount} orders sent successfully.`);
      
    } catch (error) {
      console.error('Order sync failed:', error);
      
      const result = {
        timestamp: new Date().toLocaleString(),
        success: false,
        message: error.message || 'Unknown error',
        details: { error: error.message }
      };
      
      setSyncResults(prev => [result, ...prev.slice(0, 4)]);
      setLastResponse({ error: error.message });
      
      toast.error('Order sync failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            GHL Order Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Send recent orders to the updated GoHighLevel webhook for processing
            </p>
            <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
              Webhook URL: https://services.leadconnectorhq.com/hooks/jWh1TtlCjUDeZZ27RkkI/webhook-trigger/94998e4d-5fcc-45ea-a91f-2585e8f88600
            </p>
          </div>
          
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="limit">Number of Orders</Label>
              <Input
                id="limit"
                type="number"
                min="1"
                max="50"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 5)}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={sendRecentOrders} 
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Sync Orders
                </>
              )}
            </Button>
          </div>
          
          {lastResponse && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <h4 className="text-sm font-medium mb-2">Last Sync Result:</h4>
              <div className="space-y-2 text-xs">
                {lastResponse.success ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>{lastResponse.message}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span>{lastResponse.error}</span>
                  </div>
                )}
                {lastResponse.results && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-muted-foreground">View Details</summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-32 bg-background p-2 rounded border">
                      {JSON.stringify(lastResponse, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {syncResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Sync Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {syncResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">{result.message}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={result.success ? 'default' : 'destructive'}>
                      {result.success ? 'Success' : 'Failed'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {result.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};