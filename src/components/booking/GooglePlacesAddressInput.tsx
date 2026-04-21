import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

/**
 * Parsed components we hand back to the caller when a customer picks
 * a suggestion. All fields are best-effort — the street line is the
 * primary contract; the rest are convenience fillers for the city /
 * state / zip inputs that live next to this component.
 */
export interface ParsedPlace {
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  lat: number | null;
  lng: number | null;
  formattedAddress: string;
}

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (parsed: ParsedPlace) => void;
  /** Browser-safe Maps JS key; publishable and referrer-restricted. */
  publishableKey: string;
  placeholder?: string;
  required?: boolean;
}

declare global {
  interface Window {
    google?: any;
    __alxGoogleMapsLoader?: Promise<void>;
  }
}

function loadMapsScript(key: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();
  if (window.__alxGoogleMapsLoader) return window.__alxGoogleMapsLoader;

  window.__alxGoogleMapsLoader = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-alx-maps-loader]',
    );
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(new Error('Failed to load Google Maps JS')),
      );
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      key,
    )}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.dataset.alxMapsLoader = 'true';
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('Failed to load Google Maps JS'));
    document.head.appendChild(script);
  });

  return window.__alxGoogleMapsLoader;
}

function extractComponent(
  components: any[],
  type: string,
  useShort = false,
): string {
  const match = components.find((c) => c.types.includes(type));
  if (!match) return '';
  return useShort ? match.short_name : match.long_name;
}

export function GooglePlacesAddressInput({
  id,
  value,
  onChange,
  onPlaceSelected,
  publishableKey,
  placeholder,
  required,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadMapsScript(publishableKey)
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((err) => {
        console.warn('[GooglePlacesAddressInput]', err);
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [publishableKey]);

  useEffect(() => {
    if (!ready || !inputRef.current || autocompleteRef.current) return;
    const { Autocomplete } = window.google.maps.places;
    const autocomplete = new Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'us' },
      fields: ['address_components', 'formatted_address', 'geometry'],
      types: ['address'],
    });
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place?.address_components) return;

      const streetNumber = extractComponent(
        place.address_components,
        'street_number',
      );
      const route = extractComponent(place.address_components, 'route');
      const addressLine1 = [streetNumber, route].filter(Boolean).join(' ');
      const city =
        extractComponent(place.address_components, 'locality') ||
        extractComponent(place.address_components, 'sublocality') ||
        extractComponent(place.address_components, 'postal_town');
      const stateCode = extractComponent(
        place.address_components,
        'administrative_area_level_1',
        true,
      );
      const zipCode = extractComponent(
        place.address_components,
        'postal_code',
      );
      const lat = place.geometry?.location?.lat?.() ?? null;
      const lng = place.geometry?.location?.lng?.() ?? null;

      const parsed: ParsedPlace = {
        addressLine1,
        city,
        state: stateCode,
        zipCode,
        lat,
        lng,
        formattedAddress: place.formatted_address || '',
      };
      onChange(addressLine1 || place.formatted_address || '');
      onPlaceSelected(parsed);
    });
    autocompleteRef.current = autocomplete;
  }, [ready, onChange, onPlaceSelected]);

  // If the script fails to load for any reason, the parent already
  // renders the plain <Input>. We still render our own input here so
  // the user can type manually while the script boots.
  return (
    <Input
      id={id}
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={
        placeholder ||
        (ready
          ? 'Start typing an address…'
          : loadFailed
            ? '123 Main Street'
            : 'Loading address search…')
      }
      required={required}
      autoComplete="street-address"
    />
  );
}
