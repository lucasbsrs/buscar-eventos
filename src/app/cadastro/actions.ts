"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase-server";

const CadastroSchema = z.object({
  email: z.email(),
  senha: z.string().min(8),
});

export async function cadastrar(
  formData: FormData
): Promise<{ error: string } | { mensagem: string } | void> {
  const validado = CadastroSchema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });

  if (!validado.success) {
    return { error: "Informe um e-mail válido e uma senha com pelo menos 8 caracteres." };
  }

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email: validado.data.email,
    password: validado.data.senha,
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return { mensagem: "Conta criada! Verifique seu e-mail para confirmar antes de entrar." };
  }

  redirect("/");
}
