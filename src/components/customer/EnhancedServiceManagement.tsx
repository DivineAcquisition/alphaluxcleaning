import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomerServiceCard } from '@/components/customer/CustomerServiceCard';
import { ChatFallback } from '@/components/customer/ChatFallback';
import { useCustomerData } from '@/hooks/useCustomerData';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  Star, 
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Camera,
  Upload
} from 'lucide-react';
import { format, isFuture, isPast } from 'date-fns';

export function EnhancedServiceManagement() {
  const { orders, bookings, refreshAll } = useCustomerData();
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState<any>(null);
  const [actionType, setActionType] = useState<'reschedule' | 'cancel' | 'rate' | 'details' | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const upcomingServices = bookings.filter(booking => 
    booking.status === 'confirmed' && isFuture(new Date(booking.service_date))
  );

  const completedServices = [...orders, ...bookings]
    .filter(item => {
      const status = item.status || ('service_status' in item ? item.service_status : null);
      const date = 'scheduled_date' in item ? item.scheduled_date : item.service_date;
      return status === 'completed' || status === 'paid' || (date && isPast(new Date(date)));
    })
    .sort((a, b) => {
      const aDate = new Date(a.updated_at || a.created_at);
      const bDate = new Date(b.updated_at || b.created_at);
      return bDate.getTime() - aDate.getTime();
    });

  const handleReschedule = (serviceId: string) => {
    const service = [...orders, ...bookings].find(s => s.id === serviceId);
    setSelectedService(service);
    setActionType('reschedule');
  };

  const handleCancel = (serviceId: string) => {
    const service = [...orders, ...bookings].find(s => s.id === serviceId);
    setSelectedService(service);
    setActionType('cancel');
  };

  const handleRate = (serviceId: string) => {
    const service = [...orders, ...bookings].find(s => s.id === serviceId);
    setSelectedService(service);
    setActionType('rate');
  };

  const handleViewDetails = (serviceId: string) => {
    const service = [...orders, ...bookings].find(s => s.id === serviceId);
    setSelectedService(service);
    setActionType('details');
  };

  const submitReschedule = async () => {
    if (!selectedService || !rescheduleDate || !rescheduleTime) {
      toast({
        title: "Error",
        description: "Please select both date and time for rescheduling.",
        variant: "destructive"
      });
      return;
    }

    // TODO: Implement actual rescheduling API call
    toast({
      title: "Reschedule Requested",
      description: "We'll confirm your new time within 24 hours.",
    });
    
    closeDialog();
    refreshAll();
  };

  const submitCancellation = async () => {
    if (!selectedService) return;

    // TODO: Implement actual cancellation API call
    toast({
      title: "Service Cancelled",
      description: "Your service has been cancelled. Refunds will be processed within 3-5 business days.",
    });
    
    closeDialog();
    refreshAll();
  };

  const submitRating = async () => {
    if (!selectedService || rating === 0) {
      toast({
        title: "Error",
        description: "Please select a star rating.",
        variant: "destructive"
      });
      return;
    }

    // TODO: Implement actual rating API call
    toast({
      title: "Thank You!",
      description: "Your feedback helps us improve our service.",
    });
    
    closeDialog();
    refreshAll();
  };

  const closeDialog = () => {
    setSelectedService(null);
    setActionType(null);
    setRescheduleDate('');
    setRescheduleTime('');
    setCancelReason('');
    setRating(0);
    setFeedback('');
  };

  return (
    <div className="space-y-6">
      {/* Upcoming Services */}
      {upcomingServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Services ({upcomingServices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingServices.map((service) => (
                <CustomerServiceCard
                  key={service.id}
                  service={{
                    id: service.id,
                    service_date: service.service_date,
                    service_time: service.service_time,
                    status: service.status,
                    service_address: service.service_address,
                    special_instructions: service.special_instructions,
                    estimated_duration: service.estimated_duration,
                    square_footage: (service as any).service_details?.square_footage || (service as any).service_details?.squareFootage
                  }}
                  type="upcoming"
                  onReschedule={handleReschedule}
                  onCancel={handleCancel}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Services */}
      {completedServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Service History ({completedServices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedServices.slice(0, 5).map((service, index) => (
                  <CustomerServiceCard
                    key={`${service.id}-${index}`}
                    service={{
                      id: service.id,
                      scheduled_date: 'scheduled_date' in service ? service.scheduled_date : undefined,
                      service_date: 'service_date' in service ? service.service_date : undefined,
                      scheduled_time: 'scheduled_time' in service ? service.scheduled_time : undefined,
                      service_time: 'service_time' in service ? service.service_time : undefined,
                      status: service.status,
                      service_address: 'service_address' in service ? service.service_address : undefined,
                      amount: 'amount' in service ? service.amount : undefined,
                      // Parse service details for orders (with safe access)
                      cleaning_type: 'cleaning_type' in service ? service.cleaning_type : 
                        ((service as any).service_details?.cleaning_type || (service as any).service_details?.serviceType),
                      square_footage: (service as any).service_details?.square_footage || (service as any).service_details?.squareFootage,
                      add_ons: 'add_ons' in service ? service.add_ons : 
                        ((service as any).service_details?.add_ons || (service as any).service_details?.addOns),
                      frequency: 'frequency' in service ? service.frequency : (service as any).service_details?.frequency
                    }}
                    type="completed"
                    onRate={handleRate}
                    onViewDetails={handleViewDetails}
                  />
              ))}
              {completedServices.length > 5 && (
                <Button variant="outline" className="w-full">
                  View All {completedServices.length} Services
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Services State */}
      {upcomingServices.length === 0 && completedServices.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No services yet</h3>
            <p className="text-muted-foreground mb-6">
              Ready to experience professional cleaning? Book your first service today!
            </p>
            <div className="space-y-3">
              <Button className="w-full bg-gradient-to-r from-primary to-accent" asChild>
                <a href="/schedule-service">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Your First Service
                </a>
              </Button>
              <ChatFallback className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Dialogs */}
      <Dialog open={!!selectedService && !!actionType} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[425px]">
          {actionType === 'reschedule' && (
            <>
              <DialogHeader>
                <DialogTitle>Reschedule Service</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reschedule-date">New Date</Label>
                  <Input
                    id="reschedule-date"
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
                <div>
                  <Label htmlFor="reschedule-time">Preferred Time</Label>
                  <Input
                    id="reschedule-time"
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button onClick={submitReschedule}>Request Reschedule</Button>
                </div>
              </div>
            </>
          )}

          {actionType === 'cancel' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Cancel Service
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  We're sorry to see you go. Please let us know why you're cancelling:
                </p>
                <Textarea
                  placeholder="Optional: Help us improve by sharing your reason..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-800">
                    <strong>Cancellation Policy:</strong> Free cancellation up to 24 hours before service. 
                    Later cancellations may incur a $25 fee.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeDialog}>Keep Service</Button>
                  <Button variant="destructive" onClick={submitCancellation}>
                    Confirm Cancellation
                  </Button>
                </div>
              </div>
            </>
          )}

          {actionType === 'rate' && (
            <>
              <DialogHeader>
                <DialogTitle>Rate Your Service</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Overall Rating</Label>
                  <div className="flex items-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        variant="ghost"
                        size="sm"
                        className="p-1"
                        onClick={() => setRating(star)}
                      >
                        <Star 
                          className={`h-6 w-6 ${
                            star <= rating 
                              ? 'fill-yellow-400 text-yellow-400' 
                              : 'text-muted-foreground'
                          }`} 
                        />
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="feedback">Additional Feedback (Optional)</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Tell us about your experience..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeDialog}>Skip</Button>
                  <Button onClick={submitRating} disabled={rating === 0}>
                    Submit Rating
                  </Button>
                </div>
              </div>
            </>
          )}

          {actionType === 'details' && selectedService && (
            <>
              <DialogHeader>
                <DialogTitle>Service Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Service Date</Label>
                    <p className="text-muted-foreground">
                      {format(new Date(selectedService.service_date || selectedService.scheduled_date), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <Label>Time</Label>
                    <p className="text-muted-foreground">
                      {selectedService.service_time || selectedService.scheduled_time}
                    </p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge className={`${getStatusColor(selectedService.status)} mt-1`}>
                      {selectedService.status}
                    </Badge>
                  </div>
                  {selectedService.estimated_duration && (
                    <div>
                      <Label>Duration</Label>
                      <p className="text-muted-foreground">{selectedService.estimated_duration} hours</p>
                    </div>
                  )}
                </div>
                
                {selectedService.service_address && (
                  <div>
                    <Label>Service Address</Label>
                    <p className="text-muted-foreground">{selectedService.service_address}</p>
                  </div>
                )}

                {selectedService.special_instructions && (
                  <div>
                    <Label>Special Instructions</Label>
                    <div className="p-3 bg-muted/50 rounded border text-sm text-muted-foreground">
                      {selectedService.special_instructions}
                    </div>
                  </div>
                )}

                {selectedService.amount && (
                  <div>
                    <Label>Service Cost</Label>
                    <p className="text-lg font-semibold text-foreground">
                      ${(selectedService.amount / 100).toFixed(2)}
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={closeDialog}>Close</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  function getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
}