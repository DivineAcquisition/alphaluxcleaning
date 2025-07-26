
import { ReactNode } from "react";
import { AdminFooter } from "@/components/footer/AdminFooter";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  LogOut, 
  LayoutDashboard, 
  Users, 
  Settings, 
  BarChart3,
  UserCheck,
  Home
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin-auth');
  };

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
      label: "Subcontractors",
      path: "/subcontractor-management", 
      icon: Users,
      description: "Manage network"
    },
    {
      label: "Metrics & Analytics",
      path: "/metrics-dashboard",
      icon: BarChart3,
      description: "Performance data"
    },
    {
      label: "Application Manager",
      path: "/application-manager",
      icon: UserCheck,
      description: "Review applications"
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Top Navigation Bar */}
      <div className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Bay Area Cleaning Pros</h1>
                <p className="text-xs text-muted-foreground">Admin Management</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.path}
                    variant={isActive(item.path) ? "default" : "ghost"}
                    size="sm"
                    onClick={() => navigate(item.path)}
                    className="h-9"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </div>

            {/* Sign Out */}
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-card border-b">
        <div className="container mx-auto px-4 py-2">
          <div className="flex gap-2 overflow-x-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className="flex-shrink-0"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>

        {/* Quick Navigation Cards - Only show on non-active pages */}
        {!isActive('/admin-panel') && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              if (isActive(item.path)) return null;
              
              return (
                <Card key={item.path} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(item.path)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Page Content */}
        {children}
      </div>
      
      {/* Admin Footer */}
      <AdminFooter />
    </div>
  );
}

