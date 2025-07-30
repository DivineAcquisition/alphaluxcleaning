import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function AdminPanel() {
  const [adminEmail, setAdminEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInviteAdmin = async () => {
    if (!adminEmail) {
      toast.error("Please enter an email address");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-admin-invites', {
        body: { emails: [adminEmail] }
      });

      if (error) throw error;
      toast.success("Admin invitation sent successfully");
      setAdminEmail("");
    } catch (error) {
      console.error('Error sending admin invite:', error);
      toast.error("Failed to send admin invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Control Panel" description="Admin setup and user management">
      <div className="space-y-6">
        <Tabs defaultValue="admin-invites" className="w-full">
          <TabsList>
            <TabsTrigger value="admin-invites">Admin Invites</TabsTrigger>
            <TabsTrigger value="system-settings">System Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="admin-invites">
            <Card>
              <CardHeader>
                <CardTitle>Send Admin Invitations</CardTitle>
                <CardDescription>
                  Invite new administrators to access the admin panel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                </div>
                <Button onClick={handleInviteAdmin} disabled={loading}>
                  {loading ? "Sending..." : "Send Invitation"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="system-settings">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>
                  Configure system-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">System settings panel coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}