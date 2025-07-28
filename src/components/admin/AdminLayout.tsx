
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
      <div className="min-h-screen flex w-full bg-background cyber-grid relative overflow-hidden">
        {/* Futuristic Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-accent/5 rounded-full blur-3xl animate-pulse" />
        
        <AdminSidebar />
        <SidebarInset className="flex-1 relative z-10">
          {/* Futuristic Header */}
          <header className="sticky top-0 z-40 flex h-24 shrink-0 items-center gap-6 glass-morphism border-b border-border/30 px-8">
            <div className="flex items-center gap-6 flex-1">
              <SidebarTrigger className="hover:bg-muted/50 rounded-xl p-3 transition-all duration-300 hover:neon-glow" />
              <div className="h-8 w-px bg-gradient-to-b from-primary to-accent" />
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight gradient-text text-glow">
                  {title}
                </h1>
                {description && (
                  <p className="text-muted-foreground font-medium mt-2">
                    {description}
                  </p>
                )}
              </div>
            </div>
            
            {/* Futuristic Status Indicators */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 glass-morphism px-4 py-2 rounded-lg">
                <div className="h-2 w-2 bg-success rounded-full animate-pulse neon-glow" />
                <span className="text-sm font-medium text-success">SYSTEM ONLINE</span>
              </div>
              <div className="h-6 w-px bg-border/50" />
              <div className="text-xs text-muted-foreground font-mono">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </header>

          {/* Enhanced Main Content */}
          <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto">
            <div className="relative">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
