import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { Key, Code, Zap, BarChart3, Shield, Globe, Settings, Copy, Play, TestTube, Activity } from "lucide-react";

export default function ApiPortal() {
  const [apiKey, setApiKey] = useState("sk_live_51H...");

  const apiEndpoints = [
    {
      method: "GET",
      endpoint: "/api/v1/bookings",
      description: "Retrieve all bookings",
      status: "Active"
    },
    {
      method: "POST",
      endpoint: "/api/v1/bookings",
      description: "Create a new booking",
      status: "Active"
    },
    {
      method: "GET",
      endpoint: "/api/v1/customers",
      description: "Retrieve customer data",
      status: "Active"
    },
    {
      method: "PUT",
      endpoint: "/api/v1/bookings/{id}",
      description: "Update booking status",
      status: "Active"
    }
  ];

  const webhooks = [
    {
      event: "booking.created",
      url: "https://example.com/webhook",
      status: "Active",
      lastTriggered: "2 hours ago"
    },
    {
      event: "payment.completed",
      url: "https://example.com/payments",
      status: "Active",
      lastTriggered: "5 minutes ago"
    },
    {
      event: "service.completed",
      url: "https://example.com/completed",
      status: "Inactive",
      lastTriggered: "Never"
    }
  ];

  return (
    <AdminLayout 
      title="Developer & Integration Portal" 
      description="API documentation, webhook management, and integration tools"
    >
      {/* API Overview */}
      <AdminGrid columns="auto" gap="lg">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              API Keys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">3</div>
            <p className="text-sm text-muted-foreground">Active keys</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-success" />
              API Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">12.4K</div>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              Webhooks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">8</div>
            <p className="text-sm text-muted-foreground">Configured</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-warning" />
              Rate Limit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">85%</div>
            <p className="text-sm text-muted-foreground">Usage this hour</p>
          </CardContent>
        </Card>
      </AdminGrid>

      <Tabs defaultValue="documentation" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="testing">API Testing</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="documentation">
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                API Documentation
              </CardTitle>
              <CardDescription>
                Interactive API explorer with code examples and authentication guides
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiEndpoints.map((endpoint, index) => (
                  <div key={index} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={endpoint.method === "GET" ? "secondary" : 
                                  endpoint.method === "POST" ? "default" : "outline"}
                        >
                          {endpoint.method}
                        </Badge>
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {endpoint.endpoint}
                        </code>
                      </div>
                      <Badge variant="outline">{endpoint.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{endpoint.description}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold mb-3">Example Request</h4>
                <code className="block bg-muted p-3 rounded text-sm font-mono">
                  {`curl -X GET "https://api.bayareacleaningpros.com/v1/bookings" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys">
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Key Management
              </CardTitle>
              <CardDescription>
                Create and manage API keys for secure access to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Production Key</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-sm font-mono">{apiKey}</code>
                        <Button size="sm" variant="ghost">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Created on Jan 15, 2024 • Last used: 2 hours ago
                  </p>
                </div>
                
                <Button className="w-full" variant="outline">
                  <Key className="h-4 w-4 mr-2" />
                  Generate New API Key
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Webhook Configuration
              </CardTitle>
              <CardDescription>
                Real-time event notifications for third-party integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {webhooks.map((webhook, index) => (
                  <div key={index} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{webhook.event}</h4>
                        <code className="text-sm font-mono text-muted-foreground">{webhook.url}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={webhook.status === "Active" ? "default" : "outline"}
                        >
                          {webhook.status}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Last triggered: {webhook.lastTriggered}
                    </p>
                  </div>
                ))}
              </div>
              
              <Button className="w-full mt-4" variant="outline">
                <Zap className="h-4 w-4 mr-2" />
                Add New Webhook
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing">
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Interactive API Testing
              </CardTitle>
              <CardDescription>
                Test API endpoints directly from the browser with real-time monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Endpoint</label>
                    <select className="w-full p-2 border rounded-lg bg-background">
                      <option>GET /api/v1/bookings</option>
                      <option>POST /api/v1/bookings</option>
                      <option>GET /api/v1/customers</option>
                      <option>PUT /api/v1/bookings/{"{id}"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">API Key</label>
                    <div className="flex gap-2">
                      <Input placeholder="Enter your API key" className="flex-1" />
                      <Button size="sm" variant="outline">
                        <Key className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Request Body (JSON)</label>
                  <textarea 
                    className="w-full h-32 p-3 border rounded-lg bg-muted/30 font-mono text-sm"
                    placeholder={`{
  "customer_name": "John Doe",
  "service_type": "deep-clean",
  "date": "2024-01-15"
}`}
                  />
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1">
                    <Play className="h-4 w-4 mr-2" />
                    Send Request
                  </Button>
                  <Button variant="outline">
                    <Activity className="h-4 w-4 mr-2" />
                    Monitor Response
                  </Button>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Response
                  </h4>
                  <div className="bg-muted p-3 rounded text-sm font-mono">
                    <span className="text-success">Status: 200 OK</span><br />
                    <span className="text-muted-foreground">Response Time: 145ms</span>
                    <pre className="mt-2 text-xs">{`{
  "success": true,
  "data": {
    "bookings": [...]
  }
}`}</pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Usage Analytics
              </CardTitle>
              <CardDescription>
                API usage monitoring, performance metrics, and billing integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminGrid columns={2} gap="md">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold text-sm text-muted-foreground">Requests Today</h4>
                  <p className="text-2xl font-bold text-primary">1,247</p>
                  <p className="text-xs text-muted-foreground">+12% vs yesterday</p>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold text-sm text-muted-foreground">Average Response Time</h4>
                  <p className="text-2xl font-bold text-success">145ms</p>
                  <p className="text-xs text-muted-foreground">-8ms vs last week</p>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold text-sm text-muted-foreground">Error Rate</h4>
                  <p className="text-2xl font-bold text-warning">0.02%</p>
                  <p className="text-xs text-muted-foreground">Well below threshold</p>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold text-sm text-muted-foreground">Rate Limit Used</h4>
                  <p className="text-2xl font-bold text-accent">85%</p>
                  <p className="text-xs text-muted-foreground">This hour</p>
                </div>
              </AdminGrid>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}