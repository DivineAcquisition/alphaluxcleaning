import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, Pause, Play, X, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RescheduleDialog } from "@/components/RescheduleDialog";
import { CancellationDialog } from "@/components/CancellationDialog";

interface RecurringService {
  id: string;
  cleaning_type: string;
  frequency: string;
  next_service_date: string;
  preferred_time: string;
  service_status: string;
  amount: number;
  paused_until?: string;
  square_footage?: number;
  add_ons?: string[];
}

const CustomerServicePortal = () => {
  const [services, setServices] = useState<RecurringService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<RecurringService | null>(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCancellation, setShowCancellation] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecurringServices();
  }, []);

  const fetchRecurringServices = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('is_recurring', true)
        .neq('service_status', 'cancelled');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: "Error",
        description: "Failed to load your services",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePauseService = async (serviceId: string) => {
    try {
      const pauseUntil = new Date();
      pauseUntil.setMonth(pauseUntil.getMonth() + 1);

      const { error } = await supabase
        .from('orders')
        .update({
          service_status: 'paused',
          paused_until: pauseUntil.toISOString().split('T')[0]
        })
        .eq('id', serviceId);

      if (error) throw error;

      // Log the modification
      await supabase.from('service_modifications').insert({
        order_id: serviceId,
        modification_type: 'pause',
        new_value: { paused_until: pauseUntil.toISOString().split('T')[0] },
        reason: 'Customer requested pause'
      });

      toast({
        title: "Service Paused",
        description: "Your service has been paused for 1 month",
      });

      fetchRecurringServices();
    } catch (error) {
      console.error('Error pausing service:', error);
      toast({
        title: "Error",
        description: "Failed to pause service",
        variant: "destructive",
      });
    }
  };

  const handleResumeService = async (serviceId: string) => {
    try {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 7); // Resume next week

      const { error } = await supabase
        .from('orders')
        .update({
          service_status: 'active',
          paused_until: null,
          next_service_date: nextDate.toISOString().split('T')[0]
        })
        .eq('id', serviceId);

      if (error) throw error;

      // Log the modification
      await supabase.from('service_modifications').insert({
        order_id: serviceId,
        modification_type: 'resume',
        new_value: { next_service_date: nextDate.toISOString().split('T')[0] },
        reason: 'Customer resumed service'
      });

      toast({
        title: "Service Resumed",
        description: "Your service has been resumed and scheduled for next week",
      });

      fetchRecurringServices();
    } catch (error) {
      console.error('Error resuming service:', error);
      toast({
        title: "Error",
        description: "Failed to resume service",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading your services...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Recurring Services</h1>
          <p className="text-muted-foreground">
            Manage your recurring cleaning services - reschedule, pause, or modify your bookings
          </p>
        </div>

        {services.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Recurring Services</h3>
              <p className="text-muted-foreground mb-4">
                You don't have any active recurring services yet.
              </p>
              <Button onClick={() => window.location.href = '/'}>
                Book a Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {services.map((service) => (
              <Card key={service.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {service.cleaning_type.charAt(0).toUpperCase() + service.cleaning_type.slice(1)} Cleaning
                        <Badge className={`${getStatusColor(service.service_status)} text-white`}>
                          {service.service_status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {service.frequency} • ${(service.amount / 100).toFixed(2)}
                        {service.square_footage && ` • ${service.square_footage} sq ft`}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium">Next Service Date</div>
                          <div className="text-sm text-muted-foreground">
                            {service.next_service_date ? formatDate(service.next_service_date) : 'Not scheduled'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium">Preferred Time</div>
                          <div className="text-sm text-muted-foreground">
                            {service.preferred_time || 'Not specified'}
                          </div>
                        </div>
                      </div>

                      {service.add_ons && service.add_ons.length > 0 && (
                        <div>
                          <div className="font-medium mb-2">Add-ons</div>
                          <div className="flex flex-wrap gap-1">
                            {service.add_ons.map((addon, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {addon.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {service.service_status === 'paused' && service.paused_until && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Service paused until {formatDate(service.paused_until)}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setSelectedService(service);
                          setShowReschedule(true);
                        }}
                        disabled={service.service_status === 'cancelled'}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Reschedule Service
                      </Button>

                      {service.service_status === 'active' ? (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handlePauseService(service.id)}
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Pause Service
                        </Button>
                      ) : service.service_status === 'paused' ? (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleResumeService(service.id)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Resume Service
                        </Button>
                      ) : null}

                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => {
                          setSelectedService(service);
                          setShowCancellation(true);
                        }}
                        disabled={service.service_status === 'cancelled'}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel Service
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialogs */}
        {selectedService && (
          <>
            <RescheduleDialog
              open={showReschedule}
              onOpenChange={setShowReschedule}
              service={selectedService}
              onSuccess={fetchRecurringServices}
            />
            
            <CancellationDialog
              open={showCancellation}
              onOpenChange={setShowCancellation}
              service={selectedService}
              onSuccess={fetchRecurringServices}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerServicePortal;