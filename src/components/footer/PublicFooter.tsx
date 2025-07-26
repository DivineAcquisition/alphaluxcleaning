import { Heart, MapPin, Phone, Mail, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 border-t mt-auto">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>© {currentYear} Bay Area Cleaning Pros. All rights reserved.</p>
          <p>Powered by DivineAcquisition</p>
        </div>
      </div>
    </footer>
  );
}