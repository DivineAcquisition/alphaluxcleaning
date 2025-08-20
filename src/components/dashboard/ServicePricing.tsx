import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Building, Star, Clock } from "lucide-react";

// Bay Area Cleaning Professionals original pricing structure
const originalPricingTiers = [
  {
    range: "Under 1,000 sq ft",
    icon: Home,
    description: "Cozy homes and apartments",
    originalPricing: {
      weekly: 97.50,
      biweekly: 118.59,
      monthly: 171.26,
      oneTime: 225.31,
      deepClean: 305.05
    }
  },
  {
    range: "1,001-1,400 sq ft",
    icon: Home,
    description: "Small to medium homes",
    originalPricing: {
      weekly: 115.94,
      biweekly: 125.58,
      monthly: 186.59,
      oneTime: 235.09,
      deepClean: 327.77
    }
  },
  {
    range: "1,401-1,800 sq ft",
    icon: Home,
    description: "Medium sized homes",
    originalPricing: {
      weekly: 125.67,
      biweekly: 140.06,
      monthly: 225.73,
      oneTime: 255.27,
      deepClean: 355.94
    }
  },
  {
    range: "1,801-2,400 sq ft",
    icon: Home,
    description: "Large family homes",
    originalPricing: {
      weekly: 132.81,
      biweekly: 150.15,
      monthly: 234.87,
      oneTime: 265.41,
      deepClean: 385.13
    }
  },
  {
    range: "2,401-2,800 sq ft",
    icon: Home,
    description: "Very large homes",
    originalPricing: {
      weekly: 158.26,
      biweekly: 175.14,
      monthly: 245.76,
      oneTime: 285.28,
      deepClean: 405.01
    }
  },
  {
    range: "2,801-3,300 sq ft",
    icon: Home,
    description: "Extra large homes",
    originalPricing: {
      weekly: 168.73,
      biweekly: 188.62,
      monthly: 287.92,
      oneTime: 297.46,
      deepClean: 459.16
    }
  },
  {
    range: "3,301-3,900 sq ft",
    icon: Home,
    description: "Luxury homes",
    originalPricing: {
      weekly: 178.82,
      biweekly: 197.61,
      monthly: 307.81,
      oneTime: 346.34,
      deepClean: 478.39
    }
  },
  {
    range: "3,901-4,500 sq ft",
    icon: Building,
    description: "Estate homes",
    originalPricing: {
      weekly: 215.29,
      biweekly: 231.58,
      monthly: 368.69,
      oneTime: 378.67,
      deepClean: 512.60
    }
  },
  {
    range: "4,501-5,100 sq ft",
    icon: Building,
    description: "Mansion homes",
    originalPricing: {
      weekly: 228.56,
      biweekly: 242.05,
      monthly: 428.17,
      oneTime: 461.37,
      deepClean: 564.24
    }
  },
  {
    range: "5,100+ sq ft",
    icon: Building,
    description: "Custom estimate required",
    originalPricing: {
      weekly: 0,
      biweekly: 0,
      monthly: 0,
      oneTime: 0,
      deepClean: 0
    }
  }
];

// Apply maintenance discount (15%) and premium discount (20%)
const pricingTiers = originalPricingTiers.map(tier => {
  const maintenanceDiscount = 0.15; // 15% for recurring services
  const premiumDiscount = 0.20; // 20% for premium deep clean
  
  return {
    ...tier,
    pricing: {
      weekly: {
        original: tier.originalPricing.weekly,
        discount: tier.originalPricing.weekly > 0 ? Math.round(tier.originalPricing.weekly * maintenanceDiscount * 100) / 100 : 0,
        final: tier.originalPricing.weekly > 0 ? Math.round(tier.originalPricing.weekly * (1 - maintenanceDiscount) * 100) / 100 : 0
      },
      biweekly: {
        original: tier.originalPricing.biweekly,
        discount: tier.originalPricing.biweekly > 0 ? Math.round(tier.originalPricing.biweekly * maintenanceDiscount * 100) / 100 : 0,
        final: tier.originalPricing.biweekly > 0 ? Math.round(tier.originalPricing.biweekly * (1 - maintenanceDiscount) * 100) / 100 : 0
      },
      monthly: {
        original: tier.originalPricing.monthly,
        discount: tier.originalPricing.monthly > 0 ? Math.round(tier.originalPricing.monthly * maintenanceDiscount * 100) / 100 : 0,
        final: tier.originalPricing.monthly > 0 ? Math.round(tier.originalPricing.monthly * (1 - maintenanceDiscount) * 100) / 100 : 0
      },
      oneTime: {
        original: tier.originalPricing.oneTime,
        discount: 0,
        final: tier.originalPricing.oneTime
      },
      deepClean: {
        original: tier.originalPricing.deepClean,
        discount: tier.originalPricing.deepClean > 0 ? Math.round(tier.originalPricing.deepClean * premiumDiscount * 100) / 100 : 0,
        final: tier.originalPricing.deepClean > 0 ? Math.round(tier.originalPricing.deepClean * (1 - premiumDiscount) * 100) / 100 : 0
      }
    }
  };
});

