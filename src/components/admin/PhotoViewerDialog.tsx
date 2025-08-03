import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface PhotoViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: any[];
  customerName: string;
}

export function PhotoViewerDialog({
  open,
  onOpenChange,
  photos,
  customerName
}: PhotoViewerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Customer Photos</DialogTitle>
          <DialogDescription>
            Photos submitted by {customerName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {photos && photos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="space-y-2">
                  <img
                    src={photo.url || photo}
                    alt={`Customer photo ${index + 1}`}
                    className="w-full h-64 object-cover rounded-lg border"
                  />
                  {photo.caption && (
                    <p className="text-sm text-muted-foreground">{photo.caption}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No photos available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}