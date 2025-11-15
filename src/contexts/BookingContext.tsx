import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { calculateNewPricing, PricingResult } from '@/lib/new-pricing-system';
import { getTierPrice } from '@/lib/tier-pricing-system';

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
  zipCode: string;
  city?: string;
  state?: string;
  stateCode?: string;
  tier?: 'essential' | 'premium';
  sqft?: number;
  serviceType?: string;
  homeSizeId?: string;
  frequency: string;
  serviceDate?: string;
  timeSlot?: string;
  contactInfo?: ContactInfo;
  specialInstructions?: string;
}

interface BookingContextType {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  clearBookingData: () => void;
  pricing: PricingResult | null;
  calculatePricing: () => void;
  depositAmount: number;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookingData, setBookingData] = useState<BookingData>(() => {
    const saved = localStorage.getItem('bookingData');
    if (saved) return JSON.parse(saved);
    return { zipCode: '', frequency: 'one_time', tier: 'premium', sqft: 2000 };
  });

  const [pricing, setPricing] = useState<PricingResult | null>(null);

  useEffect(() => {
    localStorage.setItem('bookingData', JSON.stringify(bookingData));
  }, [bookingData]);

  useEffect(() => {
    if (bookingData.tier && bookingData.sqft && bookingData.stateCode && bookingData.frequency) {
      calculatePricing();
    }
  }, [bookingData.tier, bookingData.sqft, bookingData.stateCode, bookingData.frequency]);

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...data }));
  };

  const clearBookingData = () => {
    setBookingData({ zipCode: '', frequency: 'one_time', tier: 'premium', sqft: 2000 });
    localStorage.removeItem('bookingData');
  };

  const calculatePricing = () => {
    if (bookingData.tier && bookingData.sqft && bookingData.stateCode) {
      try {
        const tierResult = getTierPrice(bookingData.tier, bookingData.sqft, bookingData.stateCode, bookingData.frequency);
        setPricing({
          basePrice: tierResult.basePrice,
          discountAmount: tierResult.discountAmount,
          totalPrice: tierResult.finalPrice,
          depositAmount: tierResult.depositAmount,
          savings: tierResult.savings,
          annualSavings: tierResult.annualSavings,
        });
        return;
      } catch (error) {
        console.error('Tier pricing failed:', error);
      }
    }
    if (bookingData.serviceType && bookingData.homeSizeId && bookingData.stateCode) {
      try {
        const result = calculateNewPricing({
          serviceType: bookingData.serviceType,
          homeSizeId: bookingData.homeSizeId,
          frequency: bookingData.frequency,
          stateCode: bookingData.stateCode,
        });
        if (result) setPricing(result);
      } catch (error) {
        console.error('Legacy pricing failed:', error);
      }
    }
  };

  const depositAmount = pricing?.depositAmount || 49;

  return (
    <BookingContext.Provider value={{ bookingData, updateBookingData, clearBookingData, pricing, calculatePricing, depositAmount }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used within BookingProvider');
  return context;
}
