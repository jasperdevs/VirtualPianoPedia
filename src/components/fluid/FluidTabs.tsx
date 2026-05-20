import { useId, useState } from "react";
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
  const [hovered, setHovered] = useState<T | null>(null);
  const layoutId = useId();

  return (
    <div className="inline-flex rounded-full bg-muted/80 p-1">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          onMouseEnter={() => setHovered(item)}
          onMouseLeave={() => setHovered(null)}
          className={cn("relative rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground outline-none transition-[color,font-weight] active:scale-[0.98]", value === item && "text-foreground")}
        >
          {hovered === item && value !== item ? (
            <motion.span layoutId={`fluid-tabs-hover-${layoutId}`} className="absolute inset-0 rounded-full bg-background/35" transition={{ type: "spring", stiffness: 520, damping: 36 }} />
          ) : null}
          {value === item ? <motion.span initial={false} layoutId={`fluid-tabs-active-${layoutId}`} className="absolute inset-0 rounded-full bg-background shadow-sm" transition={{ type: "spring", stiffness: 420, damping: 32 }} /> : null}
          <span className="relative">{item}</span>
        </button>
      ))}
    </div>
  );
}
