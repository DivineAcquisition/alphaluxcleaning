import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Home as HomeIcon } from "lucide-react";
import { CommercialEstimateSection } from "@/components/CommercialEstimateSection";
import { Navigation } from "@/components/Navigation";
import { TestSubcontractorButton } from "@/components/TestSubcontractorButton";
import { GHLWebhookTest } from "@/components/GHLWebhookTest";
import { Button } from "@/components/ui/button";
import { buildDomainUrl } from "@/utils/domainDetection";

import { trackViewContent, trackInitiateCheckout } from "@/lib/facebook-pixel";
const Index = () => {

  // Track page view on component mount
  useEffect(() => {
    trackViewContent('Cleaning Services Homepage');

  }, []);

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
              <CardContent className="p-8 text-center space-y-6">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold">Residential Cleaning Services</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Experience premium residential cleaning with our professional team. 
                    From regular maintenance to deep cleaning, we've got you covered.
                  </p>
                </div>
                <div className="space-y-4">
                  <ul className="text-left max-w-md mx-auto space-y-2 text-muted-foreground">
                    <li>• Regular Weekly/Bi-weekly/Monthly Cleaning</li>
                    <li>• Deep Cleaning Services</li>
                    <li>• Move-in/Move-out Cleaning</li>
                    <li>• Custom Add-on Services</li>
                  </ul>
                </div>
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6"
                  onClick={() => window.location.href = buildDomainUrl('book', '/')}
                >
                  Book Your Cleaning Service Now
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