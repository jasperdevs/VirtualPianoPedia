import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function FluidSwitch({ enabled, onChange, label, hint }: { enabled: boolean; onChange: (enabled: boolean) => void; label: string; hint?: string }) {
  return (
    <motion.button
      type="button"
      onClick={() => onChange(!enabled)}
      aria-pressed={enabled}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 520, damping: 36 }}
      className={cn(
        "group flex w-full min-w-0 items-center justify-between gap-4 rounded-xl bg-background/55 p-2 pl-3 text-left text-sm outline-none ring-1 ring-transparent transition hover:bg-background/80 focus-visible:ring-ring/45",
        enabled && "bg-background/85",
      )}
    >
      <span className="min-w-0">
        <span className={cn("block font-medium transition-[font-weight,color]", enabled ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
      <span className={cn("relative h-7 w-12 shrink-0 rounded-full p-1 transition-colors", enabled ? "bg-foreground" : "bg-muted/80 group-hover:bg-muted")}>
        <motion.span
          layout
          className={cn("absolute left-1 top-1 size-5 rounded-full shadow-sm", enabled ? "bg-background" : "bg-muted-foreground/55")}
          animate={{ x: enabled ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 520, damping: 34 }}
        />
      </span>
    </motion.button>
  );
}
