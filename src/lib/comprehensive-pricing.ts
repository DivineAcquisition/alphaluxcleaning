/**
 * Comprehensive pricing calculations with discount breakdowns and labor costs
 */

export interface PricingBreakdown {
  basePrice: number;
  addOnsPrice: number;
  
  // Discount calculations
  globalDiscount: {
    percentage: number;
    dollarAmount: number;
    description: string;
  };
  
  frequencyDiscount: {
    percentage: number;
    dollarAmount: number;
    description: string;
  };
  
  membershipDiscount: {
    percentage: number;
    dollarAmount: number;
    description: string;
  };
  
  referralDiscount: {
    percentage: number;
    dollarAmount: number;
    description: string;
  };
  
  promoDiscount: {
    percentage: number;
    dollarAmount: number;
    description: string;
  };
  
  // Labor cost calculations
  laborCosts: {
    tier1Rate: number;
    tier2Rate: number;
    tier3Rate: number;
    estimatedHours: number;
    tier1TotalCost: number;
    tier2TotalCost: number;
    tier3TotalCost: number;
    estimatedLaborCost: number;
  };
  
  // Final totals
  subtotal: number;
  totalDiscounts: number;
  finalTotal: number;
  totalSavings: number;
}

// Subcontractor tier rates (hourly)
const TIER_RATES = {
  tier1: 16.00,  // Standard
  tier2: 18.00,  // Professional
  tier3: 21.00   // Premium
};

// Estimated hours by home size
const ESTIMATED_HOURS = {
  'under-1000': 2,
  '1001-1400': 2.5,
  '1401-1800': 3,
  '1801-2400': 3.5,
  '2401-2800': 4,
  '2801-3300': 4.5,
  '3301-3900': 5,
  '3901-4500': 5.5,
  '4501-5100': 6
};

