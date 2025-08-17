import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { AdminSection } from "@/components/admin/AdminSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  Database,
  Key,
  Mail,
  Zap,
  Shield,
  Settings,
  ArrowLeft,
  Activity,
  TestTube,
  Wrench,
  Users
} from "lucide-react";

const SystemsManagementHub = () => {
  const navigate = useNavigate();
  const [systemStatus, setSystemStatus] = useState({
    database: 'Operational',
    integrations: 'Active',
    email: 'Running',
    security: 'Secure'
  });

  const systemTools = [
    {
      title: "Database Administration",
      description: "Manage database operations, backups, performance monitoring, and data integrity",
      icon: <Database className="h-5 w-5" />,
      path: "/database-tools",
      action: "Database Tools",
      status: systemStatus.database
    },
    {
      title: "API Keys & Integrations",
      description: "Manage API keys, authentication tokens, and third-party service integrations",
      icon: <Key className="h-5 w-5" />,
      path: "/api-keys",
      action: "API Management",
      status: systemStatus.integrations
    },
    {
      title: "Email Configuration",
      description: "Configure email delivery, templates, SMTP settings, and notification preferences",
      icon: <Mail className="h-5 w-5" />,
      path: "/email-settings",
      action: "Email Settings",
      status: systemStatus.email
    },
    {
      title: "Automation & Workflows",
      description: "Manage automated workflows, triggers, and business process automation",
      icon: <Zap className="h-5 w-5" />,
      path: "/automation-controls",
      action: "Automation Hub",
      status: 'Active'
    },
    {
      title: "Security Center",
      description: "Monitor security logs, manage access controls, and review audit trails",
      icon: <Shield className="h-5 w-5" />,
      path: "/security-center",
      action: "Security Dashboard",
      status: systemStatus.security
    },
    {
      title: "System Settings",
      description: "Core system configuration, feature toggles, and global application settings",
      icon: <Settings className="h-5 w-5" />,
      path: "/system-settings",
      action: "System Config",
      status: 'Configured'
    },
    {
      title: "Testing Portal",
      description: "Test webhook integrations, API endpoints, Zapier connections, and system functionality",
      icon: <TestTube className="h-5 w-5" />,
      path: "/testing-portal",
      action: "Run Tests",
      status: 'Ready'
    },
    {
      title: "Bulk Operations",
      description: "Perform bulk operations on subcontractors, customers, and system data",
      icon: <Users className="h-5 w-5" />,
      path: "/add-spreadsheet-cleaners",
      action: "Bulk Tools",
      status: 'Available'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Operational': { variant: 'default', color: 'text-success' },
      'Active': { variant: 'default', color: 'text-success' },
      'Running': { variant: 'default', color: 'text-success' },
      'Secure': { variant: 'default', color: 'text-success' },
      'Configured': { variant: 'secondary', color: 'text-primary' },
      'Ready': { variant: 'secondary', color: 'text-primary' },
      'Available': { variant: 'secondary', color: 'text-muted-foreground' }
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline', color: 'text-muted-foreground' };
    
    return (
      <Badge variant={config.variant as any} className={`${config.color} text-xs`}>
        {status}
      </Badge>
    );
  };

  return (
    <AdminLayout 
      title="Systems Management Hub" 
      description="Technical administration and system configuration"
    >
      <div className="space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Hub
          </Button>
        </div>

        {/* System Status Overview */}
        <AdminSection 
          title="System Status"
          description="Real-time system health and operational status"
        >
          <AdminGrid columns={4} gap="md">
            <AdminCard
              variant="metric"
              title="Database"
              icon={<Database className="h-4 w-4" />}
            >
              <div className="flex items-center gap-2 mt-2">
                <div className="h-3 w-3 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-success">Operational</span>
              </div>
            </AdminCard>

            <AdminCard
              variant="metric"
              title="Integrations"
              icon={<Zap className="h-4 w-4" />}
            >
              <div className="flex items-center gap-2 mt-2">
                <div className="h-3 w-3 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-success">Active</span>
              </div>
            </AdminCard>

            <AdminCard
              variant="metric"
              title="Email System"
              icon={<Mail className="h-4 w-4" />}
            >
              <div className="flex items-center gap-2 mt-2">
                <div className="h-3 w-3 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-success">Running</span>
              </div>
            </AdminCard>

            <AdminCard
              variant="metric"
              title="Security"
              icon={<Shield className="h-4 w-4" />}
            >
              <div className="flex items-center gap-2 mt-2">
                <div className="h-3 w-3 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-success">Secure</span>
              </div>
            </AdminCard>
          </AdminGrid>
        </AdminSection>

        {/* System Management Tools */}
        <AdminSection 
          title="System Administration Tools"
          description="Access all technical and system management functions"
        >
          <AdminGrid columns={2} gap="lg">
            {systemTools.map((tool) => (
              <AdminCard
                key={tool.title}
                title={tool.title}
                description={tool.description}
                variant="action"
                icon={tool.icon}
              >
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    {getStatusBadge(tool.status)}
                  </div>
                  <Button 
                    onClick={() => navigate(tool.path)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Wrench className="h-4 w-4" />
                    {tool.action}
                  </Button>
                </div>
              </AdminCard>
            ))}
          </AdminGrid>
        </AdminSection>
      </div>
    </AdminLayout>
  );
};

export default SystemsManagementHub;