import { useState } from "react";
import { CheckIcon, ClipboardTextIcon } from "@phosphor-icons/react";
import { FluidButton } from "@/components/fluid/FluidButton";
import { useToast } from "@/lib/use-toast";

export function FluidCopy({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const showToast = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      showToast({ title: "Copied", detail: "Ready to paste" });
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      showToast({ title: "Copy failed", detail: "Clipboard permission was blocked", tone: "warning" });
    }
  }

  return (
    <FluidButton variant="outline" size="sm" onClick={copy}>
      {copied ? <CheckIcon /> : <ClipboardTextIcon />}
      {copied ? "Copied" : label}
    </FluidButton>
  );
}
