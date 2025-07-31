import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  variant?: "default" | "metric" | "stat" | "action";
  icon?: ReactNode;
}

export function AdminCard({ 
  title, 
  description, 
  children, 
  className,
  variant = "default",
  icon 
}: AdminCardProps) {
  const variants = {
    default: "bg-card/60 border-border/40 shadow-lg hover:shadow-xl backdrop-blur-sm",
    metric: "bg-gradient-to-br from-card to-card/80 border-border/40 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300",
    stat: "bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 shadow-md hover:shadow-lg",
    action: "bg-card/40 border-border/60 shadow-md hover:shadow-lg hover:border-primary/40 transition-all duration-200"
  };

  return (
    <Card className={cn(
      "transition-all duration-300 backdrop-blur-sm",
      variants[variant],
      className
    )}>
      <CardHeader className={cn(
        "pb-3",
        variant === "metric" && "pb-2"
      )}>
        <div className="flex items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className={cn(
              "font-semibold tracking-tight",
              variant === "metric" ? "text-sm text-muted-foreground font-medium" : "text-lg"
            )}>
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-muted-foreground/80">
                {description}
              </CardDescription>
            )}
          </div>
          {icon && (
            <div className={cn(
              "flex-shrink-0",
              variant === "metric" ? "text-muted-foreground/60" : "text-primary"
            )}>
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn(
        variant === "metric" && "pt-0"
      )}>
        {children}
      </CardContent>
    </Card>
  );
}