export function calculateComprehensivePricing(
  basePrice: number,
  addOnsPrice: number = 0,
  homeSize: string = '',
  frequency: string = '',
  hasMembership: boolean = false,
  hasReferral: boolean = false,
  promoCode: string = ''
): PricingBreakdown {
  
  // Base calculations
  const subtotalBeforeDiscounts = basePrice + addOnsPrice;
  
  // Global 20% discount (already applied in base pricing)
  const globalDiscount = {
    percentage: 20,
    dollarAmount: Math.round(subtotalBeforeDiscounts * 0.25 * 100) / 100, // Reverse calculate original 20% discount
    description: 'Limited Time Promotion - 20% Off All Services'
  };
  
  // Frequency discounts (additional savings for recurring services)
  let frequencyDiscount = {
    percentage: 0,
    dollarAmount: 0,
    description: 'No frequency discount'
  };
  
  if (frequency === 'weekly') {
    frequencyDiscount = {
      percentage: 5,
      dollarAmount: Math.round(basePrice * 0.05 * 100) / 100,
      description: 'Weekly Service - Additional 5% Off'
    };
  } else if (frequency === 'biweekly') {
    frequencyDiscount = {
      percentage: 3,
      dollarAmount: Math.round(basePrice * 0.03 * 100) / 100,
      description: 'Bi-Weekly Service - Additional 3% Off'
    };
  }
  
  // Membership discount
  const membershipDiscount = {
    percentage: hasMembership ? 10 : 0,
    dollarAmount: hasMembership ? Math.round(basePrice * 0.10 * 100) / 100 : 0,
    description: hasMembership ? 'CleanCovered Membership - 10% Off' : 'No membership discount'
  };
  
  // Referral discount
  const referralDiscount = {
    percentage: hasReferral ? 15 : 0,
    dollarAmount: hasReferral ? Math.round(basePrice * 0.15 * 100) / 100 : 0,
    description: hasReferral ? 'Referral Discount - 15% Off First Service' : 'No referral discount'
  };
  
  // Promo code discount
  let promoDiscount = {
    percentage: 0,
    dollarAmount: 0,
    description: 'No promo code applied'
  };
  
  if (promoCode) {
    // Example promo codes - can be expanded
    if (promoCode.toUpperCase() === 'FIRST25') {
      promoDiscount = {
        percentage: 25,
        dollarAmount: Math.round(basePrice * 0.25 * 100) / 100,
        description: 'FIRST25 - 25% Off First Cleaning'
      };
    } else if (promoCode.toUpperCase() === 'SAVE10') {
      promoDiscount = {
        percentage: 10,
        dollarAmount: Math.round(basePrice * 0.10 * 100) / 100,
        description: 'SAVE10 - 10% Off Service'
      };
    }
  }
  
  // Enhanced labor cost calculations for all tiers
  const estimatedHours = ESTIMATED_HOURS[homeSize as keyof typeof ESTIMATED_HOURS] || 3;
  const laborCosts = {
    tier1Rate: TIER_RATES.tier1,
    tier2Rate: TIER_RATES.tier2,
    tier3Rate: TIER_RATES.tier3,
    estimatedHours,
    // Calculate total cost for each tier
    tier1TotalCost: Math.round(TIER_RATES.tier1 * estimatedHours * 100) / 100,
    tier2TotalCost: Math.round(TIER_RATES.tier2 * estimatedHours * 100) / 100,
    tier3TotalCost: Math.round(TIER_RATES.tier3 * estimatedHours * 100) / 100,
    estimatedLaborCost: Math.round(TIER_RATES.tier2 * estimatedHours * 100) / 100 // Default to Tier 2
  };
  
  // Calculate totals
  const additionalDiscounts = frequencyDiscount.dollarAmount + membershipDiscount.dollarAmount + 
                            referralDiscount.dollarAmount + promoDiscount.dollarAmount;
  
  const totalDiscounts = globalDiscount.dollarAmount + additionalDiscounts;
  const finalTotal = Math.max(0, subtotalBeforeDiscounts - additionalDiscounts); // Base price already has global discount
  const totalSavings = totalDiscounts;
  
  return {
    basePrice,
    addOnsPrice,
    globalDiscount,
    frequencyDiscount,
    membershipDiscount,
    referralDiscount,
    promoDiscount,
    laborCosts,
    subtotal: subtotalBeforeDiscounts,
    totalDiscounts,
    finalTotal,
    totalSavings
  };
}

