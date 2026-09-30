import { supabase } from "@/lib/supabase";
import type { Evento, FiltrosEvento, LocalizacaoSugestao } from "@/types/evento";

export async function buscarEventos(filtros: FiltrosEvento = {}): Promise<Evento[]> {
  let query = supabase
    .from("eventos")
    .select("*")
    .eq("status", "publicado")
    .order("data_inicio", { ascending: true });

  if (filtros.cidade && filtros.estado) {
    // Nomes de cidade se repetem entre estados, então cidade sempre vem junto do estado
    query = query.eq("cidade", filtros.cidade).eq("estado", filtros.estado);
  } else if (filtros.estado) {
    query = query.eq("estado", filtros.estado);
  }

  if (filtros.tipo) {
    query = query.eq("tipo", filtros.tipo);
  }

  if (filtros.nome) {
    query = query.ilike("nome", `%${filtros.nome}%`);
  }

  // Filtra eventos cuja data de início cai dentro do período selecionado
  if (filtros.data_inicio) {
    query = query.gte("data_inicio", filtros.data_inicio);
  }

  if (filtros.data_fim) {
    // Soma 1 dia para incluir o dia final inteiro, sem ambiguidade de timezone
    const aposFim = new Date(filtros.data_fim + "T00:00:00Z");
    aposFim.setUTCDate(aposFim.getUTCDate() + 1);
    const aposFimStr = aposFim.toISOString().split("T")[0];

    query = query.lt("data_inicio", aposFimStr);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function listarLocalizacoesDisponiveis(): Promise<LocalizacaoSugestao[]> {
  const { data, error } = await supabase
    .from("eventos")
    .select("cidade, estado")
    .eq("status", "publicado");

  if (error) throw new Error(error.message);

  const estados = new Set<string>();
  const cidades = new Map<string, { cidade: string; estado: string }>();

  for (const { cidade, estado } of data ?? []) {
    estados.add(estado);
    cidades.set(`${cidade}|${estado}`, { cidade, estado });
  }

  const sugestoesEstados: LocalizacaoSugestao[] = Array.from(estados)
    .sort()
    .map((estado) => ({ tipo: "estado", estado, label: estado }));

  const sugestoesCidades: LocalizacaoSugestao[] = Array.from(cidades.values())
    .sort((a, b) => a.cidade.localeCompare(b.cidade))
    .map(({ cidade, estado }) => ({
      tipo: "cidade",
      cidade,
      estado,
      label: `${cidade}, ${estado}`,
    }));

  return [...sugestoesEstados, ...sugestoesCidades];
}

export async function buscarEventosPorUsuario(userId: string): Promise<Evento[]> {
  const { data, error } = await supabase
    .from("eventos")
    .select("*")
    .eq("criado_por", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function buscarEventoPorId(id: string): Promise<Evento | null> {
  const { data, error } = await supabase
    .from("eventos")
    .select("*")
    .eq("id", id)
    .eq("status", "publicado")
    .single();

  if (error) return null;

  return data;
}
