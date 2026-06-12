"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIPOS_EVENTO, ESTADOS_BR, type TipoEvento } from "@/types/evento";

interface NovoEventoFormProps {
  action: (formData: FormData) => Promise<{ error: string } | void>;
}

export function NovoEventoForm({ action }: NovoEventoFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [gratuito, setGratuito] = useState(false);
  const [tipo, setTipo] = useState<TipoEvento | "">("");
  const [estado, setEstado] = useState("");

  async function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("tipo", tipo);
    formData.set("estado", estado);
    formData.set("gratuito", String(gratuito));
    const result = await action(formData);
    if (result?.error) setError(result.error);
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5 border rounded-xl p-6 bg-card">
      <Field label="Nome do evento">
        <Input name="nome" required placeholder="Ex: Anime Week São Paulo 2026" />
      </Field>

      <Field label="Descrição">
        <textarea
          name="descricao"
          required
          rows={3}
          placeholder="Descreva o evento..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </Field>

      <Field label="Tipo de evento">
        <Select value={tipo} onValueChange={(v) => setTipo((v ?? "") as TipoEvento)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(TIPOS_EVENTO) as [TipoEvento, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Data de início">
          <Input name="data_inicio" type="datetime-local" required />
        </Field>
        <Field label="Data de fim">
          <Input name="data_fim" type="datetime-local" required />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Estado">
          <Select value={estado} onValueChange={(v) => setEstado(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_BR.map((uf) => (
                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Cidade">
          <Input name="cidade" required placeholder="São Paulo" />
        </Field>
      </div>

      <Field label="Nome do local">
        <Input name="local" required placeholder="Ex: Expo Center Norte" />
      </Field>

      <Field label="Endereço">
        <Input name="endereco" required placeholder="Rua, número, bairro" />
      </Field>

      <Field label="Site oficial (opcional)">
        <Input name="site_url" type="url" placeholder="https://..." />
      </Field>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="gratuito"
          checked={gratuito}
          onChange={(e) => setGratuito(e.target.checked)}
          className="h-4 w-4 rounded border accent-primary"
        />
        <Label htmlFor="gratuito">Evento gratuito</Label>
      </div>

      {!gratuito && (
        <Field label="Preço de entrada (R$)">
          <Input name="preco_entrada" type="number" min="0" step="0.01" placeholder="0,00" />
        </Field>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full">
        Publicar evento
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
