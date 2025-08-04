import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Clock, 
  User, 
  Calendar,
  CheckCircle,
  XCircle,
  Phone,
  Navigation,
  Camera,
  MessageSquare
} from "lucide-react";
import { Geolocation } from '@capacitor/geolocation';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';

interface JobAssignment {
  id: string;
  booking_id: string;
  status: string;
  assigned_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  subcontractor_notes: string | null;
  bookings: {
    customer_name: string;
    customer_phone: string;
    service_address: string;
    service_date: string;
    service_time: string;
    special_instructions: string;
  };
}

export default function SubcontractorMobile() {
  const { user } = useAuth();
  const [todaysJobs, setTodaysJobs] = useState<JobAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (user) {
      fetchTodaysJobs();
      getCurrentLocation();
    }
  }, [user]);

  const fetchTodaysJobs = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('subcontractor_job_assignments')
        .select(`
          *,
          bookings:booking_id (
            customer_name,
            customer_phone,
            service_address,
            service_date,
            service_time,
            special_instructions
          )
        `)
        .eq('status', 'assigned')
        .eq('bookings.service_date', today);

      if (error) throw error;
      setTodaysJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      setLocation({
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleCheckIn = async (jobId: string) => {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      const locationString = `${coordinates.coords.latitude},${coordinates.coords.longitude}`;
      
      const { error } = await supabase
        .from('job_tracking')
        .insert({
          assignment_id: jobId,
          check_in_time: new Date().toISOString(),
          check_in_location: locationString
        });

      if (error) throw error;
      
      // Update job status
      await supabase
        .from('subcontractor_job_assignments')
        .update({ 
          status: 'in_progress',
          accepted_at: new Date().toISOString()
        })
        .eq('id', jobId);

      fetchTodaysJobs();
    } catch (error) {
      console.error('Error checking in:', error);
    }
  };

  const handleCheckOut = async (jobId: string) => {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      const locationString = `${coordinates.coords.latitude},${coordinates.coords.longitude}`;
      
      const { error } = await supabase
        .from('job_tracking')
        .update({
          check_out_time: new Date().toISOString(),
          check_out_location: locationString
        })
        .eq('assignment_id', jobId);

      if (error) throw error;
      
      // Update job status
      await supabase
        .from('subcontractor_job_assignments')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);

      fetchTodaysJobs();
    } catch (error) {
      console.error('Error checking out:', error);
    }
  };

  const takePhoto = async (jobId: string, type: 'before' | 'after') => {
    try {
      const image = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      // In a real app, you'd upload this to Supabase Storage
      console.log(`${type} photo taken for job ${jobId}:`, image.dataUrl);
      
      // For now, just log - you'd implement storage upload here
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  const getDirections = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    if (location) {
      window.open(`https://maps.google.com/maps?saddr=${location.lat},${location.lng}&daddr=${encodedAddress}`, '_blank');
    } else {
      window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
    }
  };

  const formatTime = (timeString: string) => {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Mobile Header */}
      <div className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Today's Jobs</h1>
            <p className="text-sm opacity-90">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white">
            {todaysJobs.length} Jobs
          </Badge>
        </div>
      </div>

      {/* Jobs List */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading today's jobs...</p>
          </div>
        ) : todaysJobs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No jobs scheduled for today</p>
          </div>
        ) : (
          todaysJobs.map((job) => (
            <Card key={job.id} className="shadow-md">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{job.bookings.customer_name}</CardTitle>
                  <Badge 
                    variant={job.status === 'assigned' ? 'default' : 
                            job.status === 'in_progress' ? 'secondary' : 'outline'}
                  >
                    {job.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Time and Location */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatTime(job.bookings.service_time)}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="flex-1">{job.bookings.service_address}</span>
                  </div>
                </div>

                {/* Customer Contact */}
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`tel:${job.bookings.customer_phone}`}
                    className="text-primary hover:underline"
                  >
                    {job.bookings.customer_phone}
                  </a>
                </div>

                {/* Special Instructions */}
                {job.bookings.special_instructions && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Special Instructions
                        </p>
                        <p className="text-sm">{job.bookings.special_instructions}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => getDirections(job.bookings.service_address)}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    {job.status === 'assigned' && (
                      <Button
                        className="flex-1"
                        onClick={() => handleCheckIn(job.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Check In
                      </Button>
                    )}
                    
                    {job.status === 'in_progress' && (
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleCheckOut(job.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Check Out
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={() => takePhoto(job.id, 'before')}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Photo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Bottom Safe Area */}
      <div className="h-safe"></div>
    </div>
  );
}