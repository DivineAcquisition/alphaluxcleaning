import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Server, Flag, Globe } from "lucide-react";

export default function SystemSettings() {
  return (
    <AdminLayout 
      title="System Settings" 
      description="Application configuration, feature flags, and system settings"
    >
      <div className="space-y-6">
        <AdminGrid columns={3} gap="lg">
          <AdminCard
            title="System Status"
            description="Overall system health"
            icon={<Server className="h-5 w-5" />}
          >
            <div className="text-2xl font-bold mt-2 text-green-600">Healthy</div>
          </AdminCard>

          <AdminCard
            title="Active Features"
            description="Enabled feature flags"
            icon={<Flag className="h-5 w-5" />}
          >
            <div className="text-2xl font-bold mt-2">12</div>
          </AdminCard>

          <AdminCard
            title="App Version"
            description="Current deployment"
            icon={<Settings className="h-5 w-5" />}
          >
            <div className="text-sm font-medium mt-2">v2.1.0</div>
          </AdminCard>
        </AdminGrid>

        <AdminGrid columns={2} gap="lg">
          <Card>
            <CardHeader>
              <CardTitle>Application Settings</CardTitle>
              <CardDescription>
                Basic application configuration and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="app-name">Application Name</Label>
                <Input id="app-name" defaultValue="Bay Area Cleaning Pros" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app-description">Description</Label>
                <Textarea id="app-description" defaultValue="Professional cleaning services in the Bay Area" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-email">Support Email</Label>
                <Input id="support-email" defaultValue="support@bayareacleaning.com" />
              </div>
              <Button className="w-full">Save Settings</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>
                Enable or disable application features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="booking-enabled">Online Booking</Label>
                <Switch id="booking-enabled" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="payments-enabled">Online Payments</Label>
                <Switch id="payments-enabled" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="referrals-enabled">Referral Program</Label>
                <Switch id="referrals-enabled" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="reviews-enabled">Customer Reviews</Label>
                <Switch id="reviews-enabled" />
              </div>
            </CardContent>
          </Card>
        </AdminGrid>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Regional Settings
            </CardTitle>
            <CardDescription>
              Configure timezone, currency, and localization settings
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Default Timezone</Label>
              <Input id="timezone" defaultValue="America/Los_Angeles" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" defaultValue="USD" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-format">Date Format</Label>
              <Input id="date-format" defaultValue="MM/DD/YYYY" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time-format">Time Format</Label>
              <Input id="time-format" defaultValue="12-hour" />
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}