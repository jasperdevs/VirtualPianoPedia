import { useCallback, useMemo, useState } from "react";
import type React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircleIcon, InfoIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { ToastContext, type ToastTone, type ToastInput } from "@/lib/toast-context";
import { cn } from "@/lib/utils";

type Toast = {
  id: number;
  title: string;
  detail?: string;
  tone: ToastTone;
};

const toneIcon = {
  success: CheckCircleIcon,
  info: InfoIcon,
  warning: WarningCircleIcon,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: ToastInput) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current.slice(-2), { id, tone: toast.tone ?? "success", title: toast.title, detail: toast.detail }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 2600);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-50 grid w-[min(360px,calc(100vw-2rem))] gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = toneIcon[toast.tone];

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -8, scale: 0.98, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, scale: 0.98, filter: "blur(4px)" }}
                transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                className="pointer-events-auto overflow-hidden rounded-2xl bg-card/95 p-3 text-card-foreground shadow-[0_24px_80px_rgba(0,0,0,0.22)] ring-1 ring-border/70 backdrop-blur"
              >
                <div className="flex gap-3">
                  <div
                    className={cn(
                      "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full",
                      toast.tone === "success" && "bg-emerald-500/12 text-emerald-500",
                      toast.tone === "info" && "bg-sky-500/12 text-sky-500",
                      toast.tone === "warning" && "bg-amber-500/12 text-amber-500",
                    )}
                  >
                    <Icon className="size-4" weight="fill" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-5">{toast.title}</p>
                    {toast.detail ? <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{toast.detail}</p> : null}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
