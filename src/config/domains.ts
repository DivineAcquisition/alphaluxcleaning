// Host → surface map. Single source of truth for the strict domain
// architecture, shared by the edge middleware (middleware.ts), the
// client-side guard (components/DomainGuard.tsx) and the chat widget.
//
//   admin.alphaluxcleaning.com   → admin workspace ONLY
//   try.alphaluxcleaning.com     → public booking funnel ONLY
//   book.alphaluxclean.com       → retired, 301s to the booking host
//
// "Strict" means the separation is enforced in both directions: the
// admin workspace is unreachable from the public host (no more
// try.alphaluxcleaning.com/admin), and the public funnel is unreachable
// from the admin host. Internal tooling (dev-test harnesses, the email
// console, the webhook tester) counts as admin surface — those pages
// were previously served to anyone who guessed the URL on the public
// domain.
//
// Anything not listed here — localhost, *.vercel.app previews, a bare
// IP — is an UNKNOWN host and gets no enforcement at all, so local dev
// and preview deployments keep serving the whole app from one origin.

export type HostRole = 'admin' | 'booking' | 'unknown';

/** Surface a given path belongs to. */
export type PathSurface = 'admin' | 'public' | 'shared';

const ADMIN_HOSTS = [
  'admin.alphaluxcleaning.com',
  // Legacy brand spelling — kept so an old bookmark still lands in the
  // workspace instead of the booking funnel.
  'admin.alphaluxclean.com',
];

// try.novaracleaning.com is listed alongside the AlphaLux booking host:
// both point at this same funnel, and the canonical origin below is what
// outbound links (SMS, email, invoices) use.
const BOOKING_HOSTS = [
  'try.alphaluxcleaning.com',
  'try.novaracleaning.com',
];

/** Retired hosts → where they now live. Handled before role resolution. */
export const RETIRED_HOST_REDIRECTS: Record<string, string> = {
  'book.alphaluxclean.com': 'https://try.alphaluxcleaning.com',
};

export const ADMIN_ORIGIN =
  process.env.NEXT_PUBLIC_ADMIN_ORIGIN || 'https://admin.alphaluxcleaning.com';

export const BOOKING_ORIGIN =
  process.env.NEXT_PUBLIC_BOOKING_ORIGIN || 'https://try.alphaluxcleaning.com';

/** Entry path for each surface, used when a redirect has nowhere better to go. */
export const ADMIN_HOME = '/admin';
export const BOOKING_HOME = '/book/zip';

// Path prefixes that may only be served from the admin host. Ordered
// most-specific-first is unnecessary — matching is prefix-based on
// segment boundaries, so /admin never swallows /administrator.
const ADMIN_PATH_PREFIXES = [
  '/admin',
  '/admin-login',
  '/admin-auth-login',
  '/admin-otp-login',
  '/admin-status',
  '/admin-dashboard',
  // Internal tooling. Public visitors have no business reaching these.
  '/dev-test',
  '/demo-booking',
  '/booking-debug',
  '/email-tools',
  '/test-webhook',
  '/confirmation-preview',
];

// Served from every host: uptime probes and the Next API routes the
// booking funnel calls directly.
const SHARED_PATH_PREFIXES = ['/api', '/health'];

function normalizeHost(rawHost: string | null | undefined): string {
  return String(rawHost || '')
    .toLowerCase()
    .trim()
    .split(':')[0] // strip :port
    .replace(/^www\./, '')
    .replace(/\.$/, '');
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  if (pathname === prefix) return true;
  return pathname.startsWith(`${prefix}/`);
}

/** Which surface a hostname belongs to. Unknown hosts are unenforced. */
export function hostRole(rawHost: string | null | undefined): HostRole {
  const host = normalizeHost(rawHost);
  if (!host) return 'unknown';
  if (ADMIN_HOSTS.includes(host)) return 'admin';
  if (BOOKING_HOSTS.includes(host)) return 'booking';
  return 'unknown';
}

/** Target origin for a retired host, or null when the host is still live. */
export function retiredHostTarget(rawHost: string | null | undefined): string | null {
  return RETIRED_HOST_REDIRECTS[normalizeHost(rawHost)] ?? null;
}

/** Which surface a path belongs to. */
export function pathSurface(pathname: string): PathSurface {
  const path = pathname.toLowerCase();
  if (SHARED_PATH_PREFIXES.some((p) => matchesPrefix(path, p))) return 'shared';
  if (ADMIN_PATH_PREFIXES.some((p) => matchesPrefix(path, p))) return 'admin';
  return 'public';
}

export interface HostRouteDecision {
  /** 'allow' — serve as-is. 'redirect' — send the visitor to `url`. */
  action: 'allow' | 'redirect';
  url?: string;
  reason?: string;
}

/**
 * The one routing rule, shared by the edge middleware and the client
 * guard so a client-side navigation can't slip past what the edge
 * enforces on a hard load.
 */
export function resolveHostRoute(
  rawHost: string | null | undefined,
  pathname: string,
  search = '',
): HostRouteDecision {
  const retired = retiredHostTarget(rawHost);
  if (retired) {
    return {
      action: 'redirect',
      url: `${retired}${pathname}${search}`,
      reason: 'retired-host',
    };
  }

  const role = hostRole(rawHost);
  if (role === 'unknown') return { action: 'allow' };

  const surface = pathSurface(pathname);
  if (surface === 'shared') return { action: 'allow' };

  if (role === 'admin') {
    if (surface === 'admin') return { action: 'allow' };
    // The admin host's root is the workspace, not the booking funnel.
    if (pathname === '/' || pathname === '') {
      return { action: 'redirect', url: ADMIN_HOME, reason: 'admin-root' };
    }
    return {
      action: 'redirect',
      url: `${BOOKING_ORIGIN}${pathname}${search}`,
      reason: 'public-path-on-admin-host',
    };
  }

  // role === 'booking'
  if (surface === 'public') return { action: 'allow' };
  return {
    action: 'redirect',
    url: `${ADMIN_ORIGIN}${pathname}${search}`,
    reason: 'admin-path-on-public-host',
  };
}

/** True when the chat widget (public funnel only) should render. */
export function chatWidgetAllowed(
  rawHost: string | null | undefined,
  pathname: string,
): boolean {
  return hostRole(rawHost) === 'booking' && pathSurface(pathname) === 'public';
}
