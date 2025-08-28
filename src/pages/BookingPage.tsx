import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Star } from 'lucide-react';

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Book Your Cleaning Service</h1>
          <p className="text-xl text-muted-foreground">Professional cleaning services in the Bay Area</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Regular Cleaning
              </CardTitle>
              <CardDescription>Weekly or bi-weekly maintenance cleaning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Starting at</span>
                  <span className="font-semibold">$120</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">4.9 average rating</span>
                </div>
                <Button className="w-full">Book Now</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Deep Cleaning
              </CardTitle>
              <CardDescription>Thorough one-time or seasonal cleaning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Starting at</span>
                  <span className="font-semibold">$250</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">4.8 average rating</span>
                </div>
                <Button className="w-full">Book Now</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Move-in/Move-out
              </CardTitle>
              <CardDescription>Complete cleaning for moving situations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Starting at</span>
                  <span className="font-semibold">$350</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">4.9 average rating</span>
                </div>
                <Button className="w-full">Book Now</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Why Choose Bay Area Cleaning Pros?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <h4 className="font-medium">Insured & Bonded</h4>
                    <p className="text-sm text-muted-foreground">All our cleaners are fully insured and background checked</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <h4 className="font-medium">Satisfaction Guarantee</h4>
                    <p className="text-sm text-muted-foreground">We'll make it right or your money back</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <h4 className="font-medium">Eco-Friendly Products</h4>
                    <p className="text-sm text-muted-foreground">Safe, non-toxic cleaning products for your family</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <h4 className="font-medium">Same Day Booking</h4>
                    <p className="text-sm text-muted-foreground">Available for urgent cleaning needs</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}