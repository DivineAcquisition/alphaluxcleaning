import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertCircle, Calendar } from 'lucide-react';

interface SlotTakenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTime: string;
  selectedDate: string;
}

const SlotTakenDialog: React.FC<SlotTakenDialogProps> = ({
  open,
  onOpenChange,
  selectedTime,
  selectedDate
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold text-gray-900">
                Time Slot Unavailable
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-gray-600">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="font-medium">
                  {formatDate(selectedDate)} at {selectedTime}
                </span>
              </div>
              <p>
                This time slot is already booked in our calendar. Please select a different time or date for your appointment.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Time slots with green checkmarks are available for booking.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Choose Different Time
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SlotTakenDialog;