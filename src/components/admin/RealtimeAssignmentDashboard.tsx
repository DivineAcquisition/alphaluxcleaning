import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, MapPin, User, Phone, AlertCircle, CheckCircle, XCircle, Timer, RefreshCw } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface AssignmentStatus {
  id: string;
  booking_id: string;
  subcontractor_id: string;
  status: string; // Will be 'pending' | 'accepted' | 'declined' | 'expired' after migration
  priority: 'normal' | 'high' | 'urgent';
  assigned_at: string;
  expires_at: string;
  response_received_at?: string;
  booking: {
    customer_name: string;
    customer_phone: string;
    service_address: string;
    service_date: string;
    service_time: string;
    special_instructions?: string;
  };
  subcontractor: {
    full_name: string;
    phone: string;
    tier_level: number;
    rating: number;
  };
  response?: {
    decline_reason?: string;
    notes?: string;
    estimated_duration?: number;
  };
}

interface AssignmentQueue {
  booking_id: string;
  pending_count: number;
  next_assignments: Array<{
    subcontractor_name: string;
    priority_order: number;
    expires_at: string;
  }>;
}

export function RealtimeAssignmentDashboard() {
  const [assignments, setAssignments] = useState<AssignmentStatus[]>([]);
  const [queue, setQueue] = useState<AssignmentQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_pending: 0,
    total_accepted: 0,
    total_declined: 0,
    avg_response_time: 0
  });

  useEffect(() => {
    fetchAssignments();
    
    // Set up real-time subscriptions
    const assignmentChannel = supabase
      .channel('assignment-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subcontractor_job_assignments'
        },
        () => {
          fetchAssignments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subcontractor_responses'
        },
        () => {
          fetchAssignments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(assignmentChannel);
    };
  }, []);

  const fetchAssignments = async () => {
    try {
      // Fetch current assignments with related data
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('subcontractor_job_assignments')
        .select(`
          id,
          booking_id,
          subcontractor_id,
          status,
          assigned_at,
          bookings!inner (
            customer_name,
            customer_phone,
            service_address,
            service_date,
            service_time,
            special_instructions
          ),
          subcontractors!inner (
            full_name,
            phone,
            tier_level,
            rating
          ),
          subcontractor_responses (
            decline_reason,
            notes,
            estimated_duration
          )
        `)
        .gte('assigned_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('assigned_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Fetch assignment queue data
      const { data: queueData, error: queueError } = await supabase
        .from('assignment_queue')
        .select(`
          booking_id,
          priority_order,
          expires_at,
          status,
          subcontractors!inner (
            full_name
          )
        `)
        .eq('status', 'pending')
        .order('booking_id')
        .order('priority_order');

      if (queueError) throw queueError;

      // Process assignments data
      const processedAssignments: AssignmentStatus[] = assignmentsData?.map(assignment => ({
        id: assignment.id,
        booking_id: assignment.booking_id,
        subcontractor_id: assignment.subcontractor_id,
        status: assignment.status,
        priority: 'normal' as const, // Default until migration is complete
        assigned_at: assignment.assigned_at,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Default 24 hours
        response_received_at: undefined,
        booking: Array.isArray(assignment.bookings) ? assignment.bookings[0] : assignment.bookings,
        subcontractor: Array.isArray(assignment.subcontractors) ? assignment.subcontractors[0] : assignment.subcontractors,
        response: Array.isArray(assignment.subcontractor_responses) && assignment.subcontractor_responses.length > 0 
          ? assignment.subcontractor_responses[0] 
          : undefined
      })) || [];

      // Process queue data
      const queueMap = new Map<string, AssignmentQueue>();
      queueData?.forEach(item => {
        const bookingId = item.booking_id;
        if (!queueMap.has(bookingId)) {
          queueMap.set(bookingId, {
            booking_id: bookingId,
            pending_count: 0,
            next_assignments: []
          });
        }
        
        const queueItem = queueMap.get(bookingId)!;
        queueItem.pending_count++;
        queueItem.next_assignments.push({
          subcontractor_name: Array.isArray(item.subcontractors) ? item.subcontractors[0].full_name : item.subcontractors.full_name,
          priority_order: item.priority_order,
          expires_at: item.expires_at
        });
      });

      // Calculate stats
      const totalPending = processedAssignments.filter(a => a.status === 'pending').length;
      const totalAccepted = processedAssignments.filter(a => a.status === 'accepted').length;
      const totalDeclined = processedAssignments.filter(a => a.status === 'declined').length;
      
      const responseTimes = processedAssignments
        .filter(a => a.response_received_at && a.assigned_at)
        .map(a => {
          const assigned = new Date(a.assigned_at);
          const responded = new Date(a.response_received_at!);
          return (responded.getTime() - assigned.getTime()) / (1000 * 60); // minutes
        });
      
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;

      setAssignments(processedAssignments);
      setQueue(Array.from(queueMap.values()));
      setStats({
        total_pending: totalPending,
        total_accepted: totalAccepted,
        total_declined: totalDeclined,
        avg_response_time: Math.round(avgResponseTime)
      });

    } catch (error) {
      console.error('Error fetching assignment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Timer className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Timer className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      default:
        return 'bg-blue-500';
    }
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const minutesLeft = (expires.getTime() - now.getTime()) / (1000 * 60);
    return minutesLeft <= 15 && minutesLeft > 0; // Expiring in 15 minutes or less
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.total_pending}</p>
              </div>
              <Timer className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Accepted</p>
                <p className="text-2xl font-bold text-green-600">{stats.total_accepted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Declined</p>
                <p className="text-2xl font-bold text-red-600">{stats.total_declined}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">{stats.avg_response_time}m</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Assignments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Active Assignments</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchAssignments}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No recent assignments found
            </p>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <Card key={assignment.id} className={`border-l-4 ${getPriorityColor(assignment.priority)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(assignment.status)}
                        <div>
                          <Badge className={getStatusColor(assignment.status)}>
                            {assignment.status.toUpperCase()}
                          </Badge>
                          {assignment.priority !== 'normal' && (
                            <Badge variant="secondary" className="ml-2">
                              {assignment.priority.toUpperCase()}
                            </Badge>
                          )}
                          {isExpiringSoon(assignment.expires_at) && assignment.status === 'pending' && (
                            <Badge variant="destructive" className="ml-2 animate-pulse">
                              EXPIRING SOON
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Assigned {formatDistanceToNow(new Date(assignment.assigned_at))} ago</p>
                        {assignment.status === 'pending' && (
                          <p>Expires {formatDistanceToNow(new Date(assignment.expires_at))}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Job Details */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Job Details</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{assignment.booking.customer_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{assignment.booking.customer_phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs">{assignment.booking.service_address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {format(new Date(assignment.booking.service_date), 'MMM dd, yyyy')} at {assignment.booking.service_time}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Subcontractor Details */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Assigned To</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{assignment.subcontractor.full_name}</span>
                            <Badge variant="outline">Tier {assignment.subcontractor.tier_level}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{assignment.subcontractor.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">Rating: ⭐ {assignment.subcontractor.rating || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Response Details */}
                    {assignment.response && (
                      <>
                        <Separator className="my-4" />
                        <div className="space-y-2">
                          <h4 className="font-medium">Response Details</h4>
                          {assignment.response.decline_reason && (
                            <p className="text-sm text-red-600">
                              <strong>Decline Reason:</strong> {assignment.response.decline_reason}
                            </p>
                          )}
                          {assignment.response.estimated_duration && (
                            <p className="text-sm text-green-600">
                              <strong>Estimated Duration:</strong> {assignment.response.estimated_duration} hours
                            </p>
                          )}
                          {assignment.response.notes && (
                            <p className="text-sm">
                              <strong>Notes:</strong> {assignment.response.notes}
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Queue Information */}
                    {assignment.status === 'declined' && queue.find(q => q.booking_id === assignment.booking_id) && (
                      <>
                        <Separator className="my-4" />
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-yellow-800">
                            Assignment Queue: {queue.find(q => q.booking_id === assignment.booking_id)?.pending_count} pending assignments
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}