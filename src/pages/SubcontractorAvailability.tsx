import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar,
  Clock,
  Star,
  MessageSquare,
  Settings,
  User,
  MapPin,
  Phone,
  CheckCircle
} from "lucide-react";

interface AvailabilitySlot {
  day: string;
  available: boolean;
  startTime: string;
  endTime: string;
}

interface Feedback {
  id: string;
  customer_name: string;
  overall_rating: number;
  feedback_text: string;
  created_at: string;
}

export default function SubcontractorAvailability() {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([
    { day: 'Monday', available: true, startTime: '08:00', endTime: '18:00' },
    { day: 'Tuesday', available: true, startTime: '08:00', endTime: '18:00' },
    { day: 'Wednesday', available: true, startTime: '08:00', endTime: '18:00' },
    { day: 'Thursday', available: true, startTime: '08:00', endTime: '18:00' },
    { day: 'Friday', available: true, startTime: '08:00', endTime: '18:00' },
    { day: 'Saturday', available: false, startTime: '09:00', endTime: '15:00' },
    { day: 'Sunday', available: false, startTime: '09:00', endTime: '15:00' }
  ]);
  
  const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([]);
  const [profile, setProfile] = useState({
    phone: '',
    emergency_contact: '',
    preferred_areas: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchRecentFeedback();
      fetchProfile();
    }
  }, [user]);

  const fetchRecentFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_feedback')
        .select('*')
        .eq('subcontractor_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentFeedback(data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('phone, zip_code, city')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile({
          phone: data.phone || '',
          emergency_contact: '',
          preferred_areas: `${data.city || ''} ${data.zip_code || ''}`,
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const updateAvailability = (index: number, field: keyof AvailabilitySlot, value: any) => {
    const updated = [...availability];
    updated[index] = { ...updated[index], [field]: value };
    setAvailability(updated);
  };

  const saveAvailability = async () => {
    // In a real app, you'd save this to a database
    console.log('Saving availability:', availability);
  };

  const saveProfile = async () => {
    try {
      const { error } = await supabase
        .from('subcontractors')
        .update({
          phone: profile.phone
        })
        .eq('user_id', user?.id);

      if (error) throw error;
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Mobile Header */}
      <div className="bg-primary text-primary-foreground p-4 shadow-lg">
        <h1 className="text-xl font-bold">Settings & Availability</h1>
        <p className="text-sm opacity-90">Manage your schedule and preferences</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Weekly Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {availability.map((slot, index) => (
              <div key={slot.day} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">{slot.day}</Label>
                  <Switch
                    checked={slot.available}
                    onCheckedChange={(checked) => 
                      updateAvailability(index, 'available', checked)
                    }
                  />
                </div>
                
                {slot.available && (
                  <div className="grid grid-cols-2 gap-2 ml-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Start</Label>
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => 
                          updateAvailability(index, 'startTime', e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">End</Label>
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => 
                          updateAvailability(index, 'endTime', e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}
                
                {index < availability.length - 1 && <Separator />}
              </div>
            ))}
            
            <Button onClick={saveAvailability} className="w-full">
              Save Availability
            </Button>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            
            <div>
              <Label htmlFor="emergency">Emergency Contact</Label>
              <Input
                id="emergency"
                value={profile.emergency_contact}
                onChange={(e) => setProfile({...profile, emergency_contact: e.target.value})}
                placeholder="+1 (555) 987-6543"
              />
            </div>
            
            <div>
              <Label htmlFor="areas">Preferred Work Areas</Label>
              <Textarea
                id="areas"
                value={profile.preferred_areas}
                onChange={(e) => setProfile({...profile, preferred_areas: e.target.value})}
                placeholder="San Francisco, Oakland, Berkeley..."
                rows={3}
              />
            </div>
            
            <Button onClick={saveProfile} className="w-full">
              Update Profile
            </Button>
          </CardContent>
        </Card>

        {/* Recent Feedback */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Customer Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentFeedback.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No feedback yet</p>
                <p className="text-sm">Complete more jobs to see customer reviews</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentFeedback.map((feedback) => (
                  <div key={feedback.id} className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{feedback.customer_name}</span>
                      <div className="flex items-center gap-1">
                        {renderStars(feedback.overall_rating)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      "{feedback.feedback_text}"
                    </p>
                    <div className="text-xs text-muted-foreground">
                      {new Date(feedback.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}