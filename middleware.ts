// Edge enforcement of the strict domain architecture.
//
// Runs before the catch-all page renders, so the admin workspace is
// never even shipped to a browser on the public booking host (and vice
// versa). The routing rule itself lives in src/config/domains.ts and is
// shared with the client-side guard — this file only translates the
// decision into a Next response.
//
// Unknown hosts (localhost, *.vercel.app previews) are deliberately
// unenforced so dev and preview deployments still serve the whole app.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hostRole, resolveHostRoute } from './src/config/domains';

export const config = {
  matcher: [
    // Everything except Next internals and static assets.
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
};

export function middleware(request: NextRequest) {
  const host =
    request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const { pathname, search } = request.nextUrl;

  const decision = resolveHostRoute(host, pathname, search);

  if (decision.action === 'redirect' && decision.url) {
    const target = decision.url.startsWith('http')
      ? new URL(decision.url)
      : new URL(decision.url, request.url);
    // Retired-host moves are permanent; surface separation is a 307 so a
    // future config change isn't cached into visitors' browsers forever.
    const status = decision.reason === 'retired-host' ? 308 : 307;
    return NextResponse.redirect(target, status);
  }

  const response = NextResponse.next();
  if (hostRole(host) === 'admin') {
    // The workspace must never be indexed or framed.
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'same-origin');
  }
  return response;
}
