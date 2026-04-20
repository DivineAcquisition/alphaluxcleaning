import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';
import { toast } from 'sonner';

interface DemoData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  preferredDate?: string;
  preferredTimeBlock?: string;
  notes?: string;
}

interface DemoDataHelperProps {
  onFill: (data: DemoData) => void;
  fields: ('contact' | 'address' | 'scheduling' | 'notes')[];
}

export function DemoDataHelper({ onFill, fields }: DemoDataHelperProps) {
  const handleFillDemoData = () => {
    const demoData: DemoData = {};
    
    // Calculate date 7 days from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const formattedDate = futureDate.toISOString().split('T')[0];
    
    if (fields.includes('contact')) {
      demoData.firstName = 'Demo';
      demoData.lastName = 'Customer';
      demoData.email = `demo+${Date.now()}@alphaluxclean.com`;
      demoData.phone = '555-0100';
    }
    
    if (fields.includes('address')) {
      demoData.address1 = '123 Main Street';
      demoData.address2 = 'Suite 100';
      demoData.city = 'New York';
      demoData.state = 'NY';
      demoData.zip = '75201';
    }
    
    if (fields.includes('scheduling')) {
      demoData.preferredDate = formattedDate;
      demoData.preferredTimeBlock = '9:00 AM - 11:00 AM';
    }
    
    if (fields.includes('notes')) {
      demoData.notes = 'Test booking - Demo mode active';
    }
    
    onFill(demoData);
    toast.success('Demo data filled!');
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleFillDemoData}
      className="gap-2 border-orange-500 text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/30"
    >
      <Wand2 className="h-4 w-4" />
      Fill Demo Data
    </Button>
  );
}
