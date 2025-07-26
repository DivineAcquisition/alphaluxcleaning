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
import { Home, FileText, CheckCircle, Phone, Mail, ExternalLink, Menu, Users, UserPlus, Settings, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function Navigation() {
  const location = useLocation();
  const { user, userRole, signOut } = useAuth();
  
  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/order-status", label: "Order Status", icon: FileText },
    { path: "/my-services", label: "My Services", icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex h-18 items-center justify-between">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center space-x-3 flex-shrink-0">
            <img 
              src="/lovable-uploads/58721dab-bcc3-4b69-bb80-6cca4ddf9f0c.png" 
              alt="Bay Area Cleaning Professionals" 
              className="h-10 w-10 object-contain"
            />
            <span className="font-semibold text-lg hidden sm:block">Bay Area Cleaning Pros</span>
            <span className="font-semibold text-base sm:hidden">BACP</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center justify-center flex-1 mx-8">
            <div className="flex items-center space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? "default" : "ghost"}
                    size="default"
                    className="px-4 py-2"
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
                size="default"
                className="px-4 py-2"
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
            </div>
          </div>

          {/* Tablet Navigation */}
          <div className="hidden md:flex lg:hidden items-center space-x-3">
            {navItems.slice(0, 2).map((item) => {
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
                    <span className="hidden xl:inline">{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
          
          {/* Right Section */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Contact Info - Desktop Only */}
            <div className="hidden xl:flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>Contact:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open('tel:+12812016112', '_self')}
                  className="flex items-center gap-2 h-8 px-2"
                >
                  <Phone className="h-3 w-3" />
                  <span>(281) 201-6112</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open('mailto:support@bayareacleaningpros.com', '_self')}
                  className="flex items-center gap-2 h-8 px-2"
                >
                  <Mail className="h-3 w-3" />
                  <span>Email</span>
                </Button>
              </div>
            </div>
            
            {/* Auth Section */}
            <div className="flex items-center">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="px-3 py-2">
                      <span className="hidden sm:inline mr-2">{user.email?.split('@')[0]}</span>
                      <span className="text-xs text-muted-foreground">({userRole})</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2 text-sm border-b">
                      <div className="font-medium">{user.email?.split('@')[0]}</div>
                      <div className="text-xs text-muted-foreground">Role: {userRole}</div>
                    </div>
                    {userRole === 'admin' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/admin-dashboard" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {userRole === 'customer' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/my-services" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            My Account
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="outline" className="px-4 py-2" asChild>
                  <Link to="/auth" className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign In</span>
                  </Link>
                </Button>
              )}
            </div>

            {/* Mobile Menu */}
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="px-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background z-[100]">
                  <div className="lg:hidden">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      
                      return (
                        <DropdownMenuItem key={item.path} asChild>
                          <Link 
                            to={item.path} 
                            className={`flex items-center gap-3 w-full py-2 ${
                              isActive ? "bg-primary/10 text-primary font-medium" : ""
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
                        className="flex items-center gap-3 w-full py-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Visit Website
                      </a>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                  </div>
                  
                  {/* Contact Section for Mobile */}
                  <div className="xl:hidden">
                    <div className="px-3 py-2 text-sm font-medium text-muted-foreground border-b">
                      Contact Us:
                    </div>
                    
                    <DropdownMenuItem 
                      className="flex items-center gap-3 py-2 cursor-pointer"
                      onClick={() => window.open('tel:+12812016112', '_self')}
                    >
                      <Phone className="h-4 w-4" />
                      (281) 201-6112
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      className="flex items-center gap-3 py-2 cursor-pointer"
                      onClick={() => window.open('mailto:support@bayareacleaningpros.com', '_self')}
                    >
                      <Mail className="h-4 w-4" />
                      Email Support
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}