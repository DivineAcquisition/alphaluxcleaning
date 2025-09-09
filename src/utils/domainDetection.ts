export interface DomainInfo {
  subdomain: string;
  baseDomain: string;
  isProduction: boolean;
  targetAudience: 'admin' | 'contractor' | 'customer' | 'guest';
  hostRole: 'admin' | 'book' | 'sub' | 'portal' | 'try' | 'root';
  allowedRoutes: string[];
  brandColor: string;
  redirectTo?: string;
}

export function detectDomain(): DomainInfo {
  const hostname = window.location.hostname;
  const search = window.location.search;
  
  // Check for manual override
  if (search.includes('disableDomainRouting=1')) {
    return {
      subdomain: 'book',
      baseDomain: 'bayareacleaningpros.com',
      isProduction: false,
      targetAudience: 'guest',
      hostRole: 'book',
      allowedRoutes: ['/'],
      brandColor: '#6600FF'
    };
  }
  
  // Development/localhost detection - allow all routes for development
  if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
    return {
      subdomain: 'admin', 
      baseDomain: 'bayareacleaningpros.com',
      isProduction: false,
      targetAudience: 'admin',
      hostRole: 'admin',
      allowedRoutes: ['/', '/login', '/signup', '/auth', '/portal', '/portal/login', '/portal/signup', '/portal/billing', '/portal/bookings', '/portal/settings', '/customer-auth', '/dashboard', '/app', '/admin', '/billing', '/integrations'],
      brandColor: '#A58FFF'
    };
  }
  
  // Lovable preview detection - allow all routes for preview
  if (hostname.includes('lovable.app') || hostname.includes('lovable.dev') || hostname.includes('lovableproject.com')) {
    return {
      subdomain: 'admin',
      baseDomain: 'bayareacleaningpros.com',
      isProduction: false,
      targetAudience: 'admin',
      hostRole: 'admin',
      allowedRoutes: ['/', '/login', '/signup', '/auth', '/portal', '/portal/login', '/portal/signup', '/portal/billing', '/portal/bookings', '/portal/settings', '/customer-auth', '/dashboard', '/app', '/admin', '/billing', '/integrations'],
      brandColor: '#A58FFF'
    };
  }
  
  // Production multi-host detection
  const hostRoleMap: Record<string, Omit<DomainInfo, 'subdomain' | 'baseDomain' | 'isProduction'>> = {
    'admin.bayareacleaningpros.com': {
      targetAudience: 'admin',
      hostRole: 'admin',
      allowedRoutes: ['/login', '/signup', '/onboard', '/dashboard', '/app', '/admin', '/billing', '/integrations', '/auth'],
      brandColor: '#A58FFF'
    },
    'book.bayareacleaningpros.com': {
      targetAudience: 'guest', 
      hostRole: 'book',
      allowedRoutes: ['/b', '/', '/order-confirmation', '/payment-confirmation', '/payment-success', '/booking-confirmation', '/order-status'],
      brandColor: '#6600FF'
    },
    'contractor.bayareacleaningpros.com': {
      targetAudience: 'contractor',
      hostRole: 'sub', 
      allowedRoutes: ['/today', '/job', '/offer', '/contractor', '/auth'],
      brandColor: '#A58FFF'
    },
    'portal.bayareacleaningpros.com': {
      targetAudience: 'customer',
      hostRole: 'portal',
      allowedRoutes: ['/portal', '/portal/login', '/portal/signup', '/portal/billing', '/portal/bookings', '/portal/settings', '/customer-auth', '/customer-dashboard'],
      brandColor: '#6600FF'
    },
    'try.bayareacleaningpros.com': {
      targetAudience: 'guest',
      hostRole: 'try',
      allowedRoutes: [],
      brandColor: '#A58FFF',
      redirectTo: 'https://admin.bayareacleaningpros.com/signup'
    },
    'bayareacleaningpros.com': {
      targetAudience: 'guest',
      hostRole: 'root', 
      allowedRoutes: [],
      brandColor: '#6600FF',
      redirectTo: 'https://try.bayareacleaningpros.com'
    }
  };

  const hostConfig = hostRoleMap[hostname];
  
  if (hostConfig) {
    return {
      subdomain: hostname.split('.')[0] || 'root',
      baseDomain: 'bayareacleaningpros.com',
      isProduction: true,
      ...hostConfig
    };
  }
  
  // Fallback for unknown hosts
  return {
    subdomain: 'admin',
    baseDomain: hostname,
    isProduction: true,
    targetAudience: 'admin',
    hostRole: 'admin',
    allowedRoutes: ['/login', '/signup', '/dashboard', '/app', '/admin'],
    brandColor: '#A58FFF'
  };
}

