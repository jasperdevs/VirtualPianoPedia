import type React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type FluidTextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration"
>;

export function FluidTextarea({ className, ...props }: FluidTextareaProps) {
  return (
    <motion.textarea
      className={cn(
        "flex min-h-24 w-full rounded-2xl bg-background/70 px-3 py-2 text-sm ring-1 ring-border/60 transition-colors placeholder:text-muted-foreground hover:bg-background focus-visible:bg-background focus-visible:outline-none focus-visible:ring-ring/45 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      whileFocus={{ y: -1 }}
      transition={{ type: "spring", stiffness: 520, damping: 36 }}
      {...props}
    />
  );
}
