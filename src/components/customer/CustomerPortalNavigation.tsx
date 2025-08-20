import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Calendar, 
  CreditCard, 
  Settings, 
  LogOut, 
  User, 
  Bell,
  ArrowLeft,
  MessageSquare,
  ClipboardList,
  Gift
} from 'lucide-react';
import { toast } from 'sonner';

interface CustomerPortalNavigationProps {
  showBackButton?: boolean;
  backTo?: string;
  backLabel?: string;
  title?: string;
  children?: React.ReactNode;
}

export function CustomerPortalNavigation({ 
  showBackButton = false, 
  backTo = '/customer-portal-dashboard',
  backLabel = 'Back to Dashboard',
  title = 'Customer Portal',
  children
}: CustomerPortalNavigationProps) {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Successfully signed out');
      navigate('/');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const navigationItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/customer-portal-dashboard',
      description: 'Overview of your services'
    },
    {
      icon: ClipboardList,
      label: 'My Services',
      path: '/my-services',
      description: 'Manage your cleaning services'
    },
    {
      icon: Calendar,
      label: 'Schedule Service',
      path: '/schedule-service', 
      description: 'Book new cleaning appointments'
    },
    {
      icon: CreditCard,
      label: 'Billing & Payments',
      path: '/payment-portal',
      description: 'Manage payment methods and invoices'
    },
    {
      icon: Gift,
      label: 'Membership',
      path: '/membership',
      description: 'View membership benefits'
    },
    {
      icon: Bell,
      label: 'Notifications',
      path: '/notifications',
      description: 'View important updates'
    }
  ];

  const isCurrentPath = (path: string) => location.pathname === path;

  const userInitials = user?.user_metadata?.full_name 
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="bg-background border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Back button and title */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(backTo)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Button>
            )}
            
            {title && (
              <div>
                <h1 className="text-xl font-semibold text-foreground">{title}</h1>
              </div>
            )}
          </div>

          {/* Center - Navigation items (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-2">
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                variant={isCurrentPath(item.path) ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate(item.path)}
                className="flex items-center gap-2"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center gap-4">
            {/* Quick actions on desktop */}
            <div className="hidden lg:flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/schedule-service')}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Book Service
              </Button>
            </div>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt="Profile" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium leading-none">
                        {user?.user_metadata?.full_name || 'Customer'}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {userRole === 'customer' ? 'Customer' : userRole}
                      </Badge>
                    </div>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Mobile navigation items */}
                <div className="md:hidden">
                  {navigationItems.map((item) => (
                    <DropdownMenuItem 
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={isCurrentPath(item.path) ? "bg-accent" : ""}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </div>

                <DropdownMenuItem onClick={() => navigate('/customer-profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/notifications')}>
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/help')}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Additional content area */}
        {children && (
          <div className="py-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}