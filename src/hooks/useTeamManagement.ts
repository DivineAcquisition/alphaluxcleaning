import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_available: boolean;
  rating: number;
  jobsCompleted: number;
  city?: string;
  state?: string;
  split_tier?: string;
  created_at: string;
  updated_at: string;
}

export function useTeamManagement() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchTeamMembers = async () => {
    try {
      const { data: subcontractors, error } = await supabase
        .from('subcontractors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get job completion counts for each subcontractor
      const membersWithJobs = await Promise.all(
        (subcontractors || []).map(async (member) => {
          const { count: jobsCompleted } = await supabase
            .from('subcontractor_job_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('subcontractor_id', member.id)
            .eq('status', 'completed');

          return {
            ...member,
            jobsCompleted: jobsCompleted || 0
          };
        })
      );

      setTeamMembers(membersWithJobs);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast({
        title: "Error",
        description: "Failed to load team members",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMemberAvailability = async (memberId: string, isAvailable: boolean) => {
    try {
      const { error } = await supabase
        .from('subcontractors')
        .update({ is_available: isAvailable })
        .eq('id', memberId);

      if (error) throw error;

      setTeamMembers(prev => prev.map(member => 
        member.id === memberId ? { ...member, is_available: isAvailable } : member
      ));

      toast({
        title: "Success",
        description: `Member marked as ${isAvailable ? 'available' : 'unavailable'}`
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive"
      });
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('subcontractors')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setTeamMembers(prev => prev.filter(member => member.id !== memberId));

      toast({
        title: "Success",
        description: "Team member removed successfully"
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive"
      });
    }
  };

  const filteredMembers = teamMembers.filter(member =>
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone.includes(searchTerm)
  );

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  return {
    teamMembers: filteredMembers,
    loading,
    searchTerm,
    setSearchTerm,
    updateMemberAvailability,
    removeMember,
    refreshTeamMembers: fetchTeamMembers
  };
}