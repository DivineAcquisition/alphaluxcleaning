import React from 'react';
import { NewPricingInterface } from '@/components/pricing/NewPricingInterface';
import { PricingSystemAdmin } from '@/components/admin/PricingSystemAdmin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Settings } from 'lucide-react';

export default function PricingTest() {
  const handleBookingSelect = (data: any) => {
    console.log('Booking selection:', data);
    // Here you would typically redirect to booking flow
  };

  const handleConfigUpdate = (config: any) => {
    console.log('Config updated:', config);
    // Optionally refresh the pricing interface
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            New Pricing System Test
          </h1>
          <p className="text-muted-foreground">
            Test the new pricing calculation system with cleaner pay base + multipliers
          </p>
        </div>

        <Tabs defaultValue="pricing" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Pricing Interface
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Admin Controls
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Pricing Interface</CardTitle>
                <p className="text-muted-foreground">
                  This is how customers will see and interact with the new pricing system
                </p>
              </CardHeader>
              <CardContent>
                <NewPricingInterface onBookingSelect={handleBookingSelect} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="admin" className="space-y-6">
            <PricingSystemAdmin onConfigUpdate={handleConfigUpdate} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}