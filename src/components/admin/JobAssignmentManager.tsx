import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Calendar, 
  MapPin, 
  User, 
  Clock, 
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Phone,
  Mail
} from "lucide-react";

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
  split_tier: string;
  rating: number;
  is_available: boolean;
  subscription_status: string;
}

interface JobAssignment {
  id: string;
  booking_id: string;
  subcontractor_id: string;
  status: string;
  assigned_at: string;
  accepted_at: string;
  completed_at: string;
  subcontractor_notes?: string;
  bookings: Booking;
  subcontractors: Subcontractor;
}

export function JobAssignmentManager() {
  const [unassignedBookings, setUnassignedBookings] = useState<Booking[]>([]);
  const [availableSubcontractors, setAvailableSubcontractors] = useState<Subcontractor[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<JobAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningBookingId, setAssigningBookingId] = useState<string | null>(null);
  const [selectedSubcontractors, setSelectedSubcontractors] = useState<string[]>([]);
  const [assignmentNotes, setAssignmentNotes] = useState("");

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

      // Fetch available subcontractors
      const { data: subcontractorsData, error: subcontractorsError } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('is_available', true)
        .eq('subscription_status', 'active')
        .order('rating', { ascending: false });

      if (subcontractorsError) throw subcontractorsError;

      // Fetch active job assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('subcontractor_job_assignments')
        .select(`
          *,
          bookings (*),
          subcontractors (*)
        `)
        .in('status', ['assigned', 'accepted'])
        .order('assigned_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      setUnassignedBookings(bookingsData || []);
      setAvailableSubcontractors(subcontractorsData || []);
      setActiveAssignments(assignmentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load job assignment data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignJob = async (bookingId: string) => {
    if (selectedSubcontractors.length === 0) {
      toast.error('Please select at least one subcontractor');
      return;
    }

    if (selectedSubcontractors.length > 3) {
      toast.error('Maximum 3 subcontractors allowed per job');
      return;
    }

    try {
      const assignmentPromises = selectedSubcontractors.map(subcontractorId =>
        supabase
          .from('subcontractor_job_assignments')
          .insert({
            booking_id: bookingId,
            subcontractor_id: subcontractorId,
            status: 'assigned',
            assigned_at: new Date().toISOString(),
            subcontractor_notes: assignmentNotes
          })
          .select()
          .single()
      );

      const assignmentResults = await Promise.all(assignmentPromises);
      
      // Check for errors
      const errors = assignmentResults.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Failed to create ${errors.length} assignments`);
      }

      const assignments = assignmentResults.map(result => result.data);

      // Update booking with primary assigned employee (first subcontractor)
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ assigned_employee_id: selectedSubcontractors[0] })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      // Send job assignment email notifications to each subcontractor
      const emailPromises = assignments.map(assignment =>
        supabase.functions.invoke('send-job-assignment-notification', {
          body: {
            subcontractorId: assignment.subcontractor_id,
            bookingId: bookingId,
            assignmentId: assignment.id,
            adminEmail: 'admin@divineacquisition.io'
          }
        })
      );

      try {
        await Promise.allSettled(emailPromises);
      } catch (emailError) {
        console.error('Error sending job assignment emails:', emailError);
        toast.error('Jobs assigned but some email notifications failed to send');
      }

      // Send order entry webhook for the completed assignment
      try {
        await supabase.functions.invoke('send-order-entry-webhook', {
          body: {
            booking_id: bookingId,
            assignment_id: assignments[0].id, // Use first assignment as primary
            webhook_url: undefined // Will use default or env webhook URL
          }
        });
        console.log('Order entry webhook sent successfully');
      } catch (webhookError) {
        console.error('Error sending order entry webhook:', webhookError);
        // Don't fail the assignment for webhook errors
      }

      toast.success(`Job assigned to ${selectedSubcontractors.length} subcontractor(s) successfully!`);
      setAssigningBookingId(null);
      setSelectedSubcontractors([]);
      setAssignmentNotes("");
      fetchData();
    } catch (error) {
      console.error('Error assigning job:', error);
      toast.error('Failed to assign job');
    }
  };

  const toggleSubcontractorSelection = (subcontractorId: string) => {
    setSelectedSubcontractors(prev => {
      if (prev.includes(subcontractorId)) {
        return prev.filter(id => id !== subcontractorId);
      } else if (prev.length < 3) {
        return [...prev, subcontractorId];
      } else {
        toast.error('Maximum 3 subcontractors allowed per job');
        return prev;
      }
    });
  };

  const getSubcontractorForLocation = (bookingCity: string, bookingState: string) => {
    return availableSubcontractors.filter(sub => {
      // Prioritize subcontractors in same city, then same state
      if (sub.city === bookingCity && sub.state === bookingState) return true;
      if (sub.state === bookingState) return true;
      return true; // Include all as backup
    });
  };

  const getSplitAmount = (splitTier: string, totalAmount: number = 100) => {
    const splits = {
      '60_40': { subcontractor: 60, company: 40 },
      '70_30': { subcontractor: 70, company: 30 },
      '80_20': { subcontractor: 80, company: 20 }
    };
    const split = splits[splitTier as keyof typeof splits] || splits['60_40'];
    return {
      subcontractor: (totalAmount * split.subcontractor) / 100,
      company: (totalAmount * split.company) / 100
    };
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading job assignments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Unassigned Bookings */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Unassigned Bookings ({unassignedBookings.length})</h3>
        {unassignedBookings.length === 0 ? (
          <AdminCard title="No Unassigned Bookings">
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
              <p>All bookings are assigned! Great work.</p>
            </div>
          </AdminCard>
        ) : (
          <AdminGrid columns={1} gap="md">
            {unassignedBookings.map((booking) => (
              <AdminCard key={booking.id} title={`Booking - ${booking.customer_name}`} variant="action">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <User className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">{booking.customer_name}</h4>
                      <Badge variant={booking.priority === 'high' ? 'destructive' : 'secondary'}>
                        {booking.priority || 'normal'} priority
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
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

                    {booking.special_instructions && (
                      <div className="bg-muted/50 rounded-lg p-3 mb-4">
                        <p className="text-sm"><strong>Special Instructions:</strong> {booking.special_instructions}</p>
                      </div>
                    )}

                    {assigningBookingId === booking.id && (
                      <div className="space-y-3 bg-background border rounded-lg p-4 mb-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Assign to Subcontractors (Max 3) - {selectedSubcontractors.length}/3 selected
                          </label>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {getSubcontractorForLocation(
                              booking.service_address.split(',')[1]?.trim() || '',
                              booking.service_address.split(',')[2]?.trim() || ''
                            ).map((sub) => (
                              <div 
                                key={sub.id} 
                                className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
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
                                  <div className="font-medium">{sub.full_name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    ⭐ {sub.rating} • {sub.split_tier.replace('_', '/')} split • {sub.city}, {sub.state}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-2 block">Assignment Notes (Optional)</label>
                          <Textarea
                            value={assignmentNotes}
                            onChange={(e) => setAssignmentNotes(e.target.value)}
                            placeholder="Any additional instructions for the subcontractor..."
                            rows={2}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={() => handleAssignJob(booking.id)} size="sm">
                            Assign Job
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setAssigningBookingId(null);
                              setSelectedSubcontractors([]);
                              setAssignmentNotes("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    {assigningBookingId === booking.id ? null : (
                      <Button onClick={() => setAssigningBookingId(booking.id)}>
                        Assign Subcontractor
                      </Button>
                    )}
                  </div>
                </div>
              </AdminCard>
            ))}
          </AdminGrid>
        )}
      </div>

      {/* Active Assignments */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Active Job Assignments ({activeAssignments.length})</h3>
        {activeAssignments.length === 0 ? (
          <AdminCard title="No Active Assignments">
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
              <p>No active job assignments.</p>
            </div>
          </AdminCard>
        ) : (
          <AdminGrid columns={1} gap="md">
            {/* Group assignments by booking_id to show multiple cleaners per job */}
            {Object.entries(
              activeAssignments.reduce((groups: { [key: string]: JobAssignment[] }, assignment) => {
                const bookingId = assignment.booking_id;
                if (!groups[bookingId]) groups[bookingId] = [];
                groups[bookingId].push(assignment);
                return groups;
              }, {})
            ).map(([bookingId, assignments]) => {
              const primaryAssignment = assignments[0]; // Use first assignment for booking details
              return (
                <AdminCard key={bookingId} title={`Job Assignment - ${primaryAssignment.bookings?.customer_name}`} variant="stat">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <User className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">{primaryAssignment.bookings?.customer_name}</h4>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {assignments.length} Cleaner{assignments.length > 1 ? 's' : ''} Assigned
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium mb-1">Customer Details</p>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>{primaryAssignment.bookings?.service_address}</div>
                            <div>{new Date(primaryAssignment.bookings?.service_date).toLocaleDateString()} at {primaryAssignment.bookings?.service_time}</div>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Assigned Team ({assignments.length})</p>
                          <div className="space-y-2">
                            {assignments.map((assignment, index) => (
                              <div key={assignment.id} className="flex items-center gap-2 text-sm">
                                <Badge variant={assignment.status === 'accepted' ? 'default' : 'secondary'} className="text-xs">
                                  {assignment.status}
                                </Badge>
                                <span className="font-medium">{assignment.subcontractors?.full_name}</span>
                                <span className="text-muted-foreground">
                                  ⭐ {assignment.subcontractors?.rating}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {assignments.some(a => a.subcontractor_notes) && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm font-medium mb-1">Assignment Notes:</p>
                          {assignments.map((assignment) => 
                            assignment.subcontractor_notes && (
                              <div key={assignment.id} className="text-sm text-muted-foreground">
                                <strong>{assignment.subcontractors?.full_name}:</strong> {assignment.subcontractor_notes}
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </AdminCard>
              );
            })}
          </AdminGrid>
        )}
      </div>

      {/* Available Subcontractors */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Available Subcontractors ({availableSubcontractors.length})</h3>
        <AdminGrid columns={3} gap="md">
          {availableSubcontractors.map((sub) => (
            <AdminCard key={sub.id} title={sub.full_name} variant="metric">
              <div className="text-center">
                <h4 className="font-semibold mb-2">{sub.full_name}</h4>
                <div className="space-y-1 text-sm text-muted-foreground mb-3">
                  <div>⭐ {sub.rating} rating</div>
                  <div>{sub.city}, {sub.state}</div>
                  <div className="font-medium text-primary">{sub.split_tier.replace('_', '/')} split</div>
                </div>
                <Badge variant={sub.is_available ? 'default' : 'secondary'}>
                  {sub.is_available ? 'Available' : 'Busy'}
                </Badge>
              </div>
            </AdminCard>
          ))}
        </AdminGrid>
      </div>
    </div>
  );
}