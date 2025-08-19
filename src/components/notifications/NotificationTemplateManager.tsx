import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Plus, MessageSquare, Mail, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationTemplate {
  id: string;
  name: string;
  template_type?: string;
  type: string;
  body_template?: string;
  message_template?: string;
  subject_template?: string;
  trigger_event?: string;
  trigger_events: string[];
  variables: Record<string, string>;
  is_active: boolean;
  created_at: string;
}

export const NotificationTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const typedTemplates = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        type: item.type || item.delivery_method || 'sms',
        template_type: item.delivery_method,
        body_template: item.message_template,
        message_template: item.message_template,
        subject_template: item.name,
        trigger_events: [],
        variables: {},
        is_active: item.is_active,
        created_at: item.created_at
      }));
      setTemplates(typedTemplates);
    } catch (error: any) {
      toast({
        title: "Error fetching templates",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (templateData: Partial<NotificationTemplate>) => {
    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('notification_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);
        
        if (error) throw error;
        toast({ title: "Template updated successfully" });
      } else {
        const { error } = await supabase
          .from('notification_templates')
          .insert({
            name: templateData.name || '',
            type: templateData.type || 'sms',
            trigger_event: (templateData as any).trigger_event || '',
            content_template: {},
            recipient_rules: {},
            message_template: templateData.message_template || '',
            is_active: templateData.is_active ?? true
          });
        
        if (error) throw error;
        toast({ title: "Template created successfully" });
      }
      
      fetchTemplates();
      setIsDialogOpen(false);
      setEditingTemplate(null);
    } catch (error: any) {
      toast({
        title: "Error saving template",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: "Template deleted successfully" });
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Error deleting template",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'in_app': return <Bell className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const TemplateForm = ({ template }: { template?: NotificationTemplate }) => {
    const [formData, setFormData] = useState({
      name: template?.name || '',
      type: template?.type || template?.template_type || 'sms',
      message_template: template?.message_template || template?.body_template || '',
      subject_template: template?.subject_template || '',
      trigger_event: (template as any)?.trigger_event || '',
      variables: JSON.stringify(template?.variables || {}, null, 2),
      is_active: template?.is_active ?? true
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const templateData = {
          name: formData.name,
          type: formData.type,
          message_template: formData.message_template,
          subject_template: formData.subject_template,
          trigger_event: formData.trigger_event,
          variables: JSON.parse(formData.variables || '{}'),
          is_active: formData.is_active
        };
        handleSaveTemplate(templateData);
      } catch (error) {
        toast({
          title: "Invalid JSON in variables field",
          variant: "destructive"
        });
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Template Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="in_app">In-App</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Message Template</Label>
          <Textarea
            id="body"
            value={formData.message_template}
            onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
            rows={4}
            placeholder="Use {{variable_name}} for dynamic content"
            required
          />
        </div>

        {formData.type === 'email' && (
          <div className="space-y-2">
            <Label htmlFor="subject">Subject Template</Label>
            <Input
              id="subject"
              value={formData.subject_template}
              onChange={(e) => setFormData({ ...formData, subject_template: e.target.value })}
              placeholder="Email subject line"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="trigger">Trigger Event</Label>
          <Select value={formData.trigger_event} onValueChange={(value) => setFormData({ ...formData, trigger_event: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select trigger event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="order_created">Order Created</SelectItem>
              <SelectItem value="order_status_changed">Order Status Changed</SelectItem>
              <SelectItem value="booking_status_changed">Booking Status Changed</SelectItem>
              <SelectItem value="application_submitted">Application Submitted</SelectItem>
              <SelectItem value="application_status_changed">Application Status Changed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="variables">Available Variables (JSON)</Label>
          <Textarea
            id="variables"
            value={formData.variables}
            onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
            rows={3}
            placeholder='{"customer_name": "string", "order_id": "string"}'
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit">
            {template ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </form>
    );
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading templates...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Notification Templates</CardTitle>
            <CardDescription>
              Manage SMS, email, and in-app notification templates
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingTemplate(null)}>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </DialogTitle>
                <DialogDescription>
                  Configure notification templates with dynamic variables
                </DialogDescription>
              </DialogHeader>
              <TemplateForm template={editingTemplate || undefined} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(template.type || template.template_type || 'sms')}
                    <span className="capitalize">{template.type || template.template_type || 'SMS'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {(template as any)?.trigger_event || 'No trigger'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={template.is_active ? "default" : "secondary"}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingTemplate(template);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};