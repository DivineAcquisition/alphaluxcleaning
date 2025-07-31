import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { AdminSection } from "@/components/admin/AdminSection";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Mail, 
  Database, 
  Key, 
  Shield, 
  Settings,
  ArrowRight,
  Briefcase,
  BarChart3
} from "lucide-react";
import { JobManagementDashboard } from "@/components/admin/JobManagementDashboard";
import { SubcontractorJobTracker } from "@/components/admin/SubcontractorJobTracker";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const adminSections = [
    {
      title: "User Management",
      description: "Manage user accounts, roles, and permissions across the platform",
      icon: <Users className="h-6 w-6" />,
      action: "Manage Users",
      path: "/user-management"
    },
    {
      title: "Email Settings",
      description: "Configure email templates, notifications, and delivery settings",
      icon: <Mail className="h-6 w-6" />,
      action: "Email Config",
      path: "/email-settings"
    },
    {
      title: "Database Tools",
      description: "Database management, backups, and performance monitoring",
      icon: <Database className="h-6 w-6" />,
      action: "Database Console",
      path: "/database-tools"
    },
    {
      title: "API Keys",
      description: "Manage API keys, webhooks, and third-party integrations",
      icon: <Key className="h-6 w-6" />,
      action: "API Management",
      path: "/api-keys"
    },
    {
      title: "Security Settings",
      description: "Authentication, authorization, and security configuration",
      icon: <Shield className="h-6 w-6" />,
      action: "Security Console",
      path: "/security-settings"
    },
    {
      title: "System Settings",
      description: "Application configuration, feature flags, and system settings",
      icon: <Settings className="h-6 w-6" />,
      action: "System Config",
      path: "/system-settings"
    }
  ];

  return (
    <AdminLayout 
      title="Control Panel" 
      description="Administrative tools and system configuration"
    >
      <Tabs defaultValue="management" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Job Management
          </TabsTrigger>
          <TabsTrigger value="subcontractors" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Subcontractors
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Admin Tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="space-y-4">
          <JobManagementDashboard />
        </TabsContent>

        <TabsContent value="subcontractors" className="space-y-4">
          <AdminSection 
            title="Subcontractor Performance Tracker"
            description="Monitor and manage subcontractor performance, availability, and job completion rates"
          >
            <SubcontractorJobTracker />
          </AdminSection>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <AdminSection 
            title="Admin Control Panel"
            description="Access all administrative tools and system configurations from this central hub"
          >
            <AdminGrid columns={3} gap="lg">
              {adminSections.map((section) => (
                <AdminCard
                  key={section.title}
                  title={section.title}
                  description={section.description}
                  variant="action"
                  icon={section.icon}
                >
                  <div className="mt-4">
                    <Button 
                      onClick={() => navigate(section.path)}
                      className="w-full justify-between group"
                      variant="outline"
                    >
                      <span>{section.action}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </AdminCard>
              ))}
            </AdminGrid>
          </AdminSection>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}