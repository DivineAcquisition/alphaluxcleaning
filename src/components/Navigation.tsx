import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, FileText, CheckCircle, Phone, Mail, ExternalLink, Menu, Users, UserPlus, Settings } from "lucide-react";

export function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/order-status", label: "Order Status", icon: FileText },
    { path: "/my-services", label: "My Services", icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/58721dab-bcc3-4b69-bb80-6cca4ddf9f0c.png" 
              alt="Bay Area Cleaning Professionals" 
              className="h-10 w-10 object-contain"
            />
            <span className="font-semibold text-lg">Bay Area Cleaning Pros</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  asChild
                >
                  <Link to={item.path} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
            
            {/* Website Link */}
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a 
                href="https://bayareacleaningpros.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Visit Website
              </a>
            </Button>
            
            {/* Contact Buttons */}
            <div className="hidden lg:flex items-center gap-2 ml-6 pl-6 border-l">
              <span className="text-sm text-muted-foreground mr-2">Email or call us:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('tel:+12812016112', '_self')}
                className="flex items-center gap-2 text-sm"
              >
                <Phone className="h-4 w-4" />
                <span>(281) 201-6112</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('mailto:support@bayareacleaningpros.com', '_self')}
                className="flex items-center gap-2 text-sm"
              >
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background z-[100]">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link 
                        to={item.path} 
                        className={`flex items-center gap-2 w-full ${
                          isActive ? "bg-primary/10 text-primary" : ""
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <a 
                    href="https://bayareacleaningpros.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 w-full"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Visit Website
                  </a>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem disabled className="flex items-center gap-2 text-sm font-medium">
                  Email or call us:
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="flex items-center gap-2 text-sm cursor-pointer"
                  onClick={() => window.open('tel:+12812016112', '_self')}
                >
                  <Phone className="h-4 w-4" />
                  (281) 201-6112
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="flex items-center gap-2 text-sm cursor-pointer"
                  onClick={() => window.open('mailto:support@bayareacleaningpros.com', '_self')}
                >
                  <Mail className="h-4 w-4" />
                  Email us
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}