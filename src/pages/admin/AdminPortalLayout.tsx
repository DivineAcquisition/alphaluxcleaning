import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Calendar, 
  FileText, 
  DollarSign, 
  CreditCard,
  MessageSquare,
  Settings,
  LogOut,
  BarChart3,
  Building,
  ClipboardList
} from 'lucide-react';

const navigationItems = [
  { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { path: '/contractors', label: 'Contractors', icon: Users },
  { path: '/clients', label: 'Clients', icon: Building },
  { path: '/jobs', label: 'Jobs', icon: Calendar },
  { path: '/assignments', label: 'Assignments', icon: ClipboardList },
  { path: '/timesheets', label: 'Timesheets', icon: FileText },
  { path: '/payroll', label: 'Payroll', icon: DollarSign },
  { path: '/payouts', label: 'Payouts', icon: CreditCard },
  { path: '/comms', label: 'Communications', icon: MessageSquare },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function AdminPortalLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-card border-r">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-foreground">BACP Admin</h1>
            <p className="text-sm text-muted-foreground">Management Portal</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                             (item.path === '/dashboard' && location.pathname === '/');
              
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  className="w-full justify-start gap-2"
                  onClick={() => navigate(item.path)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}