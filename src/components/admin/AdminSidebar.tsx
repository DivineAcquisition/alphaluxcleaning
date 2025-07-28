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
  LogOut
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    label: "Control Panel",
    path: "/admin-panel",
    icon: Settings,
    description: "Admin setup & invites"
  },
  {
    label: "Booking Dashboard", 
    path: "/admin-dashboard",
    icon: LayoutDashboard,
    description: "Manage bookings"
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
    icon: UserCheck,
    description: "Review applications"
  },
  {
    label: "Metrics & Analytics",
    path: "/metrics-dashboard",
    icon: BarChart3,
    description: "Performance data"
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
    <Sidebar className={open ? "w-64" : "w-14"} collapsible="icon">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <Home className="h-5 w-5 text-primary-foreground" />
          </div>
          {open && (
            <div>
              <h1 className="text-sm font-semibold">Bay Area Cleaning Pros</h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          )}
        </div>
        <SidebarTrigger className="ml-auto" />
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActive(item.path)}
                      className={isActive(item.path) ? "bg-primary text-primary-foreground" : ""}
                    >
                      <button 
                        onClick={() => navigate(item.path)}
                        className="w-full flex items-center gap-3 p-2 text-left"
                      >
                        <Icon className="h-4 w-4" />
                        {open && (
                          <div>
                            <span className="font-medium">{item.label}</span>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
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
                    className="w-full justify-start"
                  >
                    <LogOut className="h-4 w-4" />
                    {open && <span className="ml-2">Sign Out</span>}
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