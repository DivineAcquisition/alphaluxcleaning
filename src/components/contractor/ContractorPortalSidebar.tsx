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
  FileText,
  ClipboardList,
  TrendingUp,
  Award,
  CreditCard,
  Calendar,
  Settings,
  LogOut,
  UserCog,
  Truck
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const contractorItems = [
  {
    label: "Dispatch Dashboard",
    path: "/contractor",
    icon: LayoutDashboard,
    description: "Overview & jobs"
  },
  {
    label: "Job Assignment",
    path: "/contractor/dispatch",
    icon: Truck,
    description: "Assign jobs"
  },
  {
    label: "Subcontractor Management",
    path: "/contractor/subcontractors",
    icon: Users,
    description: "Manage team"
  },
  {
    label: "Applications",
    path: "/contractor/applications", 
    icon: FileText,
    description: "Review applications"
  },
  {
    label: "Subcontractor Hub",
    path: "/contractor/hub",
    icon: ClipboardList,
    description: "Hub overview"
  },
  {
    label: "Performance Tracking",
    path: "/contractor/performance",
    icon: TrendingUp,
    description: "View metrics"
  },
  {
    label: "Tier Management",
    path: "/contractor/tiers",
    icon: Award,
    description: "Manage tiers"
  },
  {
    label: "Payments",
    path: "/contractor/payments",
    icon: CreditCard,
    description: "Payment tracking"
  },
  {
    label: "Availability",
    path: "/contractor/availability",
    icon: Calendar,
    description: "Schedule management"
  },
  {
    label: "Settings",
    path: "/contractor/settings",
    icon: Settings,
    description: "Portal settings"
  }
];

export function ContractorPortalSidebar() {
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
      <SidebarHeader className="border-b p-4 bg-gradient-to-r from-primary/10 to-primary/20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
            <Truck className="h-5 w-5 text-white" />
          </div>
          {open && (
            <div>
              <h1 className="text-sm font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Contractor Portal
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Bay Area Cleaning Pros</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
            Dispatch & Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {contractorItems.map((item) => {
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
                          ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg scale-[1.02] border-primary/20" 
                          : "hover:bg-primary/10 hover:border-primary/20 border-transparent"
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
                            : "bg-primary/10 group-hover:bg-primary/20"
                          }
                        `}>
                          <Icon className={`h-4 w-4 ${active ? "text-white" : "text-primary"}`} />
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