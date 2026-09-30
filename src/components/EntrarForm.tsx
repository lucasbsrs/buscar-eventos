"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface EntrarFormProps {
  entrarAction: (formData: FormData) => Promise<{ error: string } | void>;
  entrarComGoogleAction: (formData: FormData) => Promise<{ error: string } | void>;
  redirectPara: string;
}

export function EntrarForm({ entrarAction, entrarComGoogleAction, redirectPara }: EntrarFormProps) {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await entrarAction(formData);
    if (result?.error) setError(result.error);
  }

  async function handleGoogle(formData: FormData) {
    setError(null);
    const result = await entrarComGoogleAction(formData);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={handleSubmit} className="flex flex-col gap-5 border rounded-xl p-6 bg-card">
        <input type="hidden" name="redirect" value={redirectPara} />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" required placeholder="voce@exemplo.com" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="senha">Senha</Label>
          <Input id="senha" name="senha" type="password" required placeholder="Sua senha" />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full">
          Entrar
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex-1 border-t" />
        ou
        <span className="flex-1 border-t" />
      </div>

      <form action={handleGoogle}>
        <input type="hidden" name="redirect" value={redirectPara} />
        <Button type="submit" variant="outline" className="w-full">
          Entrar com Google
        </Button>
      </form>
    </div>
  );
}