function getTargetAudience(subdomain: string): 'admin' | 'contractor' | 'customer' | 'guest' {
  switch (subdomain) {
    case 'app':
      return 'admin';
    case 'contractor':
      return 'contractor';
    case 'portal':
      return 'customer';
    case 'book':
      return 'guest';
    default:
      return 'admin'; // Fallback to admin
  }
}

export function buildDomainUrl(targetSubdomain: string, path: string = '', search: string = '', hash: string = ''): string {
  const currentDomain = detectDomain();
  
  // In development, just return the path
  if (!currentDomain.isProduction) {
    const fullPath = `${path}${search ? '?' + search : ''}${hash ? '#' + hash : ''}`;
    return fullPath || '/';
  }

  // Use environment variables for production URLs when available
  const envUrls: Record<string, string> = {
    'admin': import.meta.env.APP_URL || '',
    'book': import.meta.env.BOOK_URL || '',
    'contractor': import.meta.env.SUB_URL || '',
    'portal': import.meta.env.PORTAL_URL || '',
    'try': import.meta.env.TRY_URL || '',
    'root': import.meta.env.ROOT_URL || ''
  };
  
  // If we have an environment variable for this subdomain, use it
  if (envUrls[targetSubdomain]) {
    return `${envUrls[targetSubdomain]}${path}${search ? '?' + search : ''}${hash ? '#' + hash : ''}`;
  }
  
  // Fallback to building the URL manually
  const protocol = 'https://';
  const fullDomain = targetSubdomain ? `${targetSubdomain}.${currentDomain.baseDomain}` : currentDomain.baseDomain;
  return `${protocol}${fullDomain}${path}${search ? '?' + search : ''}${hash ? '#' + hash : ''}`;
}

export function shouldRedirectBasedOnDomainAndRole(
  subdomain: string, 
  userRole: string | null, 
  isAuthenticated: boolean
): { shouldRedirect: boolean; redirectUrl?: string; reason?: string } {
  // Handle 'try' subdomain - always redirect to admin signup
  if (subdomain === 'try') {
    return {
      shouldRedirect: true,
      redirectUrl: buildDomainUrl('admin', '/signup'),
      reason: 'Try subdomain redirects to admin signup'
    };
  }

  // Only authenticated users with specific roles should access contractor subdomain
  if (subdomain === 'contractor') {
    if (!isAuthenticated) {
      return {
        shouldRedirect: true,
        redirectUrl: buildDomainUrl('contractor', '/contractor-auth'),
        reason: 'Authentication required for contractor portal'
      };
    }
    
    if (userRole && !['contractor', 'admin', 'manager'].includes(userRole)) {
      return {
        shouldRedirect: true,
        redirectUrl: buildDomainUrl('admin', '/dashboard'),
        reason: 'Insufficient permissions for contractor portal'
      };
    }
  }
  
  // Only customers should access portal subdomain
  if (subdomain === 'portal') {
    if (!isAuthenticated) {
      return {
        shouldRedirect: true,
        redirectUrl: buildDomainUrl('portal', '/customer-auth'),
        reason: 'Authentication required for customer portal'
      };
    }
    
    if (userRole && userRole !== 'customer') {
      // Redirect other roles to their appropriate domain
      if (userRole === 'contractor') {
        return {
          shouldRedirect: true,
          redirectUrl: buildDomainUrl('contractor', '/today'),
          reason: 'Redirecting contractor to contractor portal'
        };
      } else {
        return {
          shouldRedirect: true,
          redirectUrl: buildDomainUrl('admin', '/dashboard'),
          reason: 'Redirecting to admin dashboard'
        };
      }
    }
  }
  
  // Admin subdomain should only be accessed by authenticated admin/manager users for protected routes
  if (subdomain === 'admin' && userRole === 'customer') {
    return {
      shouldRedirect: true,
      redirectUrl: buildDomainUrl('portal', '/dashboard'),
      reason: 'Customers should use customer portal'
    };
  }
  
  // Unauthenticated users should generally use the book subdomain for public access
  if (!isAuthenticated && !['book', 'root', 'try'].includes(subdomain)) {
    return {
      shouldRedirect: true,
      redirectUrl: buildDomainUrl('book', '/'),
      reason: 'Unauthenticated users should use booking portal'
    };
  }
  
  return { shouldRedirect: false };
}