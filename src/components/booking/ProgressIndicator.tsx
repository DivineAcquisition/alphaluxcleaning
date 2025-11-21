import React from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Phone, Mail, HelpCircle, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProgressIndicatorProps {
  currentStep?: number;
  steps?: any[];
}

export function ProgressIndicator({}: ProgressIndicatorProps) {
  const navigate = useNavigate();
  
  const handleTroubleBooking = () => {
    window.open('https://book.housecallpro.com/book/AlphauLux-Clean/caa37e7c0f5840c688df5b158fa41ddb?v2=true', '_blank');
  };

  return (
    <div className="flex items-center justify-between py-4 px-4 border-b bg-background">
      <div className="flex items-center">
        {/* Logo placeholder */}
        <div className="text-xl font-bold text-primary">
          AlphaLux Clean
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Call Us Button - Desktop */}
        <div className="hidden md:flex">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => navigate('/call')}
          >
            <Phone className="h-4 w-4" />
            Call Us
          </Button>
        </div>

        {/* Having Trouble Booking Button - Desktop */}
        <div className="hidden md:flex">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleTroubleBooking}
          >
            <HelpCircle className="h-4 w-4" />
            Having Trouble Booking?
          </Button>
        </div>

        {/* Contact Dropdown - Desktop */}
        <div className="hidden md:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-background border shadow-lg z-[100]">
              <DropdownMenuItem asChild>
                <a href="tel:+19725590223" className="flex items-center gap-3 w-full py-2">
                  <Phone className="h-4 w-4" />
                  Call (972) 559-0223
                </a>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem asChild>
                <a href="mailto:info@alphaluxclean.com" className="flex items-center gap-3 w-full py-2">
                  <Mail className="h-4 w-4" />
                  Email Support
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-background border shadow-lg z-[100]">
              {/* Call Us for Mobile */}
              <DropdownMenuItem className="flex items-center gap-3 py-3 cursor-pointer" onClick={() => navigate('/call')}>
                <Phone className="h-4 w-4" />
                Call Us
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Having Trouble Booking for Mobile */}
              <DropdownMenuItem className="flex items-center gap-3 py-3 cursor-pointer" onClick={handleTroubleBooking}>
                <HelpCircle className="h-4 w-4" />
                Having Trouble Booking?
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Contact Options for Mobile */}
              <DropdownMenuItem asChild>
                <a href="tel:+19725590223" className="flex items-center gap-3 w-full py-2">
                  <Phone className="h-4 w-4" />
                  Call (972) 559-0223
                </a>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <a href="mailto:info@alphaluxclean.com" className="flex items-center gap-3 w-full py-2">
                  <Mail className="h-4 w-4" />
                  Email Support
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}