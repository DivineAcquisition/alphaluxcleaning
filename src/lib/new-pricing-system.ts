/**
 * New Pricing System - Based on cleaner pay + multipliers
 * Formula: Base = $25/hr × cleaners × hours × state_multiplier × service_multiplier × frequency_discount
 */

export interface HomeSizeRange {
  id: string;
  label: string;
  minSqft: number;
  maxSqft: number;
  estimatedHours: number;
  bedroomRange: string;
  requiresEstimate?: boolean;
}

export interface ServiceTypeConfig {
  id: string;
  name: string;
  multiplier: number;
}

export interface FrequencyConfig {
  id: string;
  name: string;
  discount: number; // as decimal (0.15 = 15% discount)
  mrrMultiplier: number; // for calculating MRR
}

export interface StateConfig {
  code: string;
  name: string;
  multiplier: number;
}

export interface PricingConfig {
  baseHourlyRate: number;
  cleanersPerTeam: number;
  states: StateConfig[];
  serviceTypes: ServiceTypeConfig[];
  frequencies: FrequencyConfig[];
}

export interface PricingResult {
  basePrice: number;
  finalPrice: number;
  mrrEstimate: number;
  arrEstimate: number;
  breakdown: {
    baseCalculation: number; // hours × rate × cleaners
    stateMultiplier: number;
    serviceMultiplier: number;
    frequencyDiscount: number;
  };
}

// Home size ranges with estimated hours
export const HOME_SIZE_RANGES: HomeSizeRange[] = [
  {
    id: 'under_1000',
    label: 'Under 1,000 sq ft',
    minSqft: 0,
    maxSqft: 999,
    estimatedHours: 2,
    bedroomRange: 'Studio / 1 BR apartments'
  },
  {
    id: '1000_1500',
    label: '1,000 – 1,500 sq ft',
    minSqft: 1000,
    maxSqft: 1500,
    estimatedHours: 2.5,
    bedroomRange: '1–2 BR condos/homes'
  },
  {
    id: '1501_2000',
    label: '1,501 – 2,000 sq ft',
    minSqft: 1501,
    maxSqft: 2000,
    estimatedHours: 3,
    bedroomRange: '2–3 BR homes'
  },
  {
    id: '2001_2500',
    label: '2,001 – 2,500 sq ft',
    minSqft: 2001,
    maxSqft: 2500,
    estimatedHours: 3.5,
    bedroomRange: '3 BR homes'
  },
  {
    id: '2501_3000',
    label: '2,501 – 3,000 sq ft',
    minSqft: 2501,
    maxSqft: 3000,
    estimatedHours: 4,
    bedroomRange: '3–4 BR homes'
  },
  {
    id: '3001_3500',
    label: '3,001 – 3,500 sq ft',
    minSqft: 3001,
    maxSqft: 3500,
    estimatedHours: 4.5,
    bedroomRange: '4 BR homes'
  },
  {
    id: '3501_4000',
    label: '3,501 – 4,000 sq ft',
    minSqft: 3501,
    maxSqft: 4000,
    estimatedHours: 5,
    bedroomRange: '4–5 BR homes'
  },
  {
    id: '4001_5000',
    label: '4,001 – 5,000 sq ft',
    minSqft: 4001,
    maxSqft: 5000,
    estimatedHours: 5.5,
    bedroomRange: '5 BR homes'
  },
  {
    id: '5000_plus',
    label: '5,000+ sq ft',
    minSqft: 5000,
    maxSqft: 999999,
    estimatedHours: 0,
    bedroomRange: 'Requires in-person estimate',
    requiresEstimate: true
  }
];

