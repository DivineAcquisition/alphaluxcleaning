import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  MapPin, 
  User, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Phone,
  Mail,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface JobAssignmentCenterProps {
  data: any;
}

export function JobAssignmentCenter({ data }: JobAssignmentCenterProps) {
  const [assigningBookingId, setAssigningBookingId] = useState<string | null>(null);
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const { toast } = useToast();

  const unassignedJobs = data?.unassignedJobs || [];
  const availableSubcontractors = data?.availableSubcontractors || [];
  const activeAssignments = data?.activeAssignments || [];

  const handleSmartAssignment = async (bookingId: string) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('smart-job-assignment', {
        body: { bookingId }
      });

      if (error) throw error;

      toast({
        title: "Smart Assignment Complete",
        description: `Job assigned to ${result.subcontractorName} based on AI recommendations`,
      });
    } catch (error: any) {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign job automatically",
        variant: "destructive",
      });
    }
  };

  const handleManualAssignment = async (bookingId: string) => {
    if (!selectedSubcontractor) {
      toast({
        title: "Error",
        description: "Please select a subcontractor",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('assign-job-manual', {
        body: {
          bookingId,
          subcontractorId: selectedSubcontractor,
          notes: assignmentNotes
        }
      });

      if (error) throw error;

      toast({
        title: "Assignment Complete",
        description: "Job assigned successfully!",
      });
      
      setAssigningBookingId(null);
      setSelectedSubcontractor('');
      setAssignmentNotes('');
    } catch (error: any) {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign job",
        variant: "destructive",
      });
    }
  };

  const getRecommendedSubcontractors = (job: any) => {
    // Simple recommendation logic - in production this would be more sophisticated
    return availableSubcontractors
      .filter((sub: any) => sub.is_available)
      .sort((a: any, b: any) => {
        // Prioritize by location proximity and rating
        return (b.rating || 0) - (a.rating || 0);
      })
      .slice(0, 3);
  };

  return (
    <div className="space-y-6">
      {/* Assignment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned Jobs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unassignedJobs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Cleaners</CardTitle>
            <User className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableSubcontractors.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeAssignments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignment Rate</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {unassignedJobs.length > 0 ? 
                Math.round((activeAssignments.length / (activeAssignments.length + unassignedJobs.length)) * 100) : 100}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unassigned Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            Unassigned Jobs ({unassignedJobs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unassignedJobs.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-muted-foreground">All jobs are assigned! Great work.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {unassignedJobs.map((job: any) => (
                <div 
                  key={job.id} 
                  className="border rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <User className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">{job.customer_name}</h4>
                        <Badge variant={job.priority === 'high' ? 'destructive' : 'secondary'}>
                          {job.priority || 'normal'} priority
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(job.service_date).toLocaleDateString()}</span>
                            <Clock className="h-4 w-4 ml-2" />
                            <span>{job.service_time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4" />
                            <span className="text-muted-foreground">{job.service_address}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4" />
                            <span>{job.customer_phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4" />
                            <span className="text-muted-foreground">{job.customer_email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Recommended Subcontractors */}
                      <div className="mb-4">
                        <h5 className="text-sm font-medium mb-2">AI Recommendations:</h5>
                        <div className="flex gap-2">
                          {getRecommendedSubcontractors(job).map((sub: any) => (
                            <Badge key={sub.id} variant="outline" className="text-xs">
                              {sub.full_name} (⭐ {sub.rating})
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {assigningBookingId === job.id && (
                        <div className="space-y-3 bg-background border rounded-lg p-4 mb-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Assign to Subcontractor</label>
                            <Select value={selectedSubcontractor} onValueChange={setSelectedSubcontractor}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select subcontractor..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableSubcontractors.map((sub: any) => (
                                  <SelectItem key={sub.id} value={sub.id}>
                                    <div className="flex justify-between items-center w-full">
                                      <span>{sub.full_name}</span>
                                      <span className="text-sm text-muted-foreground ml-2">
                                        ⭐ {sub.rating} • ${sub.hourly_rate}/hr
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium mb-2 block">Assignment Notes (Optional)</label>
                            <Textarea
                              value={assignmentNotes}
                              onChange={(e) => setAssignmentNotes(e.target.value)}
                              placeholder="Any additional instructions for the subcontractor..."
                              rows={2}
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button onClick={() => handleManualAssignment(job.id)} size="sm">
                              Assign Job
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setAssigningBookingId(null);
                                setSelectedSubcontractor('');
                                setAssignmentNotes('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      {assigningBookingId === job.id ? null : (
                        <>
                          <Button 
                            onClick={() => handleSmartAssignment(job.id)}
                            className="flex items-center gap-2"
                            size="sm"
                          >
                            <Zap className="h-4 w-4" />
                            Smart Assign
                          </Button>
                          <Button 
                            onClick={() => setAssigningBookingId(job.id)}
                            variant="outline"
                            size="sm"
                          >
                            Manual Assign
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-500" />
            Active Assignments ({activeAssignments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeAssignments.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No active assignments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAssignments.map((assignment: any) => (
                <div key={assignment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="h-4 w-4 text-primary" />
                        <h4 className="font-medium">{assignment.bookings?.customer_name}</h4>
                        <Badge variant={assignment.status === 'accepted' ? 'default' : 'secondary'}>
                          {assignment.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Customer: {assignment.bookings?.customer_name}</p>
                          <p className="text-muted-foreground">Address: {assignment.bookings?.service_address}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Assigned to: {assignment.subcontractors?.full_name}</p>
                          <p className="text-muted-foreground">Rating: ⭐ {assignment.subcontractors?.rating}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}