export function formatPricingForGHL(pricing: PricingBreakdown, customerInfo: any, serviceDetails: any): any {
  // Calculate customer LTV
  const customerLTV = calculateCustomerLTV(pricing.finalTotal, serviceDetails.frequency);
  
  // Map cleaning type
  const cleaningTypeMap: { [key: string]: string } = {
    'regular': 'Regular Cleaning',
    'deep': 'Deep Cleaning', 
    'moveout': 'Move-Out Cleaning',
    'movein': 'Move-In Cleaning',
    'post_construction': 'Post-Construction Cleaning',
    'residential_cleaning': 'Residential Cleaning',
    'commercial_cleaning': 'Commercial Cleaning'
  };
  const cleaningType = cleaningTypeMap[serviceDetails.serviceType] || serviceDetails.serviceType || 'General Cleaning';
  
  return {
    // Contact Information (GHL Format)
    contact: {
      firstName: customerInfo.name?.split(' ')[0] || '',
      lastName: customerInfo.name?.split(' ').slice(1).join(' ') || '',
      email: customerInfo.email || '',
      phone: customerInfo.phone || '',
      address1: customerInfo.address || '',
      city: customerInfo.city || '',
      state: customerInfo.state || 'NY',
      postalCode: customerInfo.zipCode || ''
    },
    
    // Service Information
    service: {
      serviceType: serviceDetails.serviceType || '',
      cleaningType: cleaningType, // Human-readable cleaning type
      homeSize: serviceDetails.homeSize || '',
      frequency: serviceDetails.frequency || '',
      flooringType: serviceDetails.flooringType || '',
      addOns: serviceDetails.addOns || [],
      serviceDate: serviceDetails.serviceDate || '',
      serviceTime: serviceDetails.serviceTime || '',
      serviceDateTime: serviceDetails.serviceDate && serviceDetails.serviceTime 
        ? `${serviceDetails.serviceDate} ${serviceDetails.serviceTime}` 
        : ''
    },
    
    // Pricing Breakdown (GHL Custom Fields Format)
    pricing: {
      basePrice: pricing.basePrice,
      addOnsPrice: pricing.addOnsPrice,
      subtotal: pricing.subtotal,
      
      // Individual Discounts
      globalDiscountPercent: pricing.globalDiscount.percentage,
      globalDiscountAmount: pricing.globalDiscount.dollarAmount,
      
      frequencyDiscountPercent: pricing.frequencyDiscount.percentage,
      frequencyDiscountAmount: pricing.frequencyDiscount.dollarAmount,
      
      membershipDiscountPercent: pricing.membershipDiscount.percentage,
      membershipDiscountAmount: pricing.membershipDiscount.dollarAmount,
      
      referralDiscountPercent: pricing.referralDiscount.percentage,
      referralDiscountAmount: pricing.referralDiscount.dollarAmount,
      
      promoDiscountPercent: pricing.promoDiscount.percentage,
      promoDiscountAmount: pricing.promoDiscount.dollarAmount,
      
      totalDiscounts: pricing.totalDiscounts,
      finalTotal: pricing.finalTotal,
      totalSavings: pricing.totalSavings
    },
    
    // Labor Cost Information (all tiers)
    laborCosts: {
      tier1HourlyRate: pricing.laborCosts.tier1Rate,
      tier2HourlyRate: pricing.laborCosts.tier2Rate,
      tier3HourlyRate: pricing.laborCosts.tier3Rate,
      tier1TotalCost: pricing.laborCosts.tier1TotalCost,
      tier2TotalCost: pricing.laborCosts.tier2TotalCost,
      tier3TotalCost: pricing.laborCosts.tier3TotalCost,
      estimatedHours: pricing.laborCosts.estimatedHours,
      estimatedLaborCost: pricing.laborCosts.estimatedLaborCost
    },
    
    // GHL Pipeline Fields
    pipeline: {
      stage: 'new_booking',
      leadScore: calculateLeadScore(pricing.finalTotal, serviceDetails.frequency),
      dealValue: pricing.finalTotal,
      customerLTV: customerLTV, // Customer lifetime value
      source: 'website_booking'
    },
    
    // Timestamps
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function calculateLeadScore(totalValue: number, frequency: string): number {
  let score = 0;
  
  // Base score from order value
  if (totalValue > 300) score += 40;
  else if (totalValue > 200) score += 30;
  else if (totalValue > 100) score += 20;
  else score += 10;
  
  // Frequency bonus
  if (frequency === 'weekly') score += 30;
  else if (frequency === 'biweekly') score += 20;
  else if (frequency === 'monthly') score += 10;
  
  // Service type bonus
  score += 10; // All bookings get base service bonus
  
  return Math.min(100, score);
}

/**
 * Calculate Customer Lifetime Value (LTV) based on service frequency and price
 */
export function calculateCustomerLTV(
  servicePrice: number,
  frequency: string,
  retentionMonths: number = 12 // Default 12-month retention assumption
): number {
  if (!servicePrice || servicePrice <= 0) return 0;
  
  let servicesPerYear = 0;
  
  // Calculate services per year based on frequency
  switch (frequency?.toLowerCase()) {
    case 'weekly':
      servicesPerYear = 52;
      break;
    case 'biweekly':
    case 'bi-weekly':
      servicesPerYear = 26;
      break;
    case 'monthly':
      servicesPerYear = 12;
      break;
    case 'quarterly':
      servicesPerYear = 4;
      break;
    default:
      // One-time service
      return Math.round(servicePrice * 100) / 100;
  }
  
  // Calculate LTV: price per service × services per year × retention period (in years)
  const ltv = servicePrice * servicesPerYear * (retentionMonths / 12);
  
  return Math.round(ltv * 100) / 100;
}