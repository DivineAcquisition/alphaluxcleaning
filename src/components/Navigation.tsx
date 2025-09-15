import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Home, Phone, Mail, ExternalLink, Menu, Calendar } from "lucide-react";
export function Navigation() {
  const location = useLocation();
  
  const getNavItems = () => {
    return [{
      path: "/",
      label: "Book Cleaning",
      icon: Home
    }, {
      path: "/stripe-test",
      label: "Test Payment",
      icon: Calendar
    }];
  };
  
  const navItems = getNavItems();
  return <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center justify-center space-x-3">
            <img src="/lovable-uploads/58721dab-bcc3-4b69-bb80-6cca4ddf9f0c.png" alt="Bay Area Cleaning Professionals" width="64" height="64" className="h-32 w-32 md:h-16 md:w-16 object-contain" />
          </Link>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Navigation Dropdown */}
            <div className="hidden md:flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Menu className="h-4 w-4" />
                    Navigation
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background border shadow-lg z-[100]">
                  {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return <DropdownMenuItem key={item.path} asChild>
                        <Link to={item.path} className={`flex items-center gap-3 w-full py-2 ${isActive ? "bg-primary/10 text-primary font-medium" : ""}`}>
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>;
                })}
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                    <a href="https://bayareacleaningpros.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full py-2">
                      <ExternalLink className="h-4 w-4" />
                      Visit Website
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                
                <DropdownMenuItem className="flex items-center gap-3 py-2 cursor-pointer" onClick={() => window.open('tel:+12818099901', '_self')}>
                  <Phone className="h-4 w-4" />
                  (281) 809-9901
                </DropdownMenuItem>
                
                <DropdownMenuItem className="flex items-center gap-3 py-2 cursor-pointer" onClick={() => window.open('mailto:support@bayareacleaningpros.com', '_self')}>
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
                <DropdownMenuContent align="end" className="w-56 bg-background border shadow-lg z-[100]">
                  {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return <DropdownMenuItem key={item.path} asChild>
                        <Link to={item.path} className={`flex items-center gap-3 w-full py-2 ${isActive ? "bg-primary/10 text-primary font-medium" : ""}`}>
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>;
                })}
                  
                  <DropdownMenuSeparator />
                  
                  {/* Mobile Contact Section */}
                  <div className="px-3 py-2 text-sm font-medium text-muted-foreground border-b">
                    Contact Us:
                  </div>
                  
                  <DropdownMenuItem className="flex items-center gap-3 py-2 cursor-pointer" onClick={() => window.open('tel:+12818099901', '_self')}>
                    <Phone className="h-4 w-4" />
                    (281) 809-9901
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem className="flex items-center gap-3 py-2 cursor-pointer" onClick={() => window.open('mailto:support@bayareacleaningpros.com', '_self')}>
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