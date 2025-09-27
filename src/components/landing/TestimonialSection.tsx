import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: "Sarah Martinez",
    location: "Austin, TX",
    rating: 5,
    text: "AlphaLux has been cleaning our home for over a year. The same team comes every time and they know exactly how we like things done. Worth every penny!",
    avatar: "SM"
  },
  {
    id: 2,
    name: "Michael Chen",
    location: "Los Angeles, CA", 
    rating: 5,
    text: "Amazing service! They're always on time, professional, and our house sparkles after each visit. The online booking made it so easy to get started.",
    avatar: "MC"
  },
  {
    id: 3,
    name: "Jennifer Rodriguez",
    location: "Houston, TX",
    rating: 5,
    text: "I was hesitant to hire a cleaning service, but AlphaLux exceeded all expectations. They're trustworthy, thorough, and reasonably priced.",
    avatar: "JR"
  }
];

export function TestimonialSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const testimonial = testimonials[currentTestimonial];

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">What Our Customers Say</h2>
          <p className="text-muted-foreground">Real reviews from happy customers</p>
        </div>
        
        <Card className="max-w-2xl mx-auto bg-gradient-to-br from-card to-secondary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {testimonial.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                  <div className="flex gap-0.5">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{testimonial.location}</p>
              </div>
              <Quote className="w-8 h-8 text-primary/30" />
            </div>
            
            <p className="text-foreground leading-relaxed italic">"{testimonial.text}"</p>
          </CardContent>
        </Card>

        {/* Testimonial indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentTestimonial(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentTestimonial ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}