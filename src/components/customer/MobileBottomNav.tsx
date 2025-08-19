import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Calendar, 
  Bell, 
  User, 
  CreditCard 
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  notificationCount?: number;
  className?: string;
}

export function MobileBottomNav({ 
  activeTab, 
  onTabChange, 
  notificationCount = 0,
  className = ""
}: MobileBottomNavProps) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: Home,
      badge: null
    },
    {
      id: 'services',
      label: 'Services',
      icon: Calendar,
      badge: null
    },
    {
      id: 'notifications',
      label: 'Alerts',
      icon: Bell,
      badge: notificationCount > 0 ? notificationCount.toString() : null
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: CreditCard,
      badge: null
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      badge: null
    }
  ];

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 ${className}`}>
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? "default" : "ghost"}
            size="sm"
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col gap-1 h-16 min-w-0 flex-1 mx-1 relative ${
              activeTab === item.id 
                ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.badge && (
              <Badge 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs bg-red-500 text-white"
              >
                {item.badge}
              </Badge>
            )}
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </Button>
        ))}
      </div>
      
      {/* Safe area for iPhone bottom indicator */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </div>
  );
}