/**
 * Unified Pricing Adapter
 * Routes pricing calculations through the configured pricing engine
 */

import { PRICING_MODE } from './pricing-mode';
import { calculateFixedPricing, FREQUENCY_NAMES, SERVICE_TYPE_NAMES } from './fixed-pricing-system';
import { calculatePricing, type StateCode, type ServiceType, type FrequencyType } from './state-pricing-system';
import { calculateNewPricing, HOME_SIZE_RANGES } from './new-pricing-system';

export interface PriceQuoteParams {
  stateCode: string;
  sqft: number;
  homeSizeId: string;
  serviceTypeId: string;
  frequencyId: string;
}

export interface PriceQuote {
  discountedPrice: number;
  depositAmount: number;
  basePrice: number;
  discountAmount: number;
  recurringDetails?: {
    perClean: number;
    cleansPerMonth: number;
    monthlyTotal: number;
  };
  tierLabel: string;
}

/**
 * Get a price quote using the configured pricing engine
 */
export function getPriceQuote(params: PriceQuoteParams): PriceQuote | null {
  const { stateCode, sqft, homeSizeId, serviceTypeId, frequencyId } = params;

  try {
    switch (PRICING_MODE) {
      case 'fixed': {
        // Universal flat pricing - no variation by square footage
        const result = calculateFixedPricing(serviceTypeId, frequencyId);
        
        // Get home size label for display
        const homeSize = HOME_SIZE_RANGES.find(range => range.id === homeSizeId);
        const tierLabel = homeSize?.label || 'Standard Home';

        return {
          discountedPrice: result.finalPrice,
          depositAmount: Math.round(result.finalPrice * 0.25 * 100) / 100,
          basePrice: result.basePrice || result.finalPrice,
          discountAmount: (result.basePrice || result.finalPrice) - result.finalPrice,
          recurringDetails: result.isRecurring && result.perCleanPrice && result.cleansPerMonth
            ? {
                perClean: result.perCleanPrice,
                cleansPerMonth: result.cleansPerMonth,
                monthlyTotal: result.monthlyTotal
              }
            : undefined,
          tierLabel
        };
      }

      case 'state': {
        // State-based tiered pricing
        const result = calculatePricing(
          stateCode as StateCode,
          sqft,
          serviceTypeId as ServiceType,
          frequencyId as FrequencyType
        );

        if (!result) return null;

        return {
          discountedPrice: result.discountedPrice,
          depositAmount: Math.round(result.discountedPrice * 0.25 * 100) / 100,
          basePrice: result.originalPrice,
          discountAmount: result.savings,
          recurringDetails: result.recurringDetails
            ? {
                perClean: result.recurringDetails.perClean,
                cleansPerMonth: result.recurringDetails.cleansPerMonth,
                monthlyTotal: result.recurringDetails.monthlyTotal
              }
            : undefined,
          tierLabel: result.tier.label
        };
      }

      case 'new': {
        // New hourly-based pricing
        const result = calculateNewPricing(homeSizeId, serviceTypeId, frequencyId, stateCode);
        
        // Get home size label for display
        const homeSize = HOME_SIZE_RANGES.find(range => range.id === homeSizeId);
        const tierLabel = homeSize?.label || 'Standard Home';

        // Calculate recurring details if MRR exists
        let recurringDetails: PriceQuote['recurringDetails'];
        if (result.mrrEstimate > 0) {
          const cleansPerMonthMap: Record<string, number> = {
            weekly: 4,
            bi_weekly: 2,
            monthly: 1
          };
          const cleansPerMonth = cleansPerMonthMap[frequencyId] || 0;
          
          if (cleansPerMonth > 0) {
            recurringDetails = {
              perClean: result.finalPrice,
              cleansPerMonth,
              monthlyTotal: result.mrrEstimate
            };
          }
        }

        return {
          discountedPrice: result.finalPrice,
          depositAmount: result.depositAmount,
          basePrice: result.basePrice,
          discountAmount: result.discountAmount,
          recurringDetails,
          tierLabel
        };
      }

      default:
        console.error(`Unknown pricing mode: ${PRICING_MODE}`);
        return null;
    }
  } catch (error) {
    console.error('Error calculating price quote:', error);
    return null;
  }
}
