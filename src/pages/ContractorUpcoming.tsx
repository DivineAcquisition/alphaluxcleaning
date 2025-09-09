import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Clock, DollarSign, CheckCircle, X, AlertCircle } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { useSubcontractorPortal } from '@/hooks/useSubcontractorPortal';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { toast } from 'sonner';

export default function ContractorUpcoming() {
  const { upcomingJobs, respondToAssignment, loading } = useSubcontractorPortal();
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  const handleJobResponse = async (assignmentId: string, action: 'accept' | 'decline') => {
    setRespondingTo(assignmentId);
    try {
      await respondToAssignment(assignmentId, action);
      toast.success(`Job ${action}ed successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} job`);
    } finally {
      setRespondingTo(null);
    }
  };

  const getDateBadge = (date: string) => {
    const jobDate = new Date(date);
    if (isToday(jobDate)) return { label: 'Today', variant: 'default' as const };
    if (isTomorrow(jobDate)) return { label: 'Tomorrow', variant: 'secondary' as const };
    return { label: format(jobDate, 'MMM d'), variant: 'outline' as const };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending Response', variant: 'secondary' as const, icon: AlertCircle };
      case 'accepted':
        return { label: 'Accepted', variant: 'default' as const, icon: CheckCircle };
      case 'declined':
        return { label: 'Declined', variant: 'destructive' as const, icon: X };
      default:
        return { label: status, variant: 'outline' as const };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading upcoming jobs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Upcoming Jobs</h1>
            <p className="text-muted-foreground">
              Review and respond to your upcoming assignments
            </p>
          </div>

          {upcomingJobs.length === 0 ? (
            <Card>
              <CardContent className="pt-8 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Upcoming Jobs</h3>
                <p className="text-muted-foreground">
                  You don't have any upcoming assignments. Check back later for new opportunities!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingJobs.map((job) => {
                const dateBadge = getDateBadge(job.service_date);
                const statusBadge = getStatusBadge(job.status);
                const StatusIcon = statusBadge.icon;

                return (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={dateBadge.variant}>
                            {dateBadge.label}
                          </Badge>
                          <Badge variant={statusBadge.variant}>
                            {StatusIcon && <StatusIcon className="w-3 h-3 mr-1" />}
                            {statusBadge.label}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {job.id.slice(0, 8).toUpperCase()}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Calendar className="w-4 h-4 text-muted-foreground mt-1" />
                            <div>
                              <p className="font-medium">Date & Time</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(job.service_date), 'EEEE, MMM d, yyyy')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {job.service_time}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                            <div>
                              <p className="font-medium">Location</p>
                              <p className="text-sm text-muted-foreground">
                                {job.service_address}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <DollarSign className="w-4 h-4 text-muted-foreground mt-1" />
                            <div>
                              <p className="font-medium">Payout</p>
                              <p className="text-lg font-bold text-primary">
                                ${job.subcontractor_payout_amount?.toFixed(2) || '0.00'}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                Fixed Rate
                              </p>
                            </div>
                          </div>

                          {job.estimated_duration && (
                            <div className="flex items-start gap-3">
                              <Clock className="w-4 h-4 text-muted-foreground mt-1" />
                              <div>
                                <p className="font-medium">Duration</p>
                                <p className="text-sm text-muted-foreground">
                                  ~{Math.round(job.estimated_duration / 60)} hours
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {job.special_instructions && (
                        <>
                          <Separator />
                          <div>
                            <p className="font-medium mb-1">Special Instructions</p>
                            <p className="text-sm text-muted-foreground">
                              {job.special_instructions}
                            </p>
                          </div>
                        </>
                      )}

                      {job.status === 'pending' && (
                        <>
                          <Separator />
                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleJobResponse(job.id, 'accept')}
                              disabled={respondingTo === job.id}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              {respondingTo === job.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Accept Job
                            </Button>
                            
                            <Button
                              onClick={() => handleJobResponse(job.id, 'decline')}
                              disabled={respondingTo === job.id}
                              variant="outline"
                              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Decline
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}