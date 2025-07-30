import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Zap, 
  Users, 
  MessageSquare, 
  Mail, 
  Calendar, 
  TrendingUp,
  Settings,
  Play,
  Pause,
  BarChart3,
  Clock,
  Star,
  Phone,
  Target,
  RefreshCw,
  Send,
  Bot,
  Activity,
  CheckCircle,
  AlertTriangle,
  Heart,
  Gift,
  MessageCircle,
  UserPlus,
  Repeat,
  DollarSign
} from "lucide-react";

interface WorkflowExecution {
  id: string;
  workflow_type: string;
  stage: string;
  customer_email: string;
  executed_at: string;
  actions_executed: number;
  success_count: number;
  status: string;
}

interface AutomationMetrics {
  total_workflows: number;
  active_campaigns: number;
  success_rate: number;
  customers_engaged: number;
  retention_rate: number;
  upsell_conversions: number;
}

export const GHLIntegrationDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<AutomationMetrics>({
    total_workflows: 0,
    active_campaigns: 0,
    success_rate: 0,
    customers_engaged: 0,
    retention_rate: 0,
    upsell_conversions: 0
  });
  const [workflowExecutions, setWorkflowExecutions] = useState<WorkflowExecution[]>([]);
  
  // Phase 2: Automation Workflow States
  const [automationSettings, setAutomationSettings] = useState({
    service_lifecycle: true,
    retention_campaigns: true,
    upselling_workflows: true,
    review_management: true,
    appointment_reminders: true,
    referral_automation: true
  });

  const [campaignConfig, setCampaignConfig] = useState({
    retention_trigger_days: 30,
    upsell_delay_days: 7,
    review_request_hours: 24,
    reminder_schedule: "24h,2h,30m"
  });

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchAutomationMetrics(),
        fetchWorkflowExecutions(),
        fetchCampaignPerformance()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAutomationMetrics = async () => {
    // Simulate fetching automation metrics
    setMetrics({
      total_workflows: 1247,
      active_campaigns: 23,
      success_rate: 87.5,
      customers_engaged: 892,
      retention_rate: 73.2,
      upsell_conversions: 156
    });
  };

  const fetchWorkflowExecutions = async () => {
    // Simulate fetching recent workflow executions
    const mockExecutions: WorkflowExecution[] = [
      {
        id: '1',
        workflow_type: 'service_lifecycle',
        stage: 'booking_confirmed',
        customer_email: 'john@example.com',
        executed_at: new Date().toISOString(),
        actions_executed: 4,
        success_count: 4,
        status: 'completed'
      },
      {
        id: '2',
        workflow_type: 'retention_campaign',
        stage: 'inactive_30_days',
        customer_email: 'sarah@example.com',
        executed_at: new Date(Date.now() - 300000).toISOString(),
        actions_executed: 3,
        success_count: 2,
        status: 'partially_completed'
      }
    ];
    setWorkflowExecutions(mockExecutions);
  };

  const fetchCampaignPerformance = async () => {
    // Implementation for fetching campaign performance data
  };

  // Phase 2: Automation Workflow Functions
  const executeWorkflow = async (workflow: string, params: any) => {
    try {
      setIsLoading(true);
      const response = await supabase.functions.invoke('ghl-automation-workflows', {
        body: { workflow, ...params }
      });

      if (response.error) {
        throw response.error;
      }

      toast.success(`${workflow} workflow executed successfully`);
      await fetchWorkflowExecutions(); // Refresh data
      return response.data;
    } catch (error) {
      console.error(`Error executing ${workflow}:`, error);
      toast.error(`Failed to execute ${workflow} workflow`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAutomation = async (automationType: string, enabled: boolean) => {
    try {
      setAutomationSettings(prev => ({
        ...prev,
        [automationType]: enabled
      }));
      
      toast.success(`${automationType} ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling automation:', error);
      toast.error('Failed to update automation settings');
    }
  };

  const triggerRetentionCampaign = async () => {
    await executeWorkflow('retention_campaign', {
      campaignType: 'inactive_30_days',
      customerEmail: 'test@example.com',
      customerName: 'Test Customer',
      lastServiceDate: '2024-01-01',
      lifetimeValue: 500
    });
  };

  const triggerServiceLifecycle = async (stage: string) => {
    await executeWorkflow('service_lifecycle', {
      stage,
      orderId: 'test-order-123',
      customerEmail: 'test@example.com',
      customerName: 'Test Customer',
      serviceDate: new Date().toISOString().split('T')[0],
      serviceType: 'Standard Cleaning'
    });
  };

  const triggerUpsellWorkflow = async () => {
    await executeWorkflow('upselling_workflow', {
      customerEmail: 'test@example.com',
      customerName: 'Test Customer',
      serviceHistory: ['standard_cleaning'],
      currentService: 'standard_cleaning',
      spendingTier: 'medium'
    });
  };

  const triggerReviewManagement = async (action: string) => {
    await executeWorkflow('review_management', {
      action,
      customerEmail: 'test@example.com',
      customerName: 'Test Customer',
      serviceDate: new Date().toISOString().split('T')[0],
      rating: action === 'handle_positive_review' ? 5 : 2
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">GHL Integration Dashboard</h2>
          <p className="text-muted-foreground">Phase 2: Intelligent Automation Workflows</p>
        </div>
        <Button onClick={fetchDashboardData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Phase 2: Automation Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Workflows</p>
                <p className="text-2xl font-bold">{metrics.total_workflows}</p>
              </div>
              <Bot className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
                <p className="text-2xl font-bold">{metrics.active_campaigns}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{metrics.success_rate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customers Engaged</p>
                <p className="text-2xl font-bold">{metrics.customers_engaged}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Retention Rate</p>
                <p className="text-2xl font-bold">{metrics.retention_rate}%</p>
              </div>
              <Heart className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upsell Conversions</p>
                <p className="text-2xl font-bold">{metrics.upsell_conversions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Workflow Executions
                </CardTitle>
                <CardDescription>Latest automation activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workflowExecutions.map((execution) => (
                    <div key={execution.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{execution.workflow_type.replace('_', ' ')}</div>
                        <div className="text-sm text-muted-foreground">{execution.customer_email}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant={execution.status === 'completed' ? 'default' : 'secondary'}>
                          {execution.success_count}/{execution.actions_executed}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(execution.executed_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Summary
                </CardTitle>
                <CardDescription>Key automation metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Service Lifecycle</span>
                    <Badge variant="outline">92% success</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Retention Campaigns</span>
                    <Badge variant="outline">78% success</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Upselling</span>
                    <Badge variant="outline">65% success</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Review Management</span>
                    <Badge variant="outline">88% success</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Phase 2: Workflow Management Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Automation Workflows
              </CardTitle>
              <CardDescription>
                Intelligent automation workflows for customer lifecycle management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Service Lifecycle Workflow */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <h4 className="font-semibold">Service Lifecycle</h4>
                      </div>
                      <Switch
                        checked={automationSettings.service_lifecycle}
                        onCheckedChange={(checked) => toggleAutomation('service_lifecycle', checked)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Automate booking confirmations, service updates, and completion follow-ups
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => triggerServiceLifecycle('booking_confirmed')}>
                        <Play className="h-3 w-3 mr-1" />
                        Test Booking
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => triggerServiceLifecycle('service_completed')}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Test Completion
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Retention Campaign */}
                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-600" />
                        <h4 className="font-semibold">Retention Campaigns</h4>
                      </div>
                      <Switch
                        checked={automationSettings.retention_campaigns}
                        onCheckedChange={(checked) => toggleAutomation('retention_campaigns', checked)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Win back inactive customers with personalized offers and incentives
                    </p>
                    <Button size="sm" onClick={triggerRetentionCampaign}>
                      <Send className="h-3 w-3 mr-1" />
                      Test Campaign
                    </Button>
                  </CardContent>
                </Card>

                {/* Upselling Workflow */}
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <h4 className="font-semibold">Upselling</h4>
                      </div>
                      <Switch
                        checked={automationSettings.upselling_workflows}
                        onCheckedChange={(checked) => toggleAutomation('upselling_workflows', checked)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Intelligent upselling based on service history and customer behavior
                    </p>
                    <Button size="sm" onClick={triggerUpsellWorkflow}>
                      <Target className="h-3 w-3 mr-1" />
                      Test Upsell
                    </Button>
                  </CardContent>
                </Card>

                {/* Review Management */}
                <Card className="border-l-4 border-l-yellow-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-600" />
                        <h4 className="font-semibold">Review Management</h4>
                      </div>
                      <Switch
                        checked={automationSettings.review_management}
                        onCheckedChange={(checked) => toggleAutomation('review_management', checked)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Automate review requests and handle positive/negative feedback
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => triggerReviewManagement('request_review')}>
                        <Star className="h-3 w-3 mr-1" />
                        Request
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => triggerReviewManagement('handle_positive_review')}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Positive
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Appointment Reminders */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <h4 className="font-semibold">Reminders</h4>
                      </div>
                      <Switch
                        checked={automationSettings.appointment_reminders}
                        onCheckedChange={(checked) => toggleAutomation('appointment_reminders', checked)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Multi-stage appointment reminders to reduce no-shows
                    </p>
                    <Button size="sm">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Test Reminder
                    </Button>
                  </CardContent>
                </Card>

                {/* Referral Automation */}
                <Card className="border-l-4 border-l-indigo-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-indigo-600" />
                        <h4 className="font-semibold">Referral Program</h4>
                      </div>
                      <Switch
                        checked={automationSettings.referral_automation}
                        onCheckedChange={(checked) => toggleAutomation('referral_automation', checked)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Automate referral requests to satisfied customers
                    </p>
                    <Button size="sm">
                      <Gift className="h-3 w-3 mr-1" />
                      Test Referral
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>Track campaign effectiveness and ROI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Retention Campaigns</span>
                    <div className="text-right">
                      <div className="font-medium">23% comeback rate</div>
                      <div className="text-xs text-muted-foreground">156 sent this month</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Upsell Campaigns</span>
                    <div className="text-right">
                      <div className="font-medium">15% conversion</div>
                      <div className="text-xs text-muted-foreground">89 opportunities</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Review Requests</span>
                    <div className="text-right">
                      <div className="font-medium">67% response</div>
                      <div className="text-xs text-muted-foreground">234 requests sent</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campaign Settings</CardTitle>
                <CardDescription>Configure automation triggers and timing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Retention Trigger (days inactive)</Label>
                  <Input
                    type="number"
                    value={campaignConfig.retention_trigger_days}
                    onChange={(e) => setCampaignConfig(prev => ({ 
                      ...prev, 
                      retention_trigger_days: parseInt(e.target.value) 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Upsell Delay (days after service)</Label>
                  <Input
                    type="number"
                    value={campaignConfig.upsell_delay_days}
                    onChange={(e) => setCampaignConfig(prev => ({ 
                      ...prev, 
                      upsell_delay_days: parseInt(e.target.value) 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Review Request (hours after completion)</Label>
                  <Input
                    type="number"
                    value={campaignConfig.review_request_hours}
                    onChange={(e) => setCampaignConfig(prev => ({ 
                      ...prev, 
                      review_request_hours: parseInt(e.target.value) 
                    }))}
                  />
                </div>
                <Button className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Impact</CardTitle>
                <CardDescription>Automation-driven revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Retention Revenue</span>
                    <span className="font-medium">$12,450</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Upsell Revenue</span>
                    <span className="font-medium">$8,920</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Referral Revenue</span>
                    <span className="font-medium">$5,670</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-semibold">
                    <span>Total ROI</span>
                    <span className="text-green-600">+$27,040</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Engagement</CardTitle>
                <CardDescription>Interaction metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">SMS Open Rate</span>
                    <span className="font-medium">94%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Email Open Rate</span>
                    <span className="font-medium">67%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Response Rate</span>
                    <span className="font-medium">34%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Click-through Rate</span>
                    <span className="font-medium">23%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workflow Efficiency</CardTitle>
                <CardDescription>Automation performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Time Saved (hours)</span>
                    <span className="font-medium">127</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Manual Tasks Avoided</span>
                    <span className="font-medium">892</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Error Reduction</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cost Savings</span>
                    <span className="font-medium text-green-600">$3,240</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Automation Settings</CardTitle>
              <CardDescription>Configure automation behavior and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Workflow Controls</h4>
                  {Object.entries(automationSettings).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={key} className="capitalize">
                        {key.replace('_', ' ')}
                      </Label>
                      <Switch
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) => toggleAutomation(key, checked)}
                      />
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Timing Configuration</h4>
                  <div className="space-y-2">
                    <Label>Default Business Hours</Label>
                    <Input placeholder="9:00 AM - 6:00 PM" />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pst">Pacific Standard Time</SelectItem>
                        <SelectItem value="mst">Mountain Standard Time</SelectItem>
                        <SelectItem value="cst">Central Standard Time</SelectItem>
                        <SelectItem value="est">Eastern Standard Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Daily Messages</Label>
                    <Input type="number" placeholder="50" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Testing</CardTitle>
              <CardDescription>Test automation workflows with sample data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Test Email</Label>
                  <Input placeholder="test@example.com" />
                </div>
                <div className="space-y-3">
                  <Label>Test Customer Name</Label>
                  <Input placeholder="John Doe" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Button onClick={() => triggerServiceLifecycle('booking_confirmed')} disabled={isLoading}>
                  <Play className="h-4 w-4 mr-2" />
                  Test Booking Confirmed
                </Button>
                <Button onClick={() => triggerServiceLifecycle('service_completed')} disabled={isLoading}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Test Service Completed
                </Button>
                <Button onClick={triggerRetentionCampaign} disabled={isLoading}>
                  <Heart className="h-4 w-4 mr-2" />
                  Test Retention Campaign
                </Button>
                <Button onClick={triggerUpsellWorkflow} disabled={isLoading}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Test Upsell Workflow
                </Button>
                <Button onClick={() => triggerReviewManagement('request_review')} disabled={isLoading}>
                  <Star className="h-4 w-4 mr-2" />
                  Test Review Request
                </Button>
                <Button onClick={() => triggerReviewManagement('handle_positive_review')} disabled={isLoading}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Test Positive Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};