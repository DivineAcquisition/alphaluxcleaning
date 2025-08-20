import { useState, useEffect, useCallback } from 'react';

interface DeviceCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  orientation: 'portrait' | 'landscape';
  isOnline: boolean;
}

export const useMobileCapabilities = () => {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    hasTouch: false,
    orientation: 'landscape',
    isOnline: true
  });

  const checkCapabilities = useCallback(() => {
    const userAgent = navigator.userAgent;
    const width = window.innerWidth;
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || width < 768;
    const isTablet = /iPad|Android/i.test(userAgent) && width >= 768 && width < 1024;
    const isDesktop = !isMobile && !isTablet;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    const isOnline = navigator.onLine;

    setCapabilities({
      isMobile,
      isTablet,
      isDesktop,
      hasTouch,
      orientation,
      isOnline
    });
  }, []);

  useEffect(() => {
    checkCapabilities();
    window.addEventListener('resize', checkCapabilities);
    window.addEventListener('orientationchange', checkCapabilities);
    window.addEventListener('online', checkCapabilities);
    window.addEventListener('offline', checkCapabilities);

    return () => {
      window.removeEventListener('resize', checkCapabilities);
      window.removeEventListener('orientationchange', checkCapabilities);
      window.removeEventListener('online', checkCapabilities);
      window.removeEventListener('offline', checkCapabilities);
    };
  }, [checkCapabilities]);

  return { capabilities };
};