import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
interface ServiceIncludedProps {
  cleaningType: string;
  serviceType: string;
}
export const ServiceIncluded = ({
  cleaningType,
  serviceType
}: ServiceIncludedProps) => {
  const getServiceDetails = () => {
    if (cleaningType === "deep") {
      return {
        title: "Deep Clean Services",
        description: "Comprehensive deep cleaning with extra attention to detail",
        included: ["Dust open shelves, ceiling fans, air vents, baseboards, windowsills, and mini blinds", "Dust and polish furniture", "Clean mirrors, picture glass, inside sliding glass doors", "Bathroom: Clean tubs, shower doors, toilet, sinks, and countertops, mop floor", "Kitchen: Clean top and front of stove and burners", "Clean top, front, sides and inside of refrigerator", "Load dishwasher or hand wash dishes (breakfast dishes or dishes from night before)", "Clean kitchen countertops, sink, small appliances and microwave", "Collect and dispose of trash", "Sweep and mop all floors", "Vacuum all carpet areas", "Make beds or change bed linens if clean ones are left out", "Fold up to two baskets of laundry"],
        special: "First Cleaning Special: We'll also clean inside of fridge, oven, and drawers",
        benefit: "Recurring Service Benefit: Sign up for weekly, bi-weekly, or monthly service and your 6th cleaning is FREE!"
      };
    } else {
      return {
        title: "General Cleaning Services",
        description: "Standard professional cleaning services",
        included: ["Kitchen: Clean and disinfect kitchen, wipe countertops", "Kitchen: Wash small amount of dishes or load dishwasher", "Kitchen: Wipe down all appliances and inside/out of microwave", "General House: Dust and polish furniture throughout house", "General House: Make beds", "General House: Sweep and mop floors", "General House: Vacuum carpeted areas", "General House: Fold up to 2 baskets of clothes", "Bathrooms: Clean, disinfect and sanitize bathrooms", "Bathrooms: Clean toilets", "Bathrooms: Scrub bathtubs and showers", "Bathrooms: Wipe down countertops and inside sinks", "Bathrooms: Clean mirrors"],
        zones: {
          title: "Four-Zone Professional System",
          description: "We use our Professional House Cleaning Checklist with a four-zone rotation system:",
          areas: [{
            name: "Bathrooms",
            items: ["Tile walls, bathtubs, and showers cleaned and sanitized", "Shower doors cleaned", "Vanity and sink cleaned", "Mirrors and chrome fixtures shined", "Floors cleaned/carpets vacuumed", "Toilets thoroughly cleaned"]
          }, {
            name: "Living Areas",
            items: ["Flat areas hand wiped and sanitized", "Doors and door frames spot cleaned", "Cobwebs removed", "Picture frames dusted", "Ceiling fans dusted", "General dusting"]
          }, {
            name: "Sleeping Areas",
            items: ["Flat areas hand wiped and sanitized", "Window sills, ledges, and blinds dusted", "Hard surfaced floors: vacuumed and damp mopped", "Stairs vacuumed", "All readily accessible floors vacuumed"]
          }, {
            name: "Kitchens",
            items: ["Counter tops cleaned and sanitized", "Range hood, stove top and front cleaned", "Sinks cleaned and chrome shined", "Fronts of all appliances cleaned", "Floors vacuumed and damp mopped", "Microwave wiped out"]
          }]
        }
      };
    }
  };
  const serviceDetails = getServiceDetails();
  return <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">{serviceDetails.title}</CardTitle>
        <p className="text-muted-foreground">{serviceDetails.description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-semibold mb-3">What's Included:</h4>
          <div className="grid gap-2">
            {serviceDetails.included.map((item, index) => <div key={index} className="flex items-start gap-3">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{item}</span>
              </div>)}
          </div>
        </div>

        {serviceDetails.special && <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Special Offer</h4>
            <p className="text-sm text-blue-800">{serviceDetails.special}</p>
          </div>}

        {serviceDetails.benefit && <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">Recurring Service Benefit</h4>
            <p className="text-sm text-green-800">{serviceDetails.benefit}</p>
          </div>}

        {serviceDetails.zones && <div>
            <h4 className="font-semibold mb-2">{serviceDetails.zones.title}</h4>
            <p className="text-sm text-muted-foreground mb-4">{serviceDetails.zones.description}</p>
            <div className="grid gap-4 md:grid-cols-2">
              {serviceDetails.zones.areas.map((zone, index) => <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <h5 className="font-medium mb-2">{zone.name}</h5>
                  <div className="space-y-1">
                    {zone.items.map((item, itemIndex) => <div key={itemIndex} className="flex items-start gap-2">
                        <Check className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                        <span className="text-xs">{item}</span>
                      </div>)}
                  </div>
                </div>)}
            </div>
          </div>}

        <div className="pt-4 border-t text-center">
          <p className="text-sm text-muted-foreground">BayAreaCleaningPros | (281) 809-9901</p>
          <p className="text-sm text-muted-foreground">Baytown, TX | support@bayareacleaningpros.com</p>
        </div>
      </CardContent>
    </Card>;
};