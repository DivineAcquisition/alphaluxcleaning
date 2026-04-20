import { Card } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { useEffect, useState } from 'react';
import type { CarouselApi } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
const kitchenShowcase = '/brand/showcase/kitchen-showcase.jpg';
const fridgeShowcase = '/brand/showcase/fridge-showcase.jpg';
const bathroomShowcase = '/brand/showcase/bathroom-showcase.jpg';
const commercialShowcase = '/brand/showcase/commercial-showcase.jpg';
const roomShowcase = '/brand/showcase/room-showcase.jpg';

const showcaseImages = [
  {
    src: kitchenShowcase,
    alt: 'Spotless kitchen cleaning',
    caption: '✨ Spotless Kitchen - Counters, Appliances & More',
  },
  {
    src: fridgeShowcase,
    alt: 'Deep clean refrigerator',
    caption: '🧊 Deep Clean Refrigerator - Inside & Out',
  },
  {
    src: bathroomShowcase,
    alt: 'Pristine bathroom cleaning',
    caption: '🚿 Pristine Bathroom - Sparkling Clean',
  },
  {
    src: commercialShowcase,
    alt: 'Commercial space deep cleaning',
    caption: '🏢 Commercial Deep Clean - Professional Results',
  },
  {
    src: roomShowcase,
    alt: 'Immaculate room cleaning',
    caption: '🏠 Immaculate Spaces - Fresh & Clean',
  },
];

export function CleaningShowcaseCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <section className="mt-12 mb-8 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          See Our Professional Results
        </h2>
        <p className="text-muted-foreground">
          Real photos from our cleaning services
        </p>
      </div>

      <Card className="overflow-hidden border-border bg-card">
        <Carousel
          setApi={setApi}
          className="w-full"
          opts={{
            align: 'start',
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 4000,
              stopOnInteraction: true,
            }),
          ]}
        >
          <CarouselContent>
            {showcaseImages.map((image, index) => (
              <CarouselItem key={index}>
                <div className="relative">
                  <div className="aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-muted">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 md:p-6">
                    <p className="text-white text-lg md:text-xl font-semibold">
                      {image.caption}
                    </p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </Carousel>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 py-4">
          {showcaseImages.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                current === index
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </Card>
    </section>
  );
}
