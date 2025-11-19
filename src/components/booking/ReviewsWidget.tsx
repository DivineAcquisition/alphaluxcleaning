import { Card } from '@/components/ui/card';
import { useEffect, useRef } from 'react';

export function ReviewsWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load the review widget script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://app.alphaluxclean.com/reputation/assets/review-widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <section className="mt-8 mb-8 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          What Our Customers Say
        </h2>
        <p className="text-muted-foreground">
          Real reviews from satisfied customers
        </p>
      </div>

      <Card className="overflow-hidden border-border bg-card p-4">
        <div ref={containerRef}>
          <iframe 
            className='lc_reviews_widget' 
            src='https://app.alphaluxclean.com/reputation/widgets/review_widget/Lvvq87zxxbYFnaTEklYX?widgetId=691df995f44c6d6cf0226118' 
            frameBorder='0' 
            scrolling='no' 
            style={{ minWidth: '100%', width: '100%', height: '600px' }}
            title="Customer Reviews"
          />
        </div>
      </Card>
    </section>
  );
}
