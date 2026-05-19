import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function FluidSwitch({ enabled, onChange, label }: { enabled: boolean; onChange: (enabled: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="flex items-center justify-between rounded-xl bg-background px-3 py-2 text-sm transition active:scale-[0.98]"
    >
      {label}
      <span className={cn("relative h-5 w-9 rounded-full transition-colors", enabled ? "bg-foreground" : "bg-muted")}>
        <motion.span
          layout
          className="absolute top-0.5 size-4 rounded-full bg-background"
          animate={{ x: enabled ? 18 : 2 }}
          transition={{ type: "spring", stiffness: 520, damping: 34 }}
        />
      </span>
    </button>
  );
}
