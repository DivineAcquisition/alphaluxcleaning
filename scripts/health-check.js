#!/usr/bin/env node

/**
 * Domain separation health check.
 *
 * Verifies the live deployment enforces the rule in src/config/domains.ts:
 * the admin host serves the workspace and bounces everything else, and the
 * public booking host serves the funnel and bounces admin surface. Each
 * case asserts a status code and, for redirects, where it points.
 *
 * Usage:
 *   npm run health-check                       # against production
 *   BASE_URL=http://localhost:3000 npm run health-check
 *
 * With BASE_URL set, requests go to that origin with the host name sent
 * as a Host header, so the same matrix can be run against `next start`
 * or a preview deployment before DNS is cut over.
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const ADMIN_HOST = process.env.ADMIN_HOST || 'admin.alphaluxcleaning.com';
const BOOKING_HOST = process.env.BOOKING_HOST || 'try.alphaluxcleaning.com';
const RETIRED_HOST = 'book.alphaluxclean.com';
const BASE_URL = process.env.BASE_URL || '';

/** [host, path, expected status, expected Location substring or null] */
const CASES = [
  ['admin surface reachable on admin host', ADMIN_HOST, '/admin', [200, 401, 403], null],
  ['admin login reachable on admin host', ADMIN_HOST, '/admin-login', [200], null],
  ['admin host root enters the workspace', ADMIN_HOST, '/', [307, 308], '/admin'],
  ['booking funnel bounced off admin host', ADMIN_HOST, '/book/zip', [307, 308], BOOKING_HOST],
  ['health probe served on admin host', ADMIN_HOST, '/health/admin', [200], null],

  ['booking funnel reachable on public host', BOOKING_HOST, '/book/zip', [200], null],
  ['admin bounced off public host', BOOKING_HOST, '/admin', [307, 308], ADMIN_HOST],
  ['admin login bounced off public host', BOOKING_HOST, '/admin-login', [307, 308], ADMIN_HOST],
  ['internal tooling bounced off public host', BOOKING_HOST, '/dev-test', [307, 308], ADMIN_HOST],

  ['retired host still forwards', RETIRED_HOST, '/book/offer', [301, 307, 308], BOOKING_HOST],
];

function request(host, path) {
  return new Promise((resolve) => {
    const target = BASE_URL ? new URL(path, BASE_URL) : new URL(path, `https://${host}`);
    const client = target.protocol === 'https:' ? https : http;

    const req = client.request(
      target,
      {
        method: 'GET',
        timeout: 10000,
        headers: { Host: host, 'User-Agent': 'alphalux-domain-health-check/2.0' },
      },
      (res) => {
        res.resume(); // discard the body, we only need the head
        resolve({ statusCode: res.statusCode, location: res.headers.location || '' });
      },
    );

    req.on('error', (error) => resolve({ error: error.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'request timeout' });
    });
    req.end();
  });
}

async function run() {
  console.log('AlphaLux — domain separation health check');
  console.log(`Target: ${BASE_URL || 'production DNS'}\n`);

  const failures = [];

  for (const [label, host, path, expectedStatuses, expectedLocation] of CASES) {
    const res = await request(host, path);

    if (res.error) {
      failures.push(`${label} — request failed: ${res.error}`);
      console.log(`FAIL  ${label}\n      ${host}${path} — ${res.error}`);
      continue;
    }

    const statusOk = expectedStatuses.includes(res.statusCode);
    const locationOk = !expectedLocation || res.location.includes(expectedLocation);

    if (statusOk && locationOk) {
      const where = res.location ? ` -> ${res.location}` : '';
      console.log(`ok    ${label}\n      ${host}${path} ${res.statusCode}${where}`);
      continue;
    }

    const detail = !statusOk
      ? `expected ${expectedStatuses.join('/')}, got ${res.statusCode}`
      : `expected redirect to ${expectedLocation}, got ${res.location || '(none)'}`;
    failures.push(`${label} — ${detail}`);
    console.log(`FAIL  ${label}\n      ${host}${path} — ${detail}`);
  }

  console.log(`\n${CASES.length - failures.length}/${CASES.length} checks passed`);
  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  process.exit(0);
}

if (require.main === module) {
  run().catch((error) => {
    console.error('Health check crashed:', error);
    process.exit(1);
  });
}

module.exports = { run };
