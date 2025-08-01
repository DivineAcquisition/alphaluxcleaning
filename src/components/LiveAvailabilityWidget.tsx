import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { format, parse, isAfter, isBefore } from "date-fns";

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface AvailabilityResponse {
  status: string;
  available_slots: TimeSlot[];
  working_hours?: {
    start: string;
    end: string;
  };
  date?: string;
}

interface LiveAvailabilityWidgetProps {
  selectedDate?: Date;
  onSlotSelect?: (slot: TimeSlot) => void;
  slotDuration?: number; // in minutes
  workingHoursStart?: string; // "08:00"
  workingHoursEnd?: string; // "18:00"
}

export function LiveAvailabilityWidget({
  selectedDate = new Date(),
  onSlotSelect,
  slotDuration = 30,
  workingHoursStart = "08:00",
  workingHoursEnd = "18:00"
}: LiveAvailabilityWidgetProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkCalendarConnection();
  }, []);

  useEffect(() => {
    if (isConnected === true) {
      fetchAvailability();
      
      // Set up polling every 30 seconds for live updates
      const interval = setInterval(() => {
        fetchAvailability(true); // silent update
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [selectedDate, isConnected]);

  const checkCalendarConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsConnected(false);
        return;
      }

      // Check connection by calling availability function with connection check flag
      const { data, error } = await supabase.functions.invoke('get-live-availability', {
        body: { 
          date: new Date().toISOString().split('T')[0], 
          check_connection_only: true 
        }
      });

      if (!error && data?.has_connection) {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setIsConnected(false);
    }
  };

  const fetchAvailability = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase.functions.invoke('get-live-availability', {
        body: {
          date: dateStr,
          slot_duration: slotDuration,
          working_hours_start: workingHoursStart,
          working_hours_end: workingHoursEnd
        }
      });

      if (error) {
        setError('Failed to fetch availability');
        toast({
          title: "Error",
          description: "Failed to fetch availability. Please try again.",
          variant: "destructive"
        });
        return;
      }

      const response = data as AvailabilityResponse;
      if (response.status === 'success') {
        setSlots(response.available_slots || []);
        setLastUpdated(new Date());
      } else {
        setError('Failed to load availability');
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      setError('Failed to fetch availability');
      if (!silent) {
        toast({
          title: "Error",
          description: "Failed to fetch availability. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const formatTimeSlot = (start: string, end: string) => {
    try {
      const startTime = parse(start, 'HH:mm', new Date());
      const endTime = parse(end, 'HH:mm', new Date());
      return `${format(startTime, 'h:mm a')} – ${format(endTime, 'h:mm a')}`;
    } catch {
      return `${start} – ${end}`;
    }
  };

  const isSlotPast = (start: string) => {
    try {
      const slotTime = parse(start, 'HH:mm', selectedDate);
      const now = new Date();
      
      // If the selected date is today, check if the slot time has passed
      if (format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')) {
        return isBefore(slotTime, now);
      }
      
      // If the selected date is in the past
      return isBefore(selectedDate, now);
    } catch {
      return false;
    }
  };

  if (isConnected === false) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Live Availability
          </CardTitle>
          <CardDescription>
            Connect your Google Calendar to see live availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-4 border rounded-lg">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <span className="text-sm">Please connect your Google Calendar first</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Live Availability
            </CardTitle>
            <CardDescription>
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAvailability()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Last updated: {format(lastUpdated, 'h:mm:ss a')}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading && !lastUpdated ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading availability...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-4 border rounded-lg border-destructive/20 bg-destructive/5">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No available slots for this date</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {slots.map((slot, index) => {
              const isPast = isSlotPast(slot.start);
              const isAvailable = slot.available && !isPast;
              
              return (
                <Button
                  key={index}
                  variant={isAvailable ? "outline" : "ghost"}
                  size="sm"
                  disabled={!isAvailable}
                  onClick={() => isAvailable && onSlotSelect?.(slot)}
                  className={`h-auto p-2 text-xs ${
                    !isAvailable 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-primary hover:text-primary-foreground'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span>{formatTimeSlot(slot.start, slot.end)}</span>
                    {!slot.available && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        Busy
                      </Badge>
                    )}
                    {isPast && (
                      <Badge variant="outline" className="text-xs mt-1">
                        Past
                      </Badge>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}