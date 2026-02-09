import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  tooltip?: string;
  className?: string;
}

export function MetricCard({ label, value, subValue, icon, trend, tooltip, className }: MetricCardProps) {
  return (
    <div className={cn(
      "p-5 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-200",
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span className="text-sm font-medium">{label}</span>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3.5 h-3.5 hover:text-foreground transition-colors" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {icon && <div className="text-primary/80">{icon}</div>}
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-display font-bold tracking-tight text-foreground">
          {value}
        </span>
        {subValue && (
          <span className={cn(
            "text-xs font-medium px-1.5 py-0.5 rounded-full",
            trend === "up" ? "bg-accent/10 text-accent" : 
            trend === "down" ? "bg-destructive/10 text-destructive" :
            "text-muted-foreground bg-secondary"
          )}>
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
}
