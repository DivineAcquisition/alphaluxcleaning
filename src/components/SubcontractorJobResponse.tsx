import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Phone, 
  User,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";

interface JobAssignment {
  id: string;
  booking_id: string;
  status: string;
  assigned_at: string;
  subcontractor_notes: string;
  bookings: {
    customer_name: string;
    customer_phone: string;
    service_address: string;
    service_date: string;
    service_time: string;
    special_instructions: string;
  };
}

interface SubcontractorJobResponseProps {
  subcontractorId?: string;
}

export function SubcontractorJobResponse({ subcontractorId }: SubcontractorJobResponseProps) {
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [responses, setResponses] = useState<{ [key: string]: { action: string; reason?: string; notes?: string; estimatedTime?: string } }>({});

  useEffect(() => {
    fetchAssignments();
  }, [subcontractorId]);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('subcontractor_job_assignments')
        .select(`
          *,
          bookings (*)
        `)
        .eq('subcontractor_id', subcontractorId)
        .in('status', ['assigned', 'needs_response'])
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load job assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (assignmentId: string, action: 'accept' | 'decline') => {
    setResponding(assignmentId);
    
    try {
      const response = responses[assignmentId];
      
      // Update assignment status in database
      const { error } = await supabase
        .from('subcontractor_job_assignments')
        .update({
          status: action === 'accept' ? 'accepted' : 'declined',
          response_time: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (error) throw error;

      // Create notification for response tracking
      await supabase
        .from('subcontractor_notifications')
        .insert({
          subcontractor_id: subcontractorId,
          title: `Job ${action === 'accept' ? 'Accepted' : 'Declined'}`,
          message: `Job response recorded: ${action}`,
          type: 'job_response'
        });

      toast.success(`Job ${action === 'accept' ? 'accepted' : 'declined'} successfully`);
      fetchAssignments(); // Refresh the list
      
    } catch (error) {
      console.error('Error responding to assignment:', error);
      toast.error('Failed to submit response');
    } finally {
      setResponding(null);
    }
  };

  const updateResponse = (assignmentId: string, field: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [assignmentId]: {
        ...prev[assignmentId],
        [field]: value
      }
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityIcon = (status: string) => {
    if (status === 'assigned') return '📋';
    return '📋';
  };

  const getTimeRemaining = (assignedAt: string) => {
    const now = new Date();
    const assignedDate = new Date(assignedAt);
    const responseDeadline = new Date(assignedDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours
    const diffMs = responseDeadline.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffMs <= 0) return 'Overdue';
    if (diffHours > 0) return `${diffHours}h ${diffMinutes}m remaining`;
    return `${diffMinutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading your job assignments...</p>
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-16 w-16 text-success mb-4" />
          <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
          <p className="text-muted-foreground text-center">
            You don't have any pending job assignments at the moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pending Job Assignments</h2>
        <Badge variant="secondary">
          {assignments.length} pending
        </Badge>
      </div>

      {assignments.map((assignment) => {
        const booking = assignment.bookings;
        const responseDeadline = new Date(new Date(assignment.assigned_at).getTime() + 2 * 60 * 60 * 1000);
        const isOverdue = responseDeadline < new Date();
        
        return (
          <Card key={assignment.id} className={`${isOverdue ? 'border-destructive' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getPriorityIcon(assignment.status)}</span>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {booking.customer_name}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="secondary">
                        NORMAL Priority
                      </Badge>
                      <span className={`text-sm ${isOverdue ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                        {getTimeRemaining(assignment.assigned_at)}
                      </span>
                    </div>
                  </div>
                </div>
                {isOverdue && <AlertTriangle className="h-6 w-6 text-destructive" />}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Job Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{booking.service_address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(booking.service_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{booking.service_time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{booking.customer_phone || 'Contact admin'}</span>
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              {booking.special_instructions && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Special Instructions:</h4>
                  <p className="text-sm">{booking.special_instructions}</p>
                </div>
              )}

              {/* Admin Notes */}
              {assignment.subcontractor_notes && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold mb-2 text-blue-800">Notes from Admin:</h4>
                  <p className="text-sm text-blue-700">{assignment.subcontractor_notes}</p>
                </div>
              )}

              {/* Response Section */}
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4">Your Response</h4>
                
                <div className="space-y-4">
                  {/* Accept Section */}
                  <div className="border rounded-lg p-4 bg-green-50">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">Accept This Job</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Estimated arrival time</label>
                        <Select onValueChange={(value) => updateResponse(assignment.id, 'estimatedTime', value)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="When can you arrive?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes early</SelectItem>
                            <SelectItem value="0">Right on time</SelectItem>
                            <SelectItem value="-15">15 minutes late</SelectItem>
                            <SelectItem value="-30">30 minutes late</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                        <Textarea 
                          placeholder="Any questions or comments about this job..."
                          value={responses[assignment.id]?.notes || ''}
                          onChange={(e) => updateResponse(assignment.id, 'notes', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Decline Section */}
                  <div className="border rounded-lg p-4 bg-red-50">
                    <div className="flex items-center gap-2 mb-3">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-red-800">Decline This Job</span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Reason for declining</label>
                      <Select onValueChange={(value) => updateResponse(assignment.id, 'reason', value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Please select a reason" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="schedule_conflict">Schedule conflict</SelectItem>
                          <SelectItem value="too_far">Too far from my location</SelectItem>
                          <SelectItem value="not_available">Not available that day</SelectItem>
                          <SelectItem value="personal_reasons">Personal reasons</SelectItem>
                          <SelectItem value="other">Other (will explain separately)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={() => handleResponse(assignment.id, 'accept')}
                      disabled={responding === assignment.id}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept Job
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => handleResponse(assignment.id, 'decline')}
                      disabled={responding === assignment.id || !responses[assignment.id]?.reason}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Decline Job
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}