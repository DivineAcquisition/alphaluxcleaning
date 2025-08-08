import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { CreateAutomationDialog } from "@/components/automation/CreateAutomationDialog";
import { SendMessageDialog } from "@/components/automation/SendMessageDialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Zap, 
  Mail, 
  MessageSquare,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  Plus
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

interface AutomationStats {
  activeAutomations: number;
  queuedMessages: number;
  avgSuccessRate: number;
  messagesThisWeek: number;
  totalRules: number;
  totalExecutions: number;
  successCount: number;
  failureCount: number;
}

export default function AutomationControls() {
  const { user } = useAuth();
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([]);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [sendMessageDialogOpen, setSendMessageDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch automation rules
      const { data: rulesData, error: rulesError } = await supabase.functions.invoke('manage-automation-rules');
      if (rulesError) throw rulesError;
      
      setAutomations(rulesData.rules || []);

      // Fetch queued messages - Create a custom query for our specific needs
      const { data: messages, error: messagesError } = await supabase
        .from('automation_executions')
        .select('*')
        .eq('status', 'pending')
        .order('executed_at', { ascending: false })
        .limit(20);

      if (messagesError) {
        console.warn('Could not fetch queued messages:', messagesError);
        setQueuedMessages([]);
      } else {
        const formattedMessages: QueuedMessage[] = messages.map(msg => ({
          id: msg.id,
          recipient: msg.recipient_email || msg.recipient_phone || 'Unknown',
          type: msg.recipient_email ? 'email' : 'sms',
          subject: 'Automated Message',
          scheduled_for: msg.executed_at,
          status: 'queued' as const
        }));

        setQueuedMessages(formattedMessages);
      }

      // Fetch stats
      const { data: statsData, error: statsError } = await supabase.functions.invoke('get-automation-stats');
      if (statsError) throw statsError;
      
      setStats(statsData.stats);
    } catch (error: any) {
      console.error('Error fetching automation data:', error);
      toast({
        title: "Error",
        description: "Failed to load automation data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAutomation = async (automationId: string, enabled: boolean) => {
    try {
      const { error } = await supabase.functions.invoke(`manage-automation-rules/${automationId}`, {
        method: 'PUT',
        body: { enabled }
      });

      if (error) throw error;

      setAutomations(prev => prev.map(automation => 
        automation.id === automationId 
          ? { ...automation, enabled }
          : automation
      ));

      toast({
        title: "Success",
        description: `Automation ${enabled ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error: any) {
      console.error('Error toggling automation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update automation",
        variant: "destructive"
      });
    }
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

  const displayStats = stats || {
    activeAutomations: 0,
    queuedMessages: 0,
    avgSuccessRate: 0,
    messagesThisWeek: 0
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
              {displayStats.activeAutomations}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Running workflows</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Queued Messages"
            icon={<Clock className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight text-warning">
              {displayStats.queuedMessages}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled to send</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Success Rate"
            icon={<CheckCircle className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight text-success">
              {displayStats.avgSuccessRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Average delivery</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Messages This Week"
            icon={<MessageSquare className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight">{displayStats.messagesThisWeek}</div>
            <p className="text-xs text-muted-foreground mt-1">All channels</p>
          </AdminCard>
        </AdminGrid>

        <AdminGrid columns={2} gap="lg">
          {/* Automation Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Automation Rules
                </div>
                <Button onClick={() => setCreateDialogOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Rule
                </Button>
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
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Send Custom Message
              </div>
              <Button onClick={() => setSendMessageDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Message
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Send custom emails or SMS messages to your customers. You can target specific recipients, 
              schedule messages for later, or send immediately to all customers.
            </p>
          </CardContent>
        </Card>
      </div>

      <CreateAutomationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchData}
      />

      <SendMessageDialog
        open={sendMessageDialogOpen}
        onOpenChange={setSendMessageDialogOpen}
        onSuccess={fetchData}
      />
    </AdminLayout>
  );
}