const serviceTypes = [
  { 
    name: "Signature Clean", 
    description: "Deep cleaning service for regular maintenance (15% off recurring)",
    icon: Home, 
    color: "text-primary",
    features: [
      "Kitchen cleaned & disinfected",
      "Wipe countertops & appliances", 
      "Small amount of dishes/load dishwasher",
      "Dust & polish furniture",
      "Make beds",
      "Sweep & mop floors",
      "Vacuum carpeted areas",
      "Clean & sanitize bathrooms",
      "Fold up to 2 baskets of clothes"
    ]
  },
    { 
    name: "Ultimate Deep Cleaning", 
    description: "Premium deep clean - optimal for larger homes over 3,000 sq ft (20% off)",
    icon: Star, 
    color: "text-accent",
    features: [
      "Everything in Signature Clean",
      "Dust ceiling fans, air vents, baseboards",
      "Clean windowsills & mini blinds",
      "Windex mirrors & picture glass",
      "Clean inside sliding glass doors",
      "Clean top/front of stove & burners",
      "Clean inside of fridge",
      "Change bed linens (if left out)",
      "First cleaning: inside oven & drawers"
    ]
  },
  { 
    name: "Move-out/Move-in Cleaning", 
    description: "Complete cleaning for vacant properties",
    icon: Clock, 
    color: "text-success",
    features: [
      "Everything in Deep Clean",
      "Clean inside cabinets & drawers",
      "Detailed sanitizing throughout",
      "Window cleaning",
      "Ready for new occupants",
      "Professional checklist followed"
    ]
  }
];

const addOnServices = [
  { name: "No baseboards", price: "$50.00" },
  { name: "No Dishes", price: "$40.00" },
  { name: "No door facings/moldings", price: "$50.00" },
  { name: "Spot clean walls", price: "$75.00" },
  { name: "Wipe down/wash walls", price: "$25/room" },
  { name: "Feather dust blinds", price: "$65.00" },
  { name: "Blade by blade blinds", price: "$15/blind" },
  { name: "No oven or refrigerator", price: "$35.00" },
  { name: "No Cabinet fronts", price: "$50.00" },
  { name: "No Window Sills", price: "$25.00" },
  { name: "No light fixtures", price: "$35.00" },
  { name: "Laundry per basket", price: "$20.00" }
];

