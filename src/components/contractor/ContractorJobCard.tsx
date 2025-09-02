import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign, FileText } from "lucide-react";
import { ContractorJob } from "@/hooks/useContractorJobs";
import { format } from "date-fns";

interface ContractorJobCardProps {
  job: ContractorJob;
  onAccept?: (assignmentId: string) => void;
  onDecline?: (assignmentId: string) => void;
}

export function ContractorJobCard({ job, onAccept, onDecline }: ContractorJobCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'awaiting_acceptance':
        return 'outline';
      case 'assigned':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getAcceptanceStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'default';
      case 'declined':
        return 'destructive';
      case 'expired':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatDateTime = (dateTime: string) => {
    return format(new Date(dateTime), 'MMM d, yyyy h:mm a');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{job.service_type}</CardTitle>
          <div className="flex gap-2">
            <Badge variant={getStatusColor(job.status)}>
              {job.status.replace('_', ' ').toUpperCase()}
            </Badge>
            {job.assignment && (
              <Badge variant={getAcceptanceStatusColor(job.assignment.acceptance_status)}>
                {job.assignment.acceptance_status.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>
        {job.client && (
          <p className="text-sm text-muted-foreground">{job.client.name}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formatDateTime(job.scheduled_start)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>
              {formatCurrency(job.assignment?.pay_override_value || job.price_quote)} 
              {job.pricing_model === 'hourly' ? '/hour' : ''}
            </span>
          </div>
          
          {job.location_json?.address && (
            <div className="flex items-center gap-2 text-sm col-span-full">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{job.location_json.address}</span>
            </div>
          )}
          
          {job.instructions_text && (
            <div className="flex items-start gap-2 text-sm col-span-full">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span>{job.instructions_text}</span>
            </div>
          )}
        </div>
        
        {job.assignment && job.assignment.acceptance_status === 'pending' && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={() => onAccept?.(job.assignment!.id)}
              className="flex-1"
              size="sm"
            >
              Accept Job
            </Button>
            <Button
              onClick={() => onDecline?.(job.assignment!.id)}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              Decline
            </Button>
          </div>
        )}
        
        {job.assignment?.acceptance_at && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Response: {formatDateTime(job.assignment.acceptance_at)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}