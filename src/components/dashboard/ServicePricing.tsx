import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Building, Star, Clock } from "lucide-react";

// Bay Area Cleaning Pros pricing structure by square footage
const pricingTiers = [
  {
    range: "Under 1,000 sq ft",
    icon: Home,
    description: "Cozy homes and apartments",
    pricing: {
      weekly: "$87.75",
      biweekly: "$106.73", 
      monthly: "$154.13",
      oneTime: "$202.78",
      deepClean: "$274.55"
    }
  },
  {
    range: "1,001-1,400 sq ft",
    icon: Home,
    description: "Small to medium homes",
    pricing: {
      weekly: "$104.35",
      biweekly: "$113.02",
      monthly: "$167.93", 
      oneTime: "$211.58",
      deepClean: "$294.99"
    }
  },
  {
    range: "1,401-1,800 sq ft",
    icon: Home,
    description: "Medium sized homes",
    pricing: {
      weekly: "$113.10",
      biweekly: "$126.05",
      monthly: "$203.16",
      oneTime: "$229.74", 
      deepClean: "$320.35"
    }
  },
  {
    range: "1,801-2,400 sq ft",
    icon: Home,
    description: "Large family homes",
    pricing: {
      weekly: "$119.53",
      biweekly: "$135.14",
      monthly: "$211.38",
      oneTime: "$238.87",
      deepClean: "$346.62"
    }
  },
  {
    range: "2,401-2,800 sq ft", 
    icon: Home,
    description: "Very large homes",
    pricing: {
      weekly: "$142.43",
      biweekly: "$157.63", 
      monthly: "$221.18",
      oneTime: "$256.75",
      deepClean: "$364.51"
    }
  },
  {
    range: "2,801+ sq ft",
    icon: Home,
    description: "Extra large homes",
    pricing: {
      weekly: "$151.86+",
      biweekly: "$169.76+",
      monthly: "$259.13+", 
      oneTime: "$267.71+",
      deepClean: "$413.24+"
    }
  }
];

const serviceTypes = [
  { 
    name: "General Cleaning", 
    description: "Regular maintenance cleaning for occupied homes",
    icon: Home, 
    color: "text-primary",
    features: ["All rooms cleaned", "Kitchen & bathrooms", "Floors vacuumed/mopped", "Trash removal"]
  },
  { 
    name: "Deep Cleaning", 
    description: "Thorough cleaning including detailed work",
    icon: Star, 
    color: "text-accent",
    features: ["Everything in General", "Inside appliances", "Baseboards", "Light fixtures", "Deep scrubbing"]
  },
  { 
    name: "Move-out Cleaning", 
    description: "Complete cleaning for vacant properties",
    icon: Clock, 
    color: "text-success",
    features: ["Everything in Deep", "Inside cabinets", "Detailed sanitizing", "Window cleaning", "Move-in ready"]
  }
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
                  <div className="p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Weekly:</span>
                    <div className="font-semibold text-primary">{tier.pricing.weekly}</div>
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">EOW:</span>
                    <div className="font-semibold text-primary">{tier.pricing.biweekly}</div>
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Monthly:</span>
                    <div className="font-semibold text-primary">{tier.pricing.monthly}</div>
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">One-time:</span>
                    <div className="font-semibold text-primary">{tier.pricing.oneTime}</div>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg border border-accent/20">
                  <span className="text-sm text-muted-foreground">Deep Clean:</span>
                  <div className="font-bold text-accent text-lg">{tier.pricing.deepClean}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Service Types */}
      <Card>
        <CardHeader>
          <CardTitle>Our Cleaning Services</CardTitle>
          <CardDescription>
            Professional cleaning services tailored to your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {serviceTypes.map((service) => (
              <div key={service.name} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${service.color} bg-current/10`}>
                    <service.icon className={`h-6 w-6 ${service.color}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold">{service.name}</h4>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-15">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Star className="h-3 w-3 fill-current text-accent" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
          <Badge variant="outline" className="text-lg px-4 py-2">
            Call: (281) 201-6112
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}