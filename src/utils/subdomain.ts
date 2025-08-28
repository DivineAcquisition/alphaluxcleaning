/**
 * Subdomain detection and routing utilities
 */

export type SubdomainType = 
  | 'admin' 
  | 'portal' 
  | 'cleaners' 
  | 'subcon' 
  | 'office' 
  | 'book' 
  | 'try' 
  | 'connect' 
  | 'jobs' 
  | 'reports' 
  | 'analytics' 
  | 'referrals' 
  | 'api' 
  | 'main';

export interface SubdomainConfig {
  type: SubdomainType;
  allowedRoles: string[];
  defaultRoute: string;
  redirectUrl?: string;
  isPublic?: boolean;
}

export const SUBDOMAIN_CONFIG: Record<SubdomainType, SubdomainConfig> = {
  admin: {
    type: 'admin',
    allowedRoles: ['super_admin', 'admin'],
    defaultRoute: '/admin',
    redirectUrl: 'https://admin.bayareacleaningpros.com'
  },
  portal: {
    type: 'portal',
    allowedRoles: ['customer'],
    defaultRoute: '/customer-portal-dashboard',
    redirectUrl: 'https://portal.bayareacleaningpros.com'
  },
  cleaners: {
    type: 'cleaners',
    allowedRoles: ['subcontractor'],
    defaultRoute: '/subcontractor-dashboard',
    redirectUrl: 'https://cleaners.bayareacleaningpros.com'
  },
  subcon: {
    type: 'subcon',
    allowedRoles: ['super_admin', 'admin'],
    defaultRoute: '/subcontractor-management',
    redirectUrl: 'https://subcon.bayareacleaningpros.com'
  },
  office: {
    type: 'office',
    allowedRoles: ['office_manager', 'super_admin', 'admin'],
    defaultRoute: '/office-manager-dashboard',
    redirectUrl: 'https://office.bayareacleaningpros.com'
  },
  book: {
    type: 'book',
    allowedRoles: ['customer'],
    defaultRoute: '/booking',
    redirectUrl: 'https://book.bayareacleaningpros.com',
    isPublic: true
  },
  try: {
    type: 'try',
    allowedRoles: [],
    defaultRoute: '/demo',
    redirectUrl: 'https://try.bayareacleaningpros.com',
    isPublic: true
  },
  connect: {
    type: 'connect',
    allowedRoles: ['super_admin', 'admin'],
    defaultRoute: '/integrations',
    redirectUrl: 'https://connect.bayareacleaningpros.com'
  },
  jobs: {
    type: 'jobs',
    allowedRoles: ['super_admin', 'admin', 'office_manager'],
    defaultRoute: '/job-assignments',
    redirectUrl: 'https://jobs.bayareacleaningpros.com'
  },
  reports: {
    type: 'reports',
    allowedRoles: ['super_admin', 'admin', 'office_manager'],
    defaultRoute: '/reports',
    redirectUrl: 'https://reports.bayareacleaningpros.com'
  },
  analytics: {
    type: 'analytics',
    allowedRoles: ['super_admin', 'admin'],
    defaultRoute: '/analytics',
    redirectUrl: 'https://analytics.bayareacleaningpros.com'
  },
  referrals: {
    type: 'referrals',
    allowedRoles: ['customer', 'super_admin', 'admin'],
    defaultRoute: '/referrals',
    redirectUrl: 'https://referrals.bayareacleaningpros.com'
  },
  api: {
    type: 'api',
    allowedRoles: [],
    defaultRoute: '/api-docs',
    redirectUrl: 'https://api.bayareacleaningpros.com',
    isPublic: true
  },
  main: {
    type: 'main',
    allowedRoles: [],
    defaultRoute: '/',
    isPublic: true
  }
};

/**
 * Get the current subdomain type from hostname
 */
