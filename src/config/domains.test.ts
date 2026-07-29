// Pins the strict domain architecture described in README-Domains.md.
//
// Both the edge middleware and the client guard call resolveHostRoute,
// so these cases cover every enforcement point at once. Run with:
// deno task test

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { chatWidgetAllowed, hostRole, pathSurface, resolveHostRoute } from './domains.ts';

const ADMIN = 'admin.alphaluxcleaning.com';
const BOOKING = 'try.alphaluxcleaning.com';

Deno.test('hosts resolve to their surface, www and port stripped', () => {
  assertEquals(hostRole(ADMIN), 'admin');
  assertEquals(hostRole(`www.${ADMIN}`), 'admin');
  assertEquals(hostRole('admin.alphaluxclean.com'), 'admin');
  assertEquals(hostRole(BOOKING), 'booking');
  assertEquals(hostRole('try.novaracleaning.com'), 'booking');
  assertEquals(hostRole('localhost:3000'), 'unknown');
  assertEquals(hostRole('preview-abc.vercel.app'), 'unknown');
  assertEquals(hostRole(''), 'unknown');
});

Deno.test('internal tooling counts as admin surface', () => {
  for (const path of [
    '/admin', '/admin/activity', '/admin-login', '/admin-auth-login',
    '/dev-test', '/dev-test/payments', '/email-tools', '/booking-debug',
    '/test-webhook', '/demo-booking', '/confirmation-preview',
  ]) {
    assertEquals(pathSurface(path), 'admin', path);
  }
});

Deno.test('customer paths are public and probes are shared', () => {
  for (const path of ['/book/zip', '/pay/abc', '/careers', '/ref/CODE', '/']) {
    assertEquals(pathSurface(path), 'public', path);
  }
  for (const path of ['/api/create-job', '/health/admin']) {
    assertEquals(pathSurface(path), 'shared', path);
  }
});

Deno.test('prefix matching respects segment boundaries', () => {
  // /admin must not swallow a public path that merely starts with it.
  assertEquals(pathSurface('/administrator-signup'), 'public');
  assertEquals(pathSurface('/admin'), 'admin');
  assertEquals(pathSurface('/admin/leads'), 'admin');
});

Deno.test('admin host serves the workspace and bounces the funnel', () => {
  assertEquals(resolveHostRoute(ADMIN, '/admin/activity').action, 'allow');
  assertEquals(resolveHostRoute(ADMIN, '/admin-login').action, 'allow');
  assertEquals(resolveHostRoute(ADMIN, '/health/admin').action, 'allow');

  assertEquals(resolveHostRoute(ADMIN, '/'), {
    action: 'redirect', url: '/admin', reason: 'admin-root',
  });

  const bounced = resolveHostRoute(ADMIN, '/book/zip', '?promo=ALC2026');
  assertEquals(bounced.action, 'redirect');
  assertEquals(bounced.url, `https://${BOOKING}/book/zip?promo=ALC2026`);
});

Deno.test('booking host serves the funnel and bounces admin surface', () => {
  assertEquals(resolveHostRoute(BOOKING, '/book/zip').action, 'allow');
  assertEquals(resolveHostRoute(BOOKING, '/api/create-job').action, 'allow');

  const bounced = resolveHostRoute(BOOKING, '/admin/activity', '?tab=sms');
  assertEquals(bounced.action, 'redirect');
  assertEquals(bounced.url, `https://${ADMIN}/admin/activity?tab=sms`);

  // Internal tooling must not be reachable from the public domain.
  assertEquals(resolveHostRoute(BOOKING, '/dev-test').action, 'redirect');
});

Deno.test('the retired host forwards every path, query intact', () => {
  const decision = resolveHostRoute('book.alphaluxclean.com', '/book/offer', '?promo=X');
  assertEquals(decision.reason, 'retired-host');
  assertEquals(decision.url, `https://${BOOKING}/book/offer?promo=X`);
});

Deno.test('unknown hosts are never enforced', () => {
  for (const host of ['localhost', 'preview-abc.vercel.app', '127.0.0.1:3000']) {
    assertEquals(resolveHostRoute(host, '/admin').action, 'allow', host);
    assertEquals(resolveHostRoute(host, '/book/zip').action, 'allow', host);
  }
});

Deno.test('chat widget loads on the public funnel only', () => {
  assertEquals(chatWidgetAllowed(BOOKING, '/book/zip'), true);
  assertEquals(chatWidgetAllowed(BOOKING, '/dev-test'), false);
  assertEquals(chatWidgetAllowed(ADMIN, '/admin'), false);
  assertEquals(chatWidgetAllowed('localhost', '/book/zip'), false);
});
