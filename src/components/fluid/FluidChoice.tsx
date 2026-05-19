import type React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function FluidChoice({
  children,
  active,
  onClick,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        "relative rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground outline-none transition-[background-color,color,font-weight] hover:bg-muted hover:text-foreground active:scale-[0.98]",
        active && "text-foreground",
        className,
      )}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 520, damping: 36 }}
    >
      {active ? <motion.span layoutId="fluid-choice-active" className="absolute inset-0 rounded-full bg-muted" transition={{ type: "spring", stiffness: 420, damping: 32 }} /> : null}
      <span className="relative">{children}</span>
    </motion.button>
  );
}
