"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  criarSessao,
  encerrarSessao,
  estaAutenticado,
  senhaConfere,
} from "@/lib/admin-auth";
import { obterSupabaseAdmin } from "@/lib/supabase-admin";

async function exigirAutenticacao(): Promise<void> {
  if (!(await estaAutenticado())) {
    throw new Error("Não autenticado.");
  }
}

export async function autenticar(formData: FormData): Promise<void> {
  const senha = formData.get("senha");
  if (typeof senha === "string" && (await senhaConfere(senha))) {
    await criarSessao();
  }
  redirect("/admin/revisao");
}

export async function sair(): Promise<void> {
  await encerrarSessao();
  redirect("/admin/revisao");
}

export async function aprovarEvento(id: string): Promise<void> {
  await exigirAutenticacao();

  const { error } = await obterSupabaseAdmin()
    .from("eventos")
    .update({ status: "publicado", atualizado_em: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/revisao");
}

export async function rejeitarEvento(id: string): Promise<void> {
  await exigirAutenticacao();

  const { error } = await obterSupabaseAdmin()
    .from("eventos")
    .update({ status: "rejeitado", atualizado_em: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/revisao");
}
