"use server";

import { createSupabaseServer } from "@/lib/supabase-server";

function valorOuNulo(valor: FormDataEntryValue | null): string | null {
  if (typeof valor !== "string") return null;
  const v = valor.trim();
  return v === "" ? null : v;
}

export async function salvarPerfil(formData: FormData): Promise<{ error: string } | void> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Você precisa entrar para editar o perfil." };
  }

  const { error } = await supabase.from("perfis").upsert({
    id: user.id,
    nome: valorOuNulo(formData.get("nome")),
    sobrenome: valorOuNulo(formData.get("sobrenome")),
    data_nascimento: valorOuNulo(formData.get("data_nascimento")),
    cidade: valorOuNulo(formData.get("cidade")),
    estado: valorOuNulo(formData.get("estado")),
    atualizado_em: new Date().toISOString(),
  });

  if (error) {
    return { error: error.message };
  }
}

const TIPOS_FOTO_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp"]);
const TAMANHO_MAXIMO_FOTO = 4 * 1024 * 1024; // 4MB

export async function atualizarFoto(
  formData: FormData
): Promise<{ error: string } | { fotoUrl: string }> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Você precisa entrar para atualizar a foto." };
  }

  const arquivo = formData.get("foto");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { error: "Selecione uma imagem para enviar." };
  }

  if (!TIPOS_FOTO_PERMITIDOS.has(arquivo.type)) {
    return { error: "Formato de imagem não suportado. Envie um arquivo JPEG, PNG ou WEBP." };
  }

  if (arquivo.size > TAMANHO_MAXIMO_FOTO) {
    return { error: "A imagem deve ter no máximo 4MB." };
  }

  // Caminho fixo por usuário (sem variar por extensão): o upload com upsert
  // substitui a foto anterior no mesmo objeto, sem deixar arquivos órfãos.
  const caminho = `${user.id}/foto`;

  const { error: erroUpload } = await supabase.storage
    .from("avatars")
    .upload(caminho, arquivo, { upsert: true, contentType: arquivo.type });

  if (erroUpload) {
    return { error: erroUpload.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(caminho);

  // Adiciona um parâmetro de cache-busting: o caminho é sempre o mesmo, então
  // sem isso o navegador/CDN poderia continuar servindo a imagem antiga.
  const urlComVersao = `${publicUrl}?v=${Date.now()}`;

  const { error: erroPerfil } = await supabase.from("perfis").upsert({
    id: user.id,
    foto_url: urlComVersao,
    atualizado_em: new Date().toISOString(),
  });

  if (erroPerfil) {
    return { error: erroPerfil.message };
  }

  return { fotoUrl: urlComVersao };
}
