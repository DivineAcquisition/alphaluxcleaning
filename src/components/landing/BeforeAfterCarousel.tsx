import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const beforeAfterImages = [
  {
    id: 1,
    title: "Kitchen Deep Clean",
    before: "🏠", // Placeholder - in real app would be actual images
    after: "✨",
    description: "Complete kitchen sanitization and organization"
  },
  {
    id: 2,
    title: "Bathroom Transformation", 
    before: "🚿",
    after: "💎",
    description: "Detailed bathroom cleaning and disinfection"
  },
  {
    id: 3,
    title: "Living Room Refresh",
    before: "🛋️",
    after: "🌟",
    description: "Full living space dusting and vacuuming"
  }
];

export function BeforeAfterCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % beforeAfterImages.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % beforeAfterImages.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + beforeAfterImages.length) % beforeAfterImages.length);
    setIsAutoPlaying(false);
  };

  const currentImage = beforeAfterImages[currentSlide];

  return (
    <div className="py-8 bg-gradient-to-r from-muted/20 to-secondary/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">See the Difference</h2>
          <p className="text-muted-foreground">Professional cleaning results you can trust</p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative">
                {/* Before/After Display */}
                <div className="grid md:grid-cols-2 min-h-[200px]">
                  {/* Before */}
                  <div className="bg-gradient-to-br from-muted to-muted/50 p-8 flex flex-col items-center justify-center border-r border-border">
                    <div className="text-6xl mb-4">{currentImage.before}</div>
                    <p className="text-sm text-muted-foreground font-medium">BEFORE</p>
                  </div>
                  
                  {/* After */}
                  <div className="bg-gradient-to-br from-primary/5 to-secondary/20 p-8 flex flex-col items-center justify-center">
                    <div className="text-6xl mb-4">{currentImage.after}</div>
                    <p className="text-sm text-primary font-medium">AFTER</p>
                  </div>
                </div>
                
                {/* Navigation */}
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                  onClick={prevSlide}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                  onClick={nextSlide}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Description */}
              <div className="p-4 text-center border-t">
                <h3 className="font-semibold text-foreground mb-1">{currentImage.title}</h3>
                <p className="text-sm text-muted-foreground">{currentImage.description}</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Slide indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {beforeAfterImages.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentSlide(index);
                  setIsAutoPlaying(false);
                }}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentSlide 
                    ? 'bg-primary scale-110' 
                    : 'bg-muted hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}