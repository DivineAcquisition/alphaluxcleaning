import { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';

interface PromoCountdown {
  timeRemaining: number; // in seconds
  isEligible: boolean;
  formattedTime: string;
  hoursLeft: number;
  minutesLeft: number;
  secondsLeft: number;
}

const PROMO_DURATION_HOURS = 24;
const STORAGE_KEY = 'promo_session_start';

/**
 * Hook to manage 24-hour promotional countdown timer
 * Tracks first visit and calculates time remaining for extra 5% discount
 */
export function usePromoCountdown(): PromoCountdown {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isEligible, setIsEligible] = useState<boolean>(false);

  useEffect(() => {
    // Get or set session start time
    const storedStart = localStorage.getItem(STORAGE_KEY);
    const startTime = storedStart ? new Date(storedStart) : new Date();
    
    if (!storedStart) {
      localStorage.setItem(STORAGE_KEY, startTime.toISOString());
    }

    const updateCountdown = () => {
      const now = new Date();
      const expiryTime = new Date(startTime.getTime() + PROMO_DURATION_HOURS * 60 * 60 * 1000);
      const secondsLeft = differenceInSeconds(expiryTime, now);

      if (secondsLeft > 0) {
        setTimeRemaining(secondsLeft);
        setIsEligible(true);
      } else {
        setTimeRemaining(0);
        setIsEligible(false);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const hoursLeft = Math.floor(timeRemaining / 3600);
  const minutesLeft = Math.floor((timeRemaining % 3600) / 60);
  const secondsLeft = timeRemaining % 60;

  const formattedTime = `${hoursLeft.toString().padStart(2, '0')}:${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;

  return {
    timeRemaining,
    isEligible,
    formattedTime,
    hoursLeft,
    minutesLeft,
    secondsLeft
  };
}
