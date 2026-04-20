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
  Users, 
  Settings, 
  BarChart3,
  UserCheck,
  LogOut,
  FileText,
  Crown,
  Calendar,
  ClipboardList,
  CheckCircle,
  TrendingUp,
  Award,
  CreditCard,
  UserCog,
  UserPlus,
  ShoppingCart,
  MessageSquare,
  HeadphonesIcon,
  Building2,
  Eye,
  Database,
  Shield,
  Key,
  Terminal,
  Globe,
  Mail,
  Activity,
  Zap,
  Users2,
  Webhook,
  TestTube,
  DollarSign
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const adminItems = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
    description: "Overview & metrics"
  },
  {
    label: "Email Templates",
    path: "/admin/email/templates",
    icon: Mail,
    description: "Manage email templates"
  },
  {
    label: "Email Logs",
    path: "/admin/email/logs",
    icon: FileText,
    description: "Email delivery logs"
  },
  {
    label: "Email Events",
    path: "/admin/email/events",
    icon: Activity,
    description: "Email engagement tracking"
  },
  {
    label: "Admin Users",
    path: "/admin/users",
    icon: Shield,
    description: "Manage admin access"
  },
  {
    label: "Customers",
    path: "/admin/customers",
    icon: Users,
    description: "Customer management"
  },
  {
    label: "Subcontractors",
    path: "/admin/subcontractors",
    icon: UserCheck,
    description: "Team management"
  }
];

const sectionGroups = [
  { title: "Administration", items: adminItems, color: "primary" }
];

export function UnifiedAdminSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const getColorClasses = (color: string, active: boolean) => {
    const colorMap = {
      primary: {
        active: "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground",
        hover: "hover:bg-primary/5 hover:border-primary/10",
        icon: active ? "text-primary-foreground" : "text-primary",
        iconBg: active ? "bg-primary-foreground/20" : "bg-primary/10 group-hover:bg-primary/20"
      },
      blue: {
        active: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
        hover: "hover:bg-blue-50 hover:border-blue-500/10",
        icon: active ? "text-white" : "text-blue-600",
        iconBg: active ? "bg-white/20" : "bg-blue-500/10 group-hover:bg-blue-500/20"
      },
      green: {
        active: "bg-gradient-to-r from-green-500 to-green-600 text-white",
        hover: "hover:bg-green-50 hover:border-green-500/10",
        icon: active ? "text-white" : "text-green-600",
        iconBg: active ? "bg-white/20" : "bg-green-500/10 group-hover:bg-green-500/20"
      },
      orange: {
        active: "bg-gradient-to-r from-orange-500 to-orange-600 text-white",
        hover: "hover:bg-orange-50 hover:border-orange-500/10",
        icon: active ? "text-white" : "text-orange-600",
        iconBg: active ? "bg-white/20" : "bg-orange-500/10 group-hover:bg-orange-500/20"
      },
      purple: {
        active: "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
        hover: "hover:bg-purple-50 hover:border-purple-500/10",
        icon: active ? "text-white" : "text-purple-600",
        iconBg: active ? "bg-white/20" : "bg-purple-500/10 group-hover:bg-purple-500/20"
      },
      gray: {
        active: "bg-gradient-to-r from-gray-500 to-gray-600 text-white",
        hover: "hover:bg-gray-50 hover:border-gray-500/10",
        icon: active ? "text-white" : "text-gray-600",
        iconBg: active ? "bg-white/20" : "bg-gray-500/10 group-hover:bg-gray-500/20"
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.primary;
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
                AlphaLux Cleaning
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Admin Control Center</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        {sectionGroups.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  const colors = getColorClasses(section.color, active);
                  
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton 
                        asChild
                        isActive={active}
                        className={`
                          group relative transition-all duration-200 hover:shadow-md
                          ${active 
                            ? `${colors.active} shadow-lg scale-[1.02] border-${section.color}-500/20` 
                            : `${colors.hover} border-transparent`
                          }
                          border rounded-xl p-3 min-h-[3rem]
                        `}
                      >
                        <button 
                          onClick={() => navigate(item.path)}
                          className="w-full flex items-center gap-3 text-left"
                        >
                          <div className={`p-2 rounded-lg transition-colors ${colors.iconBg}`}>
                            <Icon className={`h-4 w-4 ${colors.icon}`} />
                          </div>
                          {open && (
                            <div className="flex-1 min-w-0">
                              <span className={`font-semibold text-sm block ${active ? "text-current" : ""}`}>
                                {item.label}
                              </span>
                              <p className={`text-xs opacity-80 ${active ? "text-current/80" : "text-muted-foreground"}`}>
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
        ))}

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