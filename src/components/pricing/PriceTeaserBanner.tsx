import React from 'react';
import { Sparkles } from 'lucide-react';
import { HOME_SIZE_RANGES } from '@/lib/new-pricing-system';

export function PriceTeaserBanner() {
  // Get the minimum regular price from pricing ranges
  const minRegularPrice = Math.min(
    ...HOME_SIZE_RANGES
      .filter(range => !range.requiresEstimate)
      .map(range => range.regularPrice)
  );

  const minDeepPrice = Math.min(
    ...HOME_SIZE_RANGES
      .filter(range => !range.requiresEstimate)
      .map(range => range.deepPrice)
  );

  return (
    <div className="mb-6 md:mb-8">
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 p-4 md:p-6">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
        
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
          </div>
          
          <div className="flex-1 space-y-1">
            <h3 className="text-base md:text-lg font-semibold text-foreground">
              Instant Pricing Available
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              Standard cleaning starting at <span className="font-semibold text-primary">${minRegularPrice}</span> • 
              Deep cleaning from <span className="font-semibold text-primary">${minDeepPrice}</span>
            </p>
          </div>
          
          <div className="flex-shrink-0 hidden sm:block">
            <div className="px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30">
              <span className="text-xs font-medium text-primary">Get Your Quote →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
