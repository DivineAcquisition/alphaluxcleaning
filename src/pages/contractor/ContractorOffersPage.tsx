import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  MapPin, 
  DollarSign, 
  Calendar,
  CheckCircle,
  X
} from 'lucide-react';
import { useContractorJobs } from '@/hooks/useContractorJobs';

export default function ContractorOffersPage() {
  const { jobs, loading, respondToAssignment } = useContractorJobs();

  const pendingOffers = jobs?.filter(job => job.assignment?.acceptance_status === 'pending') || [];

  const handleAccept = async (assignmentId: string) => {
    await respondToAssignment(assignmentId, 'accept');
  };

  const handleDecline = async (assignmentId: string) => {
    await respondToAssignment(assignmentId, 'decline');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Job Offers</h1>
        <p className="text-muted-foreground">Accept or decline job assignments</p>
      </div>

      {/* Job Offers */}
      {pendingOffers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No pending offers</h3>
                <p className="text-muted-foreground">Check back later for new job assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingOffers.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{job.service_type}</h3>
                      <Badge variant="secondary">
                        {job.assignment?.acceptance_status || 'pending'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {job.client?.address_json?.address || 'Address not specified'}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(job.scheduled_start).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {new Date(job.scheduled_start).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        ${job.price_quote || 0}
                      </div>
                    </div>

                    {job.instructions_text && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <strong>Instructions:</strong> {job.instructions_text}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button 
                      size="sm" 
                      className="gap-2"
                      onClick={() => handleAccept(job.assignment?.id || '')}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Accept
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => handleDecline(job.assignment?.id || '')}
                    >
                      <X className="h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}