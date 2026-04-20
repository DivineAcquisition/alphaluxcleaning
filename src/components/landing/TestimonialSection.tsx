import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: "Michael Chen",
    location: "Manhattan, NY",
    rating: 5,
    text: "Amazing service! They're always on time, professional, and my apartment sparkles. The online booking makes it so easy.",
    avatar: "👨‍💼"
  },
  {
    id: 2,
    name: "Jennifer Rodriguez",
    location: "Garden City, NY",
    text: "I was hesitant at first, but AlphaLux Cleaning has proven to be trustworthy and thorough. Fair pricing too.",
    rating: 5,
    avatar: "👩‍🏫"
  },
  {
    id: 3,
    name: "Sarah Martinez",
    location: "Brooklyn, NY",
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
    <div className="py-16 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <p className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-alx-gold mb-3">
            Testimonials
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3">
            What Our Clients Say
          </h2>
          <p className="text-muted-foreground">
            Real feedback from homeowners and businesses we serve.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="relative overflow-hidden border-alx-gold/20 bg-card shadow-clean">
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-1 bg-gradient-gold"
            />
            <CardContent className="p-6 lg:p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-gold flex items-center justify-center text-2xl shadow-gold flex-shrink-0">
                  {currentTestimonial.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif font-semibold text-foreground text-lg">
                    {currentTestimonial.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {currentTestimonial.location}
                  </p>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < currentTestimonial.rating
                            ? "text-alx-gold fill-alx-gold"
                            : "text-muted-foreground/40"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <blockquote className="text-base lg:text-lg text-foreground leading-relaxed italic border-l-2 border-alx-gold pl-4">
                "{currentTestimonial.text}"
              </blockquote>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => {
              const active =
                index ===
                testimonials.findIndex((t) => t.id === currentTestimonial.id);
              return (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(testimonials[index])}
                  aria-label={`View testimonial ${index + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    active
                      ? "bg-alx-gold w-8"
                      : "bg-muted w-2 hover:bg-alx-gold/40"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}