export function getCurrentSubdomain(): SubdomainType {
  if (typeof window === 'undefined') return 'main';
  
  const hostname = window.location.hostname;
  
  // Handle localhost and IP addresses
  if (hostname === 'localhost' || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    return 'main';
  }
  
  // Extract subdomain
  const parts = hostname.split('.');
  if (parts.length < 3) return 'main';
  
  const subdomain = parts[0];
  
  // Map subdomain to type
  switch (subdomain) {
    case 'admin': return 'admin';
    case 'portal': return 'portal';
    case 'cleaners': return 'cleaners';
    case 'subcon': return 'subcon';
    case 'office': return 'office';
    case 'book': return 'book';
    case 'try': return 'try';
    case 'connect': return 'connect';
    case 'jobs': return 'jobs';
    case 'reports': return 'reports';
    case 'analytics': return 'analytics';
    case 'referrals': return 'referrals';
    case 'api': return 'api';
    case 'www': return 'main';
    default: return 'main';
  }
}

/**
 * Check if current user role is allowed on current subdomain
 */
export function isRoleAllowedOnSubdomain(userRole: string | null, subdomain?: SubdomainType): boolean {
  const currentSubdomain = subdomain || getCurrentSubdomain();
  const config = SUBDOMAIN_CONFIG[currentSubdomain];
  
  // Public subdomains allow anyone
  if (config.isPublic) return true;
  
  // No role means not authenticated
  if (!userRole) return false;
  
  // Check if role is in allowed list
  return config.allowedRoles.includes(userRole);
}

/**
 * Get the correct redirect URL for a user role
 */
export function getRedirectUrlForRole(userRole: string | null): string {
  if (!userRole) {
    return '/auth';
  }
  
  // Map role to preferred subdomain
  switch (userRole) {
    case 'super_admin':
    case 'admin':
      return 'https://admin.bayareacleaningpros.com/admin';
    case 'office_manager':
      return 'https://office.bayareacleaningpros.com/office-manager-dashboard';
    case 'subcontractor':
      return 'https://cleaners.bayareacleaningpros.com/subcontractor-dashboard';
    case 'customer':
    default:
      return 'https://portal.bayareacleaningpros.com/customer-portal-dashboard';
  }
}

/**
 * Redirect user to appropriate subdomain if they're on the wrong one
 */
export function redirectToCorrectSubdomain(userRole: string | null): boolean {
  const currentSubdomain = getCurrentSubdomain();
  
  // Skip redirect for localhost
  if (window.location.hostname === 'localhost') return false;
  
  // If role is allowed on current subdomain, no redirect needed
  if (isRoleAllowedOnSubdomain(userRole, currentSubdomain)) return false;
  
  // Redirect to correct subdomain
  const redirectUrl = getRedirectUrlForRole(userRole);
  window.location.href = redirectUrl;
  return true;
}

/**
 * Get the current subdomain configuration
 */
export function getCurrentSubdomainConfig(): SubdomainConfig {
  return SUBDOMAIN_CONFIG[getCurrentSubdomain()];
}

/**
 * Check if current route is allowed on current subdomain
 */
export function isRouteAllowedOnSubdomain(route: string): boolean {
  const currentSubdomain = getCurrentSubdomain();
  const config = SUBDOMAIN_CONFIG[currentSubdomain];
  
  // For now, we'll implement basic route restrictions
  // This can be expanded with more specific route mappings
  
  switch (currentSubdomain) {
    case 'admin':
      return route.startsWith('/admin') || route === '/auth' || route === '/oauth';
    case 'portal':
      return route.startsWith('/customer') || route === '/auth' || route === '/oauth' || route === '/signup';
    case 'cleaners':
      return route.startsWith('/subcontractor') || route === '/auth' || route === '/oauth';
    case 'subcon':
      return route.startsWith('/subcontractor-management') || route === '/auth' || route === '/oauth';
    case 'office':
      return route.startsWith('/office') || route === '/auth' || route === '/oauth';
    case 'book':
      return route.startsWith('/booking') || route.startsWith('/schedule') || route === '/auth' || route === '/signup';
    case 'main':
      return route === '/' || route === '/auth' || route === '/signup' || route === '/oauth';
    default:
      return true; // Allow all routes for other subdomains for now
  }
}