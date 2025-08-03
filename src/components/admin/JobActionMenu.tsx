import { MoreHorizontal, Edit, Users, Calendar, DollarSign, Bell, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CleanerAssignmentDialog } from "./CleanerAssignmentDialog";
import { useState } from "react";

interface JobActionMenuProps {
  job: {
    id: string;
    client: string;
    status: string;
    booking_id?: string;
    assignment_id?: string;
  };
  onStatusUpdate: (jobId: string, status: string) => void;
  onAssignCleaner: (jobId: string, subcontractorId: string) => void;
}

export function JobActionMenu({ job, onStatusUpdate, onAssignCleaner }: JobActionMenuProps) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const handleStatusChange = (newStatus: string) => {
    onStatusUpdate(job.id, newStatus);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setAssignDialogOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            Assign Cleaner
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusChange('confirmed')}>
            <Calendar className="mr-2 h-4 w-4" />
            Confirm Job
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
            <Bell className="mr-2 h-4 w-4" />
            Mark Complete
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusChange('cancelled')}>
            <Ban className="mr-2 h-4 w-4" />
            Cancel Job
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CleanerAssignmentDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        jobId={job.id}
        clientName={job.client}
        onAssign={onAssignCleaner}
      />
    </>
  );
}