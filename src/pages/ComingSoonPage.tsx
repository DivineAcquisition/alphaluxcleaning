import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Calendar } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';

export default function ComingSoonPage() {
  return (
    <>
      <SEOHead 
        title="Customer Portal Coming Soon - AlphaLux Clean"
        description="The AlphaLux Clean customer portal is coming soon. Manage your bookings, track services, and more."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-6">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Customer Portal
            </h1>
            <h2 className="text-xl text-muted-foreground mb-6">
              Coming Soon
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
              We're building something amazing for our customers. Soon you'll be able to manage your bookings, 
              track service history, and access your account information all in one place.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">What to expect:</h3>
              <ul className="text-left space-y-2 text-muted-foreground">
                <li>• View and manage your cleaning appointments</li>
                <li>• Track service history and invoices</li>
                <li>• Update your preferences and special instructions</li>
                <li>• Communicate directly with your cleaning team</li>
                <li>• Schedule additional services and add-ons</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Need assistance now? Contact us directly:
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => window.location.href = 'tel:+1-555-123-4567'}
              >
                <Phone className="w-4 h-4" />
                Call Us
              </Button>
              
              <Button 
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => window.location.href = 'mailto:info@alphaluxclean.com'}
              >
                <Mail className="w-4 h-4" />
                Email Us
              </Button>
              
              <Button 
                className="flex items-center gap-2"
                onClick={() => window.location.href = 'https://app.alphaluxclean.com/booking'}
              >
                <Calendar className="w-4 h-4" />
                Book Service
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-8">
            © 2025 AlphaLux Clean. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}