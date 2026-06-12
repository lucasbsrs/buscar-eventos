"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import type { TipoEvento } from "@/types/evento";

export async function criarEvento(formData: FormData) {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autorizado" };

  const gratuito = formData.get("gratuito") === "true";
  const preco = formData.get("preco_entrada");

  const { data, error } = await supabase
    .from("eventos")
    .insert({
      nome: formData.get("nome") as string,
      descricao: formData.get("descricao") as string,
      tipo: formData.get("tipo") as TipoEvento,
      data_inicio: formData.get("data_inicio") as string,
      data_fim: formData.get("data_fim") as string,
      cidade: formData.get("cidade") as string,
      estado: formData.get("estado") as string,
      local: formData.get("local") as string,
      endereco: formData.get("endereco") as string,
      site_url: (formData.get("site_url") as string) || null,
      gratuito,
      preco_entrada: gratuito ? null : Number(preco) || null,
      criado_por: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  redirect(`/eventos/${data.id}`);
}
