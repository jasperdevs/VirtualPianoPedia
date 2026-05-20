import { toast } from "sonner";

export type ToastTone = "success" | "info" | "warning";

export type ToastInput = {
  title: string;
  detail?: string;
  tone?: ToastTone;
};

export function useToast() {
  return ({ title, detail, tone = "success" }: ToastInput) => {
    if (tone === "warning") {
      toast.warning(title, { description: detail });
      return;
    }

    if (tone === "info") {
      toast.info(title, { description: detail });
      return;
    }

    toast.success(title, { description: detail });
  };
}
