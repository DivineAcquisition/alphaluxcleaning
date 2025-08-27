/**
 * Service Price Calculator - Calculates actual amounts owed from service details
 */

// Pricing tiers from PricingCalculator
const pricingTiers = [
  { min: 0, max: 1000, weekly: 97.50, biweekly: 118.59, monthly: 171.26, oneTime: 225.31, deepClean: 305.05 },
  { min: 1001, max: 1400, weekly: 115.94, biweekly: 125.58, monthly: 186.59, oneTime: 235.09, deepClean: 327.77 },
  { min: 1401, max: 1800, weekly: 125.67, biweekly: 140.06, monthly: 225.73, oneTime: 255.27, deepClean: 355.94 },
  { min: 1801, max: 2400, weekly: 132.81, biweekly: 150.15, monthly: 234.87, oneTime: 265.41, deepClean: 385.13 },
  { min: 2401, max: 2800, weekly: 158.26, biweekly: 175.14, monthly: 245.76, oneTime: 285.28, deepClean: 405.01 },
  { min: 2801, max: 3300, weekly: 168.73, biweekly: 188.62, monthly: 287.92, oneTime: 297.46, deepClean: 459.16 },
  { min: 3301, max: 3900, weekly: 178.82, biweekly: 197.61, monthly: 307.81, oneTime: 346.34, deepClean: 478.39 },
  { min: 3901, max: 4500, weekly: 215.29, biweekly: 231.58, monthly: 368.69, oneTime: 378.67, deepClean: 512.60 },
  { min: 4501, max: 5100, weekly: 228.56, biweekly: 242.05, monthly: 428.17, oneTime: 461.37, deepClean: 564.24 }
];

const addOnPrices = {
  baseboards: 50,
  dishes: 40,
  door_facings: 50,
  wall_spot_clean: 25,
  wall_wash_per_room: 75,
  blinds_feather: 65,
  blinds_blade: 15,
  oven_fridge: 35,
  cabinet_fronts: 50,
  window_sills: 25,
  light_fixtures: 35,
  laundry_basket: 20
};

export interface ServicePriceCalculation {
  originalPrice: number;
  amountPaid: number;
  amountDue: number;
  serviceDetails: {
    squareFootage: number;
    cleaningType: string;
    frequency: string;
    addOns: string[];
    paymentType: string;
  };
  priceBreakdown: {
    basePrice: number;
    addOnsTotal: number;
    totalPrice: number;
  };
}

/**
 * Extract square footage from service details or use defaults based on cleaning type
 */
function getSquareFootageFromServiceDetails(serviceDetails: any, cleaningType: string): number {
  // First try to get from service_details
  if (serviceDetails?.square_footage && serviceDetails.square_footage > 0) {
    return serviceDetails.square_footage;
  }
  
  // Try to parse from cleaning type if it contains ranges like "2401-2800"
  const rangeMatch = cleaningType?.match(/(\d+)-(\d+)/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1]);
    const max = parseInt(rangeMatch[2]);
    return (min + max) / 2;
  }
  
  // Handle single numbers in cleaning type
  const numberMatch = cleaningType?.match(/(\d+)/);
  if (numberMatch) {
    return parseInt(numberMatch[1]);
  }
  
  // Default based on cleaning type
  const type = cleaningType?.toLowerCase() || '';
  if (type.includes('small') || type.includes('studio')) {
    return 800;
  } else if (type.includes('large') || type.includes('complete')) {
    return 2500;
  } else if (type.includes('deep')) {
    return 1800;
  }
  
  return 1500; // Default fallback for general cleaning
}

/**
 * Determine cleaning type from service details and cleaning_type field
 */
function getCleaningTypeFromServiceDetails(serviceDetails: any, cleaningType: string): string {
  // Check service details first
  const serviceCleaningType = (serviceDetails?.cleaning_type || cleaningType || '').toLowerCase();
  
  // Check if it's deep cleaning
  if (serviceCleaningType.includes('deep')) {
    return 'deep';
  }
  
  // Check frequency to determine if it's regular or one-time
  const frequency = serviceDetails?.recurring_frequency || serviceDetails?.frequency;
  if (frequency === 'weekly' || frequency === 'biweekly' || frequency === 'monthly') {
    return 'regular';
  }
  
  return 'oneTime'; // Default to one-time
}

/**
 * Get frequency from service details
 */
function getFrequencyFromServiceDetails(serviceDetails: any): string {
  const frequency = serviceDetails.recurring_frequency || serviceDetails.frequency;
  
  if (frequency === 'weekly') return 'weekly';
  if (frequency === 'bi-weekly' || frequency === 'biweekly') return 'biweekly';
  if (frequency === 'monthly') return 'monthly';
  
  return 'oneTime';
}

