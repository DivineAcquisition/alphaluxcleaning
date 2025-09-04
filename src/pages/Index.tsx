import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Home as HomeIcon } from "lucide-react";
import { CommercialEstimateSection } from "@/components/CommercialEstimateSection";
import { Navigation } from "@/components/Navigation";
import { TestSubcontractorButton } from "@/components/TestSubcontractorButton";
import { ModernLegacyBooking } from "@/components/booking/ModernLegacyBooking";
import { GHLWebhookTest } from "@/components/GHLWebhookTest";
import GuestBooking from "@/pages/GuestBooking";
import { getCurrentDomain } from "@/utils/domainDetection";

import { trackViewContent, trackInitiateCheckout } from "@/lib/facebook-pixel";
const Index = () => {
  const currentDomain = getCurrentDomain();

  // Track page view on component mount
  useEffect(() => {
    trackViewContent('Cleaning Services Homepage');
  }, []);

  // If we're on the book domain, render the guest booking flow directly
  if (currentDomain === 'book') {
    return <GuestBooking />;
  }

  // For other domains, show the landing page with CTA
  return <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div style={{
      contain: 'layout'
    }} className="container mx-auto py-8 px-[7px]">
        <div className="text-center mb-8">
          <h1 className="sm:text-4xl font-jakarta font-bold tracking-tight mb-4 px-0 mx-0 my-0 py-0 text-2xl text-center">Premium Cleaning Services</h1>
          <p className="sm:text-xl font-inter text-muted-foreground max-w-2xl mx-auto font-semibold text-sm px-[10px]">BayAreaCleaningPros premier cleaning service for residential and commercial properties</p>
        </div>


        <Tabs defaultValue="residential" className="w-full max-w-6xl mx-auto px-0">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
            <TabsTrigger value="residential" className="flex items-center gap-2 text-base">
              <HomeIcon className="h-5 w-5" />
              Residential
            </TabsTrigger>
            <TabsTrigger value="commercial" className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5" />
              Commercial
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="residential">
            <Card className="w-full max-w-4xl mx-auto">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-semibold mb-4">Residential Cleaning Services</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Get your home sparkling clean with our professional residential cleaning services.
                </p>
                <Button size="lg" asChild>
                  <a href={`https://book.${window.location.hostname.split('.').slice(-2).join('.')}/`}>
                    Book Your Cleaning
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="commercial">
            <Card className="w-full max-w-4xl mx-auto">
              <CardContent className="p-6">
                <CommercialEstimateSection />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Development Tools - Only shown in development mode */}
        {import.meta.env.DEV && <div className="w-full max-w-6xl mx-auto mt-12 px-2 sm:px-4">
            <Card className="border-dashed border-2 border-muted-foreground/20">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-bold text-muted-foreground">Development Tools</h3>
                  <p className="text-sm text-muted-foreground">
                    These tools are only visible in development mode
                  </p>
                  <div className="flex flex-col items-center gap-4">
                    <TestSubcontractorButton />
                    <GHLWebhookTest />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Creates a test subcontractor user for development</p>
                      <p>• Test GHL payment webhook integration</p>
                      <p>• You can also access onboarding directly at <a href="/subcontractor-onboarding" className="text-primary hover:underline">/subcontractor-onboarding</a></p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>}
      </div>
    </div>;
};
export default Index;