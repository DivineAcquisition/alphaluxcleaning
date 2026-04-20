import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, DollarSign, MapPin, Star, TrendingUp, Users, CheckCircle, Phone, Camera, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SubcontractorDesktopPortal() {
  const navigate = useNavigate();

  const todayJobs = [
    {
      id: 1,
      time: '10:00 AM',
      client: 'Johnson Residence',
      address: '123 Oak St, New York',
      service: 'Regular Cleaning',
      duration: '2h',
      payment: '$120',
      status: 'confirmed'
    },
    {
      id: 2,
      time: '2:30 PM',
      client: 'Tech Startup Office',
      address: '456 Market St, New York',
      service: 'Commercial Cleaning',
      duration: '3h',
      payment: '$200',
      status: 'in-progress'
    }
  ];

  const upcomingJobs = [
    {
      id: 3,
      date: '2024-08-16',
      time: '9:00 AM',
      client: 'Davis Family Home',
      service: 'Deep Cleaning',
      payment: '$180'
    },
    {
      id: 4,
      date: '2024-08-17',
      time: '1:00 PM',
      client: 'Modern Apartment',
      service: 'Move-out Cleaning',
      payment: '$150'
    }
  ];

  const stats = {
    monthlyEarnings: 2840,
    jobsCompleted: 24,
    rating: 4.9,
    responseTime: '12 min'
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Subcontractor Portal</h1>
              <p className="text-muted-foreground">Welcome back, Maria Rodriguez</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="default" className="text-sm">
                <Star className="h-3 w-3 mr-1 fill-current" />
                {stats.rating} Rating
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/subcontractor-mobile')}
              >
                Mobile View
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Earnings</p>
                  <p className="text-2xl font-bold text-foreground">${stats.monthlyEarnings}</p>
                </div>
                <DollarSign className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Jobs Completed</p>
                  <p className="text-2xl font-bold text-foreground">{stats.jobsCompleted}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                  <p className="text-2xl font-bold text-foreground">{stats.rating}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500 fill-current" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response</p>
                  <p className="text-2xl font-bold text-foreground">{stats.responseTime}</p>
                </div>
                <Clock className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="today" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="today">Today's Jobs</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>

              <TabsContent value="today" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Today's Schedule - {new Date().toLocaleDateString()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {todayJobs.map((job) => (
                        <div key={job.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                          <div className="flex items-center gap-4">
                            <div className="text-center min-w-[60px]">
                              <div className="text-lg font-semibold text-foreground">{job.time}</div>
                              <div className="text-xs text-muted-foreground">{job.duration}</div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">{job.client}</h4>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3" />
                                {job.address}
                              </div>
                              <div className="text-sm text-muted-foreground">{job.service}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-success">{job.payment}</div>
                            <Badge variant={job.status === 'confirmed' ? 'default' : 'secondary'}>
                              {job.status}
                            </Badge>
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" variant="outline">
                                <Phone className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <MapPin className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Jobs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {upcomingJobs.map((job) => (
                        <div key={job.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                          <div className="flex items-center gap-4">
                            <div className="text-center min-w-[80px]">
                              <div className="text-sm font-medium text-foreground">{job.date}</div>
                              <div className="text-xs text-muted-foreground">{job.time}</div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">{job.client}</h4>
                              <div className="text-sm text-muted-foreground">{job.service}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-success">{job.payment}</div>
                            <Button size="sm" variant="outline" className="mt-1">
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="completed">
                <Card>
                  <CardHeader>
                    <CardTitle>Recently Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Completed jobs will appear here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" onClick={() => navigate('/subcontractor-availability')}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Update Availability
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Camera className="h-4 w-4 mr-2" />
                  Upload Photos
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Submit Report
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/subcontractor-payments')}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  View Payments
                </Button>
              </CardContent>
            </Card>

            {/* Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Jobs Completed</span>
                  <span className="font-medium">{stats.jobsCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Earnings</span>
                  <span className="font-medium text-success">${stats.monthlyEarnings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">On-Time Rate</span>
                  <span className="font-medium">98%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Customer Rating</span>
                  <span className="font-medium">{stats.rating} ⭐</span>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle>Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Emergency Contact
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => navigate('/training-portal')}>
                  <Users className="h-4 w-4 mr-2" />
                  Training Resources
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}