import { supabase } from "@/lib/supabase";
import type { Evento, FiltrosEvento } from "@/types/evento";
import { ESTADOS_NOMES } from "@/types/evento";

function normalizar(str: string): string {
  return str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export async function buscarEventos(filtros: FiltrosEvento = {}): Promise<Evento[]> {
  let query = supabase
    .from("eventos")
    .select("*")
    .order("data_inicio", { ascending: true });

  if (filtros.localizacao) {
    const termo = filtros.localizacao.trim();
    const termoNorm = normalizar(termo);

    // Resolve nomes de estado sem acento para sigla (ex: "Sao Paulo" → "SP", "Minas" → "MG")
    const siglasMatching = Object.entries(ESTADOS_NOMES)
      .filter(([_, nome]) => normalizar(nome).includes(termoNorm))
      .map(([sigla]) => sigla);

    const conditions = [
      // cidade_norm é a coluna gerada com lower(unaccent(cidade)) no banco
      `cidade_norm.ilike.%${termoNorm}%`,
      `estado.ilike.%${termoNorm}%`,
      ...siglasMatching.map((sigla) => `estado.eq.${sigla}`),
    ];

    query = query.or(conditions.join(","));
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
    .single();

  if (error) return null;

  return data;
}
