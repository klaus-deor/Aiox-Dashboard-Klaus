import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-24 text-center",
        className
      )}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald/8 border border-emerald/10 mb-5">
        <Icon className="size-8 text-emerald/40" />
      </div>
      <h3 className="text-base font-medium text-foreground/80 mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground/60 max-w-xs leading-relaxed">
        {description}
      </p>
    </div>
  );
}
