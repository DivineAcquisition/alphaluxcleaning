import React from 'react';
import { Button } from '@/components/ui/button';
import { Home, LogIn, Calendar, User } from 'lucide-react';

interface BrandedErrorPageProps {
  hostRole: 'admin' | 'book' | 'sub' | 'portal' | 'try' | 'root';
  brandColor: string;
  errorType: '404' | '401' | '403';
}

export function BrandedErrorPage({ hostRole, brandColor, errorType }: BrandedErrorPageProps) {
  const getErrorConfig = () => {
    const configs = {
      admin: {
        title: 'AlphaLux Clean Admin',
        subtitle: 'Administrative Portal',
        ctaText: 'Go to Login',
        ctaAction: () => window.location.href = '/auth',
        icon: LogIn
      },
      book: {
        title: 'AlphaLux Clean',
        subtitle: 'Book Your Cleaning Service',
        ctaText: 'Back to Booking',
        ctaAction: () => window.location.href = '/',
        icon: Calendar
      },
      sub: {
        title: 'Bay Area Cleaning Pros',
        subtitle: 'Contractor Portal',
        ctaText: "Open Today's Jobs",
        ctaAction: () => window.location.href = '/today',
        icon: User
      },
      portal: {
        title: 'Bay Area Cleaning Pros',
        subtitle: 'Customer Portal',
        ctaText: 'Back to Home',
        ctaAction: () => window.location.href = '/portal',
        icon: Home
      },
      try: {
        title: 'Bay Area Cleaning Pros',
        subtitle: 'Get Started',
        ctaText: 'Sign Up Now',
        ctaAction: () => window.location.href = 'https://admin.bayareacleaningpros.com/signup',
        icon: LogIn
      },
      root: {
        title: 'Bay Area Cleaning Pros',
        subtitle: 'Professional Cleaning Services',
        ctaText: 'Get Started',
        ctaAction: () => window.location.href = 'https://try.bayareacleaningpros.com',
        icon: Home
      }
    };

    return configs[hostRole];
  };

  const getErrorMessage = () => {
    switch (errorType) {
      case '404':
        return {
          code: '404',
          title: 'Page Not Found',
          description: 'The page you are looking for is not available on this portal.'
        };
      case '401':
        return {
          code: '401',
          title: 'Authentication Required',
          description: 'You need to sign in to access this area.'
        };
      case '403':
        return {
          code: '403',
          title: 'Access Denied',
          description: 'You do not have permission to access this resource.'
        };
      default:
        return {
          code: '404',
          title: 'Page Not Found',
          description: 'The page you are looking for is not available on this portal.'
        };
    }
  };

  const config = getErrorConfig();
  const error = getErrorMessage();
  const IconComponent = config.icon;

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20"
      style={{ 
        '--brand-color': brandColor,
        background: `linear-gradient(135deg, hsl(var(--background)) 0%, ${brandColor}10 100%)`
      } as React.CSSProperties}
    >
      <div className="text-center max-w-md mx-auto px-6">
        <div className="mb-8">
          <div 
            className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${brandColor}20` }}
          >
            <IconComponent 
              className="w-10 h-10"
              style={{ color: brandColor }}
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {config.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {config.subtitle}
          </p>
        </div>

        <div className="mb-8">
          <div 
            className="text-6xl font-bold mb-4"
            style={{ color: brandColor }}
          >
            {error.code}
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {error.title}
          </h2>
          <p className="text-muted-foreground">
            {error.description}
          </p>
        </div>

        <Button 
          onClick={config.ctaAction}
          className="w-full"
          style={{ 
            backgroundColor: brandColor,
            color: 'white'
          }}
        >
          {config.ctaText}
        </Button>

        <p className="text-xs text-muted-foreground mt-6">
          © 2025 AlphaLux Clean. All rights reserved.
        </p>
      </div>
    </div>
  );
}