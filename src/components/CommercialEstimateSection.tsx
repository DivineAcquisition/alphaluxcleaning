import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Calendar, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { CommercialEstimateForm } from "./CommercialEstimateForm";

export function CommercialEstimateSection() {
  const [showForm, setShowForm] = useState(false);
  const [selectedService, setSelectedService] = useState<'commercial' | 'office'>('commercial');

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Request Commercial Estimate</h2>
          <Button 
            variant="outline" 
            onClick={() => setShowForm(false)}
            className="flex items-center gap-2"
          >
            ← Back to Overview
          </Button>
        </div>
        <CommercialEstimateForm 
          serviceType={selectedService}
          cleaningType="standard"
          frequency="weekly"
          squareFootage="5,000-10,000 sq ft"
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 px-2 sm:px-4">
      <div className="text-center space-y-4">
        <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Commercial & Office Cleaning Services
        </h2>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
          Professional cleaning solutions tailored to your business needs. Get a custom quote with a free walkthrough.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Commercial Cleaning Card */}
        <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="bg-gradient-to-br from-primary/10 to-accent/10">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Building2 className="h-6 w-6 text-primary" />
              Commercial Cleaning
            </CardTitle>
            <CardDescription className="text-base">
              Comprehensive cleaning for retail stores, warehouses, manufacturing facilities, and large commercial spaces.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Retail & Restaurant Cleaning</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Warehouse & Manufacturing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Medical Facilities</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Government Buildings</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Educational Facilities</span>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Button 
                className="w-full" 
                onClick={() => {
                  setSelectedService('commercial');
                  setShowForm(true);
                }}
              >
                Request Commercial Estimate
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Office Cleaning Card */}
        <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="bg-gradient-to-br from-accent/10 to-primary/10">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Building2 className="h-6 w-6 text-accent" />
              Office Cleaning
            </CardTitle>
            <CardDescription className="text-base">
              Professional office cleaning services for corporate environments, coworking spaces, and business offices.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Corporate Office Buildings</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Coworking Spaces</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Conference Rooms</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Break Rooms & Kitchens</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Reception Areas</span>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Button 
                className="w-full"
                onClick={() => {
                  setSelectedService('office');
                  setShowForm(true);
                }}
              >
                Request Office Estimate
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Process Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Our Process</CardTitle>
          <CardDescription className="text-base">
            Simple steps to get your custom cleaning quote
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold">Submit Request</h3>
              <p className="text-sm text-muted-foreground">
                Fill out our detailed form with your business and cleaning requirements
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold">Schedule Walkthrough</h3>
              <p className="text-sm text-muted-foreground">
                We'll visit your facility to assess your specific cleaning needs
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-semibold">Receive Quote</h3>
              <p className="text-sm text-muted-foreground">
                Get a detailed, customized cleaning plan with transparent pricing
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <div className="text-center space-y-4 p-6 bg-gradient-to-r from-primary to-accent rounded-lg text-white">
        <h3 className="text-2xl font-bold">Ready to Get Started?</h3>
        <p className="text-lg opacity-90">
          Contact us today for a free consultation and walkthrough
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button 
            variant="secondary" 
            size="lg" 
            className="flex items-center gap-2"
            onClick={() => setShowForm(true)}
          >
            <Calendar className="h-5 w-5" />
            Request Estimate
          </Button>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            Response within 24 hours
          </div>
        </div>
      </div>
    </div>
  );
}