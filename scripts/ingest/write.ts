import { supabaseAdmin } from "./lib/supabase-admin";
import { normalizarTexto } from "./lib/normalize";
import type { EventoExtraido } from "./lib/types";

const LIMIAR_CONFIANCA = 0.7;

// Datas obviamente implausíveis (evento "no passado" ou anos à frente) são um
// padrão comum de erro de extração via LLM — quando a página tem mais de uma
// data e o modelo pega a errada. Isso não conserta a extração, só impede que
// aconteça de novo o que rolou com o Anime Friends (data 2027 com confiança
// alta e publicado direto): manda pra revisão mesmo com confiança boa.
const JANELA_MESES_FUTURO = 18;

function dataEhPlausivel(dataIso: string): boolean {
  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) return false;

  const agora = new Date();
  const seteDiasAtras = new Date(agora);
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

  const limiteFuturo = new Date(agora);
  limiteFuturo.setMonth(limiteFuturo.getMonth() + JANELA_MESES_FUTURO);

  return data >= seteDiasAtras && data <= limiteFuturo;
}

export interface ItemParaEscrita {
  evento: EventoExtraido;
  fonte_url: string;
  fonte_nome: string;
}

export interface ResultadoEscrita {
  novos: number;
  atualizados: number;
  emRevisao: number;
  duplicadosIgnorados: number;
  erros: number;
}

type ResultadoItem =
  | { tipo: "duplicado" }
  | { tipo: "gravado"; novo: boolean; emRevisao: boolean };

async function encontrarDuplicataDeOutraFonte(
  evento: EventoExtraido,
  fonte_url: string
): Promise<string | null> {
  const { data: duplicatas, error } = await supabaseAdmin
    .from("eventos")
    .select("id, fonte_url")
    .ilike("nome", evento.nome)
    .eq("cidade_norm", normalizarTexto(evento.cidade))
    .eq("data_inicio", evento.data_inicio);

  if (error) throw error;

  const duplicata = duplicatas?.find((d) => d.fonte_url && d.fonte_url !== fonte_url);
  return duplicata?.fonte_url ?? null;
}

async function escreverUmEvento({ evento, fonte_url, fonte_nome }: ItemParaEscrita): Promise<ResultadoItem> {
  const fonteDuplicada = await encontrarDuplicataDeOutraFonte(evento, fonte_url);
  if (fonteDuplicada) {
    console.log(`[write] "${evento.nome}" já existe via outra fonte (${fonteDuplicada}) — ignorando ${fonte_url}`);
    return { tipo: "duplicado" };
  }

  const { data: existente, error: erroExistente } = await supabaseAdmin
    .from("eventos")
    .select("id")
    .eq("fonte_url", fonte_url)
    .maybeSingle();
  if (erroExistente) throw erroExistente;

  const dataSuspeita = !dataEhPlausivel(evento.data_inicio);
  if (dataSuspeita) {
    console.warn(
      `[write] "${evento.nome}" (${fonte_url}) tem data_inicio suspeita (${evento.data_inicio}) — mandando para revisão independente da confiança`
    );
  }

  const emRevisao = evento.confianca < LIMIAR_CONFIANCA || dataSuspeita;
  const payload = {
    ...evento,
    origem: "scraper",
    fonte_nome,
    fonte_url,
    status: emRevisao ? "pendente_revisao" : "publicado",
    atualizado_em: new Date().toISOString(),
  };

  // upsert com onConflict exige um índice único SEM predicado parcial batendo
  // exatamente com a coluna do conflito — o índice em fonte_url é parcial
  // (where fonte_url is not null), então insert/update explícitos aqui evitam
  // depender disso.
  const { error: erroEscrita } = existente
    ? await supabaseAdmin.from("eventos").update(payload).eq("id", existente.id)
    : await supabaseAdmin.from("eventos").insert(payload);
  if (erroEscrita) throw erroEscrita;

  return { tipo: "gravado", novo: !existente, emRevisao };
}

// Dedup em duas camadas:
// 1) fonte_url único (índice do banco) — checa existência antes de gravar,
//    resolve reprocessar a mesma página em execuções futuras (update em vez
//    de duplicar).
// 2) checagem fuzzy por nome + cidade + data — pega o mesmo evento real
//    quando descoberto por duas fontes diferentes (URLs diferentes).
// Confiança abaixo do limiar, ou data implausível, nunca publica direto: vai
// para pendente_revisao.
export async function escreverEventos(itens: ItemParaEscrita[]): Promise<ResultadoEscrita> {
  const resultado: ResultadoEscrita = {
    novos: 0,
    atualizados: 0,
    emRevisao: 0,
    duplicadosIgnorados: 0,
    erros: 0,
  };

  for (const item of itens) {
    try {
      const r = await escreverUmEvento(item);
      if (r.tipo === "duplicado") {
        resultado.duplicadosIgnorados++;
        continue;
      }
      if (r.novo) resultado.novos++;
      else resultado.atualizados++;
      if (r.emRevisao) resultado.emRevisao++;
    } catch (err) {
      console.error(`[write] falha ao gravar evento de ${item.fonte_url}:`, err);
      resultado.erros++;
    }
  }

  return resultado;
}
