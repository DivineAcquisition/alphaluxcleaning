import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { JobAssignmentManager } from '@/components/admin/JobAssignmentManager';

export default function JobAssignments() {
  return (
    <AdminLayout 
      title="Job Assignments" 
      description="Manage job assignments between subcontractors and bookings"
    >
      <JobAssignmentManager />
    </AdminLayout>
  );
}