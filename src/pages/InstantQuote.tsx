import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navigation } from "@/components/Navigation";
import { Home, Calculator, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";

const InstantQuote = () => {
  const [formData, setFormData] = useState({
    homeSize: "",
    bedrooms: "",
    bathrooms: "",
    serviceType: "",
    frequency: "",
    location: "",
    zipCode: ""
  });
  
  const [quote, setQuote] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateQuote = () => {
    if (!formData.homeSize || !formData.serviceType) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    
    // Dynamic pricing calculation
    setTimeout(() => {
      let basePrice = 0;
      
      // Base pricing by home size
      switch (formData.homeSize) {
        case "studio":
          basePrice = 120;
          break;
        case "1br":
          basePrice = 150;
          break;
        case "2br":
          basePrice = 180;
          break;
        case "3br":
          basePrice = 220;
          break;
        case "4br":
          basePrice = 260;
          break;
        case "5br+":
          basePrice = 320;
          break;
        default:
          basePrice = 180;
      }

      // Service type multiplier
      const multipliers = {
        standard: 1,
        deep: 1.5,
        move_in: 1.8,
        move_out: 1.6,
        post_construction: 2.0
      };

      const serviceMultiplier = multipliers[formData.serviceType as keyof typeof multipliers] || 1;
      
      // Frequency discount
      const frequencyDiscounts = {
        weekly: 0.85,
        biweekly: 0.9,
        monthly: 0.95,
        one_time: 1
      };

      const frequencyMultiplier = frequencyDiscounts[formData.frequency as keyof typeof frequencyDiscounts] || 1;

      const finalPrice = Math.round(basePrice * serviceMultiplier * frequencyMultiplier);
      setQuote(finalPrice);
      setLoading(false);
    }, 1000);
  };

  const proceedToBooking = () => {
    if (!quote) return;
    
    // Store quote data and redirect to booking
    const quoteData = {
      ...formData,
      quote,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('instant_quote', JSON.stringify(quoteData));
    window.location.href = '/schedule-service?quote_id=' + Date.now();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          
          {/* Header */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary to-accent text-white text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Calculator className="h-6 w-6" />
                Get Your Instant Quote
              </CardTitle>
              <p className="text-primary-foreground/80">
                Quick pricing based on your home size and service needs
              </p>
            </CardHeader>
          </Card>

          {/* Quote Form */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Service Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Home Size */}
              <div className="space-y-2">
                <Label htmlFor="homeSize">Home Size *</Label>
                <Select value={formData.homeSize} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, homeSize: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your home size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="studio">Studio Apartment</SelectItem>
                    <SelectItem value="1br">1 Bedroom</SelectItem>
                    <SelectItem value="2br">2 Bedrooms</SelectItem>
                    <SelectItem value="3br">3 Bedrooms</SelectItem>
                    <SelectItem value="4br">4 Bedrooms</SelectItem>
                    <SelectItem value="5br+">5+ Bedrooms</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Service Type */}
              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type *</Label>
                <Select value={formData.serviceType} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, serviceType: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Cleaning</SelectItem>
                    <SelectItem value="deep">Deep Cleaning</SelectItem>
                    <SelectItem value="move_in">Move-in Cleaning</SelectItem>
                    <SelectItem value="move_out">Move-out Cleaning</SelectItem>
                    <SelectItem value="post_construction">Post-Construction</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Frequency */}
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency *</Label>
                <Select value={formData.frequency} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, frequency: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="How often?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One Time</SelectItem>
                    <SelectItem value="weekly">Weekly (15% Off)</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly (10% Off)</SelectItem>
                    <SelectItem value="monthly">Monthly (5% Off)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">City</Label>
                  <Input
                    id="location"
                    placeholder="San Francisco"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    placeholder="94102"
                    value={formData.zipCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                  />
                </div>
              </div>

              {/* Calculate Button */}
              <Button 
                onClick={calculateQuote}
                disabled={loading || !formData.homeSize || !formData.serviceType}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Calculating...
                  </div>
                ) : (
                  "Get My Quote"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quote Result */}
          {quote && (
            <Card className="border-0 shadow-lg border-l-4 border-l-primary">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-bold text-primary">Your Instant Quote</h3>
                  <div className="text-4xl font-bold text-accent">${quote}</div>
                  
                  {formData.frequency !== "one_time" && (
                    <div className="text-sm text-muted-foreground">
                      {formData.frequency === "weekly" && "15% recurring discount applied"}
                      {formData.frequency === "biweekly" && "10% recurring discount applied"}
                      {formData.frequency === "monthly" && "5% recurring discount applied"}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-4 rounded-lg">
                    <div>
                      <strong>Service:</strong> {formData.serviceType?.replace(/_/g, ' ')}
                    </div>
                    <div>
                      <strong>Size:</strong> {formData.homeSize?.replace('br', ' bedroom')}
                    </div>
                    <div>
                      <strong>Frequency:</strong> {formData.frequency?.replace(/_/g, ' ')}
                    </div>
                    <div>
                      <strong>Location:</strong> {formData.location || "Bay Area"}
                    </div>
                  </div>

                  <Button onClick={proceedToBooking} size="lg" className="w-full">
                    <Clock className="h-4 w-4 mr-2" />
                    Book This Service
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    * Final pricing may vary based on specific requirements and property condition
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstantQuote;