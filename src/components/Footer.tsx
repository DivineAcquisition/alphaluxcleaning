import { Copyright } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-background border-t border-border py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Copyright className="h-4 w-4" />
            <span>2025 All rights reserved Bay Area Cleaning Pros</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <a 
              href="https://bayareacleaningpros.com/privacy-policy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Privacy Policy
            </a>
            <a 
              href="https://bayareacleaningpros.com/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}