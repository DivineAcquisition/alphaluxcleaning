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
    <Sidebar className={open ? "w-80" : "w-20"} collapsible="icon">
      {/* Futuristic Header with Enhanced Branding */}
      <SidebarHeader className="relative overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background p-8 border-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="h-12 w-12 glass-morphism rounded-2xl flex items-center justify-center border cyber-border">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-success rounded-full border-2 border-background animate-pulse neon-glow" />
            </div>
            {open && (
              <div className="text-foreground">
                <h1 className="text-xl font-bold tracking-tight gradient-text">ADMIN NEXUS</h1>
                <p className="text-xs text-muted-foreground font-medium tracking-wider">
                  BAY AREA CLEANING PROS
                </p>
              </div>
            )}
          </div>
          
          {/* Enhanced User Profile Section */}
          {open && user && (
            <div className="flex items-center gap-3 p-4 glass-morphism rounded-2xl border cyber-border">
              <Avatar className="h-10 w-10 border-2 border-primary/30">
                <AvatarImage src="" />
                <AvatarFallback className="glass-morphism text-primary font-bold text-sm">
                  {getInitials(user.email || '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user.email}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  SYSTEM ADMINISTRATOR
                </p>
              </div>
            </div>
          )}
        </div>
        <SidebarTrigger className="absolute top-6 right-6 z-20 text-foreground hover:glass-morphism rounded-xl p-2 transition-all duration-300" />
      </SidebarHeader>
      
      <SidebarContent className="px-6 py-8 bg-gradient-to-b from-background to-muted/20">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6 gradient-text">
            CONTROL MATRIX
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-3">
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
                        className={`w-full group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-500 ${
                          active 
                            ? `glass-morphism neon-glow cyber-border bg-gradient-to-r ${item.gradient}` 
                            : 'hover:glass-morphism hover:scale-105'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${
                            active 
                              ? 'glass-morphism border border-white/20' 
                              : 'bg-muted/50 group-hover:bg-primary/20'
                          } transition-all duration-300`}>
                            <Icon className={`h-5 w-5 ${active ? 'text-foreground' : 'text-primary'}`} />
                          </div>
                          {open && (
                            <div className="flex-1">
                              <span className={`font-bold text-sm tracking-wide ${
                                active ? 'text-foreground' : 'text-foreground'
                              }`}>
                                {item.label}
                              </span>
                              <p className={`text-xs mt-1 ${
                                active ? 'text-foreground/80' : 'text-muted-foreground'
                              }`}>
                                {item.description}
                              </p>
                            </div>
                          )}
                        </div>
                        {active && open && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="h-2 w-2 bg-foreground rounded-full animate-pulse" />
                          </div>
                        )}
                        {/* Scan line effect for active item */}
                        {active && (
                          <div className="absolute inset-0 scan-line opacity-30" />
                        )}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Enhanced Sign Out Section */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="p-0">
                  <Button 
                    onClick={handleSignOut} 
                    variant="ghost" 
                    className="w-full justify-start p-4 rounded-2xl hover:glass-morphism hover:text-destructive group transition-all duration-500 hover:scale-105"
                  >
                    <div className="p-3 rounded-xl bg-muted/50 group-hover:bg-destructive/20 transition-all duration-300">
                      <LogOut className="h-5 w-5" />
                    </div>
                    {open && <span className="ml-4 font-semibold tracking-wide">DISCONNECT</span>}
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