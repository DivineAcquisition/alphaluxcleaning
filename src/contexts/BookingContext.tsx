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
  
  // Step 2: Home Details
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  homeType: 'house' | 'apartment' | 'condo';
  
  // Step 3: Service Type
  serviceType: 'regular' | 'deep' | 'move_in_out';
  
  // Step 4: Frequency
  frequency: 'one_time' | 'weekly' | 'bi_weekly' | 'monthly';
  
  // Step 5: Schedule
  date: string;
  timeSlot: string;
  
  // Step 6: Contact & Payment
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
  depositAmount: number; // Fixed $49
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
  homeType: 'house',
  serviceType: 'regular',
  frequency: 'one_time',
  date: '',
  timeSlot: '',
  contactInfo: defaultContactInfo,
  specialInstructions: '',
  joinMembership: false,
};

const STORAGE_KEY = 'alphalux-booking-flow';
const DEPOSIT_AMOUNT = 49; // Fixed $49 deposit

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
      // Map sqft to home size or use bedrooms/bathrooms if sqft not provided
      let homeSizeId = 'small';
      if (bookingData.sqft > 0) {
        if (bookingData.sqft < 1000) homeSizeId = 'small';
        else if (bookingData.sqft < 1500) homeSizeId = 'medium';
        else if (bookingData.sqft < 2500) homeSizeId = 'large';
        else homeSizeId = 'xlarge';
      } else {
        // Estimate from bedrooms
        if (bookingData.bedrooms <= 1) homeSizeId = 'small';
        else if (bookingData.bedrooms === 2) homeSizeId = 'medium';
        else if (bookingData.bedrooms === 3) homeSizeId = 'large';
        else homeSizeId = 'xlarge';
      }

      const result = calculateNewPricing(
        homeSizeId,
        bookingData.serviceType,
        bookingData.frequency,
        bookingData.state
      );

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
        depositAmount: DEPOSIT_AMOUNT,
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
