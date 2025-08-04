import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Download, Bell, MapPin, Camera, CreditCard, Star, Clock } from "lucide-react";

export function MobileAppPromo() {
  const customerFeatures = [
    {
      icon: <Bell className="h-5 w-5" />,
      title: "Real-time Notifications",
      description: "Get updates when your cleaner is on the way"
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      title: "Live Tracking",
      description: "Track your cleaner's location and ETA"
    },
    {
      icon: <Camera className="h-5 w-5" />,
      title: "Photo Sharing",
      description: "See before/after photos of your cleaning"
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: "Easy Payments",
      description: "Pay and tip directly through the app"
    }
  ];

  const subcontractorFeatures = [
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Offline Mode",
      description: "Access job details without internet"
    },
    {
      icon: <Camera className="h-5 w-5" />,
      title: "Voice Notes",
      description: "Record completion reports hands-free"
    },
    {
      icon: <Star className="h-5 w-5" />,
      title: "Performance Dashboard",
      description: "Track your KPIs and earnings"
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      title: "Route Optimization",
      description: "Get the most efficient routes"
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Smartphone className="h-6 w-6 text-primary" />
            Bay Area Cleaning Mobile Apps
          </CardTitle>
          <CardDescription className="text-lg">
            Enhanced mobile experience for customers and subcontractors
          </CardDescription>
          <Badge variant="secondary" className="w-fit mx-auto">
            Coming in Phase 5B
          </Badge>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer App */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Customer App
            </CardTitle>
            <CardDescription>
              Native iOS and Android app for the ultimate booking experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 space-y-3">
              <Button className="w-full" variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Download for iOS
              </Button>
              <Button className="w-full" variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Download for Android
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Apps will be available in Phase 5B
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Subcontractor App */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-success" />
              Subcontractor App
            </CardTitle>
            <CardDescription>
              Professional tools for efficient job management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subcontractorFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="p-2 bg-success/10 rounded-lg text-success">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 space-y-3">
              <Button className="w-full" variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Download for iOS
              </Button>
              <Button className="w-full" variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Download for Android
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Apps will be available in Phase 5B
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* App Benefits */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Why Use Our Mobile Apps?</CardTitle>
          <CardDescription>
            Enhanced features available only in our native mobile applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Push Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Instant updates about your bookings and services
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Camera className="h-6 w-6 text-success" />
              </div>
              <h4 className="font-semibold mb-2">Photo Integration</h4>
              <p className="text-sm text-muted-foreground">
                Seamless photo capture and sharing capabilities
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <MapPin className="h-6 w-6 text-accent" />
              </div>
              <h4 className="font-semibold mb-2">Location Services</h4>
              <p className="text-sm text-muted-foreground">
                GPS tracking and location-based features
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}