import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Pause, Play, Calendar, MapPin } from 'lucide-react';
import { ManageRecurringModal } from './ManageRecurringModal';

interface RecurringServiceCardProps {
  service: any;
  onUpdate: () => void;
}

export const RecurringServiceCard = ({ service, onUpdate }: RecurringServiceCardProps) => {
  const [showManageModal, setShowManageModal] = useState(false);
  const hasCommitment = service.commitment_months && service.commitment_months > 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'paused': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'payment_failed': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    return frequency.replace('-', ' ').split(' ').map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const calculateSavingsPerVisit = () => {
    const basePrice = service.price_per_service / (1 - service.discount_percentage);
    return basePrice * service.discount_percentage;
  };

  return (
    <>
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-1">
              {service.service_type}
            </h3>
            <Badge className={getStatusColor(service.status)}>
              {service.status.toUpperCase()}
            </Badge>
          </div>
          <Badge variant="outline" className="text-lg">
            {getFrequencyLabel(service.frequency)}
          </Badge>
        </div>

        {service.service_address && (
          <div className="flex items-start gap-2 mb-3 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              {service.service_address.street}, {service.service_address.city}, {service.service_address.state}
            </span>
          </div>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Price per Service</span>
            <span className="font-semibold text-foreground">
              {formatPrice(service.price_per_service)}
            </span>
          </div>
          
          {service.discount_percentage > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">You Save</span>
              <span className="font-semibold text-green-500">
                {formatPrice(calculateSavingsPerVisit())} per visit
              </span>
            </div>
          )}

          {service.next_service_date && (
            <div className="flex items-center gap-2 text-sm pt-2 border-t">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Next Service:</span>
              <span className="font-medium text-foreground">
                {new Date(service.next_service_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}

          {hasCommitment && service.commitment_progress && (
            <div className="flex items-center gap-2 text-sm pt-2 border-t">
              <Badge variant="outline" className="text-xs">
                {service.commitment_progress.visits_completed}/{service.commitment_progress.expected_visits} visits
              </Badge>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button 
            onClick={() => setShowManageModal(true)} 
            className="flex-1"
            variant="default"
          >
            <Settings className="mr-2 h-4 w-4" />
            Manage
          </Button>
          
          {service.status === 'active' && (
            <Button variant="outline" size="icon">
              <Pause className="h-4 w-4" />
            </Button>
          )}
          
          {service.status === 'paused' && (
            <Button variant="outline" size="icon">
              <Play className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mt-3 text-xs text-muted-foreground">
          {service.total_services_completed} services completed • 
          {formatPrice(service.total_amount_saved)} total saved
        </div>
      </Card>

      <ManageRecurringModal
        service={service}
        open={showManageModal}
        onOpenChange={setShowManageModal}
        onUpdate={onUpdate}
      />
    </>
  );
};