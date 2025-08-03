import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useSubcontractors } from "@/hooks/useSubcontractors";

interface CleanerAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  clientName: string;
  onAssign: (jobId: string, subcontractorId: string) => void;
}

export function CleanerAssignmentDialog({
  open,
  onOpenChange,
  jobId,
  clientName,
  onAssign,
}: CleanerAssignmentDialogProps) {
  const [selectedCleaner, setSelectedCleaner] = useState<string>("");
  const { subcontractors, loading } = useSubcontractors();

  const handleAssign = () => {
    if (selectedCleaner) {
      onAssign(jobId, selectedCleaner);
      setSelectedCleaner("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Cleaner</DialogTitle>
          <DialogDescription>
            Select a cleaner to assign to {clientName}'s job.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="cleaner" className="text-right font-medium">
              Cleaner
            </label>
            <div className="col-span-3">
              <Select value={selectedCleaner} onValueChange={setSelectedCleaner}>
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Loading..." : "Select a cleaner"} />
                </SelectTrigger>
                <SelectContent>
                  {subcontractors.map((cleaner) => (
                    <SelectItem key={cleaner.id} value={cleaner.id}>
                      {cleaner.full_name} - {cleaner.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedCleaner}>
            Assign Cleaner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}