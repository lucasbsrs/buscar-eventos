import type { User } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase-server";

export interface Perfil {
  id: string;
  nome: string | null;
  sobrenome: string | null;
  data_nascimento: string | null;
  cidade: string | null;
  estado: string | null;
  foto_url: string | null;
  atualizado_em: string;
}

export async function buscarPerfil(userId: string): Promise<Perfil | null> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("perfis")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return data;
}

function fotoGoogleDoUsuario(user: User): string | null {
  const ehGoogle =
    user.app_metadata?.provider === "google" ||
    user.identities?.some((identidade) => identidade.provider === "google");

  if (!ehGoogle) return null;

  const metadata = user.user_metadata as { avatar_url?: string; picture?: string } | undefined;
  return metadata?.avatar_url ?? metadata?.picture ?? null;
}

// Foto do Google nunca é gravada no banco: enquanto o usuário não envia uma
// foto própria (perfil.foto_url nulo), a foto atual da conta Google é usada
// como padrão de leitura; depois que ele envia uma, ela sempre ganha.
export function fotoExibida(perfil: Perfil | null, user: User): string | null {
  return perfil?.foto_url ?? fotoGoogleDoUsuario(user) ?? null;
}
