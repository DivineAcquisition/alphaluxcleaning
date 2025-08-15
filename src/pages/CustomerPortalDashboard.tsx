import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CreditCard, MapPin, Phone, Settings, Star, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CustomerPortalDashboard() {
  const navigate = useNavigate();

  const upcomingServices = [
    {
      id: 1,
      date: '2024-08-20',
      time: '10:00 AM',
      service: 'Regular House Cleaning',
      cleaner: 'Maria Rodriguez',
      status: 'confirmed'
    },
    {
      id: 2,
      date: '2024-08-27',
      time: '2:00 PM', 
      service: 'Deep Cleaning',
      cleaner: 'John Smith',
      status: 'pending'
    }
  ];

  const recentServices = [
    {
      id: 1,
      date: '2024-08-13',
      service: 'Regular House Cleaning',
      cleaner: 'Maria Rodriguez',
      rating: 5,
      cost: 120
    },
    {
      id: 2,
      date: '2024-08-06',
      service: 'Regular House Cleaning', 
      cleaner: 'Sarah Johnson',
      rating: 4,
      cost: 120
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Customer Portal</h1>
          <p className="text-muted-foreground">Manage your cleaning services, view history, and update preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    onClick={() => navigate('/schedule-service')}
                    className="h-24 flex flex-col gap-2"
                  >
                    <Calendar className="h-6 w-6" />
                    <span className="text-xs">Book Service</span>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/order-status')}
                    className="h-24 flex flex-col gap-2"
                  >
                    <Clock className="h-6 w-6" />
                    <span className="text-xs">View Orders</span>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/billing')}
                    className="h-24 flex flex-col gap-2"
                  >
                    <CreditCard className="h-6 w-6" />
                    <span className="text-xs">Billing</span>
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-24 flex flex-col gap-2"
                  >
                    <Settings className="h-6 w-6" />
                    <span className="text-xs">Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Upcoming Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-foreground">{new Date(service.date).getDate()}</div>
                          <div className="text-xs text-muted-foreground">{new Date(service.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{service.service}</h4>
                          <p className="text-sm text-muted-foreground">{service.time} • {service.cleaner}</p>
                        </div>
                      </div>
                      <Badge variant={service.status === 'confirmed' ? 'default' : 'secondary'}>
                        {service.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Recent Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                      <div>
                        <h4 className="font-medium text-foreground">{service.service}</h4>
                        <p className="text-sm text-muted-foreground">{service.date} • {service.cleaner}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`h-3 w-3 ${star <= service.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">${service.cost}</p>
                        <Button variant="outline" size="sm" className="mt-1">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Info */}
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
                    <h4 className="font-medium text-foreground">John Doe</h4>
                    <p className="text-sm text-muted-foreground">Premium Member</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">123 Main St, San Francisco, CA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">(555) 123-4567</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* Membership Status */}
            <Card>
              <CardHeader>
                <CardTitle>Membership Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Plan</span>
                    <Badge>Premium</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Services Used</span>
                    <span className="text-sm font-medium">8 / 12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Next Billing</span>
                    <span className="text-sm font-medium">Sep 15, 2024</span>
                  </div>
                  <Button size="sm" className="w-full">
                    Manage Membership
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <MapPin className="h-4 w-4 mr-2" />
                  Service Areas
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}