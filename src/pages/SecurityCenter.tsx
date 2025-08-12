import { AdminLayout } from "@/components/admin/AdminLayout";
import SecuritySettings from "@/pages/SecuritySettings";
import { SecurityDashboard } from "@/components/admin/SecurityDashboard";
import { SecurityMonitoring } from "@/components/admin/SecurityMonitoring";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SecurityCenter() {
  return (
    <AdminLayout 
      title="Security Center" 
      description="Comprehensive security management and monitoring"
    >
      <Tabs defaultValue="monitoring" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monitoring">Security Monitoring</TabsTrigger>
          <TabsTrigger value="dashboard">Security Dashboard</TabsTrigger>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-6">
          <SecurityMonitoring />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <SecurityDashboard />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="max-w-4xl">
            <SecuritySettings />
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}