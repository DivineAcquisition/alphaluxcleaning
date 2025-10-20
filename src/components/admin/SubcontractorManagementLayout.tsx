import { ReactNode } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SubcontractorManagementSidebar } from "./SubcontractorManagementSidebar";

interface SubcontractorManagementLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function SubcontractorManagementLayout({ children, title, description }: SubcontractorManagementLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-secondary/20">
        <SubcontractorManagementSidebar />
        <SidebarInset className="flex-1 overflow-hidden ml-0">
          {/* Enhanced Header */}
          <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-3 border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm">
            <div className="flex items-center gap-3 px-6 w-full">
              <SidebarTrigger className="hover:bg-primary/10 rounded-lg transition-all duration-200 p-2" />
              <div className="h-6 w-px bg-border/60" />
              <div className="flex-1">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">{title}</h1>
                {description && (
                  <p className="text-sm text-muted-foreground/80 font-medium">{description}</p>
                )}
              </div>
            </div>
          </header>

          {/* Enhanced Main Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-6 space-y-6 max-w-7xl">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}