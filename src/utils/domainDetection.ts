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
  
  // Development/localhost detection
  if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
    return {
      subdomain: 'admin', 
      baseDomain: 'bayareacleaningpros.com',
      isProduction: false,
      targetAudience: 'admin',
      hostRole: 'admin',
      allowedRoutes: ['/login', '/signup', '/onboard', '/dashboard', '/app', '/admin', '/billing', '/integrations'],
      brandColor: '#A58FFF'
    };
  }
  
  // Lovable preview detection
  if (hostname.includes('lovable.app') || hostname.includes('lovable.dev') || hostname.includes('lovableproject.com')) {
    return {
      subdomain: 'book',
      baseDomain: 'bayareacleaningpros.com',
      isProduction: false,
      targetAudience: 'guest',
      hostRole: 'book',
      allowedRoutes: ['/b'],
      brandColor: '#6600FF'
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
      allowedRoutes: ['/portal', '/customer-auth', '/customer-dashboard'],
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

export function buildDomainUrl(targetSubdomain: string, path = '/', search = '', hash = ''): string {
  const domainInfo = detectDomain();
  
  if (!domainInfo.isProduction) {
    // In development, just change the path
    return `${path}${search}${hash}`;
  }
  
  const protocol = window.location.protocol;
  return `${protocol}//${targetSubdomain}.${domainInfo.baseDomain}${path}${search}${hash}`;
}

export function shouldRedirectBasedOnDomainAndRole(
  subdomain: string, 
  userRole: string | null, 
  isAuthenticated: boolean
): { shouldRedirect: boolean; redirectUrl?: string; reason?: string } {
  // Book domain should always be guest-friendly
  if (subdomain === 'book') {
    return { shouldRedirect: false };
  }
  
  // If not authenticated, only book domain is allowed
  if (!isAuthenticated && subdomain !== 'book') {
    return {
      shouldRedirect: true,
      redirectUrl: buildDomainUrl('book'),
      reason: 'Not authenticated'
    };
  }
  
  if (!userRole) {
    return { shouldRedirect: false };
  }
  
  // Role-based domain enforcement
  const domainRoleMap = {
    app: ['admin', 'manager'],
    contractor: ['admin', 'manager', 'super_admin'],
    portal: ['customer']
  };
  
  const allowedRoles = domainRoleMap[subdomain as keyof typeof domainRoleMap];
  
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate domain based on role
    const roleDomainMap = {
      admin: 'app',
      manager: 'app', 
      contractor: 'contractor',
      customer: 'portal'
    };
    
    const targetDomain = roleDomainMap[userRole as keyof typeof roleDomainMap];
    if (targetDomain) {
      return {
        shouldRedirect: true,
        redirectUrl: buildDomainUrl(targetDomain),
        reason: `Role ${userRole} should use ${targetDomain} domain`
      };
    }
  }
  
  return { shouldRedirect: false };
}