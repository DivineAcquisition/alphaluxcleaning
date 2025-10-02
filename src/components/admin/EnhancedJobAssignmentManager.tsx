import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminGrid } from '@/components/admin/AdminGrid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Calendar,
  MapPin,
  User,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  Zap,
  AlertTriangle,
  CheckCircle,
  Users,
  Send,
  Star
} from 'lucide-react';

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_address: string;
  service_date: string;
  service_time: string;
  special_instructions: string;
  status: string;
  priority: string;
}

interface Subcontractor {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  tier_level: number;
  rating: number;
  is_available: boolean;
  subscription_status: string;
}

export function EnhancedJobAssignmentManager() {
  const [unassignedBookings, setUnassignedBookings] = useState<Booking[]>([]);
  const [availableSubcontractors, setAvailableSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningBookingId, setAssigningBookingId] = useState<string | null>(null);
  const [selectedSubcontractors, setSelectedSubcontractors] = useState<string[]>([]);
  const [assignmentConfig, setAssignmentConfig] = useState({
    priority: 'normal' as 'normal' | 'high' | 'urgent',
    notes: '',
    sendEmail: true,
    sendSMS: false,
    requireResponse: true,
    responseTimeHours: 2,
    autoReassign: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch unassigned bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'scheduled')
        .is('assigned_employee_id', null)
        .order('service_date', { ascending: true });

      if (bookingsError) throw bookingsError;

      // Fetch available subcontractors with tier info
      const { data: subcontractorsData, error: subcontractorsError } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('is_available', true)
        .eq('subscription_status', 'active')
        .order('tier_level', { ascending: false })
        .order('rating', { ascending: false });

      if (subcontractorsError) throw subcontractorsError;

      setUnassignedBookings(bookingsData || []);
      setAvailableSubcontractors(subcontractorsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  };

  const handleEnhancedAssignment = async (bookingId: string) => {
    if (selectedSubcontractors.length === 0) {
      toast.error('Please select at least one subcontractor');
      return;
    }

    try {
      const notificationMethods = [];
      if (assignmentConfig.sendEmail) notificationMethods.push('email');
      if (assignmentConfig.sendSMS) notificationMethods.push('sms');

      const { data, error } = await supabase.functions.invoke('enhanced-job-assignment', {
        body: {
          subcontractorIds: selectedSubcontractors,
          bookingId,
          priority: assignmentConfig.priority,
          assignmentNotes: assignmentConfig.notes,
          notificationMethods,
          requiredResponseTime: assignmentConfig.responseTimeHours * 60,
          isAutoReassign: assignmentConfig.autoReassign
        }
      });

      if (error) throw error;

      toast.success(`Job assigned to ${selectedSubcontractors.length} subcontractor(s) with enhanced notifications!`);
      setAssigningBookingId(null);
      setSelectedSubcontractors([]);
      setAssignmentConfig(prev => ({ ...prev, notes: '' }));
      fetchData();
    } catch (error) {
      console.error('Error in enhanced assignment:', error);
      toast.error('Failed to assign job with enhanced features');
    }
  };

  const handleBulkAssignment = async () => {
    // Implement bulk assignment logic
    toast.info('Bulk assignment feature coming soon');
  };

  const toggleSubcontractorSelection = (subcontractorId: string) => {
    setSelectedSubcontractors(prev => {
      if (prev.includes(subcontractorId)) {
        return prev.filter(id => id !== subcontractorId);
      } else if (prev.length < 5) {
        return [...prev, subcontractorId];
      } else {
        toast.error('Maximum 5 subcontractors allowed per job');
        return prev;
      }
    });
  };

  const getSubcontractorsByProximity = (bookingAddress: string) => {
    // Enhanced proximity matching - would implement geolocation
    return availableSubcontractors.sort((a, b) => {
      // Sort by tier level first, then by rating
      if (a.tier_level !== b.tier_level) {
        return b.tier_level - a.tier_level;
      }
      return b.rating - a.rating;
    });
  };

  const getTierBadgeVariant = (tier: number) => {
    switch (tier) {
      case 4: return 'default'; // Premium
      case 3: return 'secondary'; // Elite  
      case 2: return 'outline'; // Professional
      default: return 'destructive'; // Standard
    }
  };

  const getTierName = (tier: number) => {
    switch (tier) {
      case 4: return 'Premium';
      case 3: return 'Elite';
      case 2: return 'Professional';
      default: return 'Standard';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading enhanced assignment manager...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Bulk Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Enhanced Job Assignment Manager</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBulkAssignment}>
            <Users className="h-4 w-4 mr-2" />
            Bulk Assign
          </Button>
        </div>
      </div>

      {/* Assignment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Unassigned</p>
                <p className="text-2xl font-bold">{unassignedBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">{availableSubcontractors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold">
                  {unassignedBookings.filter(b => b.priority === 'high').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Premium Cleaners</p>
                <p className="text-2xl font-bold">
                  {availableSubcontractors.filter(s => s.tier_level === 4).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unassigned Bookings */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Unassigned Bookings ({unassignedBookings.length})</h3>
        {unassignedBookings.length === 0 ? (
          <AdminCard title="All Jobs Assigned!">
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
              <p>Excellent work! All bookings have been assigned.</p>
            </div>
          </AdminCard>
        ) : (
          <AdminGrid columns={1} gap="md">
            {unassignedBookings.map((booking) => (
              <AdminCard key={booking.id} title={`Booking - ${booking.customer_name}`} variant="action">
                <div className="space-y-4">
                  {/* Booking Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">{booking.customer_name}</h4>
                      <Badge variant={booking.priority === 'high' ? 'destructive' : 'secondary'}>
                        {booking.priority || 'normal'} priority
                      </Badge>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(booking.service_date).toLocaleDateString()}</span>
                        <Clock className="h-4 w-4 ml-2" />
                        <span>{booking.service_time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4" />
                        <span className="text-muted-foreground">{booking.service_address}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4" />
                        <span>{booking.customer_phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4" />
                        <span className="text-muted-foreground">{booking.customer_email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {booking.special_instructions && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm">
                        <strong>Special Instructions:</strong> {booking.special_instructions}
                      </p>
                    </div>
                  )}

                  {/* Enhanced Assignment Interface */}
                  {assigningBookingId === booking.id && (
                    <div className="space-y-4 bg-background border rounded-lg p-4">
                      {/* Assignment Configuration */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Priority Level</Label>
                          <Select 
                            value={assignmentConfig.priority} 
                            onValueChange={(value: any) => setAssignmentConfig(prev => ({ ...prev, priority: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal Priority</SelectItem>
                              <SelectItem value="high">High Priority</SelectItem>
                              <SelectItem value="urgent">🚨 URGENT Priority</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Response Time Required</Label>
                          <Select 
                            value={assignmentConfig.responseTimeHours.toString()}
                            onValueChange={(value) => setAssignmentConfig(prev => ({ ...prev, responseTimeHours: parseInt(value) }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 hour</SelectItem>
                              <SelectItem value="2">2 hours</SelectItem>
                              <SelectItem value="4">4 hours</SelectItem>
                              <SelectItem value="12">12 hours</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Notification Options */}
                      <div className="flex items-center gap-6">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="email-notify"
                            checked={assignmentConfig.sendEmail}
                            onCheckedChange={(checked) => setAssignmentConfig(prev => ({ ...prev, sendEmail: checked }))}
                          />
                          <Label htmlFor="email-notify" className="text-sm">Email Notification</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="sms-notify"
                            checked={assignmentConfig.sendSMS}
                            onCheckedChange={(checked) => setAssignmentConfig(prev => ({ ...prev, sendSMS: checked }))}
                          />
                          <Label htmlFor="sms-notify" className="text-sm">SMS Notification</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="auto-reassign"
                            checked={assignmentConfig.autoReassign}
                            onCheckedChange={(checked) => setAssignmentConfig(prev => ({ ...prev, autoReassign: checked }))}
                          />
                          <Label htmlFor="auto-reassign" className="text-sm">Auto-reassign if declined</Label>
                        </div>
                      </div>

                      {/* Subcontractor Selection */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Select Subcontractors ({selectedSubcontractors.length}/5)
                        </Label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {getSubcontractorsByProximity(booking.service_address).map((sub) => (
                            <div
                              key={sub.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedSubcontractors.includes(sub.id)
                                  ? 'bg-primary/10 border-primary'
                                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                              }`}
                              onClick={() => toggleSubcontractorSelection(sub.id)}
                            >
                              <input
                                type="checkbox"
                                checked={selectedSubcontractors.includes(sub.id)}
                                onChange={() => toggleSubcontractorSelection(sub.id)}
                                className="rounded"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{sub.full_name}</span>
                                  <Badge variant={getTierBadgeVariant(sub.tier_level)} className="text-xs">
                                    {getTierName(sub.tier_level)}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Star className="h-3 w-3" /> {sub.rating} • {sub.city}, {sub.state}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Assignment Notes */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Assignment Notes</Label>
                        <Textarea
                          value={assignmentConfig.notes}
                          onChange={(e) => setAssignmentConfig(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Any special instructions for the subcontractors..."
                          rows={2}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleEnhancedAssignment(booking.id)} 
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send Enhanced Assignment
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAssigningBookingId(null);
                            setSelectedSubcontractors([]);
                            setAssignmentConfig(prev => ({ ...prev, notes: '' }));
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Assign Button */}
                  {assigningBookingId !== booking.id && (
                    <div className="flex justify-end">
                      <Button onClick={() => setAssigningBookingId(booking.id)}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Enhanced Assign
                      </Button>
                    </div>
                  )}
                </div>
              </AdminCard>
            ))}
          </AdminGrid>
        )}
      </div>
    </div>
  );
}