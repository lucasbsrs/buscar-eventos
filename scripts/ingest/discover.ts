import * as cheerio from "cheerio";
import { buscarComCache, RobotsBloqueadoError } from "./lib/cache";
import type { Candidato, Seed } from "./lib/types";

// Para fontes "evento_unico" (um site = um evento recorrente conhecido), a
// própria página do evento já é o único candidato — não há nada para
// descobrir. Para "listagem" (ex. um calendário de eventos), busca a página
// e extrai links que batem com o link_pattern configurado no seed.
export async function descobrirCandidatos(seeds: Seed[]): Promise<Candidato[]> {
  const candidatos: Candidato[] = [];

  for (const seed of seeds) {
    if (seed.tipo === "evento_unico") {
      if (seed.pagina_evento_url) {
        candidatos.push({ url: seed.pagina_evento_url, fonte_nome: seed.id });
      } else {
        console.warn(`[discover] seed "${seed.id}" é evento_unico mas não tem pagina_evento_url`);
      }
      continue;
    }

    if (!seed.listagem_url) {
      console.warn(`[discover] seed "${seed.id}" é listagem mas não tem listagem_url`);
      continue;
    }

    try {
      const html = await buscarComCache(seed.listagem_url);
      if (html === null) {
        console.log(`[discover] listagem de "${seed.id}" sem mudanças desde a última execução`);
        continue;
      }

      const $ = cheerio.load(html);
      const pattern = seed.link_pattern ? new RegExp(seed.link_pattern) : null;
      const vistos = new Set<string>();

      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;

        let absoluta: string;
        try {
          absoluta = new URL(href, seed.listagem_url).toString();
        } catch {
          return;
        }

        if (pattern && !pattern.test(absoluta)) return;
        if (vistos.has(absoluta)) return;
        vistos.add(absoluta);
        candidatos.push({ url: absoluta, fonte_nome: seed.id });
      });

      console.log(`[discover] "${seed.id}": ${vistos.size} URLs candidatas encontradas`);
    } catch (err) {
      if (err instanceof RobotsBloqueadoError) {
        console.warn(`[discover] ${err.message}`);
        continue;
      }
      console.error(`[discover] falha ao processar listagem "${seed.id}":`, err);
    }
  }

  return candidatos;
}
