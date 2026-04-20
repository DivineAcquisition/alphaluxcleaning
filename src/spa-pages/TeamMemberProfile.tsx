import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Star,
  Clock,
  Briefcase,
  Calendar,
  TrendingUp,
  DollarSign,
  Shield,
  Plus,
  X
} from 'lucide-react';

export default function TeamMemberProfile() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [subcontractor, setSubcontractor] = useState<any>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [serviceAreas, setServiceAreas] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [newZip, setNewZip] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (id) {
      fetchSubcontractorData();
    }
  }, [id]);

  const fetchSubcontractorData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      // Fetch subcontractor details
      const { data: subData, error: subError } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('id', id)
        .single();

      if (subError) throw subError;
      setSubcontractor(subData);

      // Fetch availability
      const { data: availData, error: availError } = await supabase
        .from('subcontractor_availability')
        .select('*')
        .eq('subcontractor_id', id)
        .order('day_of_week');

      if (availError && availError.code !== 'PGRST116') {
        throw availError;
      }

      // Create full week schedule
      const daysOfWeek = [0, 1, 2, 3, 4, 5, 6];
      const availabilityMap = new Map((availData || []).map(slot => [slot.day_of_week, slot]));
      
      const fullSchedule = daysOfWeek.map(day => 
        availabilityMap.get(day) || {
          day_of_week: day,
          is_available: false,
          start_time: '09:00',
          end_time: '17:00'
        }
      );
      setAvailability(fullSchedule);

      // Fetch service areas
      const { data: areasData, error: areasError } = await supabase
        .from('subcontractor_service_areas')
        .select('*')
        .eq('subcontractor_id', id);

      if (areasError && areasError.code !== 'PGRST116') {
        throw areasError;
      }
      setServiceAreas(areasData || []);

      // Fetch performance metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('subcontractor_metrics')
        .select('*')
        .eq('subcontractor_id', id)
        .order('period_start', { ascending: false })
        .limit(12); // Last 12 periods

      if (metricsError && metricsError.code !== 'PGRST116') {
        throw metricsError;
      }
      setMetrics(metricsData || []);

    } catch (error: any) {
      console.error('Error fetching subcontractor data:', error);
      toast({
        title: "Error",
        description: "Failed to load team member data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = async (dayOfWeek: number, isAvailable: boolean, startTime?: string, endTime?: string) => {
    try {
      const { error } = await supabase
        .from('subcontractor_availability')
        .upsert({
          subcontractor_id: id,
          day_of_week: dayOfWeek,
          is_available: isAvailable,
          start_time: startTime,
          end_time: endTime
        });

      if (error) throw error;

      setAvailability(prev => 
        prev.map(slot => 
          slot.day_of_week === dayOfWeek 
            ? { ...slot, is_available: isAvailable, start_time: startTime, end_time: endTime }
            : slot
        )
      );

      toast({
        title: "Success",
        description: "Availability updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating availability:', error);
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      });
    }
  };

  const addServiceArea = async () => {
    if (!newZip.trim()) return;

    try {
      const { error } = await supabase
        .from('subcontractor_service_areas')
        .insert({
          subcontractor_id: id,
          zip: newZip.trim()
        });

      if (error) throw error;

      setServiceAreas(prev => [...prev, { id: Date.now().toString(), subcontractor_id: id, zip: newZip.trim() }]);
      setNewZip('');
      
      toast({
        title: "Success",
        description: "Service area added successfully",
      });
    } catch (error: any) {
      console.error('Error adding service area:', error);
      toast({
        title: "Error",
        description: "Failed to add service area",
        variant: "destructive",
      });
    }
  };

  const removeServiceArea = async (areaId: string) => {
    try {
      const { error } = await supabase
        .from('subcontractor_service_areas')
        .delete()
        .eq('id', areaId);

      if (error) throw error;

      setServiceAreas(prev => prev.filter(area => area.id !== areaId));
      
      toast({
        title: "Success",
        description: "Service area removed successfully",
      });
    } catch (error: any) {
      console.error('Error removing service area:', error);
      toast({
        title: "Error",
        description: "Failed to remove service area",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!subcontractor) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Team member not found</h3>
            <p className="text-muted-foreground">The team member you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">
                {subcontractor.full_name}
              </h1>
              <div className="flex items-center gap-4 mb-4">
                <Badge variant={subcontractor.active ? "default" : "secondary"}>
                  {subcontractor.active ? "Active" : "Inactive"}
                </Badge>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-current text-amber-500" />
                  <span className="font-medium">{(subcontractor.rating || 0).toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    ({subcontractor.review_count || 0} reviews)
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{subcontractor.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{subcontractor.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{subcontractor.city}, {subcontractor.state}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 md:min-w-60">
              <div className="text-center p-3 bg-primary/5 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {(subcontractor.reliability_score || 100).toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">Reliability</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {subcontractor.completed_jobs_count || 0}
                </div>
                <div className="text-xs text-muted-foreground">Jobs Done</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {subcontractor.avg_duration_minutes || 120}m
                </div>
                <div className="text-xs text-muted-foreground">Avg Time</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="areas">Service Areas</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input value={subcontractor.email} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input value={subcontractor.phone} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium">Address</label>
                  <Input value={subcontractor.address || 'Not provided'} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium">City, State</label>
                  <Input value={`${subcontractor.city || ''}, ${subcontractor.state || ''}`} disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {(subcontractor.reliability_score || 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Reliability Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {subcontractor.completed_jobs_count || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Jobs Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {subcontractor.avg_duration_minutes || 120}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Duration (min)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">
                    {(subcontractor.rating || 0).toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {availability.map((slot) => (
                <div key={slot.day_of_week} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-20 font-medium">
                      {dayNames[slot.day_of_week]}
                    </div>
                    <Switch
                      checked={slot.is_available || false}
                      onCheckedChange={(checked) => 
                        updateAvailability(slot.day_of_week, checked, slot.start_time, slot.end_time)
                      }
                    />
                  </div>
                  
                  {slot.is_available && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={slot.start_time || '09:00'}
                        onChange={(e) => 
                          updateAvailability(slot.day_of_week, slot.is_available, e.target.value, slot.end_time)
                        }
                        className="w-32"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={slot.end_time || '17:00'}
                        onChange={(e) => 
                          updateAvailability(slot.day_of_week, slot.is_available, slot.start_time, e.target.value)
                        }
                        className="w-32"
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="areas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Areas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter ZIP code"
                  value={newZip}
                  onChange={(e) => setNewZip(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addServiceArea} disabled={!newZip.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {serviceAreas.map((area) => (
                  <Badge key={area.id} variant="outline" className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    {area.zip}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeServiceArea(area.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              
              {serviceAreas.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No service areas assigned. Add ZIP codes to define where this team member can work.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.length > 0 && (
              <>
                <Card>
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {(metrics[0]?.acceptance_rate || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Acceptance Rate</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">
                      {(metrics[0]?.on_time_rate || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">On-Time Rate</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Briefcase className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">
                      {metrics[0]?.jobs_completed || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Jobs This Period</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Star className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-amber-600">
                      {(metrics[0]?.avg_rating || 0).toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Rating</div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {metrics.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No performance data</h3>
                <p className="text-muted-foreground text-center">
                  Performance metrics will appear here once this team member starts completing jobs.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}