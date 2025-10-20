import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Users, DollarSign } from "lucide-react";
import logo from "@/assets/logo.png";
export function DashboardHeader() {
  return <div className="space-y-6">
      {/* Main Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <img src={logo} alt="Bay Area Cleaning Professionals" className="h-24 w-auto rounded-xl" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Bay Area Cleaning Professionals
        </h1>
        <p className="text-xl text-muted-foreground">
          Professional Cleaning Services in Baytown, TX - Get Your Instant Quote
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <Badge variant="secondary" className="text-sm">
            <Sparkles className="h-3 w-3 mr-1" />
            Baytown, TX 77521
          </Badge>
          <Badge variant="outline" className="text-sm">
            📞 (281) 809-9901
          </Badge>
          
        </div>
        <p className="text-sm text-muted-foreground">bayareacleaningpros.com • support@bayareacleaningpros.com</p>
      </div>

      {/* Service Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mr-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">Quality Focused</p>
              <p className="text-sm text-muted-foreground">Precision & Professionalism</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-success/10 rounded-lg mr-4">
              <Users className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">Trusted Service</p>
              <p className="text-sm text-muted-foreground">Serving Bay Area</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-accent/10 rounded-lg mr-4">
              <DollarSign className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">Fair Pricing</p>
              <p className="text-sm text-muted-foreground">Transparent Quotes</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}