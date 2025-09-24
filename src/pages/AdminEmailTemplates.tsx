import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Eye, Loader2 } from 'lucide-react';
import { AdminRoute } from '@/components/AdminRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  updated_at: string;
}

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    html: ''
  });
  const [previewData, setPreviewData] = useState('{"first_name": "John", "service_type": "Regular Cleaning", "price_final": "120"}');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.subject || !formData.html) {
        toast.error('Please fill in all fields');
        return;
      }

      const templateData = {
        name: formData.name,
        subject: formData.subject,
        html: formData.html,
        updated_at: new Date().toISOString()
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);
        
        if (error) throw error;
        toast.success('Template updated successfully');
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert(templateData);
        
        if (error) throw error;
        toast.success('Template created successfully');
      }

      setDialogOpen(false);
      setEditingTemplate(null);
      setFormData({ name: '', subject: '', html: '' });
      loadTemplates();
    } catch (error: any) {
      console.error('Failed to save template:', error);
      toast.error(error.message || 'Failed to save template');
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      html: template.html
    });
    setDialogOpen(true);
  };

  const handlePreview = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    setPreviewDialogOpen(true);
  };

  const renderPreview = () => {
    if (!previewTemplate) return { subject: '', html: '' };
    
    try {
      const payload = JSON.parse(previewData);
      let html = previewTemplate.html;
      let subject = previewTemplate.subject;
      
      // Simple template replacement
      Object.entries(payload).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        html = html.replace(regex, String(value));
        subject = subject.replace(regex, String(value));
      });
      
      return { subject, html };
    } catch {
      return { subject: previewTemplate.subject, html: previewTemplate.html };
    }
  };

  return (
    <AdminRoute requiredRole="ops">
      <Helmet>
        <title>Email Templates - Admin</title>
      </Helmet>
      
      <AdminLayout title="Email Templates">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Email Templates</h1>
              <p className="text-muted-foreground">
                Manage email templates for automated communications
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingTemplate(null);
                  setFormData({ name: '', subject: '', html: '' });
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'Edit Template' : 'Create Template'}
                  </DialogTitle>
                  <DialogDescription>
                    Use {'{'}{'{'} variable_name {'}'} {'}'} syntax for dynamic content
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Template name (e.g., booking_confirmed)"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Email subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  />
                  <Textarea
                    placeholder="HTML content"
                    value={formData.html}
                    onChange={(e) => setFormData(prev => ({ ...prev, html: e.target.value }))}
                    rows={12}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    {editingTemplate ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
              <CardDescription>
                All email templates in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <Badge variant="outline">{template.name}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {template.subject}
                        </TableCell>
                        <TableCell>
                          {new Date(template.updated_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreview(template)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(template)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview Dialog */}
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Preview: {previewTemplate?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Test Data (JSON)</label>
                <Textarea
                  value={previewData}
                  onChange={(e) => setPreviewData(e.target.value)}
                  rows={3}
                  placeholder='{"first_name": "John", "service_type": "Regular Cleaning"}'
                />
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium">Subject:</label>
                  <div className="p-2 bg-muted rounded">{renderPreview().subject}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">HTML Preview:</label>
                  <div 
                    className="border rounded p-4 max-h-96 overflow-auto"
                    dangerouslySetInnerHTML={{ __html: renderPreview().html }}
                  />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </AdminRoute>
  );
}