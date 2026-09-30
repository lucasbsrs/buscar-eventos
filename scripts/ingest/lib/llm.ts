import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";
import { ufDoEstado } from "./estado";
import { TIPOS_EVENTO, type TipoEvento } from "./types";

const MODELO = "claude-haiku-4-5-20251001";
const MAX_CARACTERES_PAGINA = 12000;

let client: Anthropic | null = null;
function obterClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

function limparHtml(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, nav, footer, header, svg, noscript, iframe").remove();
  const texto = $("body").text().replace(/\s+/g, " ").trim();
  return texto.slice(0, MAX_CARACTERES_PAGINA);
}

const FERRAMENTA_EXTRACAO = {
  name: "registrar_evento",
  description:
    "Registra os dados estruturados de um evento geek/otaku/games extraídos do texto de uma página.",
  input_schema: {
    type: "object" as const,
    properties: {
      encontrado: {
        type: "boolean",
        description:
          "true se o texto descreve claramente um evento real com pelo menos data de início e local; false caso contrário (ex: página institucional, erro, sem evento específico).",
      },
      nome: { type: "string" },
      descricao: { type: "string", description: "1-3 frases descrevendo o evento" },
      data_inicio: { type: "string", description: "Data ISO YYYY-MM-DD de início" },
      data_fim: { type: "string", description: "Data ISO YYYY-MM-DD de término (igual à de início se for um evento de um dia só)" },
      cidade: { type: "string" },
      estado: { type: "string", description: "Nome ou sigla do estado brasileiro (ex: SP, São Paulo)" },
      local: { type: "string", description: "Nome do local/venue (ex: 'São Paulo Expo')" },
      endereco: { type: "string" },
      imagem_url: { type: ["string", "null"], description: "URL absoluta de uma imagem do evento, se houver" },
      preco_entrada: { type: ["number", "null"], description: "Preço do ingresso mais barato, se houver e não for gratuito" },
      gratuito: { type: "boolean" },
      confianca: {
        type: "number",
        description:
          "0 a 1 — quão confiante você está de que TODOS os campos obrigatórios (nome, datas, cidade, estado, local, endereco) estão corretos e completos. Use valores baixos (< 0.5) se teve que adivinhar cidade/estado/endereço.",
      },
    },
    required: [
      "encontrado",
      "nome",
      "descricao",
      "data_inicio",
      "data_fim",
      "cidade",
      "estado",
      "local",
      "endereco",
      "gratuito",
      "confianca",
    ],
  },
};

interface DadosFerramenta {
  encontrado: boolean;
  nome?: string;
  descricao?: string;
  data_inicio?: string;
  data_fim?: string;
  cidade?: string;
  estado?: string;
  local?: string;
  endereco?: string;
  imagem_url?: string | null;
  preco_entrada?: number | null;
  gratuito?: boolean;
  confianca?: number;
}

interface EventoBrutoLlm {
  nome: string;
  descricao: string;
  tipo: TipoEvento;
  data_inicio: string;
  data_fim: string;
  cidade: string;
  estado: string;
  local: string;
  endereco: string;
  imagem_url: string | null;
  site_url: string | null;
  preco_entrada: number | null;
  gratuito: boolean;
  confianca: number;
}

// Fallback quando a página não tem JSON-LD de evento: manda o texto limpo
// para o modelo e força a resposta no formato da ferramenta acima.
export async function extrairViaLlm(
  html: string,
  urlPagina: string,
  tipoPadrao: TipoEvento
): Promise<EventoBrutoLlm | null> {
  const texto = limparHtml(html);
  if (texto.length < 50) return null;

  const msg = await obterClient().messages.create({
    model: MODELO,
    max_tokens: 1024,
    tools: [FERRAMENTA_EXTRACAO],
    tool_choice: { type: "tool", name: "registrar_evento" },
    messages: [
      {
        role: "user",
        content: `Extraia os dados do evento descrito nesta página (URL de origem: ${urlPagina}). Hoje é ${new Date().toISOString().slice(0, 10)}. Preencha sua melhor estimativa mesmo com incerteza, mas reflita isso no campo "confianca". Se o texto claramente não descreve um evento específico com data e local, defina "encontrado" como false.\n\nATENÇÃO com datas: páginas de eventos recorrentes costumam citar mais de um ano (edição atual, "salve a data" da próxima edição, direitos autorais no rodapé etc.). Use a data do evento anunciado como principal/mais destacado na página, não a primeira data que aparecer no texto. Se houver ambiguidade real entre datas conflitantes, use confiança baixa (< 0.5).\n\n---\n${texto}`,
      },
    ],
  });

  const toolUse = msg.content.find(
    (bloco): bloco is Anthropic.ToolUseBlock => bloco.type === "tool_use"
  );
  if (!toolUse) return null;

  const dados = toolUse.input as DadosFerramenta;
  if (!dados.encontrado) return null;

  const gratuito = Boolean(dados.gratuito);
  const estado = dados.estado ? ufDoEstado(dados.estado) ?? dados.estado : "";

  return {
    nome: dados.nome ?? "",
    descricao: dados.descricao ?? "",
    tipo: tipoPadrao,
    data_inicio: dados.data_inicio ?? "",
    data_fim: dados.data_fim ?? dados.data_inicio ?? "",
    cidade: dados.cidade ?? "",
    estado,
    local: dados.local ?? "",
    endereco: dados.endereco ?? "",
    imagem_url: dados.imagem_url ?? null,
    site_url: urlPagina,
    preco_entrada: gratuito ? null : dados.preco_entrada ?? null,
    gratuito,
    confianca: typeof dados.confianca === "number" ? dados.confianca : 0.4,
  };
}

// Reexportado só para eventual inspeção/testes manuais.
export const TIPOS_EVENTO_VALIDOS = TIPOS_EVENTO;
