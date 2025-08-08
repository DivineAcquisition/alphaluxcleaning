import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CreateAutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateAutomationDialog({ open, onOpenChange, onSuccess }: CreateAutomationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'email' as 'email' | 'sms' | 'notification',
    trigger_event: '',
    description: ''
  });
  const { toast } = useToast();

  const triggerOptions = [
    'New customer signup',
    '24 hours before service',
    '2 hours after service completion',
    '30 days since last booking',
    'Job not started 30 min past scheduled time',
    'Customer cancellation',
    'Payment received',
    'Service completed'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.trigger_event) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-automation-rules', {
        method: 'POST',
        body: formData
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Automation rule created successfully"
      });

      setFormData({
        name: '',
        type: 'email',
        trigger_event: '',
        description: ''
      });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating automation rule:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create automation rule",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Automation Rule</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Rule Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Welcome Email Sequence"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Message Type *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: 'email' | 'sms' | 'notification') => 
                setFormData(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="notification">Notification</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="trigger">Trigger Event *</Label>
            <Select 
              value={formData.trigger_event} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, trigger_event: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select trigger event" />
              </SelectTrigger>
              <SelectContent>
                {triggerOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this automation does..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}