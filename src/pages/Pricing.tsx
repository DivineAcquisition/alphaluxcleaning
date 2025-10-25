import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sparkles, Check, Phone, ArrowRight, Home, Droplets, Zap } from 'lucide-react';
import { STATE_CONFIGS, type StateCode, calculateRecurringPricing, formatPrice } from '@/lib/state-pricing-system';

export default function Pricing() {
  const [selectedState, setSelectedState] = useState<StateCode>('TX');
  const navigate = useNavigate();
  
  const stateConfig = STATE_CONFIGS.find(s => s.code === selectedState);
  
  if (!stateConfig) return null;

  const bookableTiers = stateConfig.tiers.filter(tier => tier.id !== '5000_plus');
  const customQuoteTier = stateConfig.tiers.find(tier => tier.id === '5000_plus');

  return (
    <>
      <Helmet>
        <title>Transparent Cleaning Pricing | 10% OFF Standard, 20% OFF Deep Cleaning</title>
        <meta 
          name="description" 
          content="View our transparent pricing for house cleaning services. Get 10% off standard cleaning and 20% off deep cleaning. Serving TX, CA, and NY." 
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />
        
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12 md:py-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJoc2woMjExIDQxJSAyNCUgLyAwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Limited Time Offers
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              Transparent Pricing,
              <br />
              <span className="text-primary">No Hidden Fees</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Professional cleaning services with upfront pricing. Get <span className="font-semibold text-success">10% OFF</span> Standard Cleaning and <span className="font-semibold text-warning">20% OFF</span> Deep Cleaning.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/')} className="gap-2">
                Get Your Free Quote
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => window.open('tel:+18577544557', '_self')} className="gap-2">
                <Phone className="h-4 w-4" />
                Call (857) 754-4557
              </Button>
            </div>
          </div>
        </section>

        {/* Promotional Banner */}
        <section className="bg-gradient-to-r from-success/10 via-warning/10 to-success/10 border-y py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-success/20 bg-success/5">
                <CardContent className="p-6 flex items-center gap-4">
                  <Badge className="bg-success text-success-foreground text-lg px-4 py-2">10% OFF</Badge>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">Standard Cleaning</h3>
                    <p className="text-sm text-muted-foreground">Save on regular maintenance cleanings</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-warning/20 bg-warning/5">
                <CardContent className="p-6 flex items-center gap-4">
                  <Badge className="bg-warning text-warning-foreground text-lg px-4 py-2">20% OFF</Badge>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">Deep Cleaning</h3>
                    <p className="text-sm text-muted-foreground">Maximum savings on thorough deep cleans</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* State Selector */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Select Your Location
            </h2>
            <div className="flex gap-2">
              {STATE_CONFIGS.map((state) => (
                <Button
                  key={state.code}
                  variant={selectedState === state.code ? 'default' : 'outline'}
                  onClick={() => setSelectedState(state.code)}
                  className="min-w-[80px]"
                >
                  {state.code}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Table */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Home Size</TableHead>
                      <TableHead className="font-semibold">Standard Clean</TableHead>
                      <TableHead className="font-semibold">Deep Clean</TableHead>
                      <TableHead className="font-semibold">Move-In/Out</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookableTiers.map((tier) => {
                      const regularOriginal = tier.regular;
                      const regularDiscounted = Math.round(tier.regular * 0.9);
                      const deepOriginal = tier.deep;
                      const deepDiscounted = Math.round(tier.deep * 0.8);
                      
                      return (
                        <TableRow key={tier.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-muted-foreground" />
                              {tier.label}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground line-through">
                                  {formatPrice(regularOriginal)}
                                </span>
                                <span className="text-lg font-bold text-success">
                                  {formatPrice(regularDiscounted)}
                                </span>
                                <Badge variant="secondary" className="bg-success/10 text-success text-xs">
                                  10% OFF
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground line-through">
                                  {formatPrice(deepOriginal)}
                                </span>
                                <span className="text-lg font-bold text-warning">
                                  {formatPrice(deepDiscounted)}
                                </span>
                                <Badge variant="secondary" className="bg-warning/10 text-warning text-xs">
                                  20% OFF
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-foreground">
                                {formatPrice(tier.moveInOut)}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    
                    {customQuoteTier && (
                      <TableRow className="bg-accent/5">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            {customQuoteTier.label}
                          </div>
                        </TableCell>
                        <TableCell colSpan={3}>
                          <Badge variant="outline" className="text-sm">
                            Custom Quote Required - Call (857) 754-4557
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Recurring Services Pricing */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            Recurring Service Pricing
            <span className="block text-base font-normal text-muted-foreground mt-2">
              Save even more with recurring cleanings (Standard Clean only)
            </span>
          </h2>
          
          <Accordion type="single" collapsible className="space-y-3">
            {bookableTiers.map((tier) => {
              const recurring = calculateRecurringPricing(tier.regular);
              
              return (
                <AccordionItem key={tier.id} value={tier.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{tier.label}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <Card className="border-primary/20">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-4 w-4 text-primary" />
                            <h4 className="font-semibold text-foreground">Weekly</h4>
                          </div>
                          <div className="space-y-1">
                            <p className="text-2xl font-bold text-primary">{formatPrice(recurring.weeklyPerClean)}/clean</p>
                            <p className="text-sm text-muted-foreground">4× per month = {formatPrice(recurring.weeklyMonthly)}/mo</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-primary/20">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Droplets className="h-4 w-4 text-primary" />
                            <h4 className="font-semibold text-foreground">Bi-Weekly</h4>
                          </div>
                          <div className="space-y-1">
                            <p className="text-2xl font-bold text-primary">{formatPrice(recurring.biWeeklyPerClean)}/clean</p>
                            <p className="text-sm text-muted-foreground">2× per month = {formatPrice(recurring.biWeeklyMonthly)}/mo</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-primary/20">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Home className="h-4 w-4 text-primary" />
                            <h4 className="font-semibold text-foreground">Monthly</h4>
                          </div>
                          <div className="space-y-1">
                            <p className="text-2xl font-bold text-primary">{formatPrice(recurring.monthlyPerClean)}/clean</p>
                            <p className="text-sm text-muted-foreground">1× per month = {formatPrice(recurring.monthlyMonthly)}/mo</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </section>

        {/* What's Included */}
        <section className="bg-muted/30 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-10">
              What's Included in Each Service
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4 text-foreground">Standard Cleaning</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {['Dusting all surfaces', 'Vacuum all floors', 'Mop hard floors', 'Clean bathrooms', 'Clean kitchen', 'Empty trash'].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4 text-foreground">Deep Cleaning</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {['Everything in Standard', 'Baseboards cleaning', 'Inside appliances', 'Light fixtures', 'Window sills', 'Detailed scrubbing'].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4 text-foreground">Move-In/Out</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {['Everything in Deep Clean', 'Inside cabinets', 'Wall cleaning', 'Door frames', 'Complete sanitization', 'Ready for inspection'].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { title: '100% Satisfaction', subtitle: 'Guaranteed' },
              { title: 'No Hidden Fees', subtitle: 'Transparent Pricing' },
              { title: 'Professional', subtitle: 'Trained Cleaners' },
              { title: 'Eco-Friendly', subtitle: 'Products Available' }
            ].map((item) => (
              <div key={item.title} className="space-y-1">
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.subtitle}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
            Frequently Asked Questions
          </h2>
          
          <Accordion type="single" collapsible className="space-y-3">
            <AccordionItem value="how-calculated" className="border rounded-lg px-4">
              <AccordionTrigger>How is pricing calculated?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Pricing is based on your home's square footage and the type of service you select. We offer Standard Cleaning, Deep Cleaning, and Move-In/Out services with transparent pricing for all home sizes.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="difference" className="border rounded-lg px-4">
              <AccordionTrigger>What's the difference between regular and deep cleaning?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Standard Cleaning covers daily maintenance tasks like dusting, vacuuming, and bathroom/kitchen cleaning. Deep Cleaning includes everything in Standard plus detailed work like baseboards, inside appliances, light fixtures, and thorough scrubbing of all surfaces.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="pets" className="border rounded-lg px-4">
              <AccordionTrigger>Do you charge extra for pets?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                No, we don't charge extra for pets! Our pricing already accounts for homes with pets. We just ask that you let us know during booking so our team can prepare accordingly.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="cancellation" className="border rounded-lg px-4">
              <AccordionTrigger>What's your cancellation policy?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We require 24 hours notice for cancellations. Cancellations made less than 24 hours before your scheduled service may be subject to a cancellation fee.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="deposit" className="border rounded-lg px-4">
              <AccordionTrigger>Is there a deposit required?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, we require a 25% deposit to book your service. The remaining 75% is due after service completion. This helps us confirm your appointment and ensure our cleaners are ready for your home.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Bottom CTA */}
        <section className="bg-gradient-to-br from-primary to-accent text-primary-foreground py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Book Your Cleaning?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Get started with a free quote or call us directly to schedule your service
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate('/')}
                className="gap-2"
              >
                Book Your Cleaning Now
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => window.open('tel:+18577544557', '_self')}
                className="gap-2 bg-white/10 hover:bg-white/20 border-white/30 text-white"
              >
                <Phone className="h-4 w-4" />
                Call (857) 754-4557
              </Button>
            </div>
            
            <p className="text-sm mt-6 opacity-75">
              Only 25% deposit required • Pay remaining 75% after service completion
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
