import type React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function FluidPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      className={cn("rounded-2xl bg-muted/45 ring-1 ring-border/45 transition-colors hover:bg-muted/55", className)}
      initial={false}
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 360, damping: 34 }}
    >
      {children}
    </motion.section>
  );
}
