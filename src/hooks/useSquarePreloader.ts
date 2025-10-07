import { useEffect } from 'react';
import { squarePromise } from '@/lib/square';

/**
 * Hook to preload Square in the background
 * This helps reduce loading times when payment forms are needed
 */
export const useSquarePreloader = () => {
  useEffect(() => {
    const preload = async () => {
      try {
        await squarePromise;
        console.log('✅ Square preloaded successfully');
      } catch (error) {
        console.log('⚠️ Square preload failed, will retry when needed:', error);
      }
    };

    preload();
  }, []);
};
