import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AdminGridProps {
  children: ReactNode;
  columns?: "auto" | 1 | 2 | 3 | 4 | 5 | 6;
  gap?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function AdminGrid({ 
  children, 
  columns = "auto", 
  gap = "md",
  className 
}: AdminGridProps) {
  const columnClasses = {
    auto: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
  };

  const gapClasses = {
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8"
  };

  return (
    <div className={cn(
      "grid",
      columnClasses[columns],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}