import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { useToast } from '@/hooks/use-toast';

export function useMobileCapabilities() {
  const [isNative, setIsNative] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      return image.dataUrl;
    } catch (error) {
      console.error('Error taking photo:', error);
      toast({
        title: "Camera Error",
        description: "Failed to take photo. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const selectPhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      return image.dataUrl;
    } catch (error) {
      console.error('Error selecting photo:', error);
      toast({
        title: "Photo Selection Error",
        description: "Failed to select photo. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const getCurrentLocation = async () => {
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });

      const location = {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
      };

      setLocation(location);
      return location;
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: "Location Error",
        description: "Failed to get your location. Please enable location services.",
        variant: "destructive"
      });
      return null;
    }
  };

  const requestPermissions = async () => {
    try {
      if (isNative) {
        // Request camera permissions
        await Camera.requestPermissions();
        
        // Request location permissions
        await Geolocation.requestPermissions();
        
        toast({
          title: "Permissions Granted",
          description: "Camera and location permissions have been granted."
        });
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      toast({
        title: "Permission Error",
        description: "Some permissions were denied. App functionality may be limited.",
        variant: "destructive"
      });
    }
  };

  return {
    isNative,
    location,
    takePhoto,
    selectPhoto,
    getCurrentLocation,
    requestPermissions
  };
}