// Admin shell — fixed rail, sticky topbar, scrolling content.
//
// Replaces the collapsible shadcn sidebar shell. That version relied on
// gradient headers and per-group colour ramps, and its topbar carried a
// "Preview Customer Portal" button pointing at portal.alphaluxclean.com,
// a host this deployment does not serve.
//
// Layout: 256px white rail on desktop, slide-over on mobile, 56px sticky
// topbar showing the active page, and a max-width content column.

import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  ADMIN_NAV_ITEMS,
  AdminSidebarBrand,
  AdminSidebarFooter,
  AdminSidebarNav,
  isNavActive,
} from "./UnifiedAdminSidebar";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setEmail(data.user?.email ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Never leave the slide-over open across a navigation.
  useEffect(() => setMobileOpen(false), [location.pathname]);

  const active = ADMIN_NAV_ITEMS.find((i) => isNavActive(location.pathname, i.path));

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <AdminSidebarBrand />
        <AdminSidebarNav />
        <AdminSidebarFooter email={email} />
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card transition-transform lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <AdminSidebarBrand compact />
          <Button variant="ghost" size="sm" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <AdminSidebarNav onNavigate={() => setMobileOpen(false)} />
        <AdminSidebarFooter email={email} />
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex min-w-0 items-center gap-2">
            {active && (
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <active.icon className="h-4 w-4" />
              </span>
            )}
            <h1 className="truncate text-sm font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {description && (
              <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                · {description}
              </span>
            )}
          </div>
          <div className="ml-auto hidden max-w-[220px] truncate text-xs text-muted-foreground md:block">
            {email}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-7xl space-y-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
