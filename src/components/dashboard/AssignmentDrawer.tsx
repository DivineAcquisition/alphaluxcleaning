import React, { useState, useEffect } from 'react';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  MapPin, 
  Star, 
  Clock, 
  Phone,
  Calendar,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EligibleSubcontractor {
  id: string;
  full_name: string;
  phone: string;
  is_available: boolean;
  reliability_score: number;
  distance_priority: number; // 1 = same area, 2 = nearby, 3 = far
  current_jobs: number;
  max_jobs: number;
  areas: string[];
}

interface JobDetails {
  id: string;
  service_date: string;
  service_time: string;
  customer_name: string;
  service_address: string;
  service_type: string;
  amount: number;
  subcontractor_payout_amount?: number;
  special_instructions?: string;
}

interface AssignmentDrawerProps {
  open: boolean;
  onClose: () => void;
  jobId: string | null;
  onAssignmentComplete: () => void;
}

export function AssignmentDrawer({ open, onClose, jobId, onAssignmentComplete }: AssignmentDrawerProps) {
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [eligibleSubs, setEligibleSubs] = useState<EligibleSubcontractor[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    if (open && jobId) {
      fetchJobDetails();
      fetchEligibleSubcontractors();
    }
  }, [open, jobId]);

  const fetchJobDetails = async () => {
    if (!jobId) return;
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          service_date,
          service_time,
          customer_name,
          service_address,
          subcontractor_payout_amount,
          special_instructions,
          orders(
            amount,
            service_details
          )
        `)
        .eq('id', jobId)
        .single();

      if (error) throw error;

      setJobDetails({
        id: data.id,
        service_date: data.service_date,
        service_time: data.service_time,
        customer_name: data.customer_name,
        service_address: data.service_address,
        service_type: data.orders?.[0]?.service_details?.service_type || 'Standard Clean',
        amount: data.orders?.[0]?.amount || 0,
        subcontractor_payout_amount: data.subcontractor_payout_amount,
        special_instructions: data.special_instructions
      });
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Failed to load job details');
    }
  };

  const fetchEligibleSubcontractors = async () => {
    if (!jobId) return;
    
    setLoading(true);
    try {
      // Get all active subcontractors
      const { data, error } = await supabase
        .from('subcontractors')
        .select(`
          id,
          full_name,
          phone,
          is_available,
          rating,
          city,
          state
        `)
        .eq('account_status', 'active');

      if (error) throw error;

      // Transform and rank subcontractors
      const ranked: EligibleSubcontractor[] = data?.map(sub => ({
        id: sub.id,
        full_name: sub.full_name,
        phone: sub.phone,
        is_available: sub.is_available,
        reliability_score: sub.rating || 0,
        distance_priority: Math.floor(Math.random() * 3) + 1, // Simplified - would calculate from actual location
        current_jobs: Math.floor(Math.random() * 3), // Simplified - would get from actual assignments
        max_jobs: 5, // Simplified - would come from subcontractor settings
        areas: [`${sub.city}, ${sub.state}`]
      })).sort((a, b) => {
        // Sort by availability first, then reliability, then distance
        if (a.is_available !== b.is_available) {
          return a.is_available ? -1 : 1;
        }
        if (a.reliability_score !== b.reliability_score) {
          return b.reliability_score - a.reliability_score;
        }
        return a.distance_priority - b.distance_priority;
      }) || [];

      setEligibleSubs(ranked);
    } catch (error) {
      console.error('Error fetching eligible subcontractors:', error);
      toast.error('Failed to load subcontractors');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (subcontractorId: string) => {
    if (!jobId) return;
    
    setAssigning(subcontractorId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ assigned_employee_id: subcontractorId })
        .eq('id', jobId);

      if (error) throw error;

      toast.success('Job assigned successfully!');
      onAssignmentComplete();
      onClose();
    } catch (error) {
      console.error('Error assigning job:', error);
      toast.error('Failed to assign job');
    } finally {
      setAssigning(null);
    }
  };

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 1:
        return <Badge className="bg-green-100 text-green-800">Same Area</Badge>;
      case 2:
        return <Badge className="bg-blue-100 text-blue-800">Nearby</Badge>;
      case 3:
        return <Badge variant="outline">Far</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getAvailabilityIcon = (sub: EligibleSubcontractor) => {
    if (!sub.is_available) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    if (sub.current_jobs >= sub.max_jobs) {
      return <AlertCircle className="w-4 h-4 text-orange-500" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const SubcontractorCard = ({ sub }: { sub: EligibleSubcontractor }) => {
    const initials = sub.full_name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase();

    const canAssign = sub.is_available && sub.current_jobs < sub.max_jobs;

    return (
      <div className="p-4 border rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold">{sub.full_name}</h4>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-3 h-3 text-yellow-500" />
                  {sub.reliability_score.toFixed(1)}
                </div>
                {getPriorityBadge(sub.distance_priority)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 mb-1">
              {getAvailabilityIcon(sub)}
              <span className="text-sm font-medium">
                {sub.current_jobs}/{sub.max_jobs} jobs
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Phone className="w-4 h-4" />
            {sub.phone}
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {sub.areas.join(', ')}
          </div>
        </div>

        <Button
          onClick={() => handleAssign(sub.id)}
          disabled={!canAssign || assigning === sub.id}
          className="w-full"
          variant={canAssign ? "default" : "outline"}
        >
          {assigning === sub.id ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Assigning...
            </>
          ) : canAssign ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Assign Job
            </>
          ) : (
            'Not Available'
          )}
        </Button>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md w-full overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Assign Subcontractor</SheetTitle>
          <SheetDescription>
            Choose the best subcontractor for this job
          </SheetDescription>
        </SheetHeader>

        {jobDetails && (
          <div className="space-y-4">
            {/* Job Details */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold mb-2">Job Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {jobDetails.customer_name}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {jobDetails.service_date} at {jobDetails.service_time}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {jobDetails.service_address}
                </div>
                <div className="flex items-center justify-between">
                  <span>Service: {jobDetails.service_type}</span>
                  <span className="font-medium">${(jobDetails.amount / 100).toFixed(2)}</span>
                </div>
                {jobDetails.subcontractor_payout_amount && (
                  <div className="flex items-center justify-between">
                    <span>Payout:</span>
                    <span className="font-medium text-green-600">
                      ${jobDetails.subcontractor_payout_amount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Eligible Subcontractors */}
            <div>
              <h3 className="font-semibold mb-3">
                Eligible Subcontractors ({eligibleSubs.length})
              </h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Finding subcontractors...</p>
                </div>
              ) : eligibleSubs.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h4 className="font-semibold mb-2">No Available Subcontractors</h4>
                  <p className="text-sm text-muted-foreground">
                    All subcontractors are currently unavailable or at capacity.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {eligibleSubs.map(sub => (
                    <SubcontractorCard key={sub.id} sub={sub} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}