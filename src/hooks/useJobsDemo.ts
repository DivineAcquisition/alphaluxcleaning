import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Job {
  id: string;
  customer_id: string;
  service_type: string;
  job_date: string;
  time_window: string;
  duration_est_mins: number;
  address_json: any;
  special_instructions?: string;
  price_cents: number;
  status: 'unassigned' | 'offered' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'no_show' | 'cancelled' | 'paid';
  assigned_cleaner_id?: string;
  payout_cents: number;
  created_at: string;
  updated_at: string;
  company_id: string;
  customer?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
    phone?: string;
  };
  cleaner?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    rating: number;
  };
}

// Demo data for the dispatcher board
const demoJobs: Job[] = [
  {
    id: '1',
    customer_id: 'cust-1',
    service_type: 'Deep Clean',
    job_date: new Date().toISOString().split('T')[0], // Today
    time_window: 'morning',
    duration_est_mins: 120,
    address_json: { address: '123 Main St, San Francisco, CA 94102' },
    special_instructions: 'Focus on kitchen and bathrooms',
    price_cents: 15000,
    status: 'unassigned',
    payout_cents: 5000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    company_id: '550e8400-e29b-41d4-a716-446655440000',
    customer: {
      id: 'cust-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '(857) 754-4557'
    }
  },
  {
    id: '2',
    customer_id: 'cust-2',
    service_type: 'Regular Clean',
    job_date: new Date().toISOString().split('T')[0], // Today
    time_window: 'afternoon',
    duration_est_mins: 90,
    address_json: { address: '456 Oak Ave, San Francisco, CA 94103' },
    price_cents: 12000,
    status: 'offered',
    assigned_cleaner_id: 'cleaner-1',
    payout_cents: 4000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    company_id: '550e8400-e29b-41d4-a716-446655440000',
    customer: {
      id: 'cust-2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      phone: '(555) 987-6543'
    },
    cleaner: {
      id: 'cleaner-1',
      name: 'Maria Rodriguez',
      email: 'maria@example.com',
      phone: '(555) 111-2222',
      rating: 4.8
    }
  },
  {
    id: '3',
    customer_id: 'cust-3',
    service_type: 'Move-out Clean',
    job_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    time_window: 'morning',
    duration_est_mins: 180,
    address_json: { address: '789 Pine St, San Francisco, CA 94104' },
    special_instructions: 'Empty apartment, need deep clean for security deposit',
    price_cents: 25000,
    status: 'accepted',
    assigned_cleaner_id: 'cleaner-2',
    payout_cents: 8000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    company_id: '550e8400-e29b-41d4-a716-446655440000',
    customer: {
      id: 'cust-3',
      first_name: 'Mike',
      last_name: 'Johnson',
      email: 'mike@example.com',
      phone: '(555) 555-5555'
    },
    cleaner: {
      id: 'cleaner-2',
      name: 'Carlos Mendez',
      email: 'carlos@example.com',
      phone: '(555) 333-4444',
      rating: 4.9
    }
  },
  {
    id: '4',
    customer_id: 'cust-4',
    service_type: 'Regular Clean',
    job_date: new Date().toISOString().split('T')[0], // Today
    time_window: 'evening',
    duration_est_mins: 90,
    address_json: { address: '321 Elm St, San Francisco, CA 94105' },
    price_cents: 11000,
    status: 'in_progress',
    assigned_cleaner_id: 'cleaner-3',
    payout_cents: 3500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    company_id: '550e8400-e29b-41d4-a716-446655440000',
    customer: {
      id: 'cust-4',
      first_name: 'Sarah',
      last_name: 'Wilson',
      email: 'sarah@example.com',
      phone: '(555) 777-8888'
    },
    cleaner: {
      id: 'cleaner-3',
      name: 'Ana Garcia',
      email: 'ana@example.com',
      phone: '(555) 999-0000',
      rating: 4.7
    }
  },
  {
    id: '5',
    customer_id: 'cust-5',
    service_type: 'Deep Clean',
    job_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    time_window: 'morning',
    duration_est_mins: 150,
    address_json: { address: '654 Maple Dr, San Francisco, CA 94106' },
    price_cents: 18000,
    status: 'completed',
    assigned_cleaner_id: 'cleaner-1',
    payout_cents: 6000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    company_id: '550e8400-e29b-41d4-a716-446655440000',
    customer: {
      id: 'cust-5',
      first_name: 'David',
      last_name: 'Brown',
      email: 'david@example.com',
      phone: '(555) 222-3333'
    },
    cleaner: {
      id: 'cleaner-1',
      name: 'Maria Rodriguez',
      email: 'maria@example.com',
      phone: '(555) 111-2222',
      rating: 4.8
    }
  }
];

export function useJobsDemo() {
  const [jobs, setJobs] = useState<Job[]>(demoJobs);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateJobStatus = async (jobId: string, status: Job['status']) => {
    try {
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status, updated_at: new Date().toISOString() } : job
      ));

      toast({
        title: "Success",
        description: `Job status updated to ${status.replace('_', ' ')}`,
      });
    } catch (error) {
      console.error('Error updating job status:', error);
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive",
      });
    }
  };

  const assignCleaner = async (jobId: string, cleanerId: string) => {
    try {
      // Find the cleaner (in a real app, this would come from the cleaners table)
      const demoCleaners = [
        { id: 'cleaner-1', name: 'Maria Rodriguez', email: 'maria@example.com', phone: '(555) 111-2222', rating: 4.8 },
        { id: 'cleaner-2', name: 'Carlos Mendez', email: 'carlos@example.com', phone: '(555) 333-4444', rating: 4.9 },
        { id: 'cleaner-3', name: 'Ana Garcia', email: 'ana@example.com', phone: '(555) 999-0000', rating: 4.7 },
        { id: 'cleaner-4', name: 'Luis Martinez', email: 'luis@example.com', phone: '(555) 444-5555', rating: 4.6 }
      ];

      const selectedCleaner = demoCleaners.find(c => c.id === cleanerId);

      setJobs(prev => prev.map(job => 
        job.id === jobId ? { 
          ...job, 
          assigned_cleaner_id: cleanerId,
          cleaner: selectedCleaner,
          status: 'offered',
          updated_at: new Date().toISOString()
        } : job
      ));

      toast({
        title: "Success",
        description: "Cleaner assigned successfully",
      });
    } catch (error) {
      console.error('Error assigning cleaner:', error);
      toast({
        title: "Error",
        description: "Failed to assign cleaner",
        variant: "destructive",
      });
    }
  };

  const fetchJobs = async () => {
    // In demo mode, jobs are already loaded
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return {
    jobs,
    loading,
    fetchJobs,
    updateJobStatus,
    assignCleaner
  };
}