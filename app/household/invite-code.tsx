"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { regenerateInviteCode } from "@/app/actions/household";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function InviteCode({
  code: initialCode,
  householdId,
  isAdmin,
}: {
  code: string;
  householdId: string;
  isAdmin: boolean;
}) {
  const [code, setCode] = useState(initialCode);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  async function copyLink() {
    const link = `${window.location.origin}/join/${code}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Enlace de invitación copiado");
    setTimeout(() => setCopied(false), 2000);
  }

  async function regenerate() {
    if (!confirm("¿Generar un código nuevo? El anterior dejará de funcionar.")) return;
    setRegenerating(true);
    const formData = new FormData();
    formData.set("household_id", householdId);
    const result = await regenerateInviteCode(undefined, formData);
    setRegenerating(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    if (result?.code) {
      setCode(result.code);
      toast.success("Código regenerado");
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3">
      <span className="font-mono text-lg tracking-widest text-primary">{code}</span>
      <div className="ml-auto flex gap-2">
        {isAdmin && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={regenerate}
            disabled={regenerating}
            aria-label="Regenerar código"
          >
            <RefreshCw className="size-4" />
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" onClick={copyLink}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copiado" : "Copiar enlace"}
        </Button>
      </div>
    </div>
  );
}
