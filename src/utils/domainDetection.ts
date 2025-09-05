export interface DomainInfo {
  subdomain: string;
  baseDomain: string;
  isProduction: boolean;
  targetAudience: 'admin' | 'contractor' | 'customer' | 'guest';
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
      targetAudience: 'guest'
    };
  }
  
  // Development/localhost detection
  if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
    return {
      subdomain: 'app', // Default to admin in development
      baseDomain: 'bayareacleaningpros.com',
      isProduction: false,
      targetAudience: 'admin'
    };
  }
  
  // Lovable preview detection
  if (hostname.includes('lovable.app') || hostname.includes('lovable.dev')) {
    return {
      subdomain: 'book', // Use guest mode to avoid auth redirects
      baseDomain: 'bayareacleaningpros.com',
      isProduction: false,
      targetAudience: 'guest'
    };
  }
  
  // Production domain detection
  const parts = hostname.split('.');
  
  if (parts.length >= 3) {
    const subdomain = parts[0];
    const baseDomain = parts.slice(1).join('.');
    
    const targetAudience = getTargetAudience(subdomain);
    
    return {
      subdomain,
      baseDomain,
      isProduction: true,
      targetAudience
    };
  }
  
  // Fallback for apex domain or unknown structure
  return {
    subdomain: 'app',
    baseDomain: hostname,
    isProduction: true,
    targetAudience: 'admin'
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