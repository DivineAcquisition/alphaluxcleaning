import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Phone, Mail, Menu, HelpCircle } from "lucide-react";
import logo from "@/assets/logo.png";
export function Navigation() {
  const handleTroubleBooking = () => {
    window.open('https://book.housecallpro.com/book/AlphauLux-Clean/caa37e7c0f5840c688df5b158fa41ddb?v2=true', '_blank');
  };

  return <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center justify-center space-x-3">
            <img src={logo} alt="AlphaLux Cleaning" width="64" height="64" className="h-10 w-auto md:h-16 md:w-auto object-contain rounded-xl" />
          </Link>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Having Trouble Booking Button */}
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

            {/* Contact Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-background border shadow-lg z-[100]">
                <div className="px-3 py-2 text-sm font-medium text-muted-foreground border-b">
                  Get in touch with us:
                </div>
                
                <DropdownMenuItem className="flex items-center gap-3 py-2 cursor-pointer" onClick={() => window.open('tel:+18577544557', '_self')}>
                  <Phone className="h-4 w-4" />
                  +1 857-754-4557
                </DropdownMenuItem>
                
                <DropdownMenuItem className="flex items-center gap-3 py-2 cursor-pointer" onClick={() => window.open('mailto:info@alphaluxclean.com', '_self')}>
                  <Mail className="h-4 w-4" />
                  Email Support
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-background border shadow-lg z-[100]">
                  {/* Having Trouble Booking for Mobile */}
                  <DropdownMenuItem className="flex items-center gap-3 py-3 cursor-pointer" onClick={handleTroubleBooking}>
                    <HelpCircle className="h-4 w-4" />
                    Having Trouble Booking?
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Mobile Contact Section */}
                  <div className="px-3 py-2 text-sm font-medium text-muted-foreground border-b">
                    Contact Us:
                  </div>
                  
                  <DropdownMenuItem className="flex items-center gap-3 py-2 cursor-pointer" onClick={() => window.open('tel:+18577544557', '_self')}>
                    <Phone className="h-4 w-4" />
                    +1 857-754-4557
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem className="flex items-center gap-3 py-2 cursor-pointer" onClick={() => window.open('mailto:info@alphaluxclean.com', '_self')}>
                    <Mail className="h-4 w-4" />
                    Email Support
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>;
}