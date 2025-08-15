import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, FileImage, Star, Clock, CheckCircle, AlertCircle, Filter } from 'lucide-react';

export default function ClientReportsPortal() {
  const [selectedPeriod, setSelectedPeriod] = useState('last-30-days');
  const [selectedLocation, setSelectedLocation] = useState('all');

  const serviceReports = [
    {
      id: 1,
      date: '2024-08-13',
      time: '10:00 AM - 12:30 PM',
      service: 'Regular House Cleaning',
      cleaner: 'Maria Rodriguez',
      duration: '2h 30m',
      status: 'completed',
      rating: 5,
      beforePhotos: 8,
      afterPhotos: 12,
      tasks: [
        { name: 'Kitchen Deep Clean', completed: true, notes: 'Appliances cleaned inside and out' },
        { name: 'Bathroom Sanitization', completed: true, notes: 'All surfaces disinfected' },
        { name: 'Living Room Dusting', completed: true, notes: 'All furniture and electronics dusted' },
        { name: 'Floor Mopping', completed: true, notes: 'All hard floors cleaned and dried' },
      ],
      supplies: ['All-purpose cleaner', 'Disinfectant', 'Glass cleaner', 'Floor cleaner'],
      clientNotes: 'Excellent work as always. Very thorough cleaning of the kitchen.',
      cost: 120
    },
    {
      id: 2,
      date: '2024-08-06',
      time: '2:00 PM - 5:00 PM',
      service: 'Deep Cleaning',
      cleaner: 'Sarah Johnson',
      duration: '3h',
      status: 'completed',
      rating: 4,
      beforePhotos: 15,
      afterPhotos: 18,
      tasks: [
        { name: 'Deep Kitchen Clean', completed: true, notes: 'Oven and refrigerator deep cleaned' },
        { name: 'Bathroom Deep Clean', completed: true, notes: 'Grout cleaning and sanitization' },
        { name: 'Bedroom Organization', completed: false, notes: 'Ran out of time, will complete next visit' },
        { name: 'Window Cleaning', completed: true, notes: 'Interior and exterior windows cleaned' },
      ],
      supplies: ['Degreaser', 'Disinfectant', 'Glass cleaner', 'Grout cleaner'],
      clientNotes: 'Great deep clean! Missed organizing bedroom but overall very satisfied.',
      cost: 180
    }
  ];

  const monthlyStats = {
    totalServices: 8,
    averageRating: 4.8,
    totalHours: 24,
    onTimePercentage: 95,
    tasksCompleted: 156,
    tasksTotal: 160
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Service Reports</h1>
          <p className="text-muted-foreground">Detailed reports of all cleaning services performed at your locations</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Filter Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last-7-days">Last 7 days</SelectItem>
                    <SelectItem value="last-30-days">Last 30 days</SelectItem>
                    <SelectItem value="last-3-months">Last 3 months</SelectItem>
                    <SelectItem value="last-year">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    <SelectItem value="main-office">Main Office - Downtown</SelectItem>
                    <SelectItem value="warehouse">Warehouse - SOMA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Stats Overview */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Services</span>
                  <span className="font-semibold">{monthlyStats.totalServices}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{monthlyStats.averageRating}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Hours</span>
                  <span className="font-semibold">{monthlyStats.totalHours}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">On-Time Rate</span>
                  <Badge variant="default">{monthlyStats.onTimePercentage}%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tasks Completed</span>
                  <span className="font-semibold">{monthlyStats.tasksCompleted}/{monthlyStats.tasksTotal}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Service Reports */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {serviceReports.map((report) => (
                <Card key={report.id} className="border-border">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{report.service}</CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {report.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {report.time}
                          </div>
                          <Badge variant="outline">
                            {report.cleaner}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`h-4 w-4 ${star <= report.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                            />
                          ))}
                        </div>
                        <div className="text-lg font-semibold text-foreground">${report.cost}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Task Completion */}
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Tasks Completed</h4>
                      <div className="space-y-2">
                        {report.tasks.map((task, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                            {task.completed ? (
                              <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <div className="font-medium text-foreground">{task.name}</div>
                              <div className="text-sm text-muted-foreground mt-1">{task.notes}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Photos */}
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileImage className="h-5 w-5 text-primary" />
                        <span className="font-medium">Service Photos</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {report.beforePhotos} before • {report.afterPhotos} after photos
                      </div>
                      <Button variant="outline" size="sm">
                        View Gallery
                      </Button>
                    </div>

                    {/* Supplies Used */}
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Supplies Used</h4>
                      <div className="flex flex-wrap gap-2">
                        {report.supplies.map((supply, index) => (
                          <Badge key={index} variant="secondary">
                            {supply}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Client Notes */}
                    {report.clientNotes && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-3">Client Feedback</h4>
                        <div className="p-4 bg-primary/5 border-l-4 border-primary rounded-r-lg">
                          <p className="text-foreground italic">"{report.clientNotes}"</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download Report
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileImage className="h-4 w-4 mr-2" />
                        View Photos
                      </Button>
                      <Button variant="outline" size="sm">
                        Book Again
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}