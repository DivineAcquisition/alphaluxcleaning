import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Clock, TrendingDown } from 'lucide-react';
import { RecurringServiceCard } from '@/components/recurring/RecurringServiceCard';
import { RecurringSavingsDashboard } from '@/components/recurring/RecurringSavingsDashboard';
import { RecurringServiceHistory } from '@/components/recurring/RecurringServiceHistory';
import { MembershipProgressTracker } from '@/components/recurring/MembershipProgressTracker';
import { UpcomingVisitFocusAreas } from '@/components/recurring/UpcomingVisitFocusAreas';
import { useToast } from '@/hooks/use-toast';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function RecurringServices() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [nextServiceDate, setNextServiceDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchCustomerAndServices();
  }, []);

  const fetchCustomerAndServices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/');
        return;
      }

      // Get customer ID
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (customerError) throw customerError;
      
      setCustomerId(customer.id);

      // Fetch recurring services
      const { data, error } = await supabase.functions.invoke('get-recurring-services', {
        body: { customer_id: customer.id }
      });

      if (error) throw error;

      setServices(data.services || []);
      
      // Find next service date
      const activeServices = data.services?.filter((s: any) => s.status === 'active') || [];
      if (activeServices.length > 0) {
        const dates = activeServices
          .map((s: any) => s.next_service_date)
          .filter(Boolean)
          .sort();
        if (dates.length > 0) {
          setNextServiceDate(new Date(dates[0]));
        }
      }
    } catch (error: any) {
      console.error('Error fetching services:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recurring services',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const activeServices = services.filter(s => s.status === 'active');
  const pausedServices = services.filter(s => s.status === 'paused');
  const committedServices = activeServices.filter(s => s.commitment_months && s.commitment_months > 0);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">Recurring Services</h1>
          <p className="text-muted-foreground text-lg">
            Manage your cleaning subscriptions and track your savings
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Services</p>
                <p className="text-3xl font-bold text-foreground">{activeServices.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Service</p>
                <p className="text-xl font-bold text-foreground">
                  {nextServiceDate ? nextServiceDate.toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <Button 
              onClick={() => navigate('/?mode=recurring')} 
              className="w-full h-full"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add New Service
            </Button>
          </Card>
        </div>

        {/* Savings Dashboard */}
        {customerId && <RecurringSavingsDashboard customerId={customerId} />}

        {/* Membership Progress Section */}
        {committedServices.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Membership Progress</h2>
            <div className="space-y-6">
              {committedServices.map(service => (
                <Collapsible key={service.id} defaultOpen={true}>
                  <div className="space-y-4">
                    <CollapsibleTrigger asChild>
                      <div className="cursor-pointer">
                        <MembershipProgressTracker service={service} />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {customerId && (
                        <UpcomingVisitFocusAreas
                          recurringServiceId={service.id}
                          customerId={customerId}
                          upcomingBookings={service.upcoming_bookings || []}
                          onUpdate={fetchCustomerAndServices}
                        />
                      )}
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          </div>
        )}

        {/* Active Services */}
        {activeServices.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Active Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeServices.map(service => (
                <RecurringServiceCard 
                  key={service.id} 
                  service={service}
                  onUpdate={fetchCustomerAndServices}
                />
              ))}
            </div>
          </div>
        )}

        {/* Paused Services */}
        {pausedServices.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Paused Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pausedServices.map(service => (
                <RecurringServiceCard 
                  key={service.id} 
                  service={service}
                  onUpdate={fetchCustomerAndServices}
                />
              ))}
            </div>
          </div>
        )}

        {/* Service History */}
        {customerId && <RecurringServiceHistory customerId={customerId} />}

        {/* Empty State */}
        {loading === false && services.length === 0 && (
          <Card className="p-12 text-center">
            <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">No Recurring Services Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start saving up to 15% by setting up a recurring service
            </p>
            <Button onClick={() => navigate('/?mode=recurring')} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Create Your First Recurring Service
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}