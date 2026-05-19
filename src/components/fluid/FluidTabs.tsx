import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function FluidTabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-muted p-1">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={cn("relative rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition active:scale-[0.98]", value === item && "text-foreground")}
        >
          {value === item ? <motion.span layoutId="fluid-tabs-active" className="absolute inset-0 rounded-full bg-background shadow-sm" transition={{ type: "spring", stiffness: 420, damping: 32 }} /> : null}
          <span className="relative">{item}</span>
        </button>
      ))}
    </div>
  );
}
