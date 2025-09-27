import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: "Michael Chen",
    location: "Dallas, TX",
    rating: 5,
    text: "Amazing service! They're always on time, professional, and my house sparkles. The online booking makes it so easy.",
    avatar: "👨‍💼"
  },
  {
    id: 2,
    name: "Jennifer Rodriguez",
    location: "Plano, TX", 
    text: "I was hesitant at first, but AlphaLux Clean has proven to be trustworthy and thorough. Fair pricing too.",
    rating: 5,
    avatar: "👩‍🏫"
  },
  {
    id: 3,
    name: "Sarah Martinez",
    location: "Irving, TX",
    text: "Love that I get the same team every time. They know exactly how I like things done.",
    rating: 5,
    avatar: "👩‍⚕️"
  }
];

export function TestimonialSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(testimonials[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => {
        const currentIndex = testimonials.findIndex(t => t.id === prev.id);
        return testimonials[(currentIndex + 1) % testimonials.length];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-8 lg:py-12 bg-gradient-to-r from-card to-muted/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="mobile-subheadline lg:text-2xl font-bold text-foreground mb-2">What Our Dallas Customers Say</h2>
          <p className="mobile-body text-muted-foreground">Real feedback from satisfied local customers</p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          {/* Mobile-Optimized Testimonial Card */}
          <Card className="bg-card border shadow-soft">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="text-3xl lg:text-4xl flex-shrink-0">{currentTestimonial.avatar}</div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground text-base lg:text-lg">{currentTestimonial.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{currentTestimonial.location}</p>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < currentTestimonial.rating 
                            ? 'text-warning fill-warning' 
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <blockquote className="mobile-body lg:text-lg text-foreground leading-relaxed">
                "{currentTestimonial.text}"
              </blockquote>
            </CardContent>
          </Card>
          
          {/* Mobile-Friendly Navigation Dots */}
          <div className="flex justify-center gap-3 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(testimonials[index])}
                className={`mobile-touch-target w-4 h-4 rounded-full transition-all duration-200 ${
                  index === testimonials.findIndex(t => t.id === currentTestimonial.id)
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