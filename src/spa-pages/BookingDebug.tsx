import { Navigation } from '@/components/Navigation';
import { BookingFlowDebugger } from '@/components/debug/BookingFlowDebugger';
import { ZipCodeTester } from '@/components/admin/ZipCodeTester';

export default function BookingDebug() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Booking Flow Debug</h1>
          <p className="text-muted-foreground mt-2">
            Test the booking flow components and edge functions
          </p>
        </div>
        <div className="space-y-6">
          <ZipCodeTester />
          <BookingFlowDebugger />
        </div>
      </div>
    </div>
  );
}