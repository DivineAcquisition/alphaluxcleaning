import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard,
  BarChart3,
  Settings,
  Database,
  Shield,
  Key,
  Terminal,
  Globe,
  Webhook,
  Users2,
  Mail,
  LogOut,
  Crown,
  Zap
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const systemItems = [
  {
    label: "Admin Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
    description: "Main overview"
  },
  {
    label: "Control Panel",
    path: "/admin-dashboard",
    icon: Settings,
    description: "System settings"
  },
  {
    label: "Analytics",
    path: "/metrics-dashboard",
    icon: BarChart3,
    description: "Data insights"
  },
  {
    label: "API Management",
    path: "/api-portal",
    icon: Globe,
    description: "API tools"
  },
  {
    label: "API Keys",
    path: "/api-keys",
    icon: Key,
    description: "Manage keys"
  },
  {
    label: "Database Tools",
    path: "/database-tools",
    icon: Database,
    description: "DB management"
  },
  {
    label: "System Settings",
    path: "/system-settings",
    icon: Settings,
    description: "Configuration"
  },
  {
    label: "Security Settings",
    path: "/security-settings",
    icon: Shield,
    description: "Security config"
  },
  {
    label: "User Management",
    path: "/user-management",
    icon: Users2,
    description: "System users"
  },
  {
    label: "Email Settings",
    path: "/email-settings",
    icon: Mail,
    description: "Email config"
  },
  {
    label: "Automation",
    path: "/automation-controls",
    icon: Zap,
    description: "Workflows"
  },
  {
    label: "System Logs",
    path: "/system-logs",
    icon: Terminal,
    description: "Debug logs"
  }
];

export function SystemsManagementSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <Sidebar className="z-40 border-r shadow-lg" collapsible="icon">
      <SidebarHeader className="border-b p-4 bg-gradient-to-r from-purple-500/10 to-purple-600/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Crown className="h-5 w-5 text-white" />
          </div>
          {open && (
            <div>
              <h1 className="text-sm font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                Systems Management
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Admin & Configuration</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
            System Administration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {systemItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton 
                      asChild
                      isActive={active}
                      className={`
                        group relative transition-all duration-200 hover:shadow-md
                        ${active 
                          ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg scale-[1.02] border-purple-500/20" 
                          : "hover:bg-purple-50 hover:border-purple-500/10 border-transparent"
                        }
                        border rounded-xl p-3 min-h-[3rem]
                      `}
                    >
                      <button 
                        onClick={() => navigate(item.path)}
                        className="w-full flex items-center gap-3 text-left"
                      >
                        <div className={`
                          p-2 rounded-lg transition-colors
                          ${active 
                            ? "bg-white/20" 
                            : "bg-purple-500/10 group-hover:bg-purple-500/20"
                          }
                        `}>
                          <Icon className={`h-4 w-4 ${active ? "text-white" : "text-purple-600"}`} />
                        </div>
                        {open && (
                          <div className="flex-1 min-w-0">
                            <span className={`font-semibold text-sm block ${active ? "text-white" : ""}`}>
                              {item.label}
                            </span>
                            <p className={`text-xs opacity-80 ${active ? "text-white/80" : "text-muted-foreground"}`}>
                              {item.description}
                            </p>
                          </div>
                        )}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button 
                    onClick={handleSignOut} 
                    variant="ghost" 
                    className="w-full justify-start mx-2 mb-2 hover:bg-destructive/10 hover:text-destructive transition-colors rounded-xl"
                  >
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <LogOut className="h-4 w-4 text-destructive" />
                    </div>
                    {open && <span className="ml-2 font-medium">Sign Out</span>}
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}