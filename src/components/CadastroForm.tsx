"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface CadastroFormProps {
  action: (formData: FormData) => Promise<{ error: string } | { mensagem: string } | void>;
}

export function CadastroForm({ action }: CadastroFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setMensagem(null);
    const result = await action(formData);
    if (result && "error" in result) setError(result.error);
    if (result && "mensagem" in result) setMensagem(result.mensagem);
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5 border rounded-xl p-6 bg-card">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required placeholder="voce@exemplo.com" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="senha">Senha</Label>
        <Input id="senha" name="senha" type="password" required minLength={8} placeholder="Mínimo de 8 caracteres" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {mensagem && <p className="text-sm text-emerald-600">{mensagem}</p>}

      <Button type="submit" className="w-full">
        Criar conta
      </Button>
    </form>
  );
}