// Default configuration
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  baseHourlyRate: 25,
  cleanersPerTeam: 2,
  states: [
    { code: 'CA', name: 'Cali', multiplier: 1.5 },
    { code: 'TX', name: 'Texas', multiplier: 1.43 }
  ],
  serviceTypes: [
    { id: 'standard', name: 'Standard Cleaning', multiplier: 1.0 },
    { id: 'deep', name: 'Deep Cleaning', multiplier: 1.4 },
    { id: 'move_in_out', name: 'Move-In/Out Cleaning', multiplier: 1.5 }
  ],
  frequencies: [
    { id: 'one_time', name: 'One-time', discount: 0.2, mrrMultiplier: 0 },
    { id: 'weekly', name: 'Weekly', discount: 0.15, mrrMultiplier: 4.3 },
    { id: 'bi_weekly', name: 'Bi-Weekly', discount: 0.10, mrrMultiplier: 2.15 },
    { id: 'monthly', name: 'Monthly', discount: 0.05, mrrMultiplier: 1 }
  ]
};

/**
 * Calculate pricing based on new system
 */
export function calculateNewPricing(
  homeSizeId: string,
  serviceTypeId: string,
  frequencyId: string,
  stateCode: string,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): PricingResult {
  const homeSize = HOME_SIZE_RANGES.find(h => h.id === homeSizeId);
  const serviceType = config.serviceTypes.find(s => s.id === serviceTypeId);
  const frequency = config.frequencies.find(f => f.id === frequencyId);
  const state = config.states.find(s => s.code === stateCode);

  if (!homeSize || !serviceType || !frequency || !state) {
    throw new Error('Invalid pricing parameters');
  }

  if (homeSize.requiresEstimate) {
    return {
      basePrice: 0,
      finalPrice: 0,
      mrrEstimate: 0,
      arrEstimate: 0,
      breakdown: {
        baseCalculation: 0,
        stateMultiplier: state.multiplier,
        serviceMultiplier: serviceType.multiplier,
        frequencyDiscount: frequency.discount
      }
    };
  }

  // Base calculation: hourly rate × cleaners × estimated hours
  const baseCalculation = config.baseHourlyRate * config.cleanersPerTeam * homeSize.estimatedHours;

  // Apply state multiplier
  const stateAdjusted = baseCalculation * state.multiplier;

  // Apply service type multiplier
  const serviceAdjusted = stateAdjusted * serviceType.multiplier;

  // Apply frequency discount
  const finalPrice = serviceAdjusted * (1 - frequency.discount);

  // Calculate MRR and ARR for recurring services
  const mrrEstimate = frequency.mrrMultiplier > 0 ? finalPrice * frequency.mrrMultiplier : 0;
  const arrEstimate = mrrEstimate * 12;

  return {
    basePrice: Math.round(baseCalculation * 100) / 100,
    finalPrice: Math.round(finalPrice * 100) / 100,
    mrrEstimate: Math.round(mrrEstimate * 100) / 100,
    arrEstimate: Math.round(arrEstimate * 100) / 100,
    breakdown: {
      baseCalculation: Math.round(baseCalculation * 100) / 100,
      stateMultiplier: state.multiplier,
      serviceMultiplier: serviceType.multiplier,
      frequencyDiscount: frequency.discount
    }
  };
}

/**
 * Get home size by square footage
 */
export function getHomeSizeBySquareFootage(sqft: number): HomeSizeRange | null {
  return HOME_SIZE_RANGES.find(range => sqft >= range.minSqft && sqft <= range.maxSqft) || null;
}

/**
 * Format pricing for webhook payload
 */
export function formatPricingForWebhook(
  result: PricingResult,
  homeSizeId: string,
  serviceTypeId: string,
  frequencyId: string
) {
  const homeSize = HOME_SIZE_RANGES.find(h => h.id === homeSizeId);
  const serviceType = DEFAULT_PRICING_CONFIG.serviceTypes.find(s => s.id === serviceTypeId);
  const frequency = DEFAULT_PRICING_CONFIG.frequencies.find(f => f.id === frequencyId);

  return {
    sqft_range: homeSize?.label || '',
    service_type: serviceType?.name || '',
    frequency: frequency?.name || '',
    price_final: result.finalPrice,
    mrr_est: result.mrrEstimate,
    arr_est: result.arrEstimate,
    breakdown: result.breakdown
  };
}