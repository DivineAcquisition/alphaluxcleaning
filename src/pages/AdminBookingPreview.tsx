import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Eye, FileText, Calendar, CheckCircle, Settings } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AdminBookingPreview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const navigateToPage = (path: string) => {
    setLoading(true);
    try {
      navigate(path);
    } catch (error) {
      console.error("Navigation error:", error);
      toast.error("Error navigating to page");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const previewPages = [
    {
      title: "Payment Confirmation",
      description: "View the payment success page and flow overview",
      path: "/payment-confirmation?admin_preview=true",
      icon: CheckCircle,
      status: "Entry Point"
    },
    {
      title: "Service Details",
      description: "Preview the service details form with multi-select flooring",
      path: "/service-details?admin_preview=true", 
      icon: FileText,
      status: "Enhanced"
    },
    {
      title: "Schedule Service", 
      description: "Test the scheduling interface and time slot selection",
      path: "/schedule-service?admin_preview=true",
      icon: Calendar,
      status: "Active"
    },
    {
      title: "Booking Confirmation",
      description: "View the final confirmation page with all details",
      path: "/booking-confirmation?admin_preview=true",
      icon: CheckCircle,
      status: "Complete"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Settings className="h-6 w-6" />
                Admin Booking Preview
              </CardTitle>
              <CardDescription className="text-purple-100">
                Preview all booking pages with mock data as a super admin
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Preview Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {previewPages.map((page, index) => {
              const Icon = page.icon;
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{page.title}</CardTitle>
                          <Badge variant="secondary" className="mt-1">
                            {page.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-3">
                      {page.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => navigateToPage(page.path)}
                      disabled={loading}
                      className="w-full flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      {loading ? "Checking Access..." : "Preview Page"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Info Panel */}
          <Card className="border-0 shadow-lg bg-blue-50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-blue-800 mb-3">Admin Preview Features</h3>
              <ul className="space-y-2 text-blue-700 text-sm">
                <li>• Bypass session ID requirements with mock data</li>
                <li>• Test enhanced flooring multi-selection</li>
                <li>• Navigate between all booking pages seamlessly</li>
                <li>• View complete booking flow as customers would</li>
                <li>• Test form validation and user experience</li>
              </ul>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline"
              onClick={() => navigate('/test-booking')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Create Test Order
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/admin-dashboard')}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Admin Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBookingPreview;