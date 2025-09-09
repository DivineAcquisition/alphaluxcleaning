import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  Phone, 
  Camera, 
  CheckCircle, 
  Circle,
  Navigation,
  User,
  DollarSign,
  Home
} from 'lucide-react';
import { format } from 'date-fns';

export interface JobCardProps {
  job: {
    id: string;
    service_date: string;
    service_time: string;
    service_address: string;
    customer_name: string;
    customer_phone?: string;
    special_instructions?: string;
    estimated_duration: number;
    status: string;
    entered_sqft?: number;
    subcontractor_payout_amount?: number;
    services?: {
      name: string;
      description?: string;
    };
  };
  isToday?: boolean;
  onCheckIn?: (jobId: string) => void;
  onCheckOut?: (jobId: string) => void;
  onViewPhotos?: (jobId: string) => void;
  checkingInOut?: boolean;
}

export function JobCard({ 
  job, 
  isToday = false, 
  onCheckIn, 
  onCheckOut, 
  onViewPhotos,
  checkingInOut = false 
}: JobCardProps) {
  const openMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'in_progress': return 'secondary';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <Circle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4 animate-pulse" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {job.service_time || 'Time TBD'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {job.services?.name || 'Standard Cleaning'}
            </p>
          </div>
          <Badge variant={getStatusColor(job.status)} className="flex items-center gap-1">
            {getStatusIcon(job.status)}
            {job.status?.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Customer & Location */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{job.customer_name}</span>
            {job.customer_phone && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open(`tel:${job.customer_phone}`)}
                className="p-1 h-6 w-6 ml-auto"
              >
                <Phone className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm break-words">{job.service_address}</p>
              <Button
                size="sm"
                variant="link"
                className="h-auto p-0 text-xs text-primary"
                onClick={() => openMaps(job.service_address)}
              >
                <Navigation className="h-3 w-3 mr-1" />
                Open in Maps
              </Button>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-medium">{job.estimated_duration || 120}min</span>
          </div>
          
          {job.subcontractor_payout_amount && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-3 w-3 text-green-600" />
              <span className="text-muted-foreground">Payout:</span>
              <span className="font-medium text-green-600">
                ${job.subcontractor_payout_amount.toFixed(2)}
              </span>
            </div>
          )}
          
          {job.entered_sqft && (
            <div className="flex items-center gap-2 col-span-2">
              <Home className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Size:</span>
              <span className="font-medium">{job.entered_sqft} sq ft</span>
            </div>
          )}
        </div>

        {/* Special Instructions */}
        {job.special_instructions && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
              ⚠️ Special Instructions:
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {job.special_instructions}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {isToday && (
          <div className="flex gap-2 pt-2">
            {job.status === 'confirmed' ? (
              <Button
                className="flex-1"
                onClick={() => onCheckIn?.(job.id)}
                disabled={checkingInOut}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {checkingInOut ? 'Checking In...' : 'Check In & Start'}
              </Button>
            ) : job.status === 'in_progress' ? (
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onViewPhotos?.(job.id)}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Photos
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => onCheckOut?.(job.id)}
                  disabled={checkingInOut}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {checkingInOut ? 'Checking Out...' : 'Complete Job'}
                </Button>
              </div>
            ) : job.status === 'completed' ? (
              <Button
                variant="outline"
                className="w-full"
                disabled
              >
                ✅ Job Completed
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(`/jobs/${job.id}`, '_blank')}
              >
                View Details
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}