export function ServicePricing() {
  return (
    <div className="space-y-6">
      {/* Pricing by Square Footage */}
      <div>
        <h3 className="text-2xl font-bold mb-4">Pricing by Home Size</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {pricingTiers.map((tier, index) => (
            <Card key={tier.range} className="relative overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <tier.icon className="h-5 w-5 text-primary" />
                  {tier.range}
                </CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  {/* Weekly Service */}
                  <div className="p-3 bg-muted/50 rounded relative">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-muted-foreground font-medium">Weekly Service:</span>
                      {tier.pricing.weekly.original > 0 && (
                        <Badge variant="secondary" className="text-xs">15% OFF</Badge>
                      )}
                    </div>
                    {tier.pricing.weekly.original > 0 ? (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground line-through">${tier.pricing.weekly.original}</div>
                        <div className="font-bold text-primary">${tier.pricing.weekly.final}</div>
                      </div>
                    ) : (
                      <div className="font-semibold text-primary">Call for Quote</div>
                    )}
                  </div>

                  {/* Biweekly Service */}
                  <div className="p-3 bg-muted/50 rounded relative">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-muted-foreground font-medium">Every Other Week:</span>
                      {tier.pricing.biweekly.original > 0 && (
                        <Badge variant="secondary" className="text-xs">15% OFF</Badge>
                      )}
                    </div>
                    {tier.pricing.biweekly.original > 0 ? (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground line-through">${tier.pricing.biweekly.original}</div>
                        <div className="font-bold text-primary">${tier.pricing.biweekly.final}</div>
                      </div>
                    ) : (
                      <div className="font-semibold text-primary">Call for Quote</div>
                    )}
                  </div>

                  {/* Monthly Service */}
                  <div className="p-3 bg-muted/50 rounded relative">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-muted-foreground font-medium">Monthly Service:</span>
                      {tier.pricing.monthly.original > 0 && (
                        <Badge variant="secondary" className="text-xs">15% OFF</Badge>
                      )}
                    </div>
                    {tier.pricing.monthly.original > 0 ? (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground line-through">${tier.pricing.monthly.original}</div>
                        <div className="font-bold text-primary">${tier.pricing.monthly.final}</div>
                      </div>
                    ) : (
                      <div className="font-semibold text-primary">Call for Quote</div>
                    )}
                  </div>

                  {/* One Time Service */}
                  <div className="p-3 bg-muted/50 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-muted-foreground font-medium">One-time Service:</span>
                    </div>
                    {tier.pricing.oneTime.original > 0 ? (
                      <div className="font-bold text-primary">
                        ${tier.pricing.oneTime.final}
                      </div>
                    ) : (
                      <div className="font-semibold text-primary">Call for Quote</div>
                    )}
                  </div>
                </div>

                {/* Ultimate Deep Clean Special */}
                <div className="p-4 bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg border border-accent/20 relative">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-accent">Ultimate Deep Clean:</span>
                    {tier.pricing.deepClean.original > 0 && (
                       <Badge variant="destructive" className="text-xs px-2 py-1 bg-destructive text-destructive-foreground animate-pulse">
                         20% OFF!
                       </Badge>
                    )}
                  </div>
                  {tier.pricing.deepClean.original > 0 ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Regular Price:</span>
                        <span className="line-through">${tier.pricing.deepClean.original}</span>
                      </div>
                      <div className="flex justify-between text-sm text-destructive">
                        <span>Premium Savings:</span>
                        <span>-${tier.pricing.deepClean.discount}</span>
                      </div>
                      <div className="flex justify-between font-bold text-accent text-lg border-t border-accent/30 pt-2">
                        <span>Your Price:</span>
                        <span>${tier.pricing.deepClean.final}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="font-bold text-accent text-lg">Call for Quote</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Service Types */}
      <div>
        <h3 className="text-2xl font-bold mb-4">What's Included in Each Service</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {serviceTypes.map((service) => (
            <Card key={service.name} className="relative overflow-hidden h-full">
              {service.name === "Ultimate Deep Cleaning" && (
                <div className="absolute top-2 right-2 z-10">
                  <Badge variant="destructive" className="animate-pulse bg-destructive text-destructive-foreground">
                    20% OFF!
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`flex items-center justify-center w-14 h-14 rounded-xl ${service.color} bg-current/10`}>
                    <service.icon className={`h-7 w-7 ${service.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <CardDescription className="text-sm">{service.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <h5 className="font-semibold text-sm text-muted-foreground mb-3">Services Included:</h5>
                  <ul className="space-y-2">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Star className="h-3 w-3 fill-current text-accent mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add-on Services */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Services Available</CardTitle>
          <CardDescription>
            Optional services that can be excluded or added to your cleaning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {addOnServices.map((addon, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm font-medium">{addon.name}</span>
                <Badge variant="secondary" className="text-sm">
                  {addon.price}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Special Offers */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4 text-center">Special Offers</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <h4 className="font-semibold text-primary mb-2">Maintenance Clean Discount</h4>
              <p className="text-sm text-muted-foreground">15% off all recurring services</p>
            </div>
            <div className="text-center p-4 bg-accent/10 rounded-lg">
              <h4 className="font-semibold text-accent mb-2">Premium Discount</h4>
              <p className="text-sm text-muted-foreground">20% off Ultimate Deep Cleaning</p>
            </div>
            <div className="text-center p-4 bg-success/10 rounded-lg">
              <h4 className="font-semibold text-success mb-2">Recurring Benefits</h4>
              <p className="text-sm text-muted-foreground">6th cleaning FREE with recurring service</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-bold mb-2">Homes over 5,100 sq ft?</h3>
          <p className="text-muted-foreground mb-4">
            Contact us for a personalized in-person estimate
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline" className="text-lg px-4 py-2">
              📞 (281) 809-9901
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2">
              📞 (281) 932-0616
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}