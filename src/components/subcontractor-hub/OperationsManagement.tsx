import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Settings, 
  Users, 
  Mail, 
  Shield,
  Database,
  Bell,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OperationsManagementProps {
  data: any;
}

export function OperationsManagement({ data }: OperationsManagementProps) {
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);
  const { toast } = useToast();

  const handleBulkEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both subject and message",
        variant: "destructive",
      });
      return;
    }

    setBulkOperationLoading(true);
    try {
      const { error } = await supabase.functions.invoke('bulk-subcontractor-operations', {
        body: {
          operation: 'email',
          data: {
            subject: emailSubject,
            message: emailMessage,
            recipients: 'all_active'
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bulk email sent successfully!",
      });
      
      setEmailSubject('');
      setEmailMessage('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send bulk email",
        variant: "destructive",
      });
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleDataExport = async () => {
    setBulkOperationLoading(true);
    try {
      const { error } = await supabase.functions.invoke('bulk-subcontractor-operations', {
        body: {
          operation: 'export',
          data: { format: 'csv' }
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Data export completed successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleSystemSync = async () => {
    setBulkOperationLoading(true);
    try {
      const { error } = await supabase.functions.invoke('bulk-subcontractor-operations', {
        body: {
          operation: 'sync',
          data: {}
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "System sync completed successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sync system",
        variant: "destructive",
      });
    } finally {
      setBulkOperationLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Operations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-blue-500" />
              Bulk Communications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">Send Bulk Email</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Send Bulk Email to Subcontractors</DialogTitle>
                  <DialogDescription>
                    Send an email to all active subcontractors
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subject</label>
                    <Input
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Email subject..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message</label>
                    <Textarea
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      placeholder="Email message..."
                      rows={6}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      onClick={handleBulkEmail}
                      disabled={bulkOperationLoading}
                    >
                      {bulkOperationLoading ? "Sending..." : "Send Email"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="w-full">
              <Bell className="h-4 w-4 mr-2" />
              Send Notifications
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-green-500" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleDataExport}
              disabled={bulkOperationLoading}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {bulkOperationLoading ? "Exporting..." : "Export Data"}
            </Button>
            <Button variant="outline" className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-purple-500" />
              System Operations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleSystemSync}
              disabled={bulkOperationLoading}
              variant="outline" 
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {bulkOperationLoading ? "Syncing..." : "Sync System"}
            </Button>
            <Button variant="outline" className="w-full">
              <Shield className="h-4 w-4 mr-2" />
              Security Audit
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            System Status & Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database Health</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Response Time</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Fast</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email Service</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Payment System</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Backup Status</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Current</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Security Scan</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Clean</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Sync</span>
                <span className="text-sm text-muted-foreground">2 min ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Data Integrity</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Valid</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-500" />
            System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Assignment Settings</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto-assignment enabled</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Max assignments per cleaner</span>
                  <span className="text-sm font-medium">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Assignment radius (miles)</span>
                  <span className="text-sm font-medium">15</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Notification Settings</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email notifications</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">SMS notifications</span>
                  <Badge variant="secondary">Disabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Performance alerts</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}