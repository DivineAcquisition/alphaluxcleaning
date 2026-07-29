// Google Places address field for the admin booking form.
//
// Degrades to a plain text input whenever Places is unavailable — no
// key configured, quota exhausted, or the key not authorised for this
// host. A VA on a call must always be able to type an address, so the
// widget is an accelerator and never a gate.

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { loadGooglePlaces, parsePlace, type ResolvedAddress } from '@/lib/google-places-loader';
import { MapPin } from 'lucide-react';

export function AddressAutocomplete({
  value,
  onChange,
  onResolved,
  placeholder = 'Start typing the service address…',
}: {
  value: string;
  onChange: (v: string) => void;
  /** Fired when the VA picks a suggestion, with the split fields. */
  onResolved: (address: ResolvedAddress) => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  // Keep the latest callback without re-binding the Places listener.
  const resolvedRef = useRef(onResolved);
  resolvedRef.current = onResolved;

  useEffect(() => {
    let cancelled = false;
    let listener: google.maps.MapsEventListener | undefined;

    (async () => {
      const places = await loadGooglePlaces();
      if (cancelled || !places || !inputRef.current) return;

      const autocomplete = new places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['address_components', 'geometry', 'name', 'formatted_address'],
      });

      listener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place?.address_components) return;
        const parsed = parsePlace(place);
        resolvedRef.current(parsed);
        onChange(parsed.line1);
      });

      setReady(true);
    })();

    return () => {
      cancelled = true;
      listener?.remove();
    };
    // onChange is intentionally excluded — see resolvedRef above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        className="pl-9"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
      {ready && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wide text-muted-foreground">
          Google
        </span>
      )}
    </div>
  );
}
