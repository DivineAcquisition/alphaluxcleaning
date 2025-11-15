import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Edit2, Check, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface UpcomingVisitFocusAreasProps {
  recurringServiceId: string;
  customerId: string;
  upcomingBookings: Array<{
    id: string;
    service_date: string;
    special_instructions: string | null;
  }>;
  onUpdate: () => void;
}

const QUICK_SELECT_AREAS = [
  { icon: '🧹', label: 'Focus on kitchen', value: 'Please focus extra attention on the kitchen.' },
  { icon: '🚿', label: 'Deep clean bathrooms', value: 'Please deep clean all bathrooms with extra attention to grout and fixtures.' },
  { icon: '🪟', label: 'Windows & glass', value: 'Please clean all windows and glass surfaces.' },
  { icon: '🧺', label: 'Baseboards & trim', value: 'Please wipe down all baseboards and trim.' },
  { icon: '🐾', label: 'Pet hair removal', value: 'Please focus on pet hair removal from furniture and floors.' },
  { icon: '🛏️', label: 'Change bedding', value: 'Please change bed linens (I will leave fresh sheets on the bed).' },
];

export const UpcomingVisitFocusAreas = ({ 
  recurringServiceId, 
  customerId,
  upcomingBookings, 
  onUpdate 
}: UpcomingVisitFocusAreasProps) => {
  const { toast } = useToast();
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [focusInstructions, setFocusInstructions] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);

  const handleEdit = (bookingId: string, currentInstructions: string | null) => {
    setEditingBookingId(bookingId);
    setFocusInstructions(prev => ({ ...prev, [bookingId]: currentInstructions || '' }));
  };

  const handleQuickSelect = (bookingId: string, value: string) => {
    const current = focusInstructions[bookingId] || '';
    const newValue = current ? `${current}\n${value}` : value;
    setFocusInstructions(prev => ({ ...prev, [bookingId]: newValue }));
  };

  const handleSave = async (bookingId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('update-booking-focus-areas', {
        body: {
          booking_id: bookingId,
          special_instructions: focusInstructions[bookingId] || null,
          customer_id: customerId
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Focus areas updated successfully',
      });

      setEditingBookingId(null);
      onUpdate();
    } catch (error: any) {
      console.error('Error updating focus areas:', error);
      toast({
        title: 'Error',
        description: 'Failed to update focus areas',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (bookingId: string) => {
    setEditingBookingId(null);
    setFocusInstructions(prev => {
      const updated = { ...prev };
      delete updated[bookingId];
      return updated;
    });
  };

  if (!upcomingBookings || upcomingBookings.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Upcoming Visit Focus Areas</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Customize each visit by sharing what you'd like the team to focus on
      </p>

      <div className="space-y-3">
        {upcomingBookings.slice(0, 3).map((booking) => {
          const isEditing = editingBookingId === booking.id;
          const currentInstructions = isEditing 
            ? focusInstructions[booking.id] 
            : booking.special_instructions;

          return (
            <Collapsible key={booking.id} defaultOpen={!booking.special_instructions}>
              <Card className="p-4 bg-background/50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">
                        {new Date(booking.service_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      {booking.special_instructions && !isEditing && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Focus areas set
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => !isEditing && handleEdit(booking.id, booking.special_instructions)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent className="mt-3">
                  {isEditing ? (
                    <div className="space-y-3">
                      {/* Quick Select Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {QUICK_SELECT_AREAS.map((area) => (
                          <Button
                            key={area.label}
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickSelect(booking.id, area.value)}
                            className="text-xs"
                          >
                            <span className="mr-1">{area.icon}</span>
                            {area.label}
                          </Button>
                        ))}
                      </div>

                      {/* Custom Instructions */}
                      <Textarea
                        value={focusInstructions[booking.id] || ''}
                        onChange={(e) => setFocusInstructions(prev => ({ 
                          ...prev, 
                          [booking.id]: e.target.value 
                        }))}
                        placeholder="Add any custom focus areas or special instructions..."
                        rows={4}
                        className="resize-none"
                      />

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSave(booking.id)}
                          disabled={saving}
                          size="sm"
                        >
                          {saving ? 'Saving...' : 'Save Focus Areas'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleCancel(booking.id)}
                          disabled={saving}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {currentInstructions ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {currentInstructions}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No focus areas set yet. Click edit to customize this visit.
                        </p>
                      )}
                    </div>
                  )}
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </Card>
  );
};
