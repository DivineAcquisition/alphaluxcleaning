import { Shield, Users, BarChart3, Settings, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export function AdminFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Admin Panel */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">Admin Panel</h4>
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>
                <Link to="/admin-dashboard" className="hover:text-primary transition-colors">
                  Dashboard Overview
                </Link>
              </li>
              <li>
                <Link to="/application-manager" className="hover:text-primary transition-colors">
                  Applications
                </Link>
              </li>
              <li>
                <Link to="/subcontractor-management" className="hover:text-primary transition-colors">
                  Team Management
                </Link>
              </li>
            </ul>
          </div>

          {/* Analytics */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">Analytics</h4>
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>
                <Link to="/metrics-dashboard" className="hover:text-primary transition-colors">
                  Metrics Dashboard
                </Link>
              </li>
              <li>
                <a 
                  href="#" 
                  className="hover:text-primary transition-colors flex items-center gap-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Revenue Reports <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="hover:text-primary transition-colors flex items-center gap-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Performance Analytics <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Operations */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">Operations</h4>
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>
                <Link to="/admin-dashboard" className="hover:text-primary transition-colors">
                  Active Bookings
                </Link>
              </li>
              <li>
                <a 
                  href="#" 
                  className="hover:text-primary transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Customer Support
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="hover:text-primary transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Quality Control
                </a>
              </li>
            </ul>
          </div>

          {/* System Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">System</h4>
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>
                <span className="text-green-600">● System Online</span>
              </li>
              <li>
                <span>Last Updated: {new Date().toLocaleDateString()}</span>
              </li>
              <li>
                <a 
                  href="#" 
                  className="hover:text-primary transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Documentation
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t mt-6 pt-4 flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p>© {currentYear} Bay Area Cleaning Pros - Internal Admin Portal</p>
            <div className="flex items-center gap-3">
              <span>Version 2.1.0</span>
              <span>•</span>
              <span>Last Deploy: {new Date().toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 md:mt-0">
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
              Production
            </span>
            <span className="text-xs">Logged in as Admin</span>
          </div>
        </div>
      </div>
    </footer>
  );
}