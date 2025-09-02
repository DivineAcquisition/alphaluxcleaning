/**
 * Domain Detection Service for Multi-Domain Architecture
 * Detects current subdomain and provides domain-aware functionality
 */

export type DomainType = 'app' | 'contractor' | 'book' | 'www' | 'api' | 'status' | 'localhost';

export interface DomainConfig {
  subdomain: DomainType;
  allowedRoles: string[];
  defaultRedirectPath: string;
  isSecure: boolean;
}

const DOMAIN_CONFIGS: Record<DomainType, DomainConfig> = {
  app: {
    subdomain: 'app',
    allowedRoles: ['super_admin'],
    defaultRedirectPath: '/admin',
    isSecure: true
  },
  contractor: {
    subdomain: 'contractor', 
    allowedRoles: ['subcontractor'],
    defaultRedirectPath: '/subcontractor-portal',
    isSecure: true
  },
  book: {
    subdomain: 'book',
    allowedRoles: ['customer', 'client'],
    defaultRedirectPath: '/booking',
    isSecure: false // Public booking access
  },
  www: {
    subdomain: 'www',
    allowedRoles: ['customer', 'client'],
    defaultRedirectPath: '/',
    isSecure: false // Public website access
  },
  api: {
    subdomain: 'api',
    allowedRoles: [],
    defaultRedirectPath: '/api',
    isSecure: true
  },
  status: {
    subdomain: 'status',
    allowedRoles: [],
    defaultRedirectPath: '/status',
    isSecure: false
  },
  localhost: {
    subdomain: 'localhost',
    allowedRoles: ['super_admin', 'customer', 'client', 'subcontractor'],
    defaultRedirectPath: '/',
    isSecure: false // Development mode
  }
};

/**
 * Detects the current subdomain from window.location
 */
export function getCurrentDomain(): DomainType {
  if (typeof window === 'undefined') return 'localhost';
  
  const hostname = window.location.hostname;
  
  // Handle localhost and development
  if (hostname === 'localhost' || hostname.includes('127.0.0.1') || hostname.includes('sandbox.lovable.dev')) {
    return 'localhost';
  }
  
  // Extract subdomain from hostname
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    const subdomain = parts[0].toLowerCase();
    
    // Check if it's a valid subdomain we recognize
    if (subdomain in DOMAIN_CONFIGS) {
      return subdomain as DomainType;
    }
  }
  
  // Default to www for unrecognized domains
  return 'www';
}

/**
 * Gets the configuration for the current domain
 */
export function getCurrentDomainConfig(): DomainConfig {
  const currentDomain = getCurrentDomain();
  return DOMAIN_CONFIGS[currentDomain];
}

/**
 * Checks if a user role is allowed on the current domain
 */
export function isRoleAllowedOnCurrentDomain(userRole: string | null): boolean {
  const config = getCurrentDomainConfig();
  
  // Development mode allows all roles
  if (config.subdomain === 'localhost') {
    return true;
  }
  
  // Public domains allow access without authentication
  if (!config.isSecure) {
    return true;
  }
  
  // Check if user role is in allowed roles
  if (!userRole) {
    return false;
  }
  
  return config.allowedRoles.includes(userRole);
}

/**
 * Gets the default redirect path for a user based on their role and current domain
 */
export function getDefaultRedirectForUser(userRole: string | null): string {
  const currentDomain = getCurrentDomain();
  
  // If we're in development mode, redirect based on role
  if (currentDomain === 'localhost') {
    if (userRole === 'super_admin') return '/admin';
    if (userRole === 'subcontractor') return '/subcontractor-portal';
    return '/customer-portal-dashboard';
  }
  
  // For production domains, use the domain's default path
  const config = getCurrentDomainConfig();
  return config.defaultRedirectPath;
}

/**
 * Checks if the current domain requires HTTPS (for production security)
 */
export function shouldEnforceHTTPS(): boolean {
  const config = getCurrentDomainConfig();
  return config.isSecure && config.subdomain !== 'localhost';
}

/**
 * Gets the appropriate domain URL for a user role
 */
export function getDomainForRole(userRole: string): string {
  const baseUrl = window.location.protocol + '//' + window.location.host;
  
  // In development, stay on current domain
  if (getCurrentDomain() === 'localhost') {
    return baseUrl;
  }
  
  // In production, redirect to appropriate subdomain
  const baseDomain = window.location.hostname.split('.').slice(1).join('.');
  
  switch (userRole) {
    case 'super_admin':
      return `https://app.${baseDomain}`;
    case 'subcontractor':
      return `https://contractor.${baseDomain}`;
    default:
      return `https://www.${baseDomain}`;
  }
}

/**
 * Preserves booking functionality by ensuring booking routes are always accessible
 */
export function isBookingRoute(pathname: string): boolean {
  const bookingRoutes = [
    '/booking',
    '/legacy-booking', 
    '/new-booking',
    '/booking-confirmation',
    '/order-status',
    '/order-confirmation',
    '/payment-confirmation',
    '/payment-success',
    '/schedule-service',
    '/commercial-estimates'
  ];
  
  return bookingRoutes.some(route => pathname.startsWith(route));
}

/**
 * Checks if current route should bypass domain restrictions (for booking preservation)
 */
export function shouldBypassDomainRestrictions(pathname: string): boolean {
  // Always allow booking routes on any domain
  if (isBookingRoute(pathname)) {
    return true;
  }
  
  // Allow public routes
  const publicRoutes = ['/', '/auth', '/signup', '/oauth/callback'];
  if (publicRoutes.includes(pathname)) {
    return true;
  }
  
  return false;
}