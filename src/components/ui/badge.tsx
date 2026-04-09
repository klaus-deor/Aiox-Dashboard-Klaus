import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        accent: "bg-accent text-accent-foreground",
        warning: "bg-warning/15 text-warning border border-warning/20",
        muted: "bg-muted/60 text-muted-foreground",
        success: "bg-success/15 text-success",
        emerald: "bg-emerald/12 text-emerald border border-emerald/15",
        gold: "bg-gold/12 text-gold border border-gold/15",
        scoreHigh: "bg-score-high/15 text-score-high border border-score-high/20",
        scoreMid: "bg-score-mid/15 text-score-mid border border-score-mid/20",
        scoreLow: "bg-score-low/15 text-score-low border border-score-low/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) return <Badge variant="muted">--</Badge>;
  const variant =
    score >= 9 ? "scoreHigh" : score >= 7 ? "scoreMid" : "scoreLow";
  return <Badge variant={variant}>{score.toFixed(1)}</Badge>;
}
