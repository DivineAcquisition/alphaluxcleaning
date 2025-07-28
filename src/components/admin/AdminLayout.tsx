
import { ReactNode } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-muted/20 to-background">
        <AdminSidebar />
        <SidebarInset className="flex-1">
          {/* Modern Header */}
          <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-4 border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 px-6">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger className="hover:bg-muted/50 rounded-lg p-2 transition-colors" />
              <div className="h-6 w-px bg-border/60" />
              <div className="flex-1">
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {title}
                </h1>
                {description && (
                  <p className="text-sm text-muted-foreground font-medium mt-1">
                    {description}
                  </p>
                )}
              </div>
            </div>
            
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-success rounded-full animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">Live</span>
            </div>
          </header>

          {/* Enhanced Main Content */}
          <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
