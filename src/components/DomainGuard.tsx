import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { resolveHostRoute } from '@/config/domains';
import { BrandedLoader } from '@/components/BrandedLoader';

/**
 * Client-side half of the strict domain architecture.
 *
 * The edge middleware handles hard loads, but this app is a single-page
 * React Router SPA: an in-app <Link to="/admin"> on the public host, or
 * a stale bookmark restored from history, never touches the edge. This
 * guard re-runs the same shared rule on every navigation.
 *
 * The decision is made during render, not in an effect, so a route that
 * belongs to the wrong surface never mounts. That matters for same-host
 * corrections in particular: "/" on the admin host must become /admin
 * before the SPA's own "/" route redirects it into the booking funnel.
 */
export function DomainGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const host = typeof window === 'undefined' ? '' : window.location.hostname;
  const decision = resolveHostRoute(host, location.pathname, location.search);

  const externalTarget =
    decision.action === 'redirect' && decision.url && !decision.url.startsWith('/')
      ? decision.url
      : null;

  useEffect(() => {
    if (!externalTarget) return;
    window.location.replace(`${externalTarget}${window.location.hash}`);
  }, [externalTarget]);

  if (externalTarget) return <BrandedLoader />;

  if (decision.action === 'redirect' && decision.url) {
    return <Navigate to={decision.url} replace />;
  }

  return <>{children}</>;
}
