import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Calendar, 
  Clock, 
  CreditCard, 
  MapPin, 
  Phone, 
  Settings, 
  Star, 
  User,
  Bell,
  Plus,
  Home,
  DollarSign,
  TrendingUp,
  RefreshCw,
  ChevronRight,
  Menu,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCustomerData } from '@/hooks/useCustomerData';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

export function MobileCustomerPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { profile, orders, bookings, notifications, stats, loading, refreshAll, markNotificationAsRead } = useCustomerData();
  const [activeTab, setActiveTab] = useState('dashboard');

  const upcomingServices = bookings.filter(booking => 
    booking.status === 'confirmed' && new Date(booking.service_date) > new Date()
  ).slice(0, 3);

  const recentServices = [...orders, ...bookings]
    .filter(item => isPast(new Date(item.scheduled_date || item.service_date)))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  const unreadNotifications = notifications.filter(n => !n.is_read);

  const formatServiceDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Dashboard Tab Content
  const DashboardContent = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-primary to-accent text-white border-none">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                Welcome back, {profile?.full_name || user?.email?.split('@')[0] || 'Valued Customer'}!
              </h2>
              <p className="text-white/80">Your cleaning services at a glance</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">{stats.completedServices}</div>
              <p className="text-sm text-muted-foreground">Services Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">${stats.totalSpent.toFixed(0)}</div>
              <p className="text-sm text-muted-foreground">Total Invested</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => navigate('/schedule-service')}
              className="h-20 flex flex-col gap-2 bg-primary hover:bg-primary/90"
            >
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Book Service</span>
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/payment-portal')}
              className="h-20 flex flex-col gap-2"
            >
              <CreditCard className="h-6 w-6" />
              <span className="text-sm">Payments</span>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Button 
              variant="outline"
              onClick={() => setActiveTab('services')}
              className="h-16 flex flex-col gap-1"
            >
              <Clock className="h-5 w-5" />
              <span className="text-xs">View Services</span>
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/membership')}
              className="h-16 flex flex-col gap-1"
            >
              <Star className="h-5 w-5" />
              <span className="text-xs">Membership</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Services */}
      {upcomingServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Upcoming Services
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setActiveTab('services')}
              >
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingServices.map((service, index) => (
                <div key={service.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[50px]">
                      <div className="text-lg font-bold text-primary">
                        {format(new Date(service.service_date), 'd')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(service.service_date), 'MMM')}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">House Cleaning</p>
                      <p className="text-sm text-muted-foreground">
                        {service.service_time} • {formatServiceDate(service.service_date)}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(service.status)}>
                    {service.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Services Message */}
      {upcomingServices.length === 0 && recentServices.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Ready for your first clean?</h3>
            <p className="text-muted-foreground mb-4">
              Book your first cleaning service and experience professional quality.
            </p>
            <Button 
              onClick={() => navigate('/schedule-service')}
              className="bg-primary hover:bg-primary/90"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Your First Service
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Services Tab Content
  const ServicesContent = () => (
    <div className="space-y-6">
      {/* Upcoming Services */}
      {upcomingServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingServices.map((service) => (
                <div key={service.id} className="p-4 border border-border rounded-lg bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-foreground">House Cleaning</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatServiceDate(service.service_date)} at {service.service_time}
                      </p>
                    </div>
                    <Badge className={getStatusColor(service.status)}>
                      {service.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    {service.service_address}
                  </div>
                  {service.special_instructions && (
                    <div className="text-sm text-muted-foreground mb-3">
                      <strong>Instructions:</strong> {service.special_instructions}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Reschedule
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Services */}
      {recentServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Recent Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentServices.map((service, index) => (
                <div key={`${service.id}-${index}`} className="p-4 border border-border rounded-lg bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-foreground">House Cleaning</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(service.scheduled_date || service.service_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      {service.amount && <p className="font-semibold text-foreground">${(service.amount / 100).toFixed(2)}</p>}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Notifications Tab Content
  const NotificationsContent = () => (
    <div className="space-y-4">
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No notifications yet</h3>
            <p className="text-muted-foreground">
              You'll receive updates about your services, payments, and more here.
            </p>
          </CardContent>
        </Card>
      ) : (
        notifications.map((notification) => (
          <Card key={notification.id} className={`${!notification.is_read ? 'border-primary/50 bg-primary/5' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-1">
                    {notification.title}
                    {!notification.is_read && <span className="w-2 h-2 bg-primary rounded-full inline-block ml-2" />}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(notification.created_at), 'MMM d, yyyy at h:mm a')}
                  </p>
                </div>
                {notification.importance === 'high' && (
                  <Badge variant="destructive" className="ml-2">High</Badge>
                )}
              </div>
              <div className="flex gap-2">
                {notification.action_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={notification.action_url}>
                      {notification.action_label || 'View'}
                    </a>
                  </Button>
                )}
                {!notification.is_read && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <div className="bg-white border-b border-border p-4 flex items-center justify-between sticky top-0 z-50">
          <div>
            <h1 className="text-xl font-bold text-foreground">My Services</h1>
            <p className="text-sm text-muted-foreground">Bay Area Cleaning Pros</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadNotifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="relative"
                onClick={() => setActiveTab('notifications')}
              >
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unreadNotifications.length}
                </Badge>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={refreshAll}>
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="bg-white border-b border-border">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-transparent border-none rounded-none h-auto">
              <TabsTrigger 
                value="dashboard" 
                className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none bg-transparent"
              >
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="services" 
                className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none bg-transparent"
              >
                <Calendar className="h-4 w-4 mr-1" />
                Services
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="border-b-2 border-transparent data-[state=active]:border-primary rounded-none bg-transparent relative"
              >
                <Bell className="h-4 w-4 mr-1" />
                Alerts
                {unreadNotifications.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                    {unreadNotifications.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            {/* Mobile Tab Content */}
            <div className="p-4">
              <TabsContent value="dashboard" className="mt-0">
                <DashboardContent />
              </TabsContent>
              <TabsContent value="services" className="mt-0">
                <ServicesContent />
              </TabsContent>
              <TabsContent value="notifications" className="mt-0">
                <NotificationsContent />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Desktop Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Customer Portal</h1>
            <p className="text-muted-foreground">Manage your cleaning services and account</p>
          </div>
          <div className="flex items-center gap-4">
            {unreadNotifications.length > 0 && (
              <Button variant="outline" className="relative">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                <Badge className="ml-2">
                  {unreadNotifications.length}
                </Badge>
              </Button>
            )}
            <Button onClick={refreshAll} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="notifications" className="relative">
              Notifications
              {unreadNotifications.length > 0 && (
                <Badge className="ml-2">
                  {unreadNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DashboardContent />
              </div>
              <div className="space-y-6">
                {/* Profile Sidebar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Account Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">
                          {profile?.full_name || user?.email?.split('@')[0] || 'Customer'}
                        </h4>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    {profile?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{profile.phone}</span>
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="w-full">
                      Edit Profile
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="services">
            <ServicesContent />
          </TabsContent>
          
          <TabsContent value="notifications">
            <NotificationsContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}