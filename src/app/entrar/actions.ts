"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServer } from "@/lib/supabase-server";

async function origemAtual(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocolo = host.startsWith("localhost") ? "http" : "https";
  return `${protocolo}://${host}`;
}

function destinoSeguro(valor: FormDataEntryValue | null): string {
  // Só aceita caminho relativo começando com "/" (nunca "//") para evitar
  // redirecionar para um domínio externo a partir de um parâmetro da URL.
  if (typeof valor === "string" && valor.startsWith("/") && !valor.startsWith("//")) return valor;
  return "/";
}

export async function entrar(formData: FormData): Promise<{ error: string } | void> {
  const email = formData.get("email");
  const senha = formData.get("senha");
  const redirectPara = destinoSeguro(formData.get("redirect"));

  if (typeof email !== "string" || typeof senha !== "string") {
    return { error: "Informe e-mail e senha." };
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada." };
    }
    if (error.code === "invalid_credentials") {
      return { error: "E-mail ou senha incorretos." };
    }
    return { error: error.message };
  }

  redirect(redirectPara);
}

export async function entrarComGoogle(formData: FormData): Promise<{ error: string } | void> {
  const redirectPara = destinoSeguro(formData.get("redirect"));
  const origin = await origemAtual();

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectPara)}`,
    },
  });

  if (error || !data.url) {
    return { error: error?.message ?? "Não foi possível iniciar o login com Google." };
  }

  redirect(data.url);
}
