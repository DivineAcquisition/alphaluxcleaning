import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TierProgressMobile } from '@/components/mobile/TierProgressMobile';
import { MobileNotificationCenter } from '@/components/mobile/MobileNotificationCenter';
import { useMobileCapabilities } from '@/hooks/useMobileCapabilities';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  Calendar, 
  Star, 
  Bell, 
  User, 
  Trophy,
  Camera,
  MapPin,
  Settings,
  Clock,
  CheckCircle,
  Phone,
  Navigation,
  MessageSquare,
  XCircle
} from 'lucide-react';

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
  const [subcontractorId, setSubcontractorId] = useState<string | null>(null);
  const { toast } = useToast();
  const { 
    isNative, 
    takePhoto, 
    selectPhoto, 
    getCurrentLocation, 
    requestPermissions,
    location 
  } = useMobileCapabilities();

  useEffect(() => {
    if (user) {
      fetchSubcontractorData();
      if (isNative) {
        requestPermissions();
      }
    }
  }, [user, isNative]);

  const fetchSubcontractorData = async () => {
    try {
      // First get subcontractor ID
      const { data: subData, error: subError } = await supabase
        .from('subcontractors')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (subError) throw subError;
      setSubcontractorId(subData.id);

      // Then fetch today's jobs
      await fetchTodaysJobs(subData.id);
    } catch (error) {
      console.error('Error fetching subcontractor data:', error);
      toast({
        title: "Error",
        description: "Failed to load your data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaysJobs = async (contractorId?: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const id = contractorId || subcontractorId;
      
      if (!id) return;

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
        .eq('subcontractor_id', id)
        .eq('status', 'assigned')
        .eq('bookings.service_date', today);

      if (error) throw error;
      setTodaysJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleCheckIn = async (jobId: string) => {
    try {
      const currentLocation = await getCurrentLocation();
      if (!currentLocation) return;
      
      const locationString = `${currentLocation.lat},${currentLocation.lng}`;
      
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

      await fetchTodaysJobs();
      toast({
        title: "Checked In",
        description: "Successfully checked in to the job"
      });
    } catch (error) {
      console.error('Error checking in:', error);
      toast({
        title: "Error",
        description: "Failed to check in",
        variant: "destructive"
      });
    }
  };

  const handleCheckOut = async (jobId: string) => {
    try {
      const currentLocation = await getCurrentLocation();
      if (!currentLocation) return;
      
      const locationString = `${currentLocation.lat},${currentLocation.lng}`;
      
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

      await fetchTodaysJobs();
      toast({
        title: "Checked Out",
        description: "Successfully completed the job"
      });
    } catch (error) {
      console.error('Error checking out:', error);
      toast({
        title: "Error",
        description: "Failed to check out",
        variant: "destructive"
      });
    }
  };

  const handleTakePhoto = async (jobId: string) => {
    try {
      const photoData = await takePhoto();
      if (photoData) {
        // Here you would upload to Supabase Storage
        console.log(`Photo taken for job ${jobId}:`, photoData);
        toast({
          title: "Photo Captured",
          description: "Photo has been saved"
        });
      }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Bay Area Cleaning Pros</h1>
            <p className="text-sm opacity-90">Mobile Dashboard</p>
          </div>
          {isNative && (
            <Badge variant="secondary" className="bg-white/20 text-white">
              Mobile App
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <Tabs defaultValue="jobs" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="jobs" className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Jobs
            </TabsTrigger>
            <TabsTrigger value="tier" className="flex items-center">
              <Trophy className="h-4 w-4 mr-1" />
              Tier
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center">
              <Bell className="h-4 w-4 mr-1" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Today's Jobs</h2>
                <Badge variant="outline">
                  {todaysJobs.length} {todaysJobs.length === 1 ? 'Job' : 'Jobs'}
                </Badge>
              </div>

              {todaysJobs.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No jobs scheduled for today</p>
                  </CardContent>
                </Card>
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
                            onClick={() => handleTakePhoto(job.id)}
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
          </TabsContent>

          <TabsContent value="tier" className="mt-6">
            {subcontractorId ? (
              <TierProgressMobile subcontractorId={subcontractorId} />
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">Loading tier information...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            {subcontractorId ? (
              <MobileNotificationCenter subcontractorId={subcontractorId} />
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">Loading notifications...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile & Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Welcome, {user?.email}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Bay Area Cleaning Pros Subcontractor
                  </p>
                  {isNative && (
                    <Badge variant="secondary" className="mb-4">
                      Native Mobile App
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Star className="h-4 w-4 mr-2" />
                    Rate App
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Safe Area for mobile */}
      <div className="h-6"></div>
    </div>
  );
}