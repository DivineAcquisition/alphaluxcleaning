import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Pause, XCircle } from 'lucide-react';

interface ManageRecurringModalProps {
  service: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export const ManageRecurringModal = ({ 
  service, 
  open, 
  onOpenChange, 
  onUpdate 
}: ManageRecurringModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState(service.frequency);
  const [pauseDuration, setPauseDuration] = useState('1month');
  const [cancellationReason, setCancellationReason] = useState('');

  const handleUpdateService = async (action: string, additionalData?: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-recurring-service', {
        body: {
          recurring_service_id: service.id,
          action,
          ...additionalData
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Service ${action} successfully`
      });

      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating service:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update service',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeFrequency = () => {
    handleUpdateService('change_frequency', { new_frequency: selectedFrequency });
  };

  const handlePauseService = () => {
    const pauseUntil = new Date();
    if (pauseDuration === '1month') pauseUntil.setMonth(pauseUntil.getMonth() + 1);
    else if (pauseDuration === '2months') pauseUntil.setMonth(pauseUntil.getMonth() + 2);
    else if (pauseDuration === '3months') pauseUntil.setMonth(pauseUntil.getMonth() + 3);
    
    handleUpdateService('pause', { 
      pause_until: pauseDuration === 'indefinite' ? null : pauseUntil.toISOString() 
    });
  };

  const handleResumeService = () => {
    handleUpdateService('resume');
  };

  const handleCancelService = () => {
    handleUpdateService('cancel', { cancellation_reason: cancellationReason });
  };

  const frequencies = [
    { value: 'weekly', label: 'Weekly', discount: '15%', savings: 'Highest savings!' },
    { value: 'bi-weekly', label: 'Bi-Weekly', discount: '10%', savings: 'Great value' },
    { value: 'monthly', label: 'Monthly', discount: '5%', savings: 'Save a little' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Recurring Service</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="frequency" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="frequency">
              <Calendar className="h-4 w-4 mr-2" />
              Frequency
            </TabsTrigger>
            <TabsTrigger value="pause">
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </TabsTrigger>
            <TabsTrigger value="cancel">
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="frequency" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-4">Change Service Frequency</h3>
              <RadioGroup value={selectedFrequency} onValueChange={setSelectedFrequency}>
                {frequencies.map((freq) => (
                  <div key={freq.value} className="flex items-center space-x-2 p-4 border rounded-lg mb-2 hover:bg-accent">
                    <RadioGroupItem value={freq.value} id={freq.value} />
                    <Label htmlFor={freq.value} className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{freq.label}</p>
                          <p className="text-sm text-muted-foreground">{freq.savings}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-500">{freq.discount} off</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <Button 
              onClick={handleChangeFrequency} 
              disabled={loading || selectedFrequency === service.frequency}
              className="w-full"
            >
              Update Frequency
            </Button>
          </TabsContent>

          <TabsContent value="pause" className="space-y-4">
            {service.status === 'paused' ? (
              <div>
                <p className="mb-4 text-muted-foreground">
                  Your service is currently paused. Resume to continue your regular schedule.
                </p>
                <Button onClick={handleResumeService} disabled={loading} className="w-full">
                  Resume Service
                </Button>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold mb-4">Pause Your Service</h3>
                <RadioGroup value={pauseDuration} onValueChange={setPauseDuration}>
                  <div className="flex items-center space-x-2 p-3 border rounded">
                    <RadioGroupItem value="1month" id="1month" />
                    <Label htmlFor="1month" className="cursor-pointer">1 Month</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded">
                    <RadioGroupItem value="2months" id="2months" />
                    <Label htmlFor="2months" className="cursor-pointer">2 Months</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded">
                    <RadioGroupItem value="3months" id="3months" />
                    <Label htmlFor="3months" className="cursor-pointer">3 Months</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded">
                    <RadioGroupItem value="indefinite" id="indefinite" />
                    <Label htmlFor="indefinite" className="cursor-pointer">Indefinite</Label>
                  </div>
                </RadioGroup>
                <Button onClick={handlePauseService} disabled={loading} className="w-full mt-4">
                  Pause Service
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancel" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Cancel Recurring Service</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We're sorry to see you go. Please let us know why you're cancelling:
              </p>
              <Textarea
                placeholder="Tell us why you're cancelling (optional)"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
              />
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mt-4">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ This action cannot be undone. Your service will be cancelled immediately.
                </p>
              </div>
            </div>
            <Button 
              onClick={handleCancelService} 
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              Cancel Service
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};