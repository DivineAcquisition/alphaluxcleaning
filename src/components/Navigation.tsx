import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Phone,
  Mail,
  Menu,
  HelpCircle,
  DollarSign,
  Home,
  Briefcase,
  Calendar,
  Sparkles,
} from "lucide-react";
import {
  NEW_CUSTOMER_PROMO_CODE,
  NEW_CUSTOMER_PROMO_PERCENT,
} from "@/lib/promo";

const logo = "/brand/alphalux-logo.png";

interface NavigationProps {
  minimal?: boolean;
}

/**
 * Top-of-page sticky promo bar. Mirrors the "New Customer Offer"
 * strip on alphaluxcleaning.com and keeps the ALC2026 promo code
 * visible at all times.
 */
function PromoBar() {
  return (
    <div className="bg-alx-promo text-alx-gold-pale text-xs sm:text-sm border-b border-alx-gold/20">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 py-2 flex items-center justify-center gap-3 flex-wrap text-center">
        <Sparkles className="h-4 w-4 text-alx-gold-light hidden sm:inline-block" />
        <span className="font-medium">
          New customers save{" "}
          <span className="text-alx-gold-light font-bold">
            {NEW_CUSTOMER_PROMO_PERCENT}%
          </span>{" "}
          — use code{" "}
          <span className="font-bold tracking-[0.14em] text-alx-gold-light">
            {NEW_CUSTOMER_PROMO_CODE}
          </span>
        </span>
        <Link
          to={`/book/zip?promo=${NEW_CUSTOMER_PROMO_CODE}`}
          className="inline-flex items-center gap-1 rounded-full border border-alx-gold/50 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-alx-gold-light hover:bg-alx-gold/10 transition"
        >
          Claim Offer
        </Link>
      </div>
    </div>
  );
}

