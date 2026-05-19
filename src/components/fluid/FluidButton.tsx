import type React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Button, type ButtonProps } from "@/components/ui/button";

export function FluidButton({ onMouseMove, onMouseLeave, style, ...props }: ButtonProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 22 });
  const springY = useSpring(y, { stiffness: 260, damping: 22 });
  const translateX = useTransform(springX, (value) => value * 0.08);
  const translateY = useTransform(springY, (value) => value * 0.08);

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

  return (
    <Button asChild={false} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={style} {...props}>
      <motion.span style={{ x: translateX, y: translateY }} className="inline-flex items-center justify-center gap-2">
        {props.children}
      </motion.span>
    </Button>
  );
}
