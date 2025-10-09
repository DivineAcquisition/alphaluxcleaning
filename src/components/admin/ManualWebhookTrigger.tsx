import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function ManualWebhookTrigger() {
  const [bookingId, setBookingId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleTrigger = async () => {
    if (!bookingId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a booking ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log('🎯 Manually triggering webhook for booking:', bookingId);

    try {
      const { data, error } = await supabase.functions.invoke('manual-webhook-trigger', {
        body: { booking_id: bookingId }
      });

      if (error) {
        throw error;
      }

      console.log('✅ Manual trigger response:', data);

      toast({
        title: "Webhook Triggered",
        description: `Successfully triggered webhooks for booking ${bookingId}`,
      });

      // Clear the input
      setBookingId('');
    } catch (error) {
      console.error('❌ Manual trigger error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to trigger webhook",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerApril = async () => {
    setBookingId('83ea1bcd-e791-4343-9990-7331f0fc0191');
    setTimeout(() => {
      document.getElementById('trigger-button')?.click();
    }, 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Webhook Trigger</CardTitle>
        <CardDescription>
          Manually trigger webhooks for a specific booking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter booking ID"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            disabled={isLoading}
          />
          <Button
            id="trigger-button"
            onClick={handleTrigger}
            disabled={isLoading || !bookingId.trim()}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Trigger
          </Button>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">Quick Actions:</p>
          <Button
            variant="outline"
            onClick={handleTriggerApril}
            disabled={isLoading}
            className="w-full"
          >
            Trigger Webhook for April's Booking
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
