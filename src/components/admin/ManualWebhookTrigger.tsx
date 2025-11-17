import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const testScenarios = [
  { 
    id: 'tester_1500', 
    label: 'Tester - 1,000-1,499 sq ft ($250)',
    bookingId: '83ea1bcd-e791-4343-9990-7331f0fc0191'
  },
  { 
    id: '90day_1500', 
    label: '90-Day Plan - 1,000-1,499 sq ft ($699)',
    bookingId: '' // Add real booking ID when available
  },
  { 
    id: '90day_2000', 
    label: '90-Day Plan - 1,500-1,999 sq ft ($799)',
    bookingId: '' // Add real booking ID when available
  },
];

export function ManualWebhookTrigger() {
  const [bookingId, setBookingId] = useState('');
  const [selectedScenario, setSelectedScenario] = useState('');
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

  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    const scenario = testScenarios.find(s => s.id === scenarioId);
    if (scenario?.bookingId) {
      setBookingId(scenario.bookingId);
    }
  };

  const handleTriggerScenario = async () => {
    const scenario = testScenarios.find(s => s.id === selectedScenario);
    if (scenario?.bookingId) {
      setBookingId(scenario.bookingId);
      setTimeout(() => {
        handleTrigger();
      }, 100);
    } else {
      toast({
        title: "Error",
        description: "This scenario doesn't have a booking ID yet. Please create a test booking first.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Webhook Trigger</CardTitle>
        <CardDescription>
          Test webhooks with different offer types and scenarios
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

        <div className="pt-4 border-t space-y-3">
          <p className="text-sm text-muted-foreground mb-2">Test Scenarios:</p>
          <Select value={selectedScenario} onValueChange={handleScenarioSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a test scenario" />
            </SelectTrigger>
            <SelectContent>
              {testScenarios.map((scenario) => (
                <SelectItem key={scenario.id} value={scenario.id}>
                  {scenario.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleTriggerScenario}
            disabled={isLoading || !selectedScenario}
            className="w-full"
          >
            Test Selected Scenario
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
