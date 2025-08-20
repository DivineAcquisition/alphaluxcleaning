import { useState, useEffect, useCallback } from 'react';

interface DeviceCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  orientation: 'portrait' | 'landscape';
  isOnline: boolean;
}

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
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
  
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isNative, setIsNative] = useState(false);

  const checkCapabilities = useCallback(() => {
    const userAgent = navigator.userAgent;
    const width = window.innerWidth;
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || width < 768;
    const isTablet = /iPad|Android/i.test(userAgent) && width >= 768 && width < 1024;
    const isDesktop = !isMobile && !isTablet;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    const isOnline = navigator.onLine;
    
    // Check if running in native app context (Capacitor)
    const native = !!(window as any).Capacitor;

    setCapabilities({
      isMobile,
      isTablet,
      isDesktop,
      hasTouch,
      orientation,
      isOnline
    });
    
    setIsNative(native);
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      // Request location permission
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
          },
          (error) => {
            console.error('Location permission denied or error:', error);
          }
        );
      }

      // Request camera permission (if needed)
      if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (error) {
          console.error('Camera permission denied:', error);
        }
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  }, []);

  const getCurrentLocation = useCallback((): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setLocation(locationData);
          resolve(locationData);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }, []);

  const takePhoto = useCallback(async (): Promise<string> => {
    if (!('mediaDevices' in navigator) || !('getUserMedia' in navigator.mediaDevices)) {
      throw new Error('Camera not supported');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;

      return new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          stream.getTracks().forEach(track => track.stop());
          resolve(dataUrl);
        };

        video.onerror = () => {
          stream.getTracks().forEach(track => track.stop());
          reject(new Error('Failed to capture photo'));
        };

        video.srcObject = stream;
        video.play();
      });
    } catch (error) {
      console.error('Error taking photo:', error);
      throw error;
    }
  }, []);

  const selectPhoto = useCallback(async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(file);
      };

      input.click();
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

  return { 
    capabilities,
    isNative,
    location,
    requestPermissions,
    getCurrentLocation,
    takePhoto,
    selectPhoto
  };
};