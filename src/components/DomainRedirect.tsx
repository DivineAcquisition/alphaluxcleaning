import { useEffect } from 'react';

/**
 * Client-side safety net for the retired book.alphaluxclean.com domain.
 *
 * The real redirect happens at the edge (next.config.js `redirects()`),
 * which is what visitors actually hit. This only fires if a client
 * somehow renders the app on the old host — a cached HTML shell, a
 * service worker, or a native WebView pinned to the old origin — and
 * sends them to the same place, preserving path + query.
 */

const RETIRED_HOSTS = ['book.alphaluxclean.com', 'www.book.alphaluxclean.com'];
const CANONICAL_ORIGIN = 'https://try.alphaluxcleaning.com';

export function DomainRedirect({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!RETIRED_HOSTS.includes(window.location.hostname.toLowerCase())) return;
    const { pathname, search, hash } = window.location;
    window.location.replace(`${CANONICAL_ORIGIN}${pathname}${search}${hash}`);
  }, []);

  return <>{children}</>;
}
