import type React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type FluidInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ReactNode;
};

export function FluidInput({ icon, className, ...props }: FluidInputProps) {
  return (
    <motion.label
      className="group relative flex h-11 min-w-0 max-w-full items-center gap-2 rounded-xl bg-background/55 px-3 ring-1 ring-border/70 transition-colors hover:bg-background focus-within:bg-background focus-within:ring-ring/45"
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 520, damping: 36 }}
    >
      {icon ? <span className="text-muted-foreground transition group-focus-within:text-foreground [&_svg]:size-4">{icon}</span> : null}
      <input className={cn("h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground", className)} {...props} />
    </motion.label>
  );
}
