import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, MessageSquare, BarChart3, Zap, TestTube } from 'lucide-react';
import { NotificationTemplateManager } from './NotificationTemplateManager';
import { AutomationTriggerManagement } from './AutomationTriggerManagement';
import { NotificationAnalyticsDashboard } from './NotificationAnalyticsDashboard';

export const NotificationSystemAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState('templates');

  const handleTestNotification = async () => {
    try {
      // Test SMS notification
      const response = await fetch('https://kqoezqzogleaaupjzxch.supabase.co/functions/v1/enhanced-sms-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: '+1234567890', // Replace with test number
          message: 'Test SMS from Bay Area Cleaning notification system!',
          customerId: 'test-customer-id'
        })
      });

      const result = await response.json();
      console.log('Test notification result:', result);
    } catch (error) {
      console.error('Test notification failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SMS Notification System</h1>
          <p className="text-muted-foreground mt-2">
            Manage automated SMS notifications, templates, and delivery settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTestNotification}>
            <TestTube className="h-4 w-4 mr-2" />
            Test SMS
          </Button>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            System Active
          </Badge>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">SMS templates ready</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automated Triggers</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Event triggers configured</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Today</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Management Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-6">
          <NotificationTemplateManager />
        </TabsContent>

        <TabsContent value="automation" className="mt-6">
          <AutomationTriggerManagement />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <NotificationAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>
                Configure SMS delivery settings and integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Twilio Account SID</label>
                  <p className="text-xs text-muted-foreground">Configure in Supabase Edge Functions settings</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Phone Number</label>
                  <p className="text-xs text-muted-foreground">Set your Twilio phone number</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">System Status</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    SMS Service: Active
                  </Badge>
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    Templates: 6 Ready
                  </Badge>
                  <Badge variant="outline" className="text-purple-600 border-purple-600">
                    Queue: Processing
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};