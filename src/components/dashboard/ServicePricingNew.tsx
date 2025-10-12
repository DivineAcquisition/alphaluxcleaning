import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Star, Phone } from "lucide-react";
import { HOME_SIZE_RANGES, DEFAULT_PRICING_CONFIG } from "@/lib/new-pricing-system";

const ServicePricingNew = () => {
  // Filter out the custom quote tier for the main pricing table
  const displayTiers = HOME_SIZE_RANGES.filter(tier => !tier.requiresEstimate);
  const customTier = HOME_SIZE_RANGES.find(tier => tier.requiresEstimate);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">💫 Transparent, Flexible Pricing</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Our rates are based on the size of your home and the type of cleaning you need.
          No hidden fees. No long forms. Just clear, honest pricing.
        </p>
      </div>

      {/* Regional Pricing Notice */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-3 text-center">📍 Regional Adjustments</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="font-medium">Texas</p>
              <p className="text-sm text-muted-foreground">Base pricing</p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="font-medium">California</p>
              <p className="text-sm text-primary">+10%</p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="font-medium">New York</p>
              <p className="text-sm text-primary">+15%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Standard Cleaning */}
      <div>
        <h3 className="text-2xl font-bold mb-4">🏠 STANDARD CLEANING</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayTiers.map((tier) => (
            <Card key={tier.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Home className="h-5 w-5 text-primary" />
                  {tier.label}
                </CardTitle>
                <CardDescription>{tier.bedroomRange}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  ${tier.regularPrice}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Deep Cleaning */}
      <div>
        <h3 className="text-2xl font-bold mb-4">✨ DEEP CLEANING</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayTiers.map((tier) => (
            <Card key={tier.id} className="hover:shadow-lg transition-shadow border-accent/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5 text-accent" />
                  {tier.label}
                </CardTitle>
                <CardDescription>{tier.bedroomRange}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">
                  ${tier.deepPrice}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Move-In/Out Cleaning */}
      <div>
        <h3 className="text-2xl font-bold mb-4">🚚 MOVE-IN / MOVE-OUT CLEANING</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayTiers.map((tier) => (
            <Card key={tier.id} className="hover:shadow-lg transition-shadow border-success/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Home className="h-5 w-5 text-success" />
                  {tier.label}
                </CardTitle>
                <CardDescription>{tier.bedroomRange}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  ${tier.moveInOutPrice}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Quote for Large Homes */}
      {customTier && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10">
          <CardContent className="p-6 text-center">
            <Home className="h-12 w-12 text-primary mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">{customTier.label}</h3>
            <p className="text-muted-foreground mb-4">
              Contact us for a personalized quote
            </p>
            <a href="tel:9725590223" className="inline-flex items-center gap-2">
              <Badge variant="outline" className="text-lg px-6 py-2 cursor-pointer hover:bg-primary/10">
                <Phone className="h-4 w-4" />
                (972) 559-0223
              </Badge>
            </a>
          </CardContent>
        </Card>
      )}

      {/* Recurring Discounts */}
      <Card className="border-success/20 bg-gradient-to-r from-success/5 to-primary/5">
        <CardHeader>
          <CardTitle className="text-center">🏡 RECURRING CLEANING DISCOUNTS</CardTitle>
          <CardDescription className="text-center">
            Keep your home spotless and save more over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEFAULT_PRICING_CONFIG.frequencies
              .filter(f => f.id !== 'one_time')
              .map((freq) => (
                <div key={freq.id} className="text-center p-4 bg-background rounded-lg border">
                  <h4 className="font-semibold text-lg mb-2">{freq.name}</h4>
                  <Badge variant="secondary" className="text-lg">
                    {freq.discount ? `${(freq.discount * 100).toFixed(0)}% off` : 'N/A'}
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment & Deep Clean Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h4 className="font-semibold text-lg mb-2">💳 Deposit Policy</h4>
            <p className="text-sm text-muted-foreground mb-2">
              To secure your booking, a 25% deposit is required.
            </p>
            <p className="text-sm text-muted-foreground">
              Prefer to pay after the cleaning? That's okay too — but deposits get scheduling priority.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="p-6">
            <h4 className="font-semibold text-lg mb-2">💡 Deep Cleaning Recommendation</h4>
            <p className="text-sm text-muted-foreground">
              If your home hasn't been professionally cleaned in over 2 months, 
              we recommend starting with a Deep Cleaning for best results and easier maintenance going forward.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-6 text-center">
          <p className="text-lg font-medium mb-2">
            AlphaLux Cleaning — reliable service, transparent pricing, and a spotless experience every time.
          </p>
          <p className="text-sm text-muted-foreground">
            No hidden fees. No surprises. Just exceptional cleaning.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServicePricingNew;