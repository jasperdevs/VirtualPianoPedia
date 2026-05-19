import type React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function FluidPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      className={cn("min-w-0 max-w-full rounded-2xl bg-muted/35 ring-1 ring-border/60", className)}
      initial={false}
      transition={{ type: "spring", stiffness: 360, damping: 34 }}
    >
      {children}
    </motion.section>
  );
}
