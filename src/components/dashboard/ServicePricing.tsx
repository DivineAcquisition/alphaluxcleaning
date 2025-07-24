import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Building, Star, Clock } from "lucide-react";

// Bay Area Cleaning Professionals pricing structure by square footage
const pricingTiers = [
  {
    range: "Under 1,000 sq ft",
    icon: Home,
    description: "Cozy homes and apartments",
    pricing: {
      weekly: "$73.13", // $97.50 with 25% discount
      biweekly: "$88.94", // $118.59 with 25% discount
      monthly: "$128.45", // $171.26 with 25% discount
      oneTime: "$225.31",
      deepClean: "$106.77" // $305.05 with 65% discount
    }
  },
  {
    range: "1,001-1,400 sq ft",
    icon: Home,
    description: "Small to medium homes",
    pricing: {
      weekly: "$86.96", // $115.94 with 25% discount
      biweekly: "$94.19", // $125.58 with 25% discount
      monthly: "$139.94", // $186.59 with 25% discount
      oneTime: "$235.09",
      deepClean: "$114.72" // $327.77 with 65% discount
    }
  },
  {
    range: "1,401-1,800 sq ft",
    icon: Home,
    description: "Medium sized homes",
    pricing: {
      weekly: "$94.25", // $125.67 with 25% discount
      biweekly: "$105.05", // $140.06 with 25% discount
      monthly: "$169.30", // $225.73 with 25% discount
      oneTime: "$255.27",
      deepClean: "$124.58" // $355.94 with 65% discount
    }
  },
  {
    range: "1,801-2,400 sq ft",
    icon: Home,
    description: "Large family homes",
    pricing: {
      weekly: "$99.61", // $132.81 with 25% discount
      biweekly: "$112.61", // $150.15 with 25% discount
      monthly: "$176.15", // $234.87 with 25% discount
      oneTime: "$265.41",
      deepClean: "$134.80" // $385.13 with 65% discount
    }
  },
  {
    range: "2,401-2,800 sq ft",
    icon: Home,
    description: "Very large homes",
    pricing: {
      weekly: "$118.70", // $158.26 with 25% discount
      biweekly: "$131.36", // $175.14 with 25% discount
      monthly: "$184.32", // $245.76 with 25% discount
      oneTime: "$285.28",
      deepClean: "$141.75" // $405.01 with 65% discount
    }
  },
  {
    range: "2,801-3,300 sq ft",
    icon: Home,
    description: "Extra large homes",
    pricing: {
      weekly: "$126.55", // $168.73 with 25% discount
      biweekly: "$141.47", // $188.62 with 25% discount
      monthly: "$215.94", // $287.92 with 25% discount
      oneTime: "$297.46",
      deepClean: "$160.71" // $459.16 with 65% discount
    }
  },
  {
    range: "3,301-3,900 sq ft",
    icon: Home,
    description: "Luxury homes",
    pricing: {
      weekly: "$134.12", // $178.82 with 25% discount
      biweekly: "$148.21", // $197.61 with 25% discount
      monthly: "$230.86", // $307.81 with 25% discount
      oneTime: "$346.34",
      deepClean: "$167.44" // $478.39 with 65% discount
    }
  },
  {
    range: "3,901-4,500 sq ft",
    icon: Building,
    description: "Estate homes",
    pricing: {
      weekly: "$161.47", // $215.29 with 25% discount
      biweekly: "$173.69", // $231.58 with 25% discount
      monthly: "$276.52", // $368.69 with 25% discount
      oneTime: "$378.67",
      deepClean: "$179.41" // $512.60 with 65% discount
    }
  },
  {
    range: "4,501-5,100 sq ft",
    icon: Building,
    description: "Mansion homes",
    pricing: {
      weekly: "$171.42", // $228.56 with 25% discount
      biweekly: "$181.54", // $242.05 with 25% discount
      monthly: "$321.13", // $428.17 with 25% discount
      oneTime: "$461.37",
      deepClean: "$197.48" // $564.24 with 65% discount
    }
  },
  {
    range: "5,100+ sq ft",
    icon: Building,
    description: "Custom estimate required",
    pricing: {
      weekly: "Call for Quote",
      biweekly: "Call for Quote",
      monthly: "Call for Quote",
      oneTime: "Call for Quote",
      deepClean: "Call for Quote"
    }
  }
];

const serviceTypes = [
  { 
    name: "General Cleaning", 
    description: "Standard maintenance cleaning for occupied homes",
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
    name: "Deep Cleaning", 
    description: "Comprehensive cleaning with detailed work (65% off regular price)",
    icon: Star, 
    color: "text-accent",
    features: [
      "Everything in General Cleaning",
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
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-muted/50 rounded relative">
                    <span className="text-muted-foreground">Weekly:</span>
                    <div className="font-semibold text-primary">{tier.pricing.weekly}</div>
                    {tier.pricing.weekly !== "Call for Quote" && (
                      <div className="absolute -top-1 -right-1">
                        <Badge variant="secondary" className="text-xs px-1 py-0 bg-success text-success-foreground">
                          25% OFF
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-muted/50 rounded relative">
                    <span className="text-muted-foreground">EOW:</span>
                    <div className="font-semibold text-primary">{tier.pricing.biweekly}</div>
                    {tier.pricing.biweekly !== "Call for Quote" && (
                      <div className="absolute -top-1 -right-1">
                        <Badge variant="secondary" className="text-xs px-1 py-0 bg-success text-success-foreground">
                          25% OFF
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-muted/50 rounded relative">
                    <span className="text-muted-foreground">Monthly:</span>
                    <div className="font-semibold text-primary">{tier.pricing.monthly}</div>
                    {tier.pricing.monthly !== "Call for Quote" && (
                      <div className="absolute -top-1 -right-1">
                        <Badge variant="secondary" className="text-xs px-1 py-0 bg-success text-success-foreground">
                          25% OFF
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">One-time:</span>
                    <div className="font-semibold text-primary">{tier.pricing.oneTime}</div>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg border border-accent/20 relative">
                  <span className="text-sm text-muted-foreground">Deep Clean:</span>
                  <div className="font-bold text-accent text-lg">{tier.pricing.deepClean}</div>
                  {tier.pricing.deepClean !== "Call for Quote" && (
                    <div className="absolute -top-2 -right-2">
                      <Badge variant="destructive" className="text-xs px-2 py-1 bg-destructive text-destructive-foreground animate-pulse">
                        65% OFF!
                      </Badge>
                    </div>
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
              {service.name === "Deep Cleaning" && (
                <div className="absolute top-2 right-2 z-10">
                  <Badge variant="destructive" className="animate-pulse bg-destructive text-destructive-foreground">
                    65% OFF!
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <h4 className="font-semibold text-primary mb-2">Deep Clean Discount</h4>
              <p className="text-sm text-muted-foreground">65% off all deep cleaning services</p>
            </div>
            <div className="text-center p-4 bg-accent/10 rounded-lg">
              <h4 className="font-semibold text-accent mb-2">Recurring Service Benefits</h4>
              <p className="text-sm text-muted-foreground">25% off recurring services + 6th cleaning FREE</p>
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
              📞 (281) 201-6112
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