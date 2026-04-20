import { Phone, Mail, MapPin, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="section-alx-navy mt-auto">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid gap-10 lg:gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-alx-gold-light" />
              <span className="font-serif text-xl font-semibold text-alx-gold-light">
                AlphaLux Cleaning
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-alx-gold-pale/80">
              A higher standard of clean. Trusted, eco-friendly residential and
              commercial cleaning for homes and businesses across Long Island,
              New Jersey, Texas and California.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-alx-gold-light mb-4">
              Services
            </h3>
            <ul className="space-y-2 text-sm text-alx-gold-pale/80">
              <li>
                <Link
                  to="/book/zip"
                  className="hover:text-alx-gold-light transition-colors"
                >
                  Standard Cleaning
                </Link>
              </li>
              <li>
                <Link
                  to="/book/zip"
                  className="hover:text-alx-gold-light transition-colors"
                >
                  Deep Cleaning
                </Link>
              </li>
              <li>
                <Link
                  to="/book/zip"
                  className="hover:text-alx-gold-light transition-colors"
                >
                  Move-In / Move-Out
                </Link>
              </li>
              <li>
                <Link
                  to="/recurring-services"
                  className="hover:text-alx-gold-light transition-colors"
                >
                  Recurring Plans
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="hover:text-alx-gold-light transition-colors"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-alx-gold-light mb-4">
              Company
            </h3>
            <ul className="space-y-2 text-sm text-alx-gold-pale/80">
              <li>
                <Link
                  to="/landing"
                  className="hover:text-alx-gold-light transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/careers"
                  className="hover:text-alx-gold-light transition-colors"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  to="/referrals"
                  className="hover:text-alx-gold-light transition-colors"
                >
                  Referral Program
                </Link>
              </li>
              <li>
                <a
                  href="https://alphaluxcleaning.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-alx-gold-light transition-colors"
                >
                  Main Website
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-alx-gold-light mb-4">
              Contact
            </h3>
            <ul className="space-y-3 text-sm text-alx-gold-pale/80">
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-alx-gold-light mt-0.5 flex-shrink-0" />
                <a
                  href="tel:+18577544557"
                  className="hover:text-alx-gold-light transition-colors"
                >
                  +1 (857) 754-4557
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-alx-gold-light mt-0.5 flex-shrink-0" />
                <a
                  href="mailto:support@alphaluxcleaning.com"
                  className="hover:text-alx-gold-light transition-colors"
                >
                  support@alphaluxcleaning.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-alx-gold-light mt-0.5 flex-shrink-0" />
                <span>Serving NY, NJ, TX & CA</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-alx-gold/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-alx-gold-pale/60">
          <span>© {year} AlphaLux Cleaning. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <a
              href="https://alphaluxcleaning.com/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-alx-gold-light transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="https://alphaluxcleaning.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-alx-gold-light transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
