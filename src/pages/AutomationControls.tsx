import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Zap, 
  Mail, 
  MessageSquare,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings
} from "lucide-react";

interface AutomationRule {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'notification';
  trigger: string;
  description: string;
  enabled: boolean;
  last_run: string;
  success_rate: number;
}

interface QueuedMessage {
  id: string;
  recipient: string;
  type: 'email' | 'sms';
  subject: string;
  scheduled_for: string;
  status: 'queued' | 'sent' | 'failed';
}

export default function AutomationControls() {
  const { user } = useAuth();
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [customMessage, setCustomMessage] = useState('');

  useEffect(() => {
    if (user) {
      fetchAutomations();
      fetchQueuedMessages();
    }
  }, [user]);

  const fetchAutomations = async () => {
    // Mock automation rules - in real app, this would come from database
    const mockAutomations: AutomationRule[] = [
      {
        id: '1',
        name: 'Welcome Email Sequence',
        type: 'email',
        trigger: 'New customer signup',
        description: 'Send welcome email with service overview and first booking discount',
        enabled: true,
        last_run: '2024-01-03T10:30:00Z',
        success_rate: 98.5
      },
      {
        id: '2',
        name: 'Service Reminder',
        type: 'sms',
        trigger: '24 hours before service',
        description: 'SMS reminder to customer with cleaner details and contact info',
        enabled: true,
        last_run: '2024-01-03T08:15:00Z',
        success_rate: 94.2
      },
      {
        id: '3',
        name: 'Post-Service Follow-up',
        type: 'email',
        trigger: '2 hours after service completion',
        description: 'Email requesting feedback and offering next booking incentive',
        enabled: true,
        last_run: '2024-01-03T16:45:00Z',
        success_rate: 87.3
      },
      {
        id: '4',
        name: 'Churn Prevention',
        type: 'email',
        trigger: '30 days since last booking',
        description: 'Re-engagement email with special offer for returning customers',
        enabled: false,
        last_run: '2024-01-02T12:00:00Z',
        success_rate: 76.8
      },
      {
        id: '5',
        name: 'Subcontractor Check-in',
        type: 'notification',
        trigger: 'Job not started 30 min past scheduled time',
        description: 'Alert office managers when cleaners are running late',
        enabled: true,
        last_run: '2024-01-03T14:20:00Z',
        success_rate: 100
      }
    ];

    setAutomations(mockAutomations);
  };

  const fetchQueuedMessages = async () => {
    // Mock queued messages
    const mockQueued: QueuedMessage[] = [
      {
        id: '1',
        recipient: 'john.doe@email.com',
        type: 'email',
        subject: 'Your cleaning service is confirmed!',
        scheduled_for: '2024-01-04T09:00:00Z',
        status: 'queued'
      },
      {
        id: '2',
        recipient: '+1-555-123-4567',
        type: 'sms',
        subject: 'Service reminder: Tomorrow at 2PM',
        scheduled_for: '2024-01-04T13:00:00Z',
        status: 'queued'
      },
      {
        id: '3',
        recipient: 'sarah.wilson@email.com',
        type: 'email',
        subject: 'How was your cleaning service?',
        scheduled_for: '2024-01-04T18:00:00Z',
        status: 'sent'
      }
    ];

    setQueuedMessages(mockQueued);
    setLoading(false);
  };

  const toggleAutomation = async (automationId: string, enabled: boolean) => {
    setAutomations(prev => prev.map(automation => 
      automation.id === automationId 
        ? { ...automation, enabled }
        : automation
    ));
    
    // In real app, this would update the database
    console.log(`Automation ${automationId} ${enabled ? 'enabled' : 'disabled'}`);
  };

  const sendCustomMessage = async () => {
    if (!customMessage.trim()) return;
    
    // In real app, this would queue the message
    console.log('Sending custom message:', customMessage);
    setCustomMessage('');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'notification': return <AlertCircle className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'default';
      case 'queued': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const stats = {
    activeAutomations: automations.filter(a => a.enabled).length,
    queuedMessages: queuedMessages.filter(m => m.status === 'queued').length,
    avgSuccessRate: automations.reduce((sum, a) => sum + a.success_rate, 0) / automations.length,
    messagesThisWeek: 247
  };

  return (
    <AdminLayout 
      title="Automation Controls" 
      description="Manage email sequences, SMS campaigns, and automated workflows"
    >
      <div className="space-y-6">
        {/* Automation Stats */}
        <AdminGrid columns={4} gap="md">
          <AdminCard
            variant="metric"
            title="Active Automations"
            icon={<Zap className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight text-primary">
              {stats.activeAutomations}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Running workflows</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Queued Messages"
            icon={<Clock className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight text-warning">
              {stats.queuedMessages}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled to send</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Success Rate"
            icon={<CheckCircle className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight text-success">
              {stats.avgSuccessRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Average delivery</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Messages This Week"
            icon={<MessageSquare className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight">{stats.messagesThisWeek}</div>
            <p className="text-xs text-muted-foreground mt-1">All channels</p>
          </AdminCard>
        </AdminGrid>

        <AdminGrid columns={2} gap="lg">
          {/* Automation Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Automation Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {automations.map((automation) => (
                <div key={automation.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(automation.type)}
                      <span className="font-medium">{automation.name}</span>
                    </div>
                    <Switch
                      checked={automation.enabled}
                      onCheckedChange={(enabled) => toggleAutomation(automation.id, enabled)}
                    />
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {automation.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Trigger: {automation.trigger}</span>
                    <span>Success: {automation.success_rate}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Message Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Message Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {queuedMessages.slice(0, 8).map((message) => (
                  <div key={message.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(message.type)}
                        <span className="text-sm font-medium">{message.subject}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        To: {message.recipient}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(message.scheduled_for).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(message.status) as any}>
                      {message.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </AdminGrid>

        {/* Custom Message Sender */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Send Custom Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="custom-message">Message Content</Label>
              <Textarea
                id="custom-message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter your message to send to all customers..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={sendCustomMessage} disabled={!customMessage.trim()}>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" onClick={sendCustomMessage} disabled={!customMessage.trim()}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send SMS
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}