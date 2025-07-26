import { Heart, MapPin, Phone, Mail, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src="/bay-area-logo.png" alt="Bay Area Cleaning Pros" className="h-8 w-8" />
              <h3 className="font-bold text-lg">Bay Area Cleaning Pros</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Professional cleaning services throughout the Bay Area. Trusted by thousands of satisfied customers.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="h-4 w-4 text-red-500" />
              <span>Made with care in the Bay Area</span>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="font-semibold">Our Services</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Residential Cleaning
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Deep Cleaning
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Move-out Cleaning
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Commercial Cleaning
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Recurring Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/order-status" className="hover:text-primary transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/subcontractor-application" className="hover:text-primary transition-colors">
                  Join Our Team
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-primary transition-colors">
                  Customer Portal
                </Link>
              </li>
              <li>
                <a 
                  href="#" 
                  className="hover:text-primary transition-colors flex items-center gap-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Reviews <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contact Us</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Serving the Bay Area</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="tel:+1-555-CLEANING" className="hover:text-primary transition-colors">
                  (555) CLEANING
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:hello@bayareacleaningpros.com" className="hover:text-primary transition-colors">
                  hello@bayareacleaningpros.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t mt-8 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p>© {currentYear} Bay Area Cleaning Pros. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="#" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="#" className="hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <span className="text-xs">Licensed & Insured</span>
            <span className="text-xs">•</span>
            <span className="text-xs">5-Star Rated</span>
          </div>
        </div>
      </div>
    </footer>
  );
}