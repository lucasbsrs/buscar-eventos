import * as cheerio from "cheerio";
import { ufDoEstado } from "./estado";
import type { TipoEvento } from "./types";

type JsonLd = Record<string, unknown>;

function achatar(json: unknown): JsonLd[] {
  if (Array.isArray(json)) return json.flatMap(achatar);
  if (json && typeof json === "object") {
    const obj = json as JsonLd;
    if (Array.isArray(obj["@graph"])) return (obj["@graph"] as unknown[]).flatMap(achatar);
    return [obj];
  }
  return [];
}

function ehEvento(item: JsonLd): boolean {
  const tipo = item["@type"];
  if (typeof tipo === "string") return tipo === "Event" || tipo.endsWith("Event");
  if (Array.isArray(tipo)) return tipo.some((t) => typeof t === "string" && t.endsWith("Event"));
  return false;
}

function primeiro<T>(valor: T | T[] | undefined | null): T | undefined {
  if (Array.isArray(valor)) return valor[0];
  return valor ?? undefined;
}

function textoOuUrl(imagem: unknown): string | null {
  if (typeof imagem === "string") return imagem.trim() || null;
  if (imagem && typeof imagem === "object" && "url" in imagem) {
    const url = (imagem as { url?: unknown }).url;
    return typeof url === "string" ? url.trim() || null : null;
  }
  return null;
}

// Alguns sites geram JSON-LD com quebras de linha literais dentro de
// strings (ex: description) em vez de escapadas como \n — inválido pelo
// spec de JSON. Escapa caracteres de controle apenas quando estão dentro
// de uma string, sem mexer no espaçamento estrutural entre tokens.
function sanitizarJsonLd(bruto: string): string {
  let resultado = "";
  let dentroDeString = false;
  let escapando = false;

  for (const char of bruto) {
    if (escapando) {
      resultado += char;
      escapando = false;
      continue;
    }
    if (char === "\\") {
      resultado += char;
      escapando = true;
      continue;
    }
    if (char === '"') {
      dentroDeString = !dentroDeString;
      resultado += char;
      continue;
    }
    if (dentroDeString) {
      if (char === "\n") {
        resultado += "\\n";
        continue;
      }
      if (char === "\r") {
        resultado += "\\r";
        continue;
      }
      if (char === "\t") {
        resultado += "\\t";
        continue;
      }
    }
    resultado += char;
  }

  return resultado;
}

function parsearJsonLd(conteudo: string): unknown | null {
  try {
    return JSON.parse(conteudo);
  } catch {
    try {
      return JSON.parse(sanitizarJsonLd(conteudo));
    } catch {
      return null;
    }
  }
}

// Alguns sites (ex: doity.com.br) publicam startDate/endDate com o fuso
// grudado no meio da string em vez de no final — "2026-08-30-0310:00" em
// vez de "2026-08-30T10:00:00-03:00". Detecta esse padrão específico e
// reconstrói um ISO válido; devolve o valor original se não bater.
function repararDataIso(valor: string): string {
  const m = valor.match(/^(\d{4}-\d{2}-\d{2})-(\d{2})(\d{2}:\d{2})$/);
  if (!m) return valor;
  const [, data, fusoHoras, hora] = m;
  return `${data}T${hora}:00-${fusoHoras}:00`;
}

interface EventoBruto {
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

function mapearEvento(item: JsonLd, urlPagina: string, tipoPadrao: TipoEvento): EventoBruto | null {
  const nome = typeof item.name === "string" ? item.name : null;
  const dataInicio = typeof item.startDate === "string" ? item.startDate : null;
  if (!nome || !dataInicio) return null;

  const local = primeiro(item.location as JsonLd | JsonLd[] | undefined);
  const endereco = local?.address;
  const enderecoObj = endereco && typeof endereco === "object" ? (endereco as JsonLd) : null;

  const cidade = typeof enderecoObj?.addressLocality === "string" ? enderecoObj.addressLocality : null;
  const estadoBruto = typeof enderecoObj?.addressRegion === "string" ? enderecoObj.addressRegion : null;
  const estado = estadoBruto ? ufDoEstado(estadoBruto) : null;
  const nomeLocal = typeof local?.name === "string" ? local.name : null;
  const enderecoRua = typeof enderecoObj?.streetAddress === "string" ? enderecoObj.streetAddress : null;

  if (!cidade || !estado || !nomeLocal) return null;

  const offers = primeiro(item.offers as JsonLd | JsonLd[] | undefined);
  const precoRaw = offers?.price ?? offers?.lowPrice;
  const preco = precoRaw != null ? Number(precoRaw) : null;
  const gratuito = preco === 0;

  return {
    nome,
    descricao: typeof item.description === "string" ? item.description : nome,
    tipo: tipoPadrao,
    data_inicio: repararDataIso(dataInicio),
    data_fim: repararDataIso(typeof item.endDate === "string" ? item.endDate : dataInicio),
    cidade,
    estado,
    local: nomeLocal,
    endereco: enderecoRua ?? nomeLocal,
    imagem_url: textoOuUrl(item.image),
    site_url: (typeof item.url === "string" ? item.url.trim() : "") || urlPagina,
    preco_entrada: gratuito || preco == null || Number.isNaN(preco) ? null : preco,
    gratuito,
    // dado estruturado publicado pelo próprio site — alta confiança
    confianca: 0.95,
  };
}

// Procura um bloco <script type="application/ld+json"> com um Event e
// mapeia para o formato interno. Retorna null se a página não tiver
// JSON-LD de evento (nesse caso o chamador decide se cai para o fallback
// via LLM, quando habilitado).
export function extrairViaJsonLd(
  html: string,
  urlPagina: string,
  tipoPadrao: TipoEvento
): EventoBruto | null {
  const $ = cheerio.load(html);
  const blocos = $('script[type="application/ld+json"]');

  for (const el of blocos.toArray()) {
    const conteudo = $(el).contents().text();
    const json = parsearJsonLd(conteudo);
    if (json === null) continue;

    for (const item of achatar(json)) {
      if (!ehEvento(item)) continue;
      const evento = mapearEvento(item, urlPagina, tipoPadrao);
      if (evento) return evento;
    }
  }

  return null;
}
