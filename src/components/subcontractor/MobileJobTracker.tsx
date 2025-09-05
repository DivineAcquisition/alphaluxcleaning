import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Camera, 
  MapPin, 
  CheckCircle, 
  Timer, 
  Upload,
  User,
  Phone
} from 'lucide-react';
import { useJobPhotos } from '@/hooks/useJobPhotos';

interface JobAssignment {
  id: string;
  booking: {
    id: string;
    customer_name: string;
    customer_phone: string;
    service_address: string;
    service_date: string;
    service_time: string;
    special_instructions?: string;
  };
  assignment: {
    id: string;
    status: string;
  };
}

interface JobTracking {
  id?: string;
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
}

export function MobileJobTracker() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { toast } = useToast();
  const { uploadPhotos } = useJobPhotos();

  const [job, setJob] = useState<JobAssignment | null>(null);
  const [tracking, setTracking] = useState<JobTracking>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);

  useEffect(() => {
    if (assignmentId) {
      fetchJobDetails();
    }
  }, [assignmentId]);

  const fetchJobDetails = async () => {
    try {
      // Fetch assignment details
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('subcontractor_job_assignments')
        .select(`
          id,
          status,
          bookings!inner (
            id,
            customer_name,
            customer_phone,
            service_address,
            service_date,
            service_time,
            special_instructions
          )
        `)
        .eq('id', assignmentId)
        .single();

      if (assignmentError) throw assignmentError;

      setJob({
        id: assignmentData.id,
        booking: Array.isArray(assignmentData.bookings) 
          ? assignmentData.bookings[0] 
          : assignmentData.bookings,
        assignment: {
          id: assignmentData.id,
          status: assignmentData.status
        }
      });

      // Fetch existing job tracking
      const { data: trackingData } = await supabase
        .from('job_tracking')
        .select('*')
        .eq('assignment_id', assignmentId)
        .single();

      if (trackingData) {
        setTracking(trackingData);
        setNotes(trackingData.notes || '');
      }

    } catch (error) {
      console.error('Error fetching job details:', error);
      toast({
        title: "Error",
        description: "Failed to load job details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!job || tracking.check_in_time) return;

    setProcessing(true);
    try {
      const checkInData = {
        assignment_id: assignmentId,
        subcontractor_id: null, // Will be set by database trigger
        order_id: job.booking.id,
        check_in_time: new Date().toISOString(),
        check_in_location: 'Location captured', // Simplified for Phase 3
        notes: notes || null
      };

      const { data, error } = await supabase
        .from('job_tracking')
        .insert(checkInData)
        .select()
        .single();

      if (error) throw error;

      setTracking(data);
      
      toast({
        title: "Checked In",
        description: `Successfully checked in at ${new Date().toLocaleTimeString()}`,
      });

    } catch (error) {
      console.error('Error checking in:', error);
      toast({
        title: "Error",
        description: "Failed to check in",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!job || !tracking.id || tracking.check_out_time) return;

    setProcessing(true);
    try {
      // Upload photos if any
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        photoUrls = await uploadPhotos(photos, assignmentId!, 'completion');
      }

      // Update tracking with check-out time
      const { data, error } = await supabase
        .from('job_tracking')
        .update({
          check_out_time: new Date().toISOString(),
          check_out_location: 'Location captured',
          notes: notes,
          photos: photoUrls
        })
        .eq('id', tracking.id)
        .select()
        .single();

      if (error) throw error;

      setTracking(data);

      // Update assignment status to completed
      await supabase
        .from('subcontractor_job_assignments')
        .update({ status: 'completed' })
        .eq('id', assignmentId);

      toast({
        title: "Checked Out",
        description: `Job completed at ${new Date().toLocaleTimeString()}`,
      });

    } catch (error) {
      console.error('Error checking out:', error);
      toast({
        title: "Error",
        description: "Failed to check out",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPhotos = Array.from(files);
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const getElapsedTime = () => {
    if (!tracking.check_in_time) return null;
    
    const start = new Date(tracking.check_in_time);
    const end = tracking.check_out_time ? new Date(tracking.check_out_time) : new Date();
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading job details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <h2 className="text-xl font-semibold mb-4 text-destructive">Job Not Found</h2>
            <p className="text-muted-foreground">
              Unable to find job assignment details.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCheckedIn = !!tracking.check_in_time;
  const isCheckedOut = !!tracking.check_out_time;
  const elapsedTime = getElapsedTime();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header with Status */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Job Status</CardTitle>
              <Badge 
                variant={isCheckedOut ? "default" : isCheckedIn ? "secondary" : "outline"}
                className="flex items-center gap-1"
              >
                {isCheckedOut ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    Completed
                  </>
                ) : isCheckedIn ? (
                  <>
                    <Timer className="h-3 w-3" />
                    In Progress
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3" />
                    Ready to Start
                  </>
                )}
              </Badge>
            </div>
            {elapsedTime && (
              <p className="text-sm text-muted-foreground">
                Duration: {elapsedTime}
              </p>
            )}
          </CardHeader>
        </Card>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Customer</Label>
                  <p className="text-sm">{job.booking.customer_name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm">{job.booking.customer_phone}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Address</Label>
                  <p className="text-sm">{job.booking.service_address}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Scheduled</Label>
                  <p className="text-sm">
                    {new Date(job.booking.service_date).toLocaleDateString()} at {job.booking.service_time}
                  </p>
                </div>
              </div>

              {job.booking.special_instructions && (
                <div>
                  <Label className="text-sm font-medium">Special Instructions</Label>
                  <p className="text-sm bg-muted p-3 rounded-lg">
                    {job.booking.special_instructions}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Job Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add job notes, observations, or customer feedback..."
              rows={3}
              disabled={isCheckedOut}
            />
          </CardContent>
        </Card>

        {/* Photo Upload Section */}
        {isCheckedIn && !isCheckedOut && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
                {photos.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {photos.length} photo(s) selected for upload
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          {!isCheckedIn ? (
            <Button 
              onClick={handleCheckIn}
              disabled={processing}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6"
              size="lg"
            >
              {processing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Checking In...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Check In
                </div>
              )}
            </Button>
          ) : !isCheckedOut ? (
            <Button 
              onClick={handleCheckOut}
              disabled={processing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6"
              size="lg"
            >
              {processing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Checking Out...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Check Out & Complete
                </div>
              )}
            </Button>
          ) : (
            <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-800 mb-1">Job Completed!</h3>
              <p className="text-sm text-green-600">
                Checked out at {new Date(tracking.check_out_time!).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}