import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Key, Plus, Webhook, Link } from "lucide-react";

export default function ApiKeys() {
  return (
    <AdminLayout 
      title="API Keys" 
      description="Manage API keys, webhooks, and third-party integrations"
    >
      <div className="space-y-6">
        <AdminGrid columns={3} gap="lg">
          <AdminCard
            title="Active API Keys"
            description="Currently active keys"
            icon={<Key className="h-5 w-5" />}
          >
            <div className="text-2xl font-bold mt-2">8</div>
          </AdminCard>

          <AdminCard
            title="Webhooks"
            description="Configured webhooks"
            icon={<Webhook className="h-5 w-5" />}
          >
            <div className="text-2xl font-bold mt-2">3</div>
          </AdminCard>

          <AdminCard
            title="Integrations"
            description="Connected services"
            icon={<Link className="h-5 w-5" />}
          >
            <div className="text-2xl font-bold mt-2">5</div>
          </AdminCard>
        </AdminGrid>

        <Card>
          <CardHeader>
            <CardTitle>API Key Management</CardTitle>
            <CardDescription>
              Create and manage API keys for external integrations
            </CardDescription>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate New Key
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Zapier Integration</TableCell>
                  <TableCell>sk_test_***...***abc</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Read/Write</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Active</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">Revoke</Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Mobile App</TableCell>
                  <TableCell>sk_live_***...***xyz</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Read Only</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Active</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">Revoke</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook Configuration</CardTitle>
            <CardDescription>
              Configure webhooks for real-time event notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input id="webhook-url" placeholder="https://your-app.com/webhook" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-events">Events</Label>
              <Input id="webhook-events" placeholder="booking.created, payment.completed" />
            </div>
            <Button>Add Webhook</Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}