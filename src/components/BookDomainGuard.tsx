import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface BookDomainGuardProps {
  children: React.ReactNode;
}

export function BookDomainGuard({ children }: BookDomainGuardProps) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const currentPath = location.pathname.replace(/\/+$/, '') || '/'; // Normalize trailing slashes
    
    // Allowed paths on book domain
    const allowedPaths = [
      '/',
      '/order-confirmation', 
      '/payment-confirmation', 
      '/payment-success', 
      '/booking-confirmation', 
      '/order-status',
      '/oauth/callback'
    ];
    
    // Check if current path is allowed (exact match or with query params/hash)
    const isAllowedPath = allowedPaths.some(path => 
      currentPath === path || 
      currentPath.startsWith(path + '?') || 
      currentPath.startsWith(path + '#')
    );
    
    // Legacy booking paths that should redirect to root
    const legacyBookingPaths = ['/booking', '/legacy-booking', '/new-booking'];
    const isLegacyBookingPath = legacyBookingPaths.some(path => 
      currentPath === path || currentPath.startsWith(path + '/')
    );
    
    if (isLegacyBookingPath || !isAllowedPath) {
      // Redirect to root, preserving query params and hash if they exist
      const searchParams = location.search;
      const hash = location.hash;
      navigate('/' + searchParams + hash, { replace: true });
    }
  }, [location, navigate]);

  return <>{children}</>;
}