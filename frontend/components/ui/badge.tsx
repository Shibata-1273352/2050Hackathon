import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em]",
  {
    variants: {
      tone: {
        official:
          "text-[var(--color-source-official)] border-[var(--color-source-official)]/40 bg-[var(--color-source-official)]/10",
        open: "text-[var(--color-source-open)] border-[var(--color-source-open)]/40 bg-[var(--color-source-open)]/10",
        hypothesis:
          "text-[var(--color-source-hypothesis)] border-[var(--color-source-hypothesis)]/40 bg-[var(--color-source-hypothesis)]/10",
        claim:
          "text-[var(--color-source-claim)] border-[var(--color-source-claim)]/40 bg-[var(--color-source-claim)]/10",
        muted:
          "text-[var(--color-fg-muted)] border-[var(--color-line)] bg-transparent",
      },
    },
    defaultVariants: {
      tone: "muted",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { badgeVariants };
