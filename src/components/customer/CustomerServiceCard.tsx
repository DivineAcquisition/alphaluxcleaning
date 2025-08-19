import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Star,
  MoreVertical,
  MessageSquare,
  Camera
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

interface CustomerServiceCardProps {
  service: {
    id: string;
    service_date?: string;
    scheduled_date?: string;
    service_time?: string;
    scheduled_time?: string;
    status: string;
    service_address?: string;
    customer_name?: string;
    special_instructions?: string | null;
    amount?: number;
    estimated_duration?: number | null;
  };
  type: 'upcoming' | 'completed';
  onReschedule?: (serviceId: string) => void;
  onCancel?: (serviceId: string) => void;
  onViewDetails?: (serviceId: string) => void;
  onRate?: (serviceId: string) => void;
}

export function CustomerServiceCard({ 
  service, 
  type, 
  onReschedule, 
  onCancel, 
  onViewDetails,
  onRate 
}: CustomerServiceCardProps) {
  const serviceDate = service.service_date || service.scheduled_date || '';
  const serviceTime = service.service_time || service.scheduled_time || '';
  
  const formatServiceDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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
  };

  const getServiceTypeIcon = () => {
    return <Calendar className="h-5 w-5 text-primary" />;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {getServiceTypeIcon()}
            </div>
            <div>
              <h4 className="font-semibold text-foreground">House Cleaning Service</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {serviceDate && formatServiceDate(serviceDate)}
                {serviceTime && (
                  <>
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    {serviceTime}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(service.status)}>
              {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails?.(service.id)}>
                  View Details
                </DropdownMenuItem>
                {type === 'upcoming' && (
                  <>
                    <DropdownMenuItem onClick={() => onReschedule?.(service.id)}>
                      Reschedule
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onCancel?.(service.id)}
                      className="text-red-600"
                    >
                      Cancel Service
                    </DropdownMenuItem>
                  </>
                )}
                {type === 'completed' && (
                  <DropdownMenuItem onClick={() => onRate?.(service.id)}>
                    Rate Service
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Service Details */}
        <div className="space-y-2 mb-4">
          {service.service_address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{service.service_address}</span>
            </div>
          )}
          
          {service.estimated_duration && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Estimated {service.estimated_duration} hours</span>
            </div>
          )}

          {service.amount && type === 'completed' && (
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span>${(service.amount / 100).toFixed(2)}</span>
            </div>
          )}

          {service.special_instructions && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
              <strong>Special Instructions:</strong> {service.special_instructions}
            </div>
          )}
        </div>

        {/* Service Actions */}
        <div className="flex gap-2">
          {type === 'upcoming' && (
            <>
              {service.status === 'confirmed' && (
                <Button variant="outline" size="sm" className="flex-1">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Message Cleaner
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onViewDetails?.(service.id)}
                className="flex-1"
              >
                View Details
              </Button>
            </>
          )}

          {type === 'completed' && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onRate?.(service.id)}
                className="flex-1"
              >
                <Star className="h-3 w-3 mr-1" />
                Rate Service
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onViewDetails?.(service.id)}
                className="flex-1"
              >
                <Camera className="h-3 w-3 mr-1" />
                View Photos
              </Button>
            </>
          )}
        </div>

        {/* Completed Service Rating */}
        {type === 'completed' && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your rating:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className="h-3 w-3 fill-yellow-400 text-yellow-400" 
                  />
                ))}
                <span className="text-sm text-muted-foreground ml-2">5.0</span>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Service Status Indicator */}
        {type === 'upcoming' && service.status === 'confirmed' && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Service confirmed - cleaner will arrive on time</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}