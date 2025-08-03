import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface FeedbackResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedbackId: string;
  customerName: string;
  onRespond: (feedbackId: string, response: string) => Promise<void>;
}

export function FeedbackResponseDialog({
  open,
  onOpenChange,
  feedbackId,
  customerName,
  onRespond
}: FeedbackResponseDialogProps) {
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!response.trim()) return;

    setIsSubmitting(true);
    try {
      await onRespond(feedbackId, response);
      setResponse("");
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Respond to Customer Feedback</DialogTitle>
          <DialogDescription>
            Responding to feedback from {customerName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Type your response here..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!response.trim() || isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send Response"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}