import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, CheckCircle, Sparkles } from 'lucide-react';

interface ServiceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceType: 'standard' | 'tester' | '90day';
}

export function ServiceDetailsModal({ open, onOpenChange, serviceType }: ServiceDetailsModalProps) {
  const getServiceDetails = () => {
    switch (serviceType) {
      case 'standard':
        return {
          title: "Standard Clean - What's Included",
          duration: "2-3 hours with 2-person team",
          timeSaved: "Save 3+ hours every weekend - get your evenings back",
          premium: "Professional-grade equipment & supplies, insured & bonded crew, eco-friendly products",
          checklist: [
            "Kitchen: Wipe countertops & backsplash, clean sink & faucet, wipe appliance exteriors, sweep & mop floors, take out trash",
            "Bathrooms: Clean & disinfect toilets, scrub sinks & counters, clean mirrors, wipe shower/tub surfaces, mop floors",
            "Living Areas: Vacuum all carpets & rugs, dust all surfaces & furniture, straighten cushions & decor, spot-clean high-touch areas",
            "Bedrooms: Vacuum floors, dust nightstands & dressers, make beds (with your sheets), tidy visible areas",
            "Hallways & Entryways: Vacuum or sweep floors, dust railings & light fixtures, wipe doorknobs & switches",
            "General: Empty all trash bins throughout home, spot-clean fingerprints on doors & walls",
            "Note: Perfect for regular maintenance between deep cleans. Recommended frequency: bi-weekly or monthly"
          ]
        };
      
      case 'tester':
        return {
          title: "Tester Deep Clean - What's Included",
          duration: "~4-6 hours",
          timeSaved: "Save your entire weekend - deep cleaning takes 6+ hours when DIY",
          premium: "2-3 person crew, industrial equipment, eco-friendly products",
          checklist: [
            "Everything in Standard Clean PLUS:",
            "40-point deep clean checklist",
            "Kitchen: Inside microwave, oven cleaning, cabinet fronts, backsplash scrubbing",
            "Bathrooms: Tile & grout deep scrubbing",
            "Baseboards, door frames, light fixtures, switch plates",
            "Interior windows & tracks",
            "Ceiling fans & cobweb removal",
            "Under furniture cleaning",
            "Detailed attention to high-touch surfaces"
          ]
        };
      
      case '90day':
        return {
          title: "90-Day Reset & Maintain Plan - What's Included",
          duration: "1 deep clean + 3 maintenance visits (every 3-4 weeks)",
          timeSaved: "Never clean again for 3 months - we handle everything",
          premium: "Consistent crew, relationship building, preferred scheduling",
          checklist: [
            "Visit 1: Full deep clean with 40-point checklist",
            "Visits 2-4: Standard maintenance clean",
            "Priority scheduling for all appointments",
            "Member support line for questions or adjustments",
            "Flexible rescheduling options",
            "Relationship with dedicated crew",
            "Save 5-10% compared to booking separately",
            "Maintain a consistently clean home year-round"
          ]
        };
      
      default:
        return null;
    }
  };

  const details = getServiceDetails();
  if (!details) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{details.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Duration */}
          <div className="flex items-start gap-3 p-4 bg-accent/50 rounded-lg">
            <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-1">Service Duration</h3>
              <p className="text-sm text-muted-foreground">{details.duration}</p>
            </div>
          </div>

          {/* Time Saved */}
          <div className="flex items-start gap-3 p-4 bg-accent/50 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-1">Time Saved</h3>
              <p className="text-sm text-muted-foreground">{details.timeSaved}</p>
            </div>
          </div>

          {/* Premium Expectations */}
          <div className="flex items-start gap-3 p-4 bg-accent/50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-1">Premium Experience</h3>
              <p className="text-sm text-muted-foreground">{details.premium}</p>
            </div>
          </div>

          {/* Detailed Checklist */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Complete Checklist
            </h3>
            <ul className="space-y-2">
              {details.checklist.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
