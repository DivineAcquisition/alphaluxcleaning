import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Building, Star, Clock } from "lucide-react";

const pricingTiers = [
  {
    type: "Residential",
    icon: Home,
    description: "Perfect for homes and apartments",
    services: [
      { name: "Basic Cleaning", price: "0.15", features: ["Dusting", "Vacuuming", "Bathroom clean", "Kitchen clean"] },
      { name: "Deep Cleaning", price: "0.25", features: ["Everything in Basic", "Inside appliances", "Baseboards", "Light fixtures"] },
      { name: "Move-out Clean", price: "0.35", features: ["Everything in Deep", "Inside cabinets", "Detailed scrubbing", "Window cleaning"] }
    ]
  },
  {
    type: "Commercial",
    icon: Building,
    description: "For retail and commercial spaces",
    services: [
      { name: "Basic Cleaning", price: "0.12", features: ["Floor cleaning", "Trash removal", "Surface wiping", "Restroom clean"] },
      { name: "Deep Cleaning", price: "0.20", features: ["Everything in Basic", "Carpet cleaning", "Window cleaning", "Equipment cleaning"] },
      { name: "Move-out Clean", price: "0.30", features: ["Everything in Deep", "Paint touch-ups", "Detailed sanitizing", "Fixture cleaning"] }
    ]
  },
  {
    type: "Office",
    icon: Building,
    description: "Professional office environments",
    services: [
      { name: "Basic Cleaning", price: "0.10", features: ["Desk cleaning", "Floor maintenance", "Trash service", "Kitchen areas"] },
      { name: "Deep Cleaning", price: "0.18", features: ["Everything in Basic", "Conference rooms", "Break rooms", "Sanitizing"] },
      { name: "Move-out Clean", price: "0.25", features: ["Everything in Deep", "Storage areas", "Detailed cleaning", "Final inspection"] }
    ]
  }
];

const frequencyDiscounts = [
  { frequency: "Weekly", discount: "15%", icon: Clock, color: "text-success" },
  { frequency: "Bi-weekly", discount: "10%", icon: Clock, color: "text-primary" },
  { frequency: "Monthly", discount: "5%", icon: Clock, color: "text-accent" }
];

export function ServicePricing() {
  return (
    <div className="space-y-6">
      {/* Service Types */}
      <div>
        <h3 className="text-2xl font-bold mb-4">Service Pricing</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {pricingTiers.map((tier) => (
            <Card key={tier.type} className="relative overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <tier.icon className="h-5 w-5 text-primary" />
                  {tier.type}
                </CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tier.services.map((service) => (
                  <div key={service.name} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{service.name}</h4>
                      <Badge variant="outline">
                        ${service.price}/sq ft
                      </Badge>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {service.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Star className="h-3 w-3 fill-current text-accent" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Frequency Discounts */}
      <Card>
        <CardHeader>
          <CardTitle>Frequency Discounts</CardTitle>
          <CardDescription>
            Save more with regular cleaning services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {frequencyDiscounts.map((item) => (
              <div key={item.frequency} className="flex items-center p-4 bg-muted/50 rounded-lg">
                <div className={`flex items-center justify-center w-12 h-12 rounded-lg mr-4 ${item.color} bg-current/10`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <div>
                  <p className="font-semibold">{item.frequency}</p>
                  <p className={`text-sm font-bold ${item.color}`}>
                    Save {item.discount}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}