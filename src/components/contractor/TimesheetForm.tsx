import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateTimesheetData } from "@/hooks/useTimesheets";
import { ContractorJob } from "@/hooks/useContractorJobs";

interface TimesheetFormProps {
  jobs: ContractorJob[];
  contractorId: string;
  onSubmit: (data: CreateTimesheetData) => void;
  loading?: boolean;
}

export function TimesheetForm({ jobs, contractorId, onSubmit, loading }: TimesheetFormProps) {
  const [formData, setFormData] = useState<Partial<CreateTimesheetData>>({
    contractor_id: contractorId,
    break_minutes: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.job_id && formData.start_time && formData.end_time) {
      onSubmit({
        job_id: formData.job_id,
        contractor_id: contractorId,
        start_time: formData.start_time,
        end_time: formData.end_time,
        break_minutes: formData.break_minutes || 0,
        notes_text: formData.notes_text,
        evidence_urls: formData.evidence_urls || []
      });
      
      // Reset form
      setFormData({
        contractor_id: contractorId,
        break_minutes: 0
      });
    }
  };

  const calculateHours = () => {
    if (formData.start_time && formData.end_time) {
      const start = new Date(formData.start_time);
      const end = new Date(formData.end_time);
      const diffMs = end.getTime() - start.getTime();
      const hours = diffMs / (1000 * 60 * 60);
      const breakHours = (formData.break_minutes || 0) / 60;
      return Math.max(0, hours - breakHours).toFixed(2);
    }
    return '0.00';
  };

  const assignedJobs = jobs.filter(job => 
    job.assignment?.acceptance_status === 'accepted' || job.status === 'assigned'
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Submit Timesheet</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="job">Job</Label>
            <Select
              value={formData.job_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, job_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a job" />
              </SelectTrigger>
              <SelectContent>
                {assignedJobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.service_type} - {job.client?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={formData.end_time || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="break_minutes">Break Minutes</Label>
            <Input
              id="break_minutes"
              type="number"
              min="0"
              value={formData.break_minutes || 0}
              onChange={(e) => setFormData(prev => ({ ...prev, break_minutes: parseInt(e.target.value) }))}
            />
          </div>

          {formData.start_time && formData.end_time && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Total Hours: {calculateHours()}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this timesheet..."
              value={formData.notes_text || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes_text: e.target.value }))}
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={loading || !formData.job_id || !formData.start_time || !formData.end_time}
          >
            {loading ? 'Submitting...' : 'Submit Timesheet'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}