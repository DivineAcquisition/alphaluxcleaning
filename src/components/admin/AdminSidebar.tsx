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
  Sparkles,
  Zap,
  Shield,
  Target,
  TrendingUp
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

const navigationItems = [
  {
    label: "Control Panel",
    path: "/admin-panel",
    icon: Shield,
    description: "System administration",
    gradient: "from-violet-500 to-purple-500"
  },
  {
    label: "Bookings", 
    path: "/admin-dashboard",
    icon: Target,
    description: "Active reservations",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    label: "Team Network",
    path: "/subcontractor-management", 
    icon: Users,
    description: "Contractor management",
    gradient: "from-emerald-500 to-teal-500"
  },
  {
    label: "Analytics",
    path: "/metrics-dashboard",
    icon: TrendingUp,
    description: "Business insights",
    gradient: "from-orange-500 to-amber-500"
  },
  {
    label: "Applications",
    path: "/application-manager",
    icon: Sparkles,
    description: "Review candidates",
    gradient: "from-pink-500 to-rose-500"
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
    <Sidebar className={open ? "w-72" : "w-16"} collapsible="icon">
      {/* Header with modern branding */}
      <SidebarHeader className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary p-6 border-none">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="h-10 w-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
            </div>
            {open && (
              <div className="text-white">
                <h1 className="text-lg font-bold tracking-tight">Admin Hub</h1>
                <p className="text-xs text-white/70 font-medium">Bay Area Cleaning Pros</p>
              </div>
            )}
          </div>
          
          {/* User Profile Section */}
          {open && user && (
            <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <Avatar className="h-8 w-8 border-2 border-white/30">
                <AvatarImage src="" />
                <AvatarFallback className="bg-white/20 text-white font-semibold text-sm">
                  {getInitials(user.email || '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.email}</p>
                <p className="text-xs text-white/70">Administrator</p>
              </div>
            </div>
          )}
        </div>
        <SidebarTrigger className="absolute top-4 right-4 z-20 text-white hover:bg-white/20" />
      </SidebarHeader>
      
      <SidebarContent className="px-4 py-6 bg-gradient-to-b from-background to-muted/30">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Management Suite
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton 
                      asChild
                      isActive={active}
                      className="p-0"
                    >
                      <button 
                        onClick={() => navigate(item.path)}
                        className={`w-full group relative overflow-hidden rounded-xl p-3 text-left transition-all duration-300 ${
                          active 
                            ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg scale-105` 
                            : 'hover:bg-muted/50 hover:scale-105'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            active 
                              ? 'bg-white/20 backdrop-blur-sm' 
                              : 'bg-muted group-hover:bg-muted-foreground/10'
                          }`}>
                            <Icon className={`h-4 w-4 ${active ? 'text-white' : ''}`} />
                          </div>
                          {open && (
                            <div className="flex-1">
                              <span className={`font-semibold text-sm ${active ? 'text-white' : ''}`}>
                                {item.label}
                              </span>
                              <p className={`text-xs mt-0.5 ${
                                active ? 'text-white/80' : 'text-muted-foreground'
                              }`}>
                                {item.description}
                              </p>
                            </div>
                          )}
                        </div>
                        {active && (
                          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50" />
                        )}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sign Out Section */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="p-0">
                  <Button 
                    onClick={handleSignOut} 
                    variant="ghost" 
                    className="w-full justify-start p-3 rounded-xl hover:bg-destructive/10 hover:text-destructive group transition-all duration-300"
                  >
                    <div className="p-2 rounded-lg bg-muted group-hover:bg-destructive/20">
                      <LogOut className="h-4 w-4" />
                    </div>
                    {open && <span className="ml-3 font-medium">Sign Out</span>}
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