import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AdminSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headerActions?: ReactNode;
}

export function AdminSection({ 
  title, 
  description, 
  children, 
  className,
  headerActions
}: AdminSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || description || headerActions) && (
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            {title && (
              <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-muted-foreground/80 max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {headerActions}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}