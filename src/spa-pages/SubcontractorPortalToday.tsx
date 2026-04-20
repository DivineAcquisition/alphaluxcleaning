import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSubcontractorPortal } from '@/hooks/useSubcontractorPortal';
import { 
  MapPin, 
  Clock, 
  Phone, 
  Camera, 
  CheckCircle, 
  Circle,
  Navigation,
  User,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

export default function SubcontractorPortalToday() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState<Record<string, boolean>>({});
  
  const {
    todaysJobs,
    upcomingJobs,
    loading,
    checkIn,
    checkOut,
  } = useSubcontractorPortal();

  const handleCheckIn = async (bookingId: string) => {
    setCheckingIn(prev => ({ ...prev, [bookingId]: true }));
    
    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      await checkIn(
        bookingId,
        position.coords.latitude,
        position.coords.longitude,
        'Checked in via mobile portal'
      );
    } catch (error: any) {
      console.error('Check-in error:', error);
    } finally {
      setCheckingIn(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleCheckOut = async (bookingId: string) => {
    setCheckingIn(prev => ({ ...prev, [bookingId]: true }));
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      await checkOut(
        bookingId,
        position.coords.latitude,
        position.coords.longitude,
        'Checked out via mobile portal'
      );
    } catch (error: any) {
      console.error('Check-out error:', error);
    } finally {
      setCheckingIn(prev => ({ ...prev, [bookingId]: false }));
    }
  };

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

  const JobCard = ({ job, isToday = false }: { job: any, isToday?: boolean }) => (
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
          <Badge variant={getStatusColor(job.status)}>
            {job.status?.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Customer & Location */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{job.customer_name}</span>
            {job.customer_phone && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open(`tel:${job.customer_phone}`)}
                className="p-1 h-6 w-6"
              >
                <Phone className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm">{job.service_address}</p>
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
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Duration:</span>
            <span className="ml-2 font-medium">{job.estimated_duration || 120} min</span>
          </div>
          {job.subcontractor_payout_amount && (
            <div>
              <span className="text-muted-foreground">Payout:</span>
              <span className="ml-2 font-medium text-green-600">
                ${job.subcontractor_payout_amount.toFixed(2)}
              </span>
            </div>
          )}
          {job.entered_sqft && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Size:</span>
              <span className="ml-2 font-medium">{job.entered_sqft} sq ft</span>
            </div>
          )}
        </div>

        {/* Special Instructions */}
        {job.special_instructions && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
              Special Instructions:
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
                onClick={() => handleCheckIn(job.id)}
                disabled={checkingIn[job.id]}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {checkingIn[job.id] ? 'Checking In...' : 'Check In'}
              </Button>
            ) : job.status === 'in_progress' ? (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`/jobs/${job.id}/photos`, '_blank')}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Photos
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleCheckOut(job.id)}
                  disabled={checkingIn[job.id]}
                >
                  <Circle className="h-4 w-4 mr-2" />
                  {checkingIn[job.id] ? 'Checking Out...' : 'Check Out'}
                </Button>
              </>
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

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-2 bg-muted rounded"></div>
                  <div className="h-2 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 pb-20">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">
          Today's Schedule
        </h1>
        <p className="text-muted-foreground">
          {format(new Date(), 'EEEE, MMMM do, yyyy')}
        </p>
      </div>

      {/* Today's Jobs */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Today's Jobs ({todaysJobs.length})
        </h2>
        
        {todaysJobs.length > 0 ? (
          <div className="space-y-4">
            {todaysJobs.map((job) => (
              <JobCard key={job.id} job={job} isToday={true} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No jobs scheduled for today</h3>
              <p className="text-muted-foreground text-center">
                Enjoy your day off! Check back tomorrow for new assignments.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upcoming Jobs */}
      {upcomingJobs.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Upcoming Jobs ({upcomingJobs.length})
            </h2>
            
            <div className="space-y-4">
              {upcomingJobs.map((job) => (
                <div key={job.id} className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground min-w-20">
                    {format(new Date(job.service_date), 'MMM dd')}
                  </div>
                  <div className="flex-1">
                    <JobCard job={job} isToday={false} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}