import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  List, 
  Plus, 
  MapPin, 
  Clock, 
  User,
  DollarSign,
  Filter,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function JobsPage() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');

  // Mock job data - replace with actual hook
  const jobs = [
    {
      id: '1',
      client: 'ABC Corporation',
      address: '123 Main St, San Francisco, CA',
      date: '2025-01-15',
      time: '09:00',
      duration: 4,
      status: 'unassigned',
      priority: 'high',
      amount: 320,
      type: 'deep_clean'
    },
    {
      id: '2', 
      client: 'Tech Startup Inc',
      address: '456 Market St, San Francisco, CA',
      date: '2025-01-15',
      time: '14:00',
      duration: 3,
      status: 'assigned',
      priority: 'normal',
      amount: 240,
      type: 'regular_clean',
      assignedTo: 'Sarah Miller'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unassigned': return 'destructive';
      case 'assigned': return 'default';
      case 'in_progress': return 'secondary';
      case 'completed': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Jobs</h1>
          <p className="text-muted-foreground">Manage and assign cleaning jobs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Job
          </Button>
        </div>
      </div>

      {/* View Controls */}
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." className="pl-10" />
        </div>
        
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'calendar' | 'list')}>
          <TabsList>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Jobs Content */}
      {viewMode === 'list' ? (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold">{job.client}</h3>
                      <Badge variant={getStatusColor(job.status)}>
                        {job.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge className={getPriorityColor(job.priority)}>
                        {job.priority.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {job.type.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {job.address}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {job.date} at {job.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {job.duration} hours
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        ${job.amount}
                      </div>
                      {job.assignedTo && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Assigned to {job.assignedTo}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {job.status === 'unassigned' && (
                      <Button size="sm">
                        Assign
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Calendar view coming soon</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}