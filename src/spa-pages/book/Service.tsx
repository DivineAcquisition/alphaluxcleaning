import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookingProgressBar } from '@/components/booking/BookingProgressBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBooking } from '@/contexts/BookingContext';
import { Sparkles, Home as HomeIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BookingService() {
  const navigate = useNavigate();
  const { bookingData, updateBookingData } = useBooking();

  useEffect(() => {
    if (!bookingData.zipCode) {
      navigate('/book/zip');
    }
  }, [bookingData.zipCode, navigate]);

  const handleServiceSelect = (serviceType: 'regular' | 'deep' | 'move_in_out') => {
    updateBookingData({ serviceType });
  };

  const handleContinue = () => {
    navigate('/book/frequency');
  };

  const services = [
    {
      id: 'regular' as const,
      icon: Sparkles,
      name: 'Standard Cleaning',
      description: 'Perfect for regular maintenance. Dusting, vacuuming, mopping, and bathrooms.',
      badge: '10% OFF First Clean',
      badgeVariant: 'default' as const,
    },
    {
      id: 'deep' as const,
      icon: Trash2,
      name: 'Deep Cleaning',
      description: 'Thorough clean including baseboards, inside appliances, and more.',
      badge: '20% OFF',
      badgeVariant: 'default' as const,
      recommended: true,
    },
    {
      id: 'move_in_out' as const,
      icon: HomeIcon,
      name: 'Move-In/Out',
      description: 'Complete reset for empty homes. Cabinets, walls, and all surfaces.',
      badge: null,
      badgeVariant: null,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BookingProgressBar currentStep={3} totalSteps={7} />
      
      <div className="flex-1 flex flex-col">
        <main className="flex-1 px-4 py-8 lg:py-12 max-w-4xl mx-auto w-full">
          <Link 
            to="/book/home" 
            className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block transition-colors"
          >
            ← Previous
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Choose your clean
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Deep clean recommended for first visit
          </p>
          
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            {services.map((service) => {
              const Icon = service.icon;
              const isSelected = bookingData.serviceType === service.id;
              
              return (
                <Card
                  key={service.id}
                  className={cn(
                    'cursor-pointer hover:border-primary transition-all p-6 relative',
                    isSelected && 'border-primary ring-2 ring-primary',
                    service.recommended && 'border-2 border-primary/50'
                  )}
                  onClick={() => handleServiceSelect(service.id)}
                >
                  {service.recommended && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                      Recommended
                    </Badge>
                  )}
                  
                  <Icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-lg font-bold mb-2">{service.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {service.description}
                  </p>
                  
                  {service.badge && (
                    <Badge variant={service.badgeVariant}>
                      {service.badge}
                    </Badge>
                  )}
                </Card>
              );
            })}
          </div>
          
          <Button 
            size="lg" 
            className="w-full h-14 text-lg" 
            onClick={handleContinue}
          >
            Continue
          </Button>
        </main>
      </div>
    </div>
  );
}
