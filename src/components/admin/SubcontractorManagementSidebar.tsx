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
  Users, 
  UserCheck,
  FileText,
  TrendingUp,
  Award,
  CreditCard,
  ClipboardList,
  Calendar,
  Settings,
  LogOut,
  UserCog
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const subcontractorItems = [
  {
    label: "Subcontractor Dashboard",
    path: "/subcontractor-management",
    icon: Users,
    description: "Team overview"
  },
  {
    label: "Applications",
    path: "/application-manager", 
    icon: FileText,
    description: "Review applications"
  },
  {
    label: "Performance Tracking",
    path: "/subcontractor-performance",
    icon: TrendingUp,
    description: "View metrics"
  },
  {
    label: "Job Assignments",
    path: "/job-assignments",
    icon: ClipboardList,
    description: "Assign jobs"
  },
  {
    label: "Tier Management",
    path: "/subcontractor-tiers",
    icon: Award,
    description: "Manage tiers"
  },
  {
    label: "Payments",
    path: "/subcontractor-payments",
    icon: CreditCard,
    description: "Payment tracking"
  },
  {
    label: "Availability",
    path: "/subcontractor-availability",
    icon: Calendar,
    description: "Schedule management"
  },
  {
    label: "Profile Settings",
    path: "/subcontractor-profiles",
    icon: UserCog,
    description: "Manage profiles"
  }
];

export function SubcontractorManagementSidebar() {
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
      <SidebarHeader className="border-b p-4 bg-gradient-to-r from-blue-500/10 to-blue-600/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Users className="h-5 w-5 text-white" />
          </div>
          {open && (
            <div>
              <h1 className="text-sm font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                Subcontractor Management
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Team & Operations</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
            Team Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {subcontractorItems.map((item) => {
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
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-[1.02] border-blue-500/20" 
                          : "hover:bg-blue-50 hover:border-blue-500/10 border-transparent"
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
                            : "bg-blue-500/10 group-hover:bg-blue-500/20"
                          }
                        `}>
                          <Icon className={`h-4 w-4 ${active ? "text-white" : "text-blue-600"}`} />
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