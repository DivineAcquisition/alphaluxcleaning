import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  TrendingUp, 
  MessageSquare, 
  Calendar, 
  Target,
  BarChart3,
  Mail,
  Phone,
  Star,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface PipelineMetrics {
  totalContacts: number;
  opportunities: number;
  conversionRate: number;
  averageDealValue: number;
  totalRevenue: number;
}

interface CampaignMetrics {
  emailsSent: number;
  emailOpenRate: number;
  smsDelivered: number;
  responseRate: number;
  automationsActive: number;
}

export function GHLIntegrationDashboard() {
  const [pipelineMetrics, setPipelineMetrics] = useState<PipelineMetrics>({
    totalContacts: 0,
    opportunities: 0,
    conversionRate: 0,
    averageDealValue: 0,
    totalRevenue: 0
  });
  
  const [campaignMetrics, setCampaignMetrics] = useState<CampaignMetrics>({
    emailsSent: 0,
    emailOpenRate: 0,
    smsDelivered: 0,
    responseRate: 0,
    automationsActive: 0
  });

  const [loading, setLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [campaignType, setCampaignType] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load metrics from GHL via our enhanced integration
      const metricsResponse = await supabase.functions.invoke('enhanced-ghl-integration', {
        body: {
          action: 'get_analytics',
          reportType: 'contacts',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        }
      });

      if (metricsResponse.data?.result) {
        // Update metrics based on response
        setPipelineMetrics({
          totalContacts: metricsResponse.data.result.totalContacts || 0,
          opportunities: metricsResponse.data.result.opportunities || 0,
          conversionRate: metricsResponse.data.result.conversionRate || 0,
          averageDealValue: metricsResponse.data.result.averageDealValue || 0,
          totalRevenue: metricsResponse.data.result.totalRevenue || 0
        });
      }

      // Load campaign metrics
      const campaignResponse = await supabase.functions.invoke('enhanced-ghl-integration', {
        body: {
          action: 'get_analytics',
          reportType: 'campaigns',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        }
      });

      if (campaignResponse.data?.result) {
        setCampaignMetrics({
          emailsSent: campaignResponse.data.result.emailsSent || 0,
          emailOpenRate: campaignResponse.data.result.emailOpenRate || 0,
          smsDelivered: campaignResponse.data.result.smsDelivered || 0,
          responseRate: campaignResponse.data.result.responseRate || 0,
          automationsActive: campaignResponse.data.result.automationsActive || 0
        });
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendSMS = async () => {
    if (!selectedContact || !messageContent) {
      toast({
        title: "Error",
        description: "Please select a contact and enter a message",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke('enhanced-ghl-integration', {
        body: {
          action: 'send_sms',
          contactId: selectedContact,
          message: messageContent,
          messageType: 'text'
        }
      });

      if (response.data?.success) {
        toast({
          title: "Success",
          description: "SMS sent successfully",
        });
        setMessageContent("");
      } else {
        throw new Error(response.data?.error || 'Failed to send SMS');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send SMS",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerCampaign = async () => {
    if (!campaignType || !selectedContact) {
      toast({
        title: "Error",
        description: "Please select a contact and campaign type",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke('enhanced-ghl-integration', {
        body: {
          action: 'create_campaign_automation',
          campaignType: campaignType,
          contactId: selectedContact,
          serviceType: 'general_cleaning',
          triggerDate: new Date().toISOString()
        }
      });

      if (response.data?.success) {
        toast({
          title: "Success",
          description: "Campaign automation triggered successfully",
        });
        setCampaignType("");
      } else {
        throw new Error(response.data?.error || 'Failed to trigger campaign');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to trigger campaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testPipelineAutomation = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('ghl-advanced-pipeline', {
        body: {
          action: 'automation_trigger',
          triggerType: 'service_completed',
          contactId: selectedContact,
          data: { rating: 5 }
        }
      });

      if (response.data?.success) {
        toast({
          title: "Success",
          description: "Pipeline automation tested successfully",
        });
      } else {
        throw new Error(response.data?.error || 'Failed to test automation');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test pipeline automation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">GoHighLevel Integration</h2>
          <p className="text-muted-foreground">
            Advanced CRM automation and pipeline management
          </p>
        </div>
        <Button onClick={loadDashboardData} disabled={loading}>
          {loading ? "Loading..." : "Refresh Data"}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineMetrics.totalContacts}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineMetrics.opportunities}</div>
            <p className="text-xs text-muted-foreground">
              {pipelineMetrics.conversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pipelineMetrics.averageDealValue}</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Open Rate</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignMetrics.emailOpenRate}%</div>
            <p className="text-xs text-muted-foreground">
              {campaignMetrics.emailsSent} emails sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Automations</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignMetrics.automationsActive}</div>
            <p className="text-xs text-muted-foreground">
              Running campaigns
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline Management</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Automation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Overview</CardTitle>
                <CardDescription>
                  Track opportunities through the sales pipeline
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Leads</span>
                    <Badge variant="secondary">45</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Qualified</span>
                    <Badge variant="secondary">32</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Scheduled</span>
                    <Badge variant="secondary">28</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">In Progress</span>
                    <Badge variant="secondary">15</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Completed</span>
                    <Badge variant="outline">12</Badge>
                  </div>
                </div>
                <Button onClick={testPipelineAutomation} disabled={loading} className="w-full">
                  Test Pipeline Automation
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lead Scoring</CardTitle>
                <CardDescription>
                  Automatic lead scoring based on behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Hot Leads (80-100)</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-12 bg-red-500 rounded" />
                      <span className="text-sm font-medium">8</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Warm Leads (60-79)</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-12 bg-orange-500 rounded" />
                      <span className="text-sm font-medium">15</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cold Leads (0-59)</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-12 bg-blue-500 rounded" />
                      <span className="text-sm font-medium">22</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="communications" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Send SMS</CardTitle>
                <CardDescription>
                  Send personalized SMS messages to contacts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-select">Select Contact</Label>
                  <Input
                    id="contact-select"
                    placeholder="Enter contact ID or email"
                    value={selectedContact}
                    onChange={(e) => setSelectedContact(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message-content">Message</Label>
                  <Textarea
                    id="message-content"
                    placeholder="Enter your message here..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button onClick={sendSMS} disabled={loading || !selectedContact || !messageContent}>
                  {loading ? "Sending..." : "Send SMS"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communication Stats</CardTitle>
                <CardDescription>
                  Recent communication metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Emails Sent (30d)
                    </span>
                    <Badge variant="secondary">{campaignMetrics.emailsSent}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      SMS Delivered (30d)
                    </span>
                    <Badge variant="secondary">{campaignMetrics.smsDelivered}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Response Rate
                    </span>
                    <Badge variant="outline">{campaignMetrics.responseRate}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Trigger Campaign</CardTitle>
                <CardDescription>
                  Launch automated campaign sequences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-type">Campaign Type</Label>
                  <Select value={campaignType} onValueChange={setCampaignType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service_reminder">Service Reminder</SelectItem>
                      <SelectItem value="upsell_sequence">Upsell Sequence</SelectItem>
                      <SelectItem value="retention_campaign">Retention Campaign</SelectItem>
                      <SelectItem value="referral_request">Referral Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-contact">Target Contact</Label>
                  <Input
                    id="target-contact"
                    placeholder="Enter contact ID"
                    value={selectedContact}
                    onChange={(e) => setSelectedContact(e.target.value)}
                  />
                </div>
                <Button onClick={triggerCampaign} disabled={loading || !campaignType || !selectedContact}>
                  {loading ? "Triggering..." : "Trigger Campaign"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Campaigns</CardTitle>
                <CardDescription>
                  Currently running automated campaigns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">Welcome Sequence</p>
                      <p className="text-sm text-muted-foreground">New customer onboarding</p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">Service Reminders</p>
                      <p className="text-sm text-muted-foreground">Appointment notifications</p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">Review Requests</p>
                      <p className="text-sm text-muted-foreground">Post-service feedback</p>
                    </div>
                    <Badge variant="outline">Paused</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Attribution</CardTitle>
                <CardDescription>
                  Revenue tracked by source and campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Google Ads</span>
                    <span className="font-medium">$12,450</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Email Campaigns</span>
                    <span className="font-medium">$8,200</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Referrals</span>
                    <span className="font-medium">$5,750</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Direct</span>
                    <span className="font-medium">$3,100</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Journey</CardTitle>
                <CardDescription>
                  Average customer progression metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Lead to Qualified</span>
                    <span className="font-medium">2.3 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Qualified to Booked</span>
                    <span className="font-medium">1.7 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Booked to Completed</span>
                    <span className="font-medium">5.2 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">First to Repeat Service</span>
                    <span className="font-medium">28 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}