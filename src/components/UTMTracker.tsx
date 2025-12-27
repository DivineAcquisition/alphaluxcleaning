import { useUTMTracking } from '@/hooks/useUTMTracking';

/**
 * Silent component that captures UTM parameters on every page.
 * Place this inside the Router to ensure it captures on initial load and navigation.
 */
export function UTMTracker() {
  // This hook captures UTMs automatically on mount and URL changes
  useUTMTracking();
  
  // This component renders nothing - it just captures data
  return null;
}
