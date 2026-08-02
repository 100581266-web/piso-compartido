"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function InviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const link = `${window.location.origin}/join/${code}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Enlace de invitación copiado");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3">
      <span className="font-mono text-lg tracking-widest text-primary">{code}</span>
      <Button type="button" size="sm" variant="outline" className="ml-auto" onClick={copyLink}>
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Copiado" : "Copiar enlace"}
      </Button>
    </div>
  );
}
