/**
 * One-time offer tracking utilities
 */

export interface CustomerData {
  name?: string;
  email?: string;
  phone?: string;
  zipCode?: string;
  address?: string;
}

const OFFER_STORAGE_KEY = 'used_promotional_offers';

/**
 * Normalize customer data for consistent matching
 */
function normalizeCustomerData(data: CustomerData): string {
  const normalized = {
    name: data.name?.toLowerCase().trim().replace(/\s+/g, ' '),
    email: data.email?.toLowerCase().trim(),
    phone: data.phone?.replace(/\D/g, ''), // Remove all non-digits
    zipCode: data.zipCode?.trim(),
    address: data.address?.toLowerCase().trim().replace(/\s+/g, ' ')
  };
  
  // Create a composite key from available data
  const parts = [normalized.name, normalized.email, normalized.phone, normalized.zipCode, normalized.address]
    .filter(Boolean);
  
  return parts.join('|');
}

/**
 * Check if customer has already used the promotional offer
 */
export function hasUsedPromoOffer(customerData: CustomerData): boolean {
  try {
    const usedOffers = localStorage.getItem(OFFER_STORAGE_KEY);
    if (!usedOffers) return false;
    
    const offersArray = JSON.parse(usedOffers) as string[];
    const customerKey = normalizeCustomerData(customerData);
    
    // Check if any part of the customer data matches existing entries
    return offersArray.some(usedKey => {
      const usedParts = usedKey.split('|');
      const currentParts = customerKey.split('|');
      
      // Check for matches in name, email, phone, or address+zipcode combination
      return usedParts.some((usedPart, index) => {
        if (!usedPart || !currentParts[index]) return false;
        
        // Exact match for any field
        if (usedPart === currentParts[index]) return true;
        
        // For address+zipcode combination (if both are present)
        if (index >= 3 && usedParts[3] && currentParts[3] && usedParts[4] && currentParts[4]) {
          return usedParts[3] === currentParts[3] && usedParts[4] === currentParts[4];
        }
        
        return false;
      });
    });
  } catch (error) {
    console.warn('Error checking offer usage:', error);
    return false;
  }
}

/**
 * Mark customer as having used the promotional offer
 */
export function markPromoOfferUsed(customerData: CustomerData): void {
  try {
    const customerKey = normalizeCustomerData(customerData);
    if (!customerKey) return;
    
    const usedOffers = localStorage.getItem(OFFER_STORAGE_KEY);
    const offersArray = usedOffers ? JSON.parse(usedOffers) : [];
    
    if (!offersArray.includes(customerKey)) {
      offersArray.push(customerKey);
      localStorage.setItem(OFFER_STORAGE_KEY, JSON.stringify(offersArray));
    }
  } catch (error) {
    console.warn('Error marking offer as used:', error);
  }
}

/**
 * Clear all offer usage data (admin function)
 */
export function clearOfferUsageData(): void {
  try {
    localStorage.removeItem(OFFER_STORAGE_KEY);
  } catch (error) {
    console.warn('Error clearing offer data:', error);
  }
}