import React, { createContext, useContext, useState, ReactNode } from 'react';

interface HomeDetails {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  homeSize: string;
  sqFt: string;
}

interface PlanOffer {
  offerType: 'tester_deep_clean' | '90_day_plan' | null;
  offerName: string;
  basePrice: number;
  visitCount: number;
  isRecurring: boolean;
}

interface ScheduleDetails {
  preferredDate: string;
  preferredTimeBlock: string;
  notes: string;
}

interface SimpleBookingData {
  homeDetails: HomeDetails;
  planOffer: PlanOffer;
  scheduleDetails: ScheduleDetails;
}

interface SimpleBookingContextType {
  bookingData: SimpleBookingData;
  updateHomeDetails: (data: Partial<HomeDetails>) => void;
  updatePlanOffer: (data: PlanOffer) => void;
  updateScheduleDetails: (data: Partial<ScheduleDetails>) => void;
  clearBookingData: () => void;
}

const defaultBookingData: SimpleBookingData = {
  homeDetails: {
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    homeSize: '',
    sqFt: '',
  },
  planOffer: {
    offerType: null,
    offerName: '',
    basePrice: 0,
    visitCount: 1,
    isRecurring: false,
  },
  scheduleDetails: {
    preferredDate: '',
    preferredTimeBlock: '',
    notes: '',
  },
};

const STORAGE_KEY = 'novara-simple-booking';

const SimpleBookingContext = createContext<SimpleBookingContextType | undefined>(undefined);

export function SimpleBookingProvider({ children }: { children: ReactNode }) {
  const [bookingData, setBookingData] = useState<SimpleBookingData>(() => {
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

  const updateHomeDetails = (data: Partial<HomeDetails>) => {
    setBookingData(prev => {
      const updated = {
        ...prev,
        homeDetails: { ...prev.homeDetails, ...data },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const updatePlanOffer = (data: PlanOffer) => {
    setBookingData(prev => {
      const updated = {
        ...prev,
        planOffer: data,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const updateScheduleDetails = (data: Partial<ScheduleDetails>) => {
    setBookingData(prev => {
      const updated = {
        ...prev,
        scheduleDetails: { ...prev.scheduleDetails, ...data },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearBookingData = () => {
    setBookingData(defaultBookingData);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <SimpleBookingContext.Provider
      value={{
        bookingData,
        updateHomeDetails,
        updatePlanOffer,
        updateScheduleDetails,
        clearBookingData,
      }}
    >
      {children}
    </SimpleBookingContext.Provider>
  );
}

export function useSimpleBooking() {
  const context = useContext(SimpleBookingContext);
  if (!context) {
    throw new Error('useSimpleBooking must be used within SimpleBookingProvider');
  }
  return context;
}
