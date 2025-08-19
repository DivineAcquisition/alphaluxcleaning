import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Plus, Zap, Clock, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AutomatedTrigger {
  id: string;
  name: string;
  description: string;
  trigger_event: string;
  template_id: string;
  delivery_methods: string[];
  delay_minutes: number;
  priority: number;
  is_active: boolean;
  created_at: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
}

export const AutomationTriggerManagement: React.FC = () => {
  const [triggers, setTriggers] = useState<AutomatedTrigger[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTrigger, setEditingTrigger] = useState<AutomatedTrigger | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [triggersResponse, templatesResponse] = await Promise.all([
        supabase.from('automated_notification_triggers').select('*').order('created_at', { ascending: false }),
        supabase.from('notification_templates').select('id, name, type').eq('is_active', true)
      ]);

      if (triggersResponse.error) throw triggersResponse.error;
      if (templatesResponse.error) throw templatesResponse.error;

      setTriggers(triggersResponse.data || []);
      setTemplates(templatesResponse.data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTrigger = async (triggerData: Partial<AutomatedTrigger>) => {
    try {
      if (editingTrigger) {
        const { error } = await supabase
          .from('automated_notification_triggers')
          .update(triggerData)
          .eq('id', editingTrigger.id);
        
        if (error) throw error;
        toast({ title: "Trigger updated successfully" });
      } else {
        const { error } = await supabase
          .from('automated_notification_triggers')
          .insert({
            name: triggerData.name || '',
            description: triggerData.description || '',
            trigger_event: triggerData.trigger_event || '',
            template_id: triggerData.template_id,
            delivery_methods: triggerData.delivery_methods || ['sms'],
            delay_minutes: triggerData.delay_minutes || 0,
            priority: triggerData.priority || 5,
            is_active: triggerData.is_active ?? true
          });
        
        if (error) throw error;
        toast({ title: "Trigger created successfully" });
      }
      
      fetchData();
      setIsDialogOpen(false);
      setEditingTrigger(null);
    } catch (error: any) {
      toast({
        title: "Error saving trigger",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteTrigger = async (id: string) => {
    try {
      const { error } = await supabase
        .from('automated_notification_triggers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: "Trigger deleted successfully" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error deleting trigger",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const TriggerForm = ({ trigger }: { trigger?: AutomatedTrigger }) => {
    const [formData, setFormData] = useState({
      name: trigger?.name || '',
      description: trigger?.description || '',
      trigger_event: trigger?.trigger_event || '',
      template_id: trigger?.template_id || '',
      delivery_methods: trigger?.delivery_methods || ['sms'],
      delay_minutes: trigger?.delay_minutes || 0,
      priority: trigger?.priority || 5,
      is_active: trigger?.is_active ?? true
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSaveTrigger(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Trigger Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event">Trigger Event</Label>
            <Select value={formData.trigger_event} onValueChange={(value) => setFormData({ ...formData, trigger_event: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="order_created">Order Created</SelectItem>
                <SelectItem value="order_status_changed">Order Status Changed</SelectItem>
                <SelectItem value="booking_status_changed">Booking Status Changed</SelectItem>
                <SelectItem value="application_submitted">Application Submitted</SelectItem>
                <SelectItem value="application_status_changed">Application Status Changed</SelectItem>
                <SelectItem value="payment_completed">Payment Completed</SelectItem>
                <SelectItem value="service_started">Service Started</SelectItem>
                <SelectItem value="service_completed">Service Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of what this trigger does"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="template">Notification Template</Label>
          <Select value={formData.template_id} onValueChange={(value) => setFormData({ ...formData, template_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name} ({template.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="delay">Delay (minutes)</Label>
            <Input
              id="delay"
              type="number"
              value={formData.delay_minutes}
              onChange={(e) => setFormData({ ...formData, delay_minutes: parseInt(e.target.value) || 0 })}
              min="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority (1-10)</Label>
            <Input
              id="priority"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 5 })}
              min="1"
              max="10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="active">Active</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit">
            {trigger ? 'Update Trigger' : 'Create Trigger'}
          </Button>
        </div>
      </form>
    );
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading automation triggers...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Automation Triggers</CardTitle>
            <CardDescription>
              Configure automated notification triggers for business events
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingTrigger(null)}>
                <Plus className="h-4 w-4 mr-2" />
                New Trigger
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTrigger ? 'Edit Trigger' : 'Create New Trigger'}
                </DialogTitle>
                <DialogDescription>
                  Configure when and how notifications are automatically sent
                </DialogDescription>
              </DialogHeader>
              <TriggerForm trigger={editingTrigger || undefined} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Timing</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {triggers.map((trigger) => {
              const template = templates.find(t => t.id === trigger.template_id);
              return (
                <TableRow key={trigger.id}>
                  <TableCell className="font-medium">{trigger.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Target className="h-3 w-3" />
                      <span className="text-sm">{trigger.trigger_event}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{template?.name || 'Unknown'}</span>
                      {template && (
                        <Badge variant="outline" className="text-xs">
                          {template.type}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="text-sm">
                        {trigger.delay_minutes === 0 ? 'Immediate' : `${trigger.delay_minutes}m`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{trigger.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={trigger.is_active ? "default" : "secondary"}>
                      {trigger.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTrigger(trigger);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTrigger(trigger.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};