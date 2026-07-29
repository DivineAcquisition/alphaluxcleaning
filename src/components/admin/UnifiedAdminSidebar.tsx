// Admin sidebar — one accent, one voice.
//
// The previous version assigned each nav group its own colour ramp
// (primary / purple / blue / gray gradients). Against a navy-and-off-white
// brand that read as four unrelated products stacked in one column, and
// the gradients fought every card on the page next to them.
//
// This is a single flat "Workspace" list on a white rail: neutral slate
// for resting state, AlphaLux navy for the active row only. Colour now
// means "you are here" instead of "this link belongs to group three".

import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarDays,
  CalendarPlus,
  LogOut,
  Activity,
  Zap,
  Ticket,
  TrendingUp,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AdminNavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  description: string;
}

/**
 * Every entry points at a route registered in App.tsx.
 *
 * Email templates/logs/events, Housecall Pro settings and sync logs,
 * admin users, the booking monitor, database watcher and booking tester
 * were removed from the rail. Their routes still resolve so existing
 * deep links and bookmarks keep working — they are simply no longer
 * everyday navigation.
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, description: "Live overview" },
  { label: "Booking Activity", path: "/admin/activity", icon: Activity, description: "Internal + online rails" },
  { label: "Bookings", path: "/admin/bookings", icon: CalendarDays, description: "All jobs & revenue" },
  { label: "Internal Booking", path: "/admin/internal-booking", icon: CalendarPlus, description: "Book over the phone" },
  { label: "Customers", path: "/admin/customers", icon: Users, description: "CRM & lifecycle stage" },
  { label: "Leads", path: "/admin/leads", icon: UserPlus, description: "Speed-to-lead & funnel" },
  { label: "Lifecycle Engine", path: "/admin/lifecycle", icon: Zap, description: "Cadence, offers, campaigns" },
  { label: "Promo Codes", path: "/admin/promos", icon: Ticket, description: "Discounts & rewards" },
  { label: "Conversion", path: "/admin/conversion", icon: TrendingUp, description: "Funnel analytics" },
];

/** Active when the path matches exactly or is a parent segment of it. */
export function isNavActive(currentPath: string, itemPath: string): boolean {
  if (itemPath === "/admin") return currentPath === "/admin";
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}

export function AdminSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
      <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-bold">
        Workspace
      </p>
      {ADMIN_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isNavActive(location.pathname, item.path);
        return (
          <button
            key={item.path}
            onClick={() => {
              navigate(item.path);
              onNavigate?.();
            }}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
              active
                ? "bg-primary/[0.07] font-semibold text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {active && (
              <span
                aria-hidden
                className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-primary"
              />
            )}
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/15 group-hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block leading-tight tracking-tight">{item.label}</span>
              <span
                className={cn(
                  "block truncate text-[11px] leading-tight",
                  active ? "text-primary/70" : "text-muted-foreground/70",
                )}
              >
                {item.description}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export function AdminSidebarBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 px-5 py-5",
        !compact && "border-b border-border",
        compact && "py-0",
      )}
    >
      <img
        src="/brand/alphalux-mark.png"
        alt="AlphaLux Clean"
        className="h-8 w-8 rounded-lg object-cover"
        width={32}
        height={32}
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold leading-tight tracking-tight text-foreground">
          AlphaLux Clean
        </p>
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
          Admin
        </span>
      </div>
    </div>
  );
}

export function AdminSidebarFooter({ email }: { email?: string | null }) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // The app has no /auth route — the admin entry point is /admin-login.
    navigate("/admin-login", { replace: true });
  };

  return (
    <div className="space-y-2 border-t border-border p-3">
      <div className="rounded-lg bg-muted/60 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Signed in
        </p>
        <p className="truncate text-sm font-medium text-foreground">{email || "—"}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  );
}
