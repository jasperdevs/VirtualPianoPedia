import { useState } from "react";
import { CheckIcon, ClipboardTextIcon } from "@phosphor-icons/react";
import { FluidButton } from "@/components/fluid/FluidButton";

export function FluidCopy({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <FluidButton variant="outline" size="sm" onClick={copy}>
      {copied ? <CheckIcon /> : <ClipboardTextIcon />}
      {copied ? "Copied" : label}
    </FluidButton>
  );
}
