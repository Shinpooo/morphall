import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-zinc-400",
  {
    variants: {
      tone: {
        neutral: "",
        accent: "border-rose-400/20 bg-rose-400/10 text-rose-200",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, tone, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { Badge, badgeVariants };
