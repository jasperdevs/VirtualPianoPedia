import { createContext } from "react";

export type ToastTone = "success" | "info" | "warning";

export type ToastInput = {
  title: string;
  detail?: string;
  tone?: ToastTone;
};

export const ToastContext = createContext<{ showToast: (toast: ToastInput) => void } | null>(null);
