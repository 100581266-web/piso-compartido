"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Home, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", next);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    setLoading(false);

    if (error) {
      toast.error("No se ha podido enviar el enlace: " + error.message);
      return;
    }

    setSent(true);
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Home className="size-6" />
      </div>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Piso Compartido</CardTitle>
          <CardDescription>
            {sent
              ? "Revisa tu correo y pulsa el enlace para entrar."
              : "Escribe tu email y te mandamos un enlace para entrar, sin contraseña."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sent && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={loading || !email}>
                <Mail className="size-4" />
                {loading ? "Enviando..." : "Enviar enlace mágico"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
