import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cliente: SupabaseClient | null = null;

// Cliente com service role: ignora RLS. Uso exclusivo de Server
// Components/Server Actions sob src/app/admin/ — nunca importar de um
// Client Component (o pacote "server-only" garante isso em build).
//
// Construção sob demanda (não no top-level do módulo): a página de login em
// /admin/revisao precisa carregar mesmo antes de SUPABASE_SERVICE_ROLE_KEY
// estar configurada — só falha quando alguém autenticado de fato tenta ler
// ou gravar eventos.
export function obterSupabaseAdmin(): SupabaseClient {
  if (cliente) return cliente;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias para operações administrativas."
    );
  }

  cliente = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return cliente;
}
