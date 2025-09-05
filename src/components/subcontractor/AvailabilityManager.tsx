import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Plus, Trash2, CalendarX } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';

interface AvailabilitySlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface BlackoutPeriod {
  id?: string;
  start_date: string;
  end_date: string;
  reason?: string;
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export function AvailabilityManager() {
  const { toast } = useToast();
  const [subcontractorId, setSubcontractorId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [blackouts, setBlackouts] = useState<BlackoutPeriod[]>([]);
  const [newBlackout, setNewBlackout] = useState<BlackoutPeriod>({
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSubcontractorData();
  }, []);

  const fetchSubcontractorData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get subcontractor ID
      const { data: subData, error: subError } = await supabase
        .from('subcontractors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (subError || !subData) {
        throw new Error('Subcontractor profile not found');
      }

      setSubcontractorId(subData.id);

      // Fetch availability
      const { data: availData, error: availError } = await supabase
        .from('subcontractor_availability')
        .select('*')
        .eq('subcontractor_id', subData.id)
        .order('day_of_week')
        .order('start_time');

      if (availError) throw availError;

      // Fetch blackouts
      const { data: blackoutData, error: blackoutError } = await supabase
        .from('subcontractor_blackouts')
        .select('*')
        .eq('subcontractor_id', subData.id)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('start_date');

      if (blackoutError) throw blackoutError;

      setAvailability(availData || []);
      setBlackouts(blackoutData || []);

      // Initialize default availability if none exists
      if (!availData || availData.length === 0) {
        initializeDefaultAvailability(subData.id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load availability data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultAvailability = (subId: string) => {
    // Create default availability (Monday-Friday, 8 AM - 6 PM)
    const defaultSlots: AvailabilitySlot[] = [];
    for (let day = 1; day <= 5; day++) { // Monday to Friday
      defaultSlots.push({
        day_of_week: day,
        start_time: '08:00',
        end_time: '18:00',
        is_available: true
      });
    }
    setAvailability(defaultSlots);
  };

  const updateAvailabilitySlot = (dayOfWeek: number, field: keyof AvailabilitySlot, value: any) => {
    setAvailability(prev => {
      const existingIndex = prev.findIndex(slot => slot.day_of_week === dayOfWeek);
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], [field]: value };
        return updated;
      } else {
        // Create new slot for this day
        return [...prev, {
          day_of_week: dayOfWeek,
          start_time: '08:00',
          end_time: '18:00',
          is_available: true,
          [field]: value
        }];
      }
    });
  };

  const saveAvailability = async () => {
    if (!subcontractorId) return;

    setSaving(true);
    try {
      // Delete existing availability
      const { error: deleteError } = await supabase
        .from('subcontractor_availability')
        .delete()
        .eq('subcontractor_id', subcontractorId);

      if (deleteError) throw deleteError;

      // Insert new availability
      const slotsToInsert = availability
        .filter(slot => slot.is_available)
        .map(slot => ({
          subcontractor_id: subcontractorId,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: slot.is_available
        }));

      if (slotsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('subcontractor_availability')
          .insert(slotsToInsert);

        if (insertError) throw insertError;
      }

      toast({
        title: "Success",
        description: "Availability updated successfully"
      });
    } catch (error) {
      console.error('Error saving availability:', error);
      toast({
        title: "Error",
        description: "Failed to save availability",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const addBlackoutPeriod = async () => {
    if (!subcontractorId || !newBlackout.start_date || !newBlackout.end_date) {
      toast({
        title: "Error",
        description: "Please fill in all required blackout period fields",
        variant: "destructive"
      });
      return;
    }

    if (new Date(newBlackout.start_date) > new Date(newBlackout.end_date)) {
      toast({
        title: "Error",
        description: "Start date must be before end date",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subcontractor_blackouts')
        .insert({
          subcontractor_id: subcontractorId,
          start_date: newBlackout.start_date,
          end_date: newBlackout.end_date,
          reason: newBlackout.reason
        })
        .select()
        .single();

      if (error) throw error;

      setBlackouts(prev => [...prev, data]);
      setNewBlackout({ start_date: '', end_date: '', reason: '' });
      
      toast({
        title: "Success",
        description: "Blackout period added successfully"
      });
    } catch (error) {
      console.error('Error adding blackout:', error);
      toast({
        title: "Error",
        description: "Failed to add blackout period",
        variant: "destructive"
      });
    }
  };

  const removeBlackoutPeriod = async (blackoutId: string) => {
    try {
      const { error } = await supabase
        .from('subcontractor_blackouts')
        .delete()
        .eq('id', blackoutId);

      if (error) throw error;

      setBlackouts(prev => prev.filter(b => b.id !== blackoutId));
      
      toast({
        title: "Success",
        description: "Blackout period removed successfully"
      });
    } catch (error) {
      console.error('Error removing blackout:', error);
      toast({
        title: "Error",
        description: "Failed to remove blackout period",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Availability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Weekly Availability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS_OF_WEEK.map((dayName, dayIndex) => {
            const slot = availability.find(s => s.day_of_week === dayIndex);
            const isAvailable = slot?.is_available ?? false;

            return (
              <div key={dayIndex} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isAvailable}
                    onCheckedChange={(checked) => 
                      updateAvailabilitySlot(dayIndex, 'is_available', checked)
                    }
                  />
                  <Label className="min-w-[80px]">{dayName}</Label>
                </div>
                
                {isAvailable && (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={slot?.start_time || '08:00'}
                      onChange={(e) => 
                        updateAvailabilitySlot(dayIndex, 'start_time', e.target.value)
                      }
                      className="w-32"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={slot?.end_time || '18:00'}
                      onChange={(e) => 
                        updateAvailabilitySlot(dayIndex, 'end_time', e.target.value)
                      }
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            );
          })}
          
          <Button onClick={saveAvailability} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Availability'}
          </Button>
        </CardContent>
      </Card>

      {/* Blackout Periods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarX className="h-5 w-5" />
            Blackout Periods
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Blackout */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium">Add Blackout Period</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={newBlackout.start_date}
                  onChange={(e) => setNewBlackout(prev => ({
                    ...prev,
                    start_date: e.target.value
                  }))}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={newBlackout.end_date}
                  onChange={(e) => setNewBlackout(prev => ({
                    ...prev,
                    end_date: e.target.value
                  }))}
                  min={newBlackout.start_date || format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                value={newBlackout.reason}
                onChange={(e) => setNewBlackout(prev => ({
                  ...prev,
                  reason: e.target.value
                }))}
                placeholder="e.g., Vacation, Medical appointment, etc."
                rows={2}
              />
            </div>
            <Button onClick={addBlackoutPeriod} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Blackout Period
            </Button>
          </div>

          {/* Existing Blackouts */}
          <div className="space-y-2">
            {blackouts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No blackout periods scheduled
              </p>
            ) : (
              blackouts.map((blackout) => (
                <div key={blackout.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {format(new Date(blackout.start_date), 'MMM dd, yyyy')} - {format(new Date(blackout.end_date), 'MMM dd, yyyy')}
                      </p>
                      {blackout.reason && (
                        <p className="text-sm text-muted-foreground">{blackout.reason}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => blackout.id && removeBlackoutPeriod(blackout.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
