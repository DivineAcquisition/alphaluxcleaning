/**
 * Security Provider Component
 * Applies security headers and enforces security policies
 */

import React, { useEffect } from 'react';
import { enforceHTTPS, getSecurityHeaders, logSecurityEvent } from '@/utils/security';

interface SecurityProviderProps {
  children: React.ReactNode;
}

export function SecurityProvider({ children }: SecurityProviderProps) {
  useEffect(() => {
    // Enforce HTTPS on secure domains
    enforceHTTPS();
    
    // Apply security headers (in a real app, these would be set by the server)
    const headers = getSecurityHeaders();
    
    // Log security initialization
    logSecurityEvent({
      event: 'https_redirect',
      details: {
        protocol: window.location.protocol,
        domain: window.location.hostname,
        headers: Object.keys(headers)
      }
    });

    // Set up CSP violation reporting
    document.addEventListener('securitypolicyviolation', (e) => {
      logSecurityEvent({
        event: 'csp_violation',
        details: {
          violatedDirective: e.violatedDirective,
          blockedURI: e.blockedURI,
          originalPolicy: e.originalPolicy,
          sourceFile: e.sourceFile,
          lineNumber: e.lineNumber
        }
      });
    });

    // Monitor for unauthorized access attempts
    const handleUnauthorizedAccess = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target && target.dataset?.requiresAuth === 'true') {
        logSecurityEvent({
          event: 'unauthorized_access',
          details: {
            element: target.tagName,
            path: window.location.pathname,
            timestamp: Date.now()
          }
        });
      }
    };

    document.addEventListener('click', handleUnauthorizedAccess);
    
    return () => {
      document.removeEventListener('click', handleUnauthorizedAccess);
    };
  }, []);

  return <>{children}</>;
}