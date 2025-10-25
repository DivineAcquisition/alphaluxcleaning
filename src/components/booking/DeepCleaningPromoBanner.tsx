import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface DeepCleaningPromoBannerProps {
  show: boolean;
}

export function DeepCleaningPromoBanner({ show }: DeepCleaningPromoBannerProps) {
  if (!show) return null;

  return (
    <Card className="border-blue-500/30 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/20 dark:to-transparent shadow-lg mb-4">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-blue-500/20">
            <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Deep Cleaning Special</h3>
            <p className="text-sm text-muted-foreground">
              Save 20% on all deep cleaning services - thorough, top-to-bottom cleaning
            </p>
          </div>
          <Badge className="bg-blue-600 hover:bg-blue-600 text-white px-4 py-2 text-xl font-bold">
            20% OFF
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
