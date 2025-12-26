import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { calculateNewPricing, PricingResult } from '@/lib/new-pricing-system';

interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
}

interface BookingData {
  // Step 1: ZIP
  zipCode: string;
  city: string;
  state: string;
  
  // Step 2: Home Size (Square Feet)
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  homeSizeId?: string;
  homeType: 'house' | 'apartment' | 'condo';
  
  // Step 3: Offer Selection
  offerType?: 'tester_deep_clean' | '90_day_plan' | 'standard_clean' | 'deep_clean' | 'recurring';
  offerName?: string;
  basePrice?: number;
  visitCount?: number;
  isRecurring?: boolean;
  
  // Promo code support
  promoCode?: string;
  promoDiscount?: number;
  
  // Service Type (locked to 'deep')
  serviceType: 'regular' | 'deep' | 'move_in_out';
  
  // Frequency (locked to 'one_time')
  frequency: 'one_time' | 'weekly' | 'bi_weekly' | 'monthly';
  
  // Step 5: Schedule (collected post-payment)
  date: string;
  timeSlot: string;
  bookingExpiresAt?: number;
  
  // Post-payment tracking
  additionalDetailsCollected?: boolean;
  
  // Summary & Upsell (not used in simplified flow)
  recurringStartDate?: string;
  upgradedToRecurring?: boolean;
  recurringUpgradeDiscount?: number;
  
  // Contact & Payment
  contactInfo: ContactInfo;
  specialInstructions: string;
  joinMembership: boolean;
}

interface BookingContextType {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  clearBookingData: () => void;
  pricing: PricingResult | null;
  calculatePricing: () => void;
  depositAmount: number; // Dynamic 25% deposit
}

const defaultContactInfo: ContactInfo = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  zip: '',
};

const defaultBookingData: BookingData = {
  zipCode: '',
  city: '',
  state: '',
  bedrooms: 2,
  bathrooms: 2,
  sqft: 0,
  homeSizeId: '2001_2500',
  homeType: 'house',
  serviceType: 'deep',
  frequency: 'one_time',
  date: '',
  timeSlot: '',
  bookingExpiresAt: undefined,
  contactInfo: defaultContactInfo,
  specialInstructions: '',
  joinMembership: false,
};

const STORAGE_KEY = 'alphalux-booking-flow';
const DEPOSIT_PERCENTAGE = 0.25; // 25%

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookingData, setBookingData] = useState<BookingData>(() => {
    // Load from localStorage on mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultBookingData, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load booking data:', error);
    }
    return defaultBookingData;
  });

  const [pricing, setPricing] = useState<PricingResult | null>(null);

  // Calculate deposit dynamically based on selected offer (25% of basePrice)
  const depositAmount = bookingData.basePrice 
    ? Math.round(bookingData.basePrice * DEPOSIT_PERCENTAGE)
    : 0;

  // Save to localStorage whenever bookingData changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookingData));
    } catch (error) {
      console.error('Failed to save booking data:', error);
    }
  }, [bookingData]);

  // Calculate pricing whenever relevant fields change
  useEffect(() => {
    if (bookingData.state && bookingData.serviceType) {
      calculatePricing();
    }
  }, [
    bookingData.state,
    bookingData.bedrooms,
    bookingData.bathrooms,
    bookingData.sqft,
    bookingData.serviceType,
    bookingData.frequency,
    bookingData.upgradedToRecurring,
    bookingData.recurringUpgradeDiscount,
  ]);

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...data }));
  };

  const clearBookingData = () => {
    setBookingData(defaultBookingData);
    localStorage.removeItem(STORAGE_KEY);
    setPricing(null);
  };

  const calculatePricing = () => {
    try {
      // SKIP auto-recalculation if user has already selected a specific offer
      // These offers have pre-calculated bundle/promotional pricing
      if (bookingData.offerType) {
        console.log('Skipping auto-pricing: offerType already set to', bookingData.offerType);
        return;
      }

      // Check if we have all required data
      if (!bookingData.state || !bookingData.serviceType || !bookingData.frequency) {
        return;
      }

      // Use homeSizeId if available, otherwise map from sqft or bedrooms
      let homeSizeId = bookingData.homeSizeId || '2001_2500'; // Default
      
      if (!bookingData.homeSizeId) {
        if (bookingData.sqft > 0) {
          if (bookingData.sqft >= 1000 && bookingData.sqft <= 1500) homeSizeId = '1000_1500';
          else if (bookingData.sqft >= 1501 && bookingData.sqft <= 2000) homeSizeId = '1501_2000';
          else if (bookingData.sqft >= 2001 && bookingData.sqft <= 2500) homeSizeId = '2001_2500';
          else if (bookingData.sqft >= 2501 && bookingData.sqft <= 3000) homeSizeId = '2501_3000';
          else if (bookingData.sqft >= 3001 && bookingData.sqft <= 3500) homeSizeId = '3001_3500';
          else if (bookingData.sqft >= 3501 && bookingData.sqft <= 4000) homeSizeId = '3501_4000';
          else if (bookingData.sqft >= 4001 && bookingData.sqft <= 4500) homeSizeId = '4001_4500';
          else if (bookingData.sqft >= 4501 && bookingData.sqft <= 5000) homeSizeId = '4501_5000';
          else if (bookingData.sqft >= 5000) homeSizeId = '5000_plus';
          else if (bookingData.sqft < 1000) homeSizeId = '1000_1500';
        } else if (bookingData.bedrooms > 0) {
          if (bookingData.bedrooms <= 1) homeSizeId = '1000_1500';
          else if (bookingData.bedrooms === 2) homeSizeId = '1501_2000';
          else if (bookingData.bedrooms === 3) homeSizeId = '2001_2500';
          else if (bookingData.bedrooms === 4) homeSizeId = '2501_3000';
          else homeSizeId = '3001_3500';
        }
      }

      const result = calculateNewPricing(
        homeSizeId,
        bookingData.serviceType,
        bookingData.frequency,
        bookingData.state
      );

      // Log for debugging pricing calculations
      console.log('Pricing calculated:', {
        homeSizeId,
        serviceType: bookingData.serviceType,
        frequency: bookingData.frequency,
        state: bookingData.state,
        basePrice: result.basePrice,
        discountAmount: result.discountAmount,
        finalPrice: result.finalPrice,
      });

      // Note: recurringUpgradeDiscount is NOT applied to the deep clean price
      // It only applies to the recurring service pricing shown separately in checkout

      setPricing(result);
    } catch (error) {
      console.error('Pricing calculation error:', error);
      setPricing(null);
    }
  };

  return (
    <BookingContext.Provider
      value={{
        bookingData,
        updateBookingData,
        clearBookingData,
        pricing,
        calculatePricing,
        depositAmount,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
}
