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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  BarChart3,
  UserCheck,
  Home,
  LogOut,
  FileText,
  Crown
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    label: "Overview Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
    description: "Main dashboard overview"
  },
  {
    label: "Control Panel",
    path: "/admin-panel",
    icon: Settings,
    description: "Admin setup & configuration"
  },
  {
    label: "Subcontractor Management",
    path: "/subcontractor-management",
    icon: Users,
    description: "Manage subcontractors"
  },
  {
    label: "Application Manager",
    path: "/application-manager",
    icon: FileText,
    description: "Review applications"
  },
  {
    label: "Metrics & Analytics",
    path: "/metrics-dashboard",
    icon: BarChart3,
    description: "Performance insights"
  },
  {
    label: "Subcontractor Portal",
    path: "/subcontractor-dashboard",
    icon: UserCheck,
    description: "Subcontractor view"
  }
];

export function AdminSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin-auth');
  };

  return (
    <Sidebar className="z-40 border-r shadow-lg" collapsible="icon">
      <SidebarHeader className="border-b p-4 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
            <Crown className="h-5 w-5 text-primary-foreground" />
          </div>
          {open && (
            <div>
              <h1 className="text-sm font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Bay Area Cleaning Pros
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Admin Dashboard</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
            Management Hub
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => {
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
                          ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg scale-[1.02] border-primary/20" 
                          : "hover:bg-primary/5 hover:border-primary/10 border-transparent"
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
                            ? "bg-primary-foreground/20" 
                            : "bg-primary/10 group-hover:bg-primary/20"
                          }
                        `}>
                          <Icon className={`h-4 w-4 ${active ? "text-primary-foreground" : "text-primary"}`} />
                        </div>
                        {open && (
                          <div className="flex-1 min-w-0">
                            <span className={`font-semibold text-sm block ${active ? "text-primary-foreground" : ""}`}>
                              {item.label}
                            </span>
                            <p className={`text-xs opacity-80 ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
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