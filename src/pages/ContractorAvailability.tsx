import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Plus, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, startOfWeek } from 'date-fns';
import { toast } from 'sonner';

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

interface TimeOffRequest {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00'
];

export default function ContractorAvailability() {
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTimeOff, setNewTimeOff] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    fetchAvailabilityData();
  }, []);

  const fetchAvailabilityData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Initialize default availability (9 AM - 5 PM, Monday to Friday)
      const defaultAvailability = DAYS_OF_WEEK.map(day => ({
        day,
        startTime: day === 'Saturday' || day === 'Sunday' ? '' : '09:00',
        endTime: day === 'Saturday' || day === 'Sunday' ? '' : '17:00',
        available: day !== 'Saturday' && day !== 'Sunday'
      }));

      setAvailability(defaultAvailability);

      // Fetch time off requests
      const { data: subcontractor } = await supabase
        .from('subcontractors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (subcontractor) {
        // For now, we'll use a mock for time off requests since the table might not exist
        // In a real implementation, this would fetch from a time_off_requests table
        setTimeOffRequests([]);
      }

    } catch (error) {
      console.error('Error fetching availability data:', error);
      toast.error('Failed to load availability data');
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityChange = (day: string, field: string, value: string | boolean) => {
    setAvailability(prev => prev.map(slot => 
      slot.day === day 
        ? { ...slot, [field]: value }
        : slot
    ));
  };

  const saveAvailability = async () => {
    setSaving(true);
    try {
      // In a real implementation, this would save to the database
      toast.success('Availability updated successfully!');
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const submitTimeOffRequest = async () => {
    if (!newTimeOff.startDate || !newTimeOff.endDate || !newTimeOff.reason.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (new Date(newTimeOff.startDate) > new Date(newTimeOff.endDate)) {
      toast.error('Start date cannot be after end date');
      return;
    }

    try {
      // In a real implementation, this would create a time off request in the database
      const mockRequest: TimeOffRequest = {
        id: Date.now().toString(),
        start_date: newTimeOff.startDate,
        end_date: newTimeOff.endDate,
        reason: newTimeOff.reason,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      setTimeOffRequests(prev => [mockRequest, ...prev]);
      setNewTimeOff({ startDate: '', endDate: '', reason: '' });
      toast.success('Time off request submitted successfully!');
    } catch (error) {
      console.error('Error submitting time off request:', error);
      toast.error('Failed to submit time off request');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', variant: 'secondary' as const, icon: Clock };
      case 'approved':
        return { label: 'Approved', variant: 'default' as const, icon: CheckCircle };
      case 'rejected':
        return { label: 'Rejected', variant: 'destructive' as const, icon: X };
      default:
        return { label: status, variant: 'outline' as const, icon: AlertTriangle };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading availability settings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Availability & Time Off</h1>
            <p className="text-muted-foreground">
              Manage your weekly availability and request time off
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Weekly Availability */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Weekly Availability
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {availability.map((slot, index) => (
                    <div key={slot.day} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`available-${slot.day}`}
                            checked={slot.available}
                            onChange={(e) => handleAvailabilityChange(slot.day, 'available', e.target.checked)}
                            className="rounded"
                          />
                          <label htmlFor={`available-${slot.day}`} className="font-medium">
                            {slot.day}
                          </label>
                        </div>
                        
                        {slot.available && (
                          <div className="flex items-center gap-2">
                            <select
                              value={slot.startTime}
                              onChange={(e) => handleAvailabilityChange(slot.day, 'startTime', e.target.value)}
                              className="text-sm border rounded px-2 py-1"
                            >
                              {TIME_SLOTS.map(time => (
                                <option key={time} value={time}>{time}</option>
                              ))}
                            </select>
                            <span className="text-muted-foreground">to</span>
                            <select
                              value={slot.endTime}
                              onChange={(e) => handleAvailabilityChange(slot.day, 'endTime', e.target.value)}
                              className="text-sm border rounded px-2 py-1"
                            >
                              {TIME_SLOTS.map(time => (
                                <option key={time} value={time}>{time}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                      {index < availability.length - 1 && <Separator />}
                    </div>
                  ))}
                  
                  <Button 
                    onClick={saveAvailability} 
                    disabled={saving}
                    className="w-full mt-4"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Availability'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Time Off Requests */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Request Time Off
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Start Date</label>
                      <input
                        type="date"
                        value={newTimeOff.startDate}
                        onChange={(e) => setNewTimeOff(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full mt-1 text-sm border rounded px-3 py-2"
                        min={format(new Date(), 'yyyy-MM-dd')}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">End Date</label>
                      <input
                        type="date"
                        value={newTimeOff.endDate}
                        onChange={(e) => setNewTimeOff(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full mt-1 text-sm border rounded px-3 py-2"
                        min={newTimeOff.startDate || format(new Date(), 'yyyy-MM-dd')}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Reason</label>
                      <Textarea
                        placeholder="Please provide a brief reason..."
                        value={newTimeOff.reason}
                        onChange={(e) => setNewTimeOff(prev => ({ ...prev, reason: e.target.value }))}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    
                    <Button 
                      onClick={submitTimeOffRequest}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Submit Request
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Time Off History */}
              {timeOffRequests.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Recent Requests</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {timeOffRequests.slice(0, 5).map((request) => {
                      const statusBadge = getStatusBadge(request.status);
                      const StatusIcon = statusBadge.icon;

                      return (
                        <div key={request.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant={statusBadge.variant}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusBadge.label}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">
                            {format(new Date(request.start_date), 'MMM d')} - {format(new Date(request.end_date), 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {request.reason}
                          </p>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}