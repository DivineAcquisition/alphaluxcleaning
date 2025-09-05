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
import { Separator } from '@/components/ui/separator';
import { MapPin, Clock, DollarSign, User, Phone, Calendar, Camera, Upload } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';

interface JobDetails {
  booking: {
    id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    service_address: string;
    service_date: string;
    service_time: string;
    special_instructions?: string;
    estimated_duration?: number;
  };
  assignment: {
    id: string;
    status: string;
    priority: string;
    expires_at: string;
  };
  subcontractor: {
    id: string;
    full_name: string;
  };
}

interface ResponseData {
  estimatedDuration?: number;
  declineReason?: string;
  notes?: string;
  photos?: string[];
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

export function EnhancedJobAcceptance() {
  const { token, action } = useParams<{ token: string; action: string }>();
  const { toast } = useToast();
  const { location, error: locationError, requestLocation } = useGeolocation();
  
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responseData, setResponseData] = useState<ResponseData>({});
  const [photos, setPhotos] = useState<File[]>([]);

  useEffect(() => {
    if (token && action) {
      validateTokenAndFetchJob();
    }
  }, [token, action]);

  const validateTokenAndFetchJob = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-job-token', {
        body: { token, action }
      });

      if (error) throw error;

      if (!data.valid) {
        toast({
          title: "Invalid Token",
          description: data.message,
          variant: "destructive"
        });
        return;
      }

      setJobDetails(data.jobDetails);
    } catch (error) {
      console.error('Error validating token:', error);
      toast({
        title: "Error",
        description: "Failed to load job details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPhotos = Array.from(files);
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return [];
    
    const uploadedUrls: string[] = [];
    
    for (const photo of photos) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `job-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('job-photos')
        .upload(filePath, photo);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('job-photos')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        uploadedUrls.push(urlData.publicUrl);
      }
    }
    
    return uploadedUrls;
  };

  const handleResponse = async (responseType: 'accept' | 'decline') => {
    if (!jobDetails) return;

    setSubmitting(true);
    
    try {
      // Request location if accepting
      if (responseType === 'accept' && !location) {
        await requestLocation();
      }

      // Upload photos if any
      const photoUrls = await uploadPhotos();

      const payload = {
        token,
        action: responseType,
        ...responseData,
        photos: photoUrls,
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy
        } : undefined
      };

      const { data, error } = await supabase.functions.invoke('subcontractor-response', {
        body: payload
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: responseType === 'accept' ? "Job Accepted!" : "Job Declined",
          description: data.message,
          variant: responseType === 'accept' ? "default" : "destructive"
        });

        // Redirect or show success message
        setTimeout(() => {
          window.close(); // If opened in new tab
        }, 2000);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Response error:', error);
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
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

  if (!jobDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <h2 className="text-xl font-semibold mb-4 text-destructive">Invalid Request</h2>
            <p className="text-muted-foreground">
              This job assignment link is invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAccepting = action === 'accept';
  const expiresAt = new Date(jobDetails.assignment.expires_at);
  const isExpired = expiresAt < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                {isAccepting ? 'Accept Job Assignment' : 'Decline Job Assignment'}
              </CardTitle>
              <Badge variant={isExpired ? "destructive" : "secondary"}>
                {isExpired ? 'Expired' : jobDetails.assignment.priority}
              </Badge>
            </div>
            {!isExpired && (
              <p className="text-sm text-muted-foreground">
                Expires: {expiresAt.toLocaleString()}
              </p>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium">Customer</Label>
                    <p className="text-sm">{jobDetails.booking.customer_name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm">{jobDetails.booking.customer_phone}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium">Date & Time</Label>
                    <p className="text-sm">
                      {new Date(jobDetails.booking.service_date).toLocaleDateString()} at {jobDetails.booking.service_time}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium">Estimated Duration</Label>
                    <p className="text-sm">{jobDetails.booking.estimated_duration || 'TBD'} hours</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location */}
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <Label className="text-sm font-medium">Service Address</Label>
                <p className="text-sm">{jobDetails.booking.service_address}</p>
              </div>
            </div>

            {/* Special Instructions */}
            {jobDetails.booking.special_instructions && (
              <div>
                <Label className="text-sm font-medium">Special Instructions</Label>
                <p className="text-sm bg-muted p-3 rounded-lg mt-1">
                  {jobDetails.booking.special_instructions}
                </p>
              </div>
            )}

            <Separator />

            {/* Response Form */}
            <div className="space-y-4">
              {isAccepting ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="estimatedDuration">Your Estimated Duration (hours)</Label>
                    <Input
                      id="estimatedDuration"
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="12"
                      value={responseData.estimatedDuration || ''}
                      onChange={(e) => setResponseData(prev => ({
                        ...prev,
                        estimatedDuration: parseFloat(e.target.value)
                      }))}
                      placeholder="e.g., 2.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="photos">Upload Photos (optional)</Label>
                    <div className="space-y-2">
                      <Input
                        id="photos"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                      />
                      {photos.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {photos.length} photo(s) selected
                        </p>
                      )}
                    </div>
                  </div>

                  {locationError && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        Location access denied. You can still accept the job, but location verification is recommended.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <Label htmlFor="declineReason">Reason for Declining</Label>
                  <Textarea
                    id="declineReason"
                    value={responseData.declineReason || ''}
                    onChange={(e) => setResponseData(prev => ({
                      ...prev,
                      declineReason: e.target.value
                    }))}
                    placeholder="Please provide a reason for declining this job..."
                    rows={3}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="notes">Additional Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={responseData.notes || ''}
                  onChange={(e) => setResponseData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  placeholder="Any additional information..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={() => handleResponse(isAccepting ? 'accept' : 'decline')}
                disabled={submitting || isExpired}
                className={`flex-1 ${isAccepting ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isAccepting ? <Upload className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                    {isAccepting ? 'Accept Job' : 'Decline Job'}
                  </div>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.close()}
                disabled={submitting}
                className="flex-1 sm:flex-initial sm:px-8"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}