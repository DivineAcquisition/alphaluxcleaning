/**
 * Security Utilities for Multi-Domain Architecture
 * Handles HTTPS enforcement, HSTS, and HMAC token generation
 */

import { getCurrentDomain, shouldEnforceHTTPS } from './domainDetection';

/**
 * Security Headers Configuration
 */
export interface SecurityHeaders {
  'Strict-Transport-Security'?: string;
  'Content-Security-Policy'?: string;
  'X-Frame-Options'?: string;
  'X-Content-Type-Options'?: string;
  'Referrer-Policy'?: string;
  'Permissions-Policy'?: string;
}

/**
 * Get security headers based on current domain
 */
export function getSecurityHeaders(): SecurityHeaders {
  const currentDomain = getCurrentDomain();
  const headers: SecurityHeaders = {};

  // Apply HSTS for app and contractor domains
  if (currentDomain === 'app' || currentDomain === 'contractor') {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
    
    // Strict CSP for admin domains
    headers['Content-Security-Policy'] = [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src 'self' data: blob: https:`,
      `font-src 'self' data:`,
      `connect-src 'self' https://kqoezqzogleaaupjzxch.supabase.co wss://kqoezqzogleaaupjzxch.supabase.co`,
      `frame-ancestors 'none'`
    ].join('; ');
    
    headers['X-Frame-Options'] = 'DENY';
  } else if (currentDomain === 'book' || currentDomain === 'www') {
    // More permissive CSP for public booking domains
    headers['Content-Security-Policy'] = [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com`,
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      `img-src 'self' data: blob: https:`,
      `font-src 'self' data: https://fonts.gstatic.com`,
      `connect-src 'self' https://api.stripe.com https://kqoezqzogleaaupjzxch.supabase.co wss://kqoezqzogleaaupjzxch.supabase.co`,
      `frame-src https://js.stripe.com https://hooks.stripe.com`
    ].join('; ');
    
    headers['X-Frame-Options'] = 'SAMEORIGIN';
  }

  // Common security headers
  headers['X-Content-Type-Options'] = 'nosniff';
  headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
  headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()';

  return headers;
}

/**
 * Enforce HTTPS redirect if needed
 */
export function enforceHTTPS(): void {
  if (typeof window === 'undefined') return;
  
  if (shouldEnforceHTTPS() && window.location.protocol === 'http:') {
    window.location.replace(window.location.href.replace('http:', 'https:'));
  }
}

/**
 * HMAC Token System for One-Time Actions
 */
export interface HMACTokenData {
  action: 'accept_job' | 'decline_job' | 'confirm_timesheet' | 'approve_payout';
  userId: string;
  resourceId: string;
  expiresAt: number;
  timestamp: number;
}

/**
 * Generate HMAC token for secure one-time actions
 */
export async function generateHMACToken(data: Omit<HMACTokenData, 'timestamp' | 'expiresAt'>): Promise<string> {
  const timestamp = Date.now();
  const expiresAt = timestamp + (24 * 60 * 60 * 1000); // 24 hours
  
  const tokenData: HMACTokenData = {
    ...data,
    timestamp,
    expiresAt
  };
  
  // Encode the data
  const payload = btoa(JSON.stringify(tokenData));
  
  // In a real implementation, you'd use a server-side HMAC with a secret key
  // For now, we'll use a client-side hash (this should be server-side in production)
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${payload}.${signature}`;
}

/**
 * Verify HMAC token
 */
export async function verifyHMACToken(token: string): Promise<{ valid: boolean; data?: HMACTokenData; error?: string }> {
  try {
    const [payload, signature] = token.split('.');
    
    if (!payload || !signature) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    // Verify signature
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(payload);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid token signature' };
    }
    
    // Decode and validate data
    const data: HMACTokenData = JSON.parse(atob(payload));
    
    // Check expiration
    if (Date.now() > data.expiresAt) {
      return { valid: false, error: 'Token expired' };
    }
    
    return { valid: true, data };
  } catch (error) {
    return { valid: false, error: 'Token parsing error' };
  }
}

/**
 * Generate secure action URL with HMAC token
 */
export async function generateSecureActionUrl(
  baseUrl: string,
  action: HMACTokenData['action'],
  userId: string,
  resourceId: string
): Promise<string> {
  const token = await generateHMACToken({ action, userId, resourceId });
  return `${baseUrl}?token=${encodeURIComponent(token)}`;
}

/**
 * Robots.txt configuration based on domain
 */
export function getRobotsConfig(): string {
  const currentDomain = getCurrentDomain();
  
  switch (currentDomain) {
    case 'book':
    case 'www':
      // Allow indexing for public booking domains
      return `User-agent: *
Allow: /
Allow: /booking
Allow: /schedule-service
Allow: /commercial-estimates
Disallow: /admin
Disallow: /customer-portal-dashboard
Disallow: /subcontractor-portal
Disallow: /auth
Sitemap: https://${window.location.hostname}/sitemap.xml`;

    case 'app':
    case 'contractor':
    case 'api':
    case 'status':
    default:
      // Disallow indexing for admin and internal domains
      return `User-agent: *
Disallow: /`;
  }
}

/**
 * Security audit logging
 */
export interface SecurityEvent {
  event: 'hmac_token_generated' | 'hmac_token_verified' | 'https_redirect' | 'csp_violation' | 'unauthorized_access';
  userId?: string;
  details: Record<string, any>;
  timestamp: number;
  userAgent: string;
  ipAddress: string;
}

/**
 * Log security events for audit purposes
 */
export async function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp' | 'userAgent' | 'ipAddress'>): Promise<void> {
  const securityEvent: SecurityEvent = {
    ...event,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    ipAddress: '0.0.0.0' // Would be populated by server in production
  };
  
  // In production, this would send to a security logging service
  console.log('Security Event:', securityEvent);
  
  // Store in localStorage for development
  const existingLogs = localStorage.getItem('security_audit_log') || '[]';
  const logs = JSON.parse(existingLogs);
  logs.push(securityEvent);
  
  // Keep only last 100 events
  if (logs.length > 100) {
    logs.splice(0, logs.length - 100);
  }
  
  localStorage.setItem('security_audit_log', JSON.stringify(logs));
}
