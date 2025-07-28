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
  LogOut,
  DollarSign,
  Briefcase,
  UserPlus,
  ClipboardList,
  Crown,
  Shield,
  Eye,
  Sparkles,
  TrendingUp,
  Zap
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

const navigationItems = [
  {
    label: "Dashboard",
    path: "/admin-dashboard",
    icon: LayoutDashboard,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30"
  },
  {
    label: "Control Center", 
    path: "/admin-panel",
    icon: Shield,
    color: "text-violet-500",
    bgColor: "bg-violet-50 dark:bg-violet-950/30"
  },
  {
    label: "Business Intelligence",
    path: "/metrics-dashboard",
    icon: TrendingUp,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30"
  },
  {
    label: "Team Management",
    path: "/subcontractor-management", 
    icon: Users,
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/30"
  },
  {
    label: "Talent Acquisition",
    path: "/application-manager",
    icon: UserPlus,
    color: "text-pink-500",
    bgColor: "bg-pink-50 dark:bg-pink-950/30"
  },
  {
    label: "Service Portfolio",
    path: "/services",
    icon: Briefcase,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30"
  },
  {
    label: "System Settings",
    path: "/settings",
    icon: Settings,
    color: "text-gray-500",
    bgColor: "bg-gray-50 dark:bg-gray-950/30"
  }
];

const quickActions = [
  {
    label: "View Live Site",
    path: "/",
    icon: Eye,
    badge: "Live"
  },
  {
    label: "Premium Features",
    path: "/upgrade",
    icon: Crown,
    badge: "Pro"
  }
];

export function AdminSidebar() {
  const { open } = useSidebar();
  const { user, userRole } = useAuth();
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
    <Sidebar className="border-r border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80" collapsible="icon">
      {/* Modern Header */}
      <SidebarHeader className="p-6 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full border-2 border-background animate-pulse" />
          </div>
          {open && (
            <div className="flex-1">
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Bay Area Pro
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground font-medium">Admin Console</p>
                <Badge variant="secondary" className="text-xs px-2 py-0">
                  {userRole || 'Admin'}
                </Badge>
              </div>
            </div>
          )}
        </div>
        
        {/* User Profile Mini Card */}
        {open && user && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/40">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border-2 border-border">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {getInitials(user.email || '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground">System Administrator</p>
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent className="px-4 py-6">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-4 flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            Core Functions
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
                      className="h-12 p-0"
                    >
                      <button 
                        onClick={() => navigate(item.path)}
                        className={`w-full group relative overflow-hidden rounded-xl transition-all duration-300 ${
                          active 
                            ? 'bg-primary text-primary-foreground shadow-lg scale-[1.02]' 
                            : 'hover:bg-muted/70 hover:scale-[1.01]'
                        }`}
                      >
                        <div className="flex items-center gap-4 p-3">
                          <div className={`p-2 rounded-lg transition-colors ${
                            active 
                              ? 'bg-primary-foreground/20' 
                              : `${item.bgColor} ${item.color} group-hover:scale-110`
                          }`}>
                            <Icon className={`h-4 w-4 transition-transform ${
                              active ? 'text-primary-foreground' : item.color
                            }`} />
                          </div>
                          {open && (
                            <div className="flex-1 text-left">
                              <span className={`font-semibold text-sm block ${
                                active ? 'text-primary-foreground' : 'text-foreground'
                              }`}>
                                {item.label}
                              </span>
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

        {/* Quick Actions */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-4">
            Quick Access
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {quickActions.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton 
                      asChild
                      className="h-10"
                    >
                      <button 
                        onClick={() => navigate(item.path)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-muted/50 group"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                        {open && (
                          <>
                            <span className="flex-1 text-left text-muted-foreground group-hover:text-foreground">
                              {item.label}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {item.badge}
                            </Badge>
                          </>
                        )}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Status Card */}
        {open && (
          <SidebarGroup className="mt-6">
            <SidebarGroupContent>
              <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-foreground">System Status</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  All services operational
                </p>
                <Button size="sm" variant="outline" className="w-full h-8 text-xs">
                  View Details
                </Button>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Sign Out */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-10">
                  <Button 
                    onClick={handleSignOut} 
                    variant="ghost" 
                    className="w-full justify-start gap-3 p-3 rounded-lg hover:bg-destructive/10 hover:text-destructive group transition-all duration-200"
                  >
                    <div className="p-1.5 rounded-md bg-muted group-hover:bg-destructive/20 transition-colors">
                      <LogOut className="h-3.5 w-3.5" />
                    </div>
                    {open && <span className="font-medium">Sign Out</span>}
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