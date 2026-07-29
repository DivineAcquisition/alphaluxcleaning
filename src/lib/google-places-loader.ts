// Google Maps JS + Places loader.
//
// Ported from Novara. Fetches the key from the `google-places-key` edge
// function so it never enters the client bundle, then injects the Maps
// script exactly once per page. Concurrent callers share one promise so
// two address fields mounting together don't race and load it twice —
// Places is billed per script load.
//
// Never throws. Returns null when the key is missing or Google rejects
// it, so the caller falls back to a plain typeable input rather than
// blocking a VA mid-call over an address widget.

import { supabase } from '@/integrations/supabase/client';

// `window.google` is already declared as `any` by the legacy
// GooglePlacesAddressInput component; redeclaring it with a stricter
// type is a compile error, so this file reads it through a local cast.
declare global {
  interface Window {
    __alxPlacesPromise?: Promise<typeof google.maps.places | null>;
    __alxPlacesAuthFailed?: boolean;
  }
}

const mapsGlobal = () =>
  (window as unknown as { google?: typeof google }).google;

const SCRIPT_ID = 'alx-google-maps-js';

export function googlePlacesAuthFailed(): boolean {
  return typeof window !== 'undefined' && window.__alxPlacesAuthFailed === true;
}

export function loadGooglePlaces(): Promise<typeof google.maps.places | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.__alxPlacesPromise) return window.__alxPlacesPromise;

  window.__alxPlacesPromise = (async () => {
    // Defining gm_authFailure BEFORE the script loads suppresses
    // Google's full-page "can't load Google Maps correctly" modal. A
    // rejected key should degrade to a text input, not shout at a VA
    // who is on the phone with a customer.
    (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
      window.__alxPlacesAuthFailed = true;
      console.warn(
        '[google-places] Key rejected. Add this host to the key\'s HTTP referrer ' +
        'restrictions in Google Cloud Console.',
      );
    };

    if (mapsGlobal()?.maps?.places) return mapsGlobal()!.maps.places;

    let apiKey = '';
    try {
      const { data } = await supabase.functions.invoke('google-places-key', { body: {} });
      apiKey = String(data?.apiKey || '');
    } catch {
      return null;
    }
    if (!apiKey) return null;

    const existing = document.getElementById(SCRIPT_ID);
    if (!existing) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.async = true;
      script.defer = true;
      script.src =
        `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
        '&libraries=places&loading=async';
      document.head.appendChild(script);
    }

    // Poll rather than rely on a global callback: the script may already
    // be in flight from another mount.
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      if (window.__alxPlacesAuthFailed) return null;
      if (mapsGlobal()?.maps?.places) return mapsGlobal()!.maps.places;
      await new Promise((r) => setTimeout(r, 100));
    }
    return null;
  })();

  return window.__alxPlacesPromise;
}

export interface ResolvedAddress {
  line1: string;
  city: string;
  state: string;
  zipCode: string;
  lat?: number;
  lng?: number;
}

/** Flatten a Places result into the fields the booking form stores. */
export function parsePlace(
  place: google.maps.places.PlaceResult,
): ResolvedAddress {
  const get = (type: string, short = false) => {
    const c = place.address_components?.find((x) => x.types.includes(type));
    return (short ? c?.short_name : c?.long_name) || '';
  };
  const line1 = [get('street_number'), get('route')].filter(Boolean).join(' ');
  return {
    line1: line1 || place.name || '',
    city: get('locality') || get('sublocality') || get('postal_town'),
    state: get('administrative_area_level_1', true),
    zipCode: get('postal_code'),
    lat: place.geometry?.location?.lat(),
    lng: place.geometry?.location?.lng(),
  };
}
