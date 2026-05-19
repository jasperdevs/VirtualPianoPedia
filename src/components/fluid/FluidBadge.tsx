import type React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const colorClass = {
  gray: "bg-muted text-muted-foreground hover:text-foreground",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  white: "bg-foreground text-background",
};

export function FluidBadge({
  children,
  color = "gray",
  className,
}: {
  children: React.ReactNode;
  color?: keyof typeof colorClass;
  className?: string;
}) {
  return (
    <motion.span
      className={cn("inline-flex h-6 select-none items-center rounded-full px-2.5 text-xs font-medium transition-[font-weight,color,background-color]", colorClass[color], className)}
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 520, damping: 36 }}
    >
      {children}
    </motion.span>
  );
}
