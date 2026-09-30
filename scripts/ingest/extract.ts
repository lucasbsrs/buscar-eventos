import { extrairViaJsonLd } from "./lib/jsonld";
import { EventoExtraidoSchema, type EventoExtraido, type TipoEvento } from "./lib/types";

// Fallback via LLM desligado por padrão para não gerar custo de API — ligar
// só quando fizer sentido, com INGEST_USE_LLM=true no ambiente.
const LLM_HABILITADO = process.env.INGEST_USE_LLM === "true";

// Por enquanto só usa JSON-LD (schema.org/Event) — dado estruturado que o
// próprio site publica, sem custo nenhum. Páginas sem JSON-LD de evento são
// simplesmente puladas (extrairEvento retorna null) em vez de cair para o
// LLM. O resultado passa pelo schema zod antes de seguir — nada que falhe
// validação chega ao write.ts.
export async function extrairEvento(
  html: string,
  urlPagina: string,
  tipoPadrao: TipoEvento
): Promise<EventoExtraido | null> {
  const viaJsonLd = extrairViaJsonLd(html, urlPagina, tipoPadrao);
  if (viaJsonLd) {
    const validado = EventoExtraidoSchema.safeParse(viaJsonLd);
    if (validado.success) return validado.data;
    console.warn(`[extract] JSON-LD de ${urlPagina} não passou na validação:`, validado.error.issues);
    return null;
  }

  if (!LLM_HABILITADO) {
    console.warn(`[extract] ${urlPagina} não tem JSON-LD de evento — pulando (fallback LLM desligado)`);
    return null;
  }

  try {
    const { extrairViaLlm } = await import("./lib/llm");
    const viaLlm = await extrairViaLlm(html, urlPagina, tipoPadrao);
    if (!viaLlm) return null;

    const validado = EventoExtraidoSchema.safeParse(viaLlm);
    if (!validado.success) {
      console.warn(`[extract] extração via LLM de ${urlPagina} não passou na validação:`, validado.error.issues);
      return null;
    }
    return validado.data;
  } catch (err) {
    console.error(`[extract] falha ao chamar o LLM para ${urlPagina}:`, err);
    return null;
  }
}
