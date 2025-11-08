import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function DomainRedirect({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if we're on book subdomain and at root path
    const isBookDomain = window.location.hostname === 'book.alphaluxclean.com';
    const isRootPath = location.pathname === '/';

    if (isBookDomain && isRootPath) {
      console.log('📍 Redirecting from book.alphaluxclean.com to /book/zip');
      navigate('/book/zip', { replace: true });
    }
  }, [location.pathname, navigate]);

  return <>{children}</>;
}
