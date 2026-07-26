// Admin sidebar — grouped navigation.
//
// Every entry below points at a route that is actually registered in
// App.tsx. The previous version linked to /admin/customers and
// /admin/subcontractors (both 404s, the latter for a feature this
// deployment doesn't have — field ops live in Housecall Pro) while
// hiding half the pages that do exist.

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
  UserPlus,
  CalendarDays,
  CalendarPlus,
  LogOut,
  FileText,
  Crown,
  Shield,
  Mail,
  Activity,
  Zap,
  Plug,
  Ticket,
  TrendingUp,
  Database,
  FlaskConical,
  MonitorPlay,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  description: string;
}

const operationsItems: NavItem[] = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, description: "Live overview" },
  { label: "Bookings", path: "/admin/bookings", icon: CalendarDays, description: "All jobs & revenue" },
  { label: "Customers", path: "/admin/customers", icon: Users, description: "CRM & lifecycle stage" },
  { label: "Leads", path: "/admin/leads", icon: UserPlus, description: "Speed-to-lead & funnel" },
  { label: "Internal Booking", path: "/admin/internal-booking", icon: CalendarPlus, description: "Book over the phone" },
];

const growthItems: NavItem[] = [
  { label: "Lifecycle Engine", path: "/admin/lifecycle", icon: Zap, description: "Cadence, offers, campaigns" },
  { label: "Promo Codes", path: "/admin/promos", icon: Ticket, description: "Discounts & rewards" },
  { label: "Conversion", path: "/admin/conversion", icon: TrendingUp, description: "Funnel analytics" },
];

const commsItems: NavItem[] = [
  { label: "Email Templates", path: "/admin/email/templates", icon: Mail, description: "Manage templates" },
  { label: "Email Logs", path: "/admin/email/logs", icon: FileText, description: "Delivery history" },
  { label: "Email Events", path: "/admin/email/events", icon: Activity, description: "Opens, clicks, bounces" },
];

const systemItems: NavItem[] = [
  { label: "Housecall Pro", path: "/admin/integrations/housecall-pro", icon: Plug, description: "Ops integration" },
  { label: "HCP Sync Logs", path: "/admin/integrations/housecall-pro/logs", icon: FileText, description: "Job sync history" },
  { label: "Admin Users", path: "/admin/users", icon: Shield, description: "Access control" },
  { label: "Booking Monitor", path: "/admin/booking-monitor", icon: MonitorPlay, description: "Live funnel events" },
  { label: "Database Watcher", path: "/admin/database-watcher", icon: Database, description: "Realtime table feed" },
  { label: "Booking Tester", path: "/admin/booking-tester", icon: FlaskConical, description: "End-to-end test runs" },
];

const sectionGroups: Array<{ title: string; items: NavItem[]; color: string }> = [
  { title: "Operations", items: operationsItems, color: "primary" },
  { title: "Growth", items: growthItems, color: "purple" },
  { title: "Communications", items: commsItems, color: "blue" },
  { title: "System", items: systemItems, color: "gray" },
];

export function UnifiedAdminSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // The app has no /auth route — the admin entry point is /admin-login.
    navigate("/admin-login", { replace: true });
  };

  const getColorClasses = (color: string, active: boolean) => {
    const colorMap = {
      primary: {
        active: "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground",
        hover: "hover:bg-primary/5 hover:border-primary/10",
        icon: active ? "text-primary-foreground" : "text-primary",
        iconBg: active ? "bg-primary-foreground/20" : "bg-primary/10 group-hover:bg-primary/20",
      },
      blue: {
        active: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
        hover: "hover:bg-blue-50 hover:border-blue-500/10",
        icon: active ? "text-white" : "text-blue-600",
        iconBg: active ? "bg-white/20" : "bg-blue-500/10 group-hover:bg-blue-500/20",
      },
      purple: {
        active: "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
        hover: "hover:bg-purple-50 hover:border-purple-500/10",
        icon: active ? "text-white" : "text-purple-600",
        iconBg: active ? "bg-white/20" : "bg-purple-500/10 group-hover:bg-purple-500/20",
      },
      gray: {
        active: "bg-gradient-to-r from-gray-500 to-gray-600 text-white",
        hover: "hover:bg-gray-50 hover:border-gray-500/10",
        icon: active ? "text-white" : "text-gray-600",
        iconBg: active ? "bg-white/20" : "bg-gray-500/10 group-hover:bg-gray-500/20",
      },
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
                        tooltip={item.label}
                        className={`
                          group relative transition-all duration-200 hover:shadow-md
                          ${active
                            ? `${colors.active} shadow-lg`
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
                              <p className={`text-xs opacity-80 truncate ${active ? "text-current/80" : "text-muted-foreground"}`}>
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
