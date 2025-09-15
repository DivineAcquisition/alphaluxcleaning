import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Calendar, ArrowLeft, Phone } from "lucide-react";
import { toast } from "sonner";

const ScheduleService = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary to-accent text-white">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule Your Service
              </CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Service scheduling is currently being updated. Please contact us directly.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Need to schedule your cleaning service?
                  </h3>
                  <p className="text-muted-foreground">
                    Contact us directly and we'll help you find the perfect time.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => window.open('tel:+12818099901', '_self')}
                    className="flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    Call (281) 809-9901
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Booking
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ScheduleService;