/**
 * Calculate service price from order details
 */
export function calculateServicePrice(order: any): ServicePriceCalculation {
  const serviceDetails = order.service_details || {};
  
  // Get square footage from service details or defaults
  const squareFootage = getSquareFootageFromServiceDetails(serviceDetails, order.cleaning_type);
  
  // Determine actual cleaning type and frequency
  const cleaningType = getCleaningTypeFromServiceDetails(serviceDetails, order.cleaning_type);
  const frequency = getFrequencyFromServiceDetails(serviceDetails);
  
  // Find appropriate pricing tier
  const tier = pricingTiers.find(t => squareFootage >= t.min && squareFootage <= t.max) || pricingTiers[0];
  
  // Get base price based on cleaning type and frequency
  let basePrice = 0;
  if (cleaningType === 'deep') {
    basePrice = tier.deepClean;
  } else if (frequency === 'weekly') {
    basePrice = tier.weekly;
  } else if (frequency === 'biweekly') {
    basePrice = tier.biweekly;
  } else if (frequency === 'monthly') {
    basePrice = tier.monthly;
  } else {
    basePrice = tier.oneTime;
  }
  
  // Calculate add-ons total
  const addOns = order.add_ons || [];
  const addOnsTotal = addOns.reduce((total: number, addOn: string) => {
    return total + (addOnPrices[addOn as keyof typeof addOnPrices] || 0);
  }, 0);
  
  const totalPrice = basePrice + addOnsTotal;
  
  // Determine payment type and calculate amounts
  const paymentType = serviceDetails.paymentType || order.payment_type || 'pay_after_service';
  let amountPaid = 0;
  let amountDue = totalPrice;
  
  if (paymentType === 'deposit') {
    // 30% deposit was paid
    amountPaid = Math.round(totalPrice * 0.3 * 100) / 100;
    amountDue = totalPrice - amountPaid;
  } else if (paymentType === '25_percent_with_discount') {
    // 25% of discounted total (5% discount applied)
    const discountedTotal = totalPrice * 0.95;
    amountPaid = Math.round(discountedTotal * 0.25 * 100) / 100;
    amountDue = discountedTotal - amountPaid;
  } else if (paymentType === 'full') {
    // Full amount already paid
    amountPaid = totalPrice;
    amountDue = 0;
  }
  // For 'pay_after_service', amountPaid stays 0, amountDue is full price
  
  return {
    originalPrice: totalPrice,
    amountPaid,
    amountDue,
    serviceDetails: {
      squareFootage,
      cleaningType,
      frequency,
      addOns,
      paymentType
    },
    priceBreakdown: {
      basePrice,
      addOnsTotal,
      totalPrice
    }
  };
}

/**
 * Determine if order requires payment
 */
export function orderRequiresPayment(order: any): boolean {
  const calculation = calculateServicePrice(order);
  return calculation.amountDue > 0;
}

/**
 * Get display information for service type
 */
export function getServiceDisplayInfo(order: any): {
  serviceName: string;
  serviceDescription: string;
  squareFootageDisplay: string;
} {
  const calculation = calculateServicePrice(order);
  const { cleaningType, frequency, squareFootage } = calculation.serviceDetails;
  
  // Get user-friendly cleaning type name
  const rawCleaningType = (order.cleaning_type || '').toLowerCase();
  let serviceName = '';
  
  if (cleaningType === 'deep' || rawCleaningType.includes('deep')) {
    serviceName = 'Deep Cleaning';
  } else if (frequency === 'weekly') {
    serviceName = 'Weekly Cleaning';
  } else if (frequency === 'biweekly') {
    serviceName = 'Bi-Weekly Cleaning';
  } else if (frequency === 'monthly') {
    serviceName = 'Monthly Cleaning';
  } else {
    // Map raw cleaning types to user-friendly names
    if (rawCleaningType.includes('complete')) {
      serviceName = 'Complete Cleaning';
    } else if (rawCleaningType.includes('general')) {
      serviceName = 'General Cleaning';
    } else if (rawCleaningType.includes('standard')) {
      serviceName = 'Standard Cleaning';
    } else {
      serviceName = 'One-Time Cleaning';
    }
  }
  
  const serviceDescription = `${serviceName} for ${squareFootage} sq ft home`;
  const squareFootageDisplay = `${squareFootage} sq ft`;
  
  return {
    serviceName,
    serviceDescription,
    squareFootageDisplay
  };
}