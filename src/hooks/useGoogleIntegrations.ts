import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GoogleCalendarStatus {
  configured: boolean;
  method?: 'service_account' | 'oauth' | 'missing' | 'invalid_service_account';
  calendar_id?: string;
}

export interface GooglePlacesStatus {
  configured: boolean;
  /**
   * Browser-safe Maps JS publishable key. Only present when `configured`
   * is true — otherwise the client should fall back to a plain input.
   */
  publishable_key: string | null;
}

export interface GoogleIntegrationsStatus {
  loading: boolean;
  calendar: GoogleCalendarStatus;
  places: GooglePlacesStatus;
}

const DEFAULT_STATUS: GoogleIntegrationsStatus = {
  loading: true,
  calendar: { configured: false },
  places: { configured: false, publishable_key: null },
};

// Cache the probe result across the whole SPA so every page doesn't
// hit the edge function on mount. Re-check after 5 minutes.
let cache: {
  at: number;
  value: Omit<GoogleIntegrationsStatus, 'loading'>;
} | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Fetches `get-google-integrations-config` once and returns whether
 * the Google Calendar and Google Places integrations are fully
 * configured. Any consumer that renders a Google-specific UI element
 * should gate on `configured === true` and fall back gracefully
 * otherwise — we never show a half-working Google feature.
 */
export function useGoogleIntegrations(): GoogleIntegrationsStatus {
  const [state, setState] = useState<GoogleIntegrationsStatus>(() => {
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
      return { loading: false, ...cache.value };
    }
    return DEFAULT_STATUS;
  });

  useEffect(() => {
    let cancelled = false;
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
      setState({ loading: false, ...cache.value });
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          'get-google-integrations-config',
          { body: {} },
        );
        if (error) {
          console.warn('[useGoogleIntegrations] probe failed:', error.message);
          if (!cancelled) {
            setState({
              loading: false,
              calendar: { configured: false },
              places: { configured: false, publishable_key: null },
            });
          }
          return;
        }
        const value = {
          calendar: {
            configured: !!data?.calendar?.configured,
            method: data?.calendar?.method,
            calendar_id: data?.calendar?.calendar_id,
          },
          places: {
            configured: !!data?.places?.configured,
            publishable_key: data?.places?.publishable_key ?? null,
          },
        };
        cache = { at: Date.now(), value };
        if (!cancelled) setState({ loading: false, ...value });
      } catch (err) {
        console.warn('[useGoogleIntegrations] probe threw:', err);
        if (!cancelled) {
          setState({
            loading: false,
            calendar: { configured: false },
            places: { configured: false, publishable_key: null },
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
