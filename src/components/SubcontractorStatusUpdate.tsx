import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Clock, MapPin, Send } from "lucide-react";

interface SubcontractorStatusUpdateProps {
  orderId: string;
  onStatusUpdate?: (status: string) => void;
}

export const SubcontractorStatusUpdate = ({ orderId, onStatusUpdate }: SubcontractorStatusUpdateProps) => {
  const [isSubcontractor, setIsSubcontractor] = useState(false);
  const [subcontractorId, setSubcontractorId] = useState<string>('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<any>(null);

  useEffect(() => {
    checkSubcontractorAccess();
    fetchLastUpdate();
  }, [orderId]);

  const checkSubcontractorAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if current user is a subcontractor assigned to this order
      const { data: subcontractor } = await supabase
        .from('subcontractors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (subcontractor) {
        setSubcontractorId(subcontractor.id);
        
        // Check if this subcontractor is assigned to the order
        const { data: assignment } = await supabase
          .from('subcontractor_job_assignments')
          .select('booking_id')
          .eq('subcontractor_id', subcontractor.id)
          .eq('status', 'accepted');

        if (assignment && assignment.length > 0) {
          // Check if any of these bookings match the order
          const { data: booking } = await supabase
            .from('bookings')
            .select('order_id')
            .eq('order_id', orderId)
            .in('id', assignment.map(a => a.booking_id))
            .single();

          if (booking) {
            setIsSubcontractor(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking subcontractor access:', error);
    }
  };

  const fetchLastUpdate = async () => {
    try {
      const { data } = await supabase
        .from('order_status_updates')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setLastUpdate(data);
      }
    } catch (error) {
      // No updates yet, which is fine
    }
  };

  const handleStatusUpdate = async () => {
    if (!isSubcontractor || !subcontractorId) {
      toast.error('Access denied');
      return;
    }

    if (!estimatedMinutes && !customMessage) {
      toast.error('Please provide either an estimated arrival time or a custom message');
      return;
    }

    setIsLoading(true);
    try {
      const statusMessage = customMessage || `Estimated arrival: ${estimatedMinutes} minutes`;
      
      const { error } = await supabase
        .from('order_status_updates')
        .insert({
          order_id: orderId,
          subcontractor_id: subcontractorId,
          status_message: statusMessage,
          estimated_arrival_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : null
        });

      if (error) throw error;

      toast.success('Status updated successfully');
      setEstimatedMinutes('');
      setCustomMessage('');
      fetchLastUpdate();
      
      if (onStatusUpdate) {
        onStatusUpdate(statusMessage);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSubcontractor) {
    return null;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Update Arrival Status
        </CardTitle>
        <CardDescription className="text-blue-50">
          Keep customers informed about your arrival time
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {lastUpdate && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="text-sm font-medium">Last Update:</div>
            <div className="text-sm text-muted-foreground">{lastUpdate.status_message}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(lastUpdate.created_at).toLocaleString()}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="estimated-minutes">Quick Arrival Time</Label>
            <Select value={estimatedMinutes} onValueChange={setEstimatedMinutes}>
              <SelectTrigger>
                <SelectValue placeholder="Select here" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutes away</SelectItem>
                <SelectItem value="10">10 minutes away</SelectItem>
                <SelectItem value="15">15 minutes away</SelectItem>
                <SelectItem value="30">30 minutes away</SelectItem>
                <SelectItem value="60">1 hour away</SelectItem>
                <SelectItem value="120">2 hours away</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            OR
          </div>

          <div>
            <Label htmlFor="custom-message">Custom Status Message</Label>
            <Input
              id="custom-message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="e.g., Running 10 minutes late due to traffic"
              maxLength={200}
            />
          </div>

          <Button 
            onClick={handleStatusUpdate}
            disabled={isLoading || (!estimatedMinutes && !customMessage)}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Updating...' : 'Update Status'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};