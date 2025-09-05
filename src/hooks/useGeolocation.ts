import { useState, useEffect } from 'react';

interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

interface GeolocationError {
  code: number;
  message: string;
}

export function useGeolocation() {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const geoError = { code: 0, message: 'Geolocation is not supported by this browser.' };
        setError(geoError);
        reject(geoError);
        return;
      }

      setLoading(true);
      setError(null);

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos: GeolocationPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          
          setLocation(pos);
          setLoading(false);
          resolve(pos);
        },
        (err) => {
          const geoError: GeolocationError = {
            code: err.code,
            message: getGeolocationErrorMessage(err.code)
          };
          
          setError(geoError);
          setLoading(false);
          reject(geoError);
        },
        options
      );
    });
  };

  const getGeolocationErrorMessage = (code: number): string => {
    switch (code) {
      case 1:
        return 'Location access denied by user.';
      case 2:
        return 'Location information unavailable.';
      case 3:
        return 'Location request timed out.';
      default:
        return 'An unknown error occurred while retrieving location.';
    }
  };

  const watchLocation = (): number | null => {
    if (!navigator.geolocation) {
      setError({ code: 0, message: 'Geolocation is not supported by this browser.' });
      return null;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // 1 minute
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const pos: GeolocationPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        
        setLocation(pos);
        setError(null);
      },
      (err) => {
        const geoError: GeolocationError = {
          code: err.code,
          message: getGeolocationErrorMessage(err.code)
        };
        
        setError(geoError);
      },
      options
    );

    return watchId;
  };

  const clearWatch = (watchId: number) => {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  };

  return {
    location,
    error,
    loading,
    requestLocation,
    watchLocation,
    clearWatch
  };
}