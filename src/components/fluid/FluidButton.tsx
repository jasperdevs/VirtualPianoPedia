import type React from "react";
import { Slot } from "@radix-ui/react-slot";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

type FluidButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration"
> & {
  asChild?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "tertiary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "icon" | "icon-sm";
};

const variantClass = {
  primary: "bg-primary text-primary-foreground shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.08)] hover:bg-primary/92",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/85",
  tertiary: "bg-muted/65 text-foreground hover:bg-muted",
  ghost: "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
  outline: "border border-border/70 bg-background/55 text-foreground hover:bg-muted/65",
};

const sizeClass = {
  sm: "h-8 rounded-lg px-3 text-xs",
  md: "h-10 rounded-xl px-4 text-sm",
  lg: "h-11 rounded-xl px-5 text-sm",
  icon: "size-10 rounded-xl p-0",
  "icon-sm": "size-8 rounded-lg p-0",
};

export function FluidButton({
  asChild = false,
  loading = false,
  variant = "primary",
  size = "md",
  className,
  children,
  disabled,
  onMouseMove,
  onMouseLeave,
  style,
  ...props
}: FluidButtonProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 22 });
  const springY = useSpring(y, { stiffness: 260, damping: 22 });
  const translateX = useTransform(springX, (value) => value * 0.045);
  const translateY = useTransform(springY, (value) => value * 0.045);
  const Comp = asChild ? Slot : motion.button;

  function handleMouseMove(event: React.MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);
    onMouseMove?.(event);
  }

  function handleMouseLeave(event: React.MouseEvent<HTMLButtonElement>) {
    x.set(0);
    y.set(0);
    onMouseLeave?.(event);
  }

  const classes = cn(
    "group relative inline-flex max-w-full select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap font-medium outline-none transition-[background-color,color,border-color,font-weight,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-ring/45 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
    variantClass[variant],
    sizeClass[size],
    className,
  );

  if (asChild) {
    return (
      <Comp className={classes} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={style} {...props}>
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      className={classes}
      disabled={disabled || loading}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 520, damping: 34 }}
      {...props}
    >
      <motion.span style={{ x: translateX, y: translateY }} className="inline-flex items-center justify-center gap-2">
        {loading ? <span className="size-3 animate-spin rounded-full border border-current border-t-transparent" /> : null}
        {children}
      </motion.span>
    </Comp>
  );
}
