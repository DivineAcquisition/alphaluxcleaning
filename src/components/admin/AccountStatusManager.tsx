import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Shield, Ban, Play } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AccountStatusManagerProps {
  subcontractorId: string;
  currentStatus: string;
  subcontractorName: string;
  onStatusUpdate?: () => void;
}

export const AccountStatusManager: React.FC<AccountStatusManagerProps> = ({
  subcontractorId,
  currentStatus,
  subcontractorName,
  onStatusUpdate
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [reason, setReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const statusConfig = {
    active: { 
      label: 'Active', 
      color: 'default', 
      icon: Play,
      description: 'Account is active and can accept jobs'
    },
    suspended: { 
      label: 'Suspended', 
      color: 'secondary', 
      icon: AlertTriangle,
      description: 'Account is temporarily suspended'
    },
    banned: { 
      label: 'Banned', 
      color: 'destructive', 
      icon: Ban,
      description: 'Account is permanently banned'
    },
    inactive: { 
      label: 'Inactive', 
      color: 'outline', 
      icon: Shield,
      description: 'Account is inactive'
    }
  };

  const handleStatusChange = async () => {
    if (!reason.trim() && newStatus !== 'active') {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for the status change.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    
    try {
      // Update subcontractor status
      const { error: updateError } = await supabase
        .from('subcontractors')
        .update({ 
          account_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', subcontractorId);

      if (updateError) throw updateError;

      // Log the status change in security audit
      const { error: auditError } = await supabase.rpc('log_security_event', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_action_type: 'account_status_change',
        p_resource_type: 'subcontractors',
        p_resource_id: subcontractorId,
        p_old_values: { account_status: currentStatus },
        p_new_values: { account_status: newStatus, reason },
        p_risk_level: newStatus === 'banned' ? 'critical' : 'high'
      });

      if (auditError) {
        console.warn('Failed to log security audit:', auditError);
      }

      toast({
        title: "Status Updated",
        description: `${subcontractorName}'s account status has been updated to ${statusConfig[newStatus as keyof typeof statusConfig].label}.`,
      });

      setIsDialogOpen(false);
      setReason('');
      onStatusUpdate?.();

    } catch (error) {
      console.error('Error updating account status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update account status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const CurrentStatusIcon = statusConfig[currentStatus as keyof typeof statusConfig]?.icon || Shield;
  const currentConfig = statusConfig[currentStatus as keyof typeof statusConfig];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CurrentStatusIcon className="h-5 w-5" />
          Account Status Management
        </CardTitle>
        <CardDescription>
          Manage {subcontractorName}'s account status and restrictions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Current Status</Label>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={currentConfig?.color as any}>
                {currentConfig?.label || 'Unknown'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {currentConfig?.description}
              </span>
            </div>
          </div>
          <Button 
            onClick={() => setIsDialogOpen(true)}
            variant="outline"
            className="ml-4"
          >
            Change Status
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Account Status</DialogTitle>
              <DialogDescription>
                Update the account status for {subcontractorName}. This will affect their ability to accept jobs and access the platform.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newStatus !== 'active' && (
                <div>
                  <Label htmlFor="reason">Reason for Status Change *</Label>
                  <Textarea
                    id="reason"
                    placeholder="Provide a detailed reason for this status change..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleStatusChange}
                disabled={isUpdating}
                className="bg-primary hover:bg-primary/90"
              >
                {isUpdating ? 'Updating...' : 'Update Status'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};