export function Navigation({ minimal = false }: NavigationProps) {
  const handleTroubleBooking = () => {
    window.open(
      "https://book.housecallpro.com/book/AlphauLux-Clean/caa37e7c0f5840c688df5b158fa41ddb?v2=true",
      "_blank",
    );
  };

  return (
    <div className="sticky top-0 z-50 w-full">
      {!minimal && <PromoBar />}
      <nav className="w-full border-b border-alx-gold/15 bg-alx-black-ink/95 backdrop-blur supports-[backdrop-filter]:bg-alx-black-ink/85 text-alx-gold-pale shadow-soft">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo/Brand */}
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src={logo}
                alt="AlphaLux Clean"
                width="180"
                height="60"
                className="h-9 md:h-11 w-auto object-contain drop-shadow-[0_0_18px_rgba(15,119,204,0.30)] transition group-hover:drop-shadow-[0_0_24px_rgba(61,160,235,0.45)]"
              />
            </Link>

            {/* Right Section - Hidden in minimal mode */}
            {!minimal && (
              <div className="flex items-center gap-1 md:gap-2">
                <Link to="/landing" className="hidden md:block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-alx-gold-pale hover:text-alx-gold-light hover:bg-alx-gold/10"
                  >
                    <Home className="h-4 w-4" />
                    Home
                  </Button>
                </Link>

                <Link to="/pricing" className="hidden md:block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-alx-gold-pale hover:text-alx-gold-light hover:bg-alx-gold/10"
                  >
                    <DollarSign className="h-4 w-4" />
                    Pricing
                  </Button>
                </Link>

                <Link to="/careers" className="hidden md:block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-alx-gold-pale hover:text-alx-gold-light hover:bg-alx-gold/10"
                  >
                    <Briefcase className="h-4 w-4" />
                    Careers
                  </Button>
                </Link>

                {/* Book Now CTA — mirrors the Book Online button on alphaluxcleaning.com */}
                <div className="hidden md:flex">
                  <Button
                    size="sm"
                    className="btn-alx-gold rounded-full px-5 font-semibold uppercase tracking-wider border-0 gap-2"
                    asChild
                  >
                    <Link to={`/book/zip?promo=${NEW_CUSTOMER_PROMO_CODE}`}>
                      <Calendar className="h-4 w-4" />
                      Book Online
                    </Link>
                  </Button>
                </div>

                <div className="hidden lg:flex">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 btn-alx-outline-gold rounded-full"
                    onClick={handleTroubleBooking}
                  >
                    <HelpCircle className="h-4 w-4" />
                    Need Help?
                  </Button>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hidden md:flex items-center gap-2 text-alx-gold-pale hover:text-alx-gold-light hover:bg-alx-gold/10"
                    >
                      <Phone className="h-4 w-4" />
                      Contact
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-alx-black-ink text-alx-gold-pale border border-alx-gold/20 shadow-clean z-[100]"
                  >
                    <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-alx-gold border-b border-alx-gold/20">
                      Get in touch
                    </div>
                    <DropdownMenuItem
                      className="flex items-center gap-3 py-2 cursor-pointer focus:bg-alx-gold/10 focus:text-alx-gold-light"
                      onClick={() => window.open("tel:+18577544557", "_self")}
                    >
                      <Phone className="h-4 w-4" />
                      +1 857-754-4557
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-3 py-2 cursor-pointer focus:bg-alx-gold/10 focus:text-alx-gold-light"
                      onClick={() =>
                        window.open(
                          "mailto:support@alphaluxcleaning.com",
                          "_self",
                        )
                      }
                    >
                      <Mail className="h-4 w-4" />
                      Email Support
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile Menu */}
                <div className="md:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-alx-gold-pale hover:text-alx-gold-light hover:bg-alx-gold/10"
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-64 bg-alx-black-ink text-alx-gold-pale border border-alx-gold/20 shadow-clean z-[100]"
                    >
                      <DropdownMenuItem asChild>
                        <Link
                          to={`/book/zip?promo=${NEW_CUSTOMER_PROMO_CODE}`}
                          className="flex items-center gap-3 py-3 cursor-pointer focus:bg-alx-gold/10 focus:text-alx-gold-light"
                        >
                          <Calendar className="h-4 w-4" />
                          Book Online
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          to="/landing"
                          className="flex items-center gap-3 py-3 cursor-pointer focus:bg-alx-gold/10 focus:text-alx-gold-light"
                        >
                          <Home className="h-4 w-4" />
                          Home
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          to="/pricing"
                          className="flex items-center gap-3 py-3 cursor-pointer focus:bg-alx-gold/10 focus:text-alx-gold-light"
                        >
                          <DollarSign className="h-4 w-4" />
                          View Pricing
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          to="/careers"
                          className="flex items-center gap-3 py-3 cursor-pointer focus:bg-alx-gold/10 focus:text-alx-gold-light"
                        >
                          <Briefcase className="h-4 w-4" />
                          We're Hiring
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-3 py-3 cursor-pointer focus:bg-alx-gold/10 focus:text-alx-gold-light"
                        onClick={handleTroubleBooking}
                      >
                        <HelpCircle className="h-4 w-4" />
                        Having Trouble Booking?
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="bg-alx-gold/20" />

                      <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-alx-gold border-b border-alx-gold/20">
                        Contact Us
                      </div>
                      <DropdownMenuItem
                        className="flex items-center gap-3 py-2 cursor-pointer focus:bg-alx-gold/10 focus:text-alx-gold-light"
                        onClick={() =>
                          window.open("tel:+18577544557", "_self")
                        }
                      >
                        <Phone className="h-4 w-4" />
                        +1 857-754-4557
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-3 py-2 cursor-pointer focus:bg-alx-gold/10 focus:text-alx-gold-light"
                        onClick={() =>
                          window.open(
                            "mailto:support@alphaluxcleaning.com",
                            "_self",
                          )
                        }
                      >
                        <Mail className="h-4 w-4" />
                        Email Support
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
