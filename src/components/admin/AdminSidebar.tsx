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
  LogOut,
  DollarSign,
  FileText,
  Home,
  Eye,
  EyeOff,
  CreditCard,
  UserPlus,
  ClipboardList,
  Briefcase
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

const navigationItems = [
  {
    label: "Overview",
    path: "/admin-dashboard",
    icon: LayoutDashboard
  },
  {
    label: "Bookings", 
    path: "/admin-panel",
    icon: Home
  },
  {
    label: "Analytics",
    path: "/metrics-dashboard",
    icon: BarChart3
  },
  {
    label: "Payments",
    path: "/payments",
    icon: DollarSign
  },
  {
    label: "Billing",
    path: "/billing",
    icon: CreditCard
  },
  {
    label: "Services",
    path: "/services",
    icon: Briefcase
  },
  {
    label: "Subcontractors",
    path: "/subcontractor-management", 
    icon: Users
  },
  {
    label: "Hire Team",
    path: "/hire-team",
    icon: UserPlus
  },
  {
    label: "Job Assignments",
    path: "/application-manager",
    icon: ClipboardList
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings
  }
];

const bookingPageItems = [
  {
    label: "View Booking Page",
    path: "/booking-page",
    icon: Eye
  },
  {
    label: "Disable Page",
    path: "/disable-page",
    icon: EyeOff
  }
];

export function AdminSidebar() {
  const { open } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin-auth');
  };

  const getInitials = (email: string) => {
    return email ? email.charAt(0).toUpperCase() : 'A';
  };

  return (
    <Sidebar className="w-64 border-r border-border bg-card" collapsible="icon">
      {/* Header */}
      <SidebarHeader className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">BC</span>
          </div>
          {open && (
            <div>
              <h1 className="font-semibold text-foreground">Bay Area Cleaning Pros</h1>
              <p className="text-sm text-muted-foreground">Admin Panel</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-3 py-4">
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground mb-2 px-3">
            Navigation
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
                      className="h-9"
                    >
                      <button 
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          active 
                            ? 'bg-primary text-primary-foreground' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {open && <span>{item.label}</span>}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Booking Page */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground mb-2 px-3">
            Booking Page
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {bookingPageItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton 
                      asChild
                      isActive={active}
                      className="h-9"
                    >
                      <button 
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          active 
                            ? 'bg-primary text-primary-foreground' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {open && <span>{item.label}</span>}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Current Plan */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground mb-2 px-3">
            Current Plan
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-3 bg-accent/50 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Free</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                You're on a Free Preview. Upgrade to unlock full features.
              </p>
              <Button size="sm" className="w-full h-8 text-xs">
                Upgrade Plan
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sign Out */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-9">
                  <Button 
                    onClick={handleSignOut} 
                    variant="ghost" 
                    className="w-full justify-start px-3 text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    {open && <span className="text-sm font-medium">Sign In</span>}
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