import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Shield, Lock, Eye, AlertTriangle } from "lucide-react";

export default function SecuritySettings() {
  return (
    <AdminLayout 
      title="Security Settings" 
      description="Authentication, authorization, and security configuration"
    >
      <div className="space-y-6">
        <AdminGrid columns={3} gap="lg">
          <AdminCard
            title="Failed Logins"
            description="Last 24 hours"
            icon={<AlertTriangle className="h-5 w-5" />}
          >
            <div className="text-2xl font-bold mt-2">3</div>
          </AdminCard>

          <AdminCard
            title="Active Sessions"
            description="Current user sessions"
            icon={<Eye className="h-5 w-5" />}
          >
            <div className="text-2xl font-bold mt-2">47</div>
          </AdminCard>

          <AdminCard
            title="Security Score"
            description="Overall security rating"
            icon={<Shield className="h-5 w-5" />}
          >
            <div className="text-2xl font-bold mt-2 text-green-600">95%</div>
          </AdminCard>
        </AdminGrid>

        <AdminGrid columns={2} gap="lg">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Password Policy
              </CardTitle>
              <CardDescription>
                Configure password requirements and policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="min-length">Minimum Password Length</Label>
                <Input id="min-length" type="number" defaultValue="8" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="require-uppercase">Require Uppercase</Label>
                <Switch id="require-uppercase" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="require-numbers">Require Numbers</Label>
                <Switch id="require-numbers" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="require-symbols">Require Symbols</Label>
                <Switch id="require-symbols" />
              </div>
              <Button className="w-full">Save Policy</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Management</CardTitle>
              <CardDescription>
                Control user session behavior and timeouts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                <Input id="session-timeout" type="number" defaultValue="60" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="force-logout">Force Logout on Password Change</Label>
                <Switch id="force-logout" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="concurrent-sessions">Allow Concurrent Sessions</Label>
                <Switch id="concurrent-sessions" defaultChecked />
              </div>
              <Button className="w-full">Update Settings</Button>
            </CardContent>
          </Card>
        </AdminGrid>

        <Card>
          <CardHeader>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>
              Configure 2FA requirements for different user roles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="admin-2fa">Require 2FA for Admins</Label>
              <Switch id="admin-2fa" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="subcontractor-2fa">Require 2FA for Subcontractors</Label>
              <Switch id="subcontractor-2fa" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="customer-2fa">Optional 2FA for Customers</Label>
              <Switch id="customer-2fa" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}