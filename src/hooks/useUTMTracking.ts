import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

// Storage keys
const STORAGE_KEYS = {
  UTM_SOURCE: 'utm_source',
  UTM_MEDIUM: 'utm_medium',
  UTM_CAMPAIGN: 'utm_campaign',
  UTM_CONTENT: 'utm_content',
  UTM_TERM: 'utm_term',
  LANDING_PAGE: 'landing_page',
  REFERRER: 'referrer',
  FIRST_VISIT_TIMESTAMP: 'first_visit_timestamp',
} as const;

export interface TrackingData {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  landing_page: string | null;
  referrer: string | null;
  first_visit_timestamp: string | null;
}

/**
 * Captures UTM parameters from the URL and stores them in localStorage.
 * Also captures landing page, referrer, and first visit timestamp.
 * 
 * Usage:
 * - Call useUTMTracking() in your App component to auto-capture on any page
 * - Use getTrackingData() to retrieve all stored tracking data for form submissions
 */
export function useUTMTracking() {
  const location = useLocation();

  // Capture UTMs and session data on mount and URL changes
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    // Capture UTM parameters if present in URL
    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');
    const utmContent = searchParams.get('utm_content');
    const utmTerm = searchParams.get('utm_term');

    // Only store UTMs if they exist in the current URL (don't overwrite with empty)
    if (utmSource) localStorage.setItem(STORAGE_KEYS.UTM_SOURCE, utmSource);
    if (utmMedium) localStorage.setItem(STORAGE_KEYS.UTM_MEDIUM, utmMedium);
    if (utmCampaign) localStorage.setItem(STORAGE_KEYS.UTM_CAMPAIGN, utmCampaign);
    if (utmContent) localStorage.setItem(STORAGE_KEYS.UTM_CONTENT, utmContent);
    if (utmTerm) localStorage.setItem(STORAGE_KEYS.UTM_TERM, utmTerm);

    // Capture landing page only if not already set (first page visit)
    if (!localStorage.getItem(STORAGE_KEYS.LANDING_PAGE)) {
      localStorage.setItem(STORAGE_KEYS.LANDING_PAGE, window.location.href);
    }

    // Capture referrer only if not already set
    if (!localStorage.getItem(STORAGE_KEYS.REFERRER)) {
      localStorage.setItem(STORAGE_KEYS.REFERRER, document.referrer || '');
    }

    // Capture timestamp only if not already set (first visit)
    if (!localStorage.getItem(STORAGE_KEYS.FIRST_VISIT_TIMESTAMP)) {
      localStorage.setItem(STORAGE_KEYS.FIRST_VISIT_TIMESTAMP, new Date().toISOString());
    }

    console.log('[UTM Tracking] Captured tracking data:', {
      hasUtmParams: !!(utmSource || utmMedium || utmCampaign || utmContent || utmTerm),
      landingPage: localStorage.getItem(STORAGE_KEYS.LANDING_PAGE),
    });
  }, [location.search]);

  /**
   * Returns all stored tracking data for inclusion in form submissions
   */
  const getTrackingData = useCallback((): TrackingData => {
    return {
      utm_source: localStorage.getItem(STORAGE_KEYS.UTM_SOURCE),
      utm_medium: localStorage.getItem(STORAGE_KEYS.UTM_MEDIUM),
      utm_campaign: localStorage.getItem(STORAGE_KEYS.UTM_CAMPAIGN),
      utm_content: localStorage.getItem(STORAGE_KEYS.UTM_CONTENT),
      utm_term: localStorage.getItem(STORAGE_KEYS.UTM_TERM),
      landing_page: localStorage.getItem(STORAGE_KEYS.LANDING_PAGE),
      referrer: localStorage.getItem(STORAGE_KEYS.REFERRER),
      first_visit_timestamp: localStorage.getItem(STORAGE_KEYS.FIRST_VISIT_TIMESTAMP),
    };
  }, []);

  /**
   * Clears all stored tracking data (useful after conversion)
   */
  const clearTrackingData = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('[UTM Tracking] Cleared all tracking data');
  }, []);

  return {
    getTrackingData,
    clearTrackingData,
  };
}

/**
 * Standalone function to get tracking data without using the hook
 * Useful for edge functions or non-React contexts
 */
export function getStoredTrackingData(): TrackingData {
  return {
    utm_source: localStorage.getItem(STORAGE_KEYS.UTM_SOURCE),
    utm_medium: localStorage.getItem(STORAGE_KEYS.UTM_MEDIUM),
    utm_campaign: localStorage.getItem(STORAGE_KEYS.UTM_CAMPAIGN),
    utm_content: localStorage.getItem(STORAGE_KEYS.UTM_CONTENT),
    utm_term: localStorage.getItem(STORAGE_KEYS.UTM_TERM),
    landing_page: localStorage.getItem(STORAGE_KEYS.LANDING_PAGE),
    referrer: localStorage.getItem(STORAGE_KEYS.REFERRER),
    first_visit_timestamp: localStorage.getItem(STORAGE_KEYS.FIRST_VISIT_TIMESTAMP),
  };
}
