import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  CreditCard, 
  Star, 
  Phone,
  MessageSquare,
  Repeat,
  Plus,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface QuickServiceActionsProps {
  hasActiveServices?: boolean;
  hasRecurringServices?: boolean;
  className?: string;
}

export function QuickServiceActions({ 
  hasActiveServices = false, 
  hasRecurringServices = false,
  className = ""
}: QuickServiceActionsProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const primaryActions = [
    {
      title: 'Book New Service',
      description: 'Schedule your next cleaning',
      icon: Calendar,
      action: () => navigate('/schedule-service'),
      variant: 'default' as const,
      highlight: true
    },
    {
      title: 'Quick Rebooking',
      description: 'Book same as last time',
      icon: Repeat,
      action: () => navigate('/schedule-service?repeat=true'),
      variant: 'outline' as const,
      show: hasActiveServices
    }
  ];

  const secondaryActions = [
    {
      title: 'View Orders',
      description: 'Check service history',
      icon: Clock,
      action: () => navigate('/order-status'),
      variant: 'outline' as const
    },
    {
      title: 'Payment & Billing',
      description: 'Manage payments',
      icon: CreditCard,
      action: () => navigate('/payment-portal'),
      variant: 'outline' as const
    },
    {
      title: 'Get Membership',
      description: 'Save with Clean & Covered',
      icon: Star,
      action: () => navigate('/membership'),
      variant: 'outline' as const,
      badge: 'Save 15%',
      show: !hasRecurringServices
    },
    {
      title: 'Contact Support',
      description: '24/7 customer service',
      icon: Phone,
      action: () => window.open('tel:+1-555-123-4567'),
      variant: 'outline' as const
    }
  ];

  const emergencyActions = [
    {
      title: 'Same-Day Service',
      description: 'Emergency cleaning (fees apply)',
      icon: Zap,
      action: () => navigate('/schedule-service?urgent=true'),
      variant: 'destructive' as const,
      badge: 'Rush'
    }
  ];

  if (isMobile) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Primary Actions - Mobile Grid */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {primaryActions
                .filter(action => action.show !== false)
                .map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant}
                  onClick={action.action}
                  className={`h-16 justify-start p-4 ${
                    action.highlight 
                      ? 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white' 
                      : ''
                  }`}
                >
                  <action.icon className="h-6 w-6 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">{action.title}</div>
                    <div className="text-xs opacity-80">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Secondary Actions - Compact Grid */}
        <div className="grid grid-cols-2 gap-3">
          {secondaryActions
            .filter(action => action.show !== false)
            .map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              onClick={action.action}
              className="h-20 flex flex-col gap-1 relative"
            >
              {action.badge && (
                <Badge className="absolute -top-1 -right-1 text-xs px-1 py-0">
                  {action.badge}
                </Badge>
              )}
              <action.icon className="h-5 w-5" />
              <span className="text-xs font-medium text-center leading-tight">{action.title}</span>
            </Button>
          ))}
        </div>

        {/* Emergency Actions */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            {emergencyActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant}
                onClick={action.action}
                className="w-full justify-start relative"
              >
                {action.badge && (
                  <Badge className="absolute -top-1 -right-1 text-xs px-1 py-0 bg-orange-500">
                    {action.badge}
                  </Badge>
                )}
                <action.icon className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-semibold">{action.title}</div>
                  <div className="text-xs opacity-80">{action.description}</div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Service Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Primary Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {primaryActions
              .filter(action => action.show !== false)
              .map((action, index) => (
              <Button
                key={index}
                variant={action.variant}
                onClick={action.action}
                className={`h-24 flex flex-col gap-2 ${
                  action.highlight 
                    ? 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white' 
                    : ''
                }`}
              >
                <action.icon className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-semibold">{action.title}</div>
                  <div className="text-xs opacity-80">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {secondaryActions
              .filter(action => action.show !== false)
              .map((action, index) => (
              <Button
                key={index}
                variant={action.variant}
                onClick={action.action}
                className="h-20 flex flex-col gap-1 relative"
              >
                {action.badge && (
                  <Badge className="absolute -top-1 -right-1 text-xs px-1 py-0">
                    {action.badge}
                  </Badge>
                )}
                <action.icon className="h-5 w-5" />
                <span className="text-xs font-medium text-center">{action.title}</span>
              </Button>
            ))}
          </div>

          {/* Emergency Actions */}
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="font-semibold text-orange-800 mb-2">Need Urgent Service?</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {emergencyActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={action.action}
                  className="justify-start border-orange-300 hover:bg-orange-100 relative"
                >
                  {action.badge && (
                    <Badge className="absolute -top-1 -right-1 text-xs px-1 py-0 bg-orange-500">
                      {action.badge}
                    </Badge>
                  )}
                  <action.icon className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-semibold">{action.title}</div>
                    <div className="text-xs opacity-80">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}