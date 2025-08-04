import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Home as HomeIcon } from "lucide-react";
import { ModernBookingPage } from "@/components/ModernBookingPage";
import { CommercialEstimateSection } from "@/components/CommercialEstimateSection";
import { Navigation } from "@/components/Navigation";
import { trackViewContent } from "@/lib/facebook-pixel";
const Index = () => {

  // Track page view on component mount
  useEffect(() => {
    trackViewContent('Modern Booking Page');

    // Load chat widget with defer to prevent layout shift
    const loadChatWidget = () => {
      const script = document.createElement('script');
      script.src = 'https://widgets.leadconnectorhq.com/loader.js';
      script.setAttribute('data-resources-url', 'https://widgets.leadconnectorhq.com/chat-widget/loader.js');
      script.setAttribute('data-widget-id', '688b7acb81758b9cee3c0c05');
      script.async = true;
      document.head.appendChild(script);
    };

    // Defer chat widget loading
    setTimeout(loadChatWidget, 2000);
    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[data-widget-id="688b7acb81758b9cee3c0c05"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <Tabs defaultValue="residential" className="w-full">
        <div className="container mx-auto py-4">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 h-12">
            <TabsTrigger value="residential" className="flex items-center gap-2 text-base">
              <HomeIcon className="h-5 w-5" />
              Residential
            </TabsTrigger>
            <TabsTrigger value="commercial" className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5" />
              Commercial
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="residential" className="mt-0">
          <ModernBookingPage />
        </TabsContent>
        
        <TabsContent value="commercial" className="mt-0">
          <div className="container mx-auto py-8">
            <Card className="w-full max-w-4xl mx-auto">
              <CardContent className="p-6">
                <CommercialEstimateSection />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default Index;