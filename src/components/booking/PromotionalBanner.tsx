import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Gift } from 'lucide-react';

export function PromotionalBanner() {
  return (
    <Card className="border-[#ECC98B]/30 bg-gradient-to-r from-[#ECC98B]/10 to-transparent shadow-lg mb-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Main Headline */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-[#ECC98B]" />
              <h2 className="text-2xl md:text-3xl font-bold">Get 20% off your first clean.</h2>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Commit to 2 months of Weekly or Bi-Weekly service and we'll reward you with a 30% off Deep Clean code—shown instantly in your booking flow.
            </p>
          </div>

          {/* Options */}
          <div className="grid md:grid-cols-2 gap-4 pt-4">
            {/* Option A */}
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-background">
              <Badge variant="secondary" className="mt-1">Option A</Badge>
              <div className="space-y-1">
                <p className="font-semibold">20% OFF First Clean</p>
                <p className="text-sm text-muted-foreground">No commitment required</p>
              </div>
            </div>

            {/* Option B */}
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-gradient-to-br from-[#ECC98B]/5 to-transparent border-[#ECC98B]/30">
              <Badge className="bg-[#ECC98B] text-[#ECC98B]-foreground hover:bg-[#ECC98B]/80 mt-1">
                <Gift className="h-3 w-3 mr-1" />
                Option B
              </Badge>
              <div className="space-y-1">
                <p className="font-semibold">Commit & Get Reward</p>
                <p className="text-sm text-muted-foreground">
                  Book Weekly/Bi-Weekly for 2 months → receive a 30% OFF Deep Clean code (redeemable anytime in 90 days)
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}