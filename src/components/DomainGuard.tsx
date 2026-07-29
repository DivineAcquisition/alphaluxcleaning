import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { resolveHostRoute } from '@/config/domains';
import { BrandedLoader } from '@/components/BrandedLoader';

/**
 * Client-side half of the strict domain architecture.
 *
 * The edge middleware handles hard loads, but this app is a single-page
 * React Router SPA: an in-app <Link to="/admin"> on the public host, or
 * a stale bookmark restored from history, never touches the edge. This
 * guard re-runs the same shared rule on every navigation and bounces
 * the visitor to the correct origin, rendering nothing in the meantime
 * so the wrong surface can't flash on screen.
 */
export function DomainGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const decision = resolveHostRoute(
      window.location.hostname,
      location.pathname,
      location.search,
    );

    if (decision.action !== 'redirect' || !decision.url) {
      setRedirecting(false);
      return;
    }

    // Same-origin corrections (the admin host's "/" → "/admin") stay
    // client-side; cross-origin moves need a real navigation.
    if (decision.url.startsWith('/')) {
      navigate(decision.url, { replace: true });
      return;
    }

    setRedirecting(true);
    window.location.replace(`${decision.url}${window.location.hash}`);
  }, [location.pathname, location.search, navigate]);

  if (redirecting) return <BrandedLoader />;
  return <>{children}</>;
}
