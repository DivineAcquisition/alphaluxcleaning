import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { JobAssignmentManager } from '@/components/admin/JobAssignmentManager';
import { MultiCleanerAssignmentTest } from '@/components/admin/MultiCleanerAssignmentTest';

export default function JobAssignments() {
  return (
    <AdminLayout 
      title="Job Assignments" 
      description="Manage job assignments between subcontractors and bookings"
    >
      <div className="space-y-6">
        <MultiCleanerAssignmentTest />
        <JobAssignmentManager />
      </div>
    </AdminLayout>
  );
}