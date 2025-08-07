import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Users, 
  Settings, 
  BarChart3, 
  Calendar, 
  CreditCard, 
  Smartphone,
  UserCheck,
  Shield
} from "lucide-react";

export default function TestDashboard() {
  const testRoutes = [
    {
      title: "Subcontractor Dashboard",
      description: "Main subcontractor interface",
      path: "/test/subcontractor-dashboard",
      icon: Users,
      category: "Subcontractor"
    },
    {
      title: "Subcontractor Mobile",
      description: "Mobile-first subcontractor interface",
      path: "/test/subcontractor-mobile",
      icon: Smartphone,
      category: "Subcontractor"
    },
    {
      title: "Subcontractor Management",
      description: "Admin interface for managing subcontractors",
      path: "/test/subcontractor-management",
      icon: UserCheck,
      category: "Admin"
    },
    {
      title: "Tier Management",
      description: "Manage subcontractor tier system",
      path: "/test/tier-management",
      icon: BarChart3,
      category: "Admin"
    },
    {
      title: "Tier Configuration",
      description: "Configure tier system settings",
      path: "/test/tier-config",
      icon: Settings,
      category: "Admin"
    },
    {
      title: "Payment Dashboard",
      description: "Subcontractor payment interface",
      path: "/test/subcontractor-payments",
      icon: CreditCard,
      category: "Subcontractor"
    },
    {
      title: "Office Manager Dashboard",
      description: "Office manager interface",
      path: "/test/office-dashboard",
      icon: Calendar,
      category: "Office Manager"
    },
    {
      title: "Admin Dashboard",
      description: "Main admin interface",
      path: "/test/admin-dashboard",
      icon: Shield,
      category: "Admin"
    }
  ];

  const categories = [...new Set(testRoutes.map(route => route.category))];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Testing Dashboard</h1>
        <p className="text-muted-foreground">
          Access all protected routes without authentication for testing purposes
        </p>
      </div>

      {categories.map(category => (
        <div key={category} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{category} Routes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testRoutes
              .filter(route => route.category === category)
              .map((route) => {
                const Icon = route.icon;
                return (
                  <Card key={route.path} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <CardTitle className="text-lg">{route.title}</CardTitle>
                      </div>
                      <CardDescription>{route.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full">
                        <Link to={route.path}>Open</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      ))}

      <Card className="mt-8 border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">⚠️ Testing Notice</CardTitle>
          <CardDescription className="text-yellow-700">
            These test routes bypass authentication and should only be used in development. 
            Production routes require proper user roles and authentication.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}