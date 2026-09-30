import "./lib/env";

import seedsData from "./sources/seeds.json";
import { descobrirCandidatos } from "./discover";
import { extrairEvento } from "./extract";
import { escreverEventos, type ItemParaEscrita } from "./write";
import { buscarComCache, RobotsBloqueadoError } from "./lib/cache";
import type { Seed } from "./lib/types";

const seeds = seedsData as Seed[];

async function main() {
  const llmHabilitado = process.env.INGEST_USE_LLM === "true";
  console.log(
    `[ingest] iniciando — ${seeds.length} fontes configuradas, fallback LLM ${llmHabilitado ? "ligado" : "desligado"}`
  );

  const candidatos = await descobrirCandidatos(seeds);
  console.log(`[ingest] ${candidatos.length} URLs candidatas no total`);

  const seedPorId = new Map(seeds.map((s) => [s.id, s]));
  const itens: ItemParaEscrita[] = [];
  let semMudanca = 0;
  let falhasExtracao = 0;

  for (const candidato of candidatos) {
    const seed = seedPorId.get(candidato.fonte_nome);
    if (!seed) continue;

    try {
      const html = await buscarComCache(candidato.url);
      if (html === null) {
        semMudanca++;
        continue;
      }

      const evento = await extrairEvento(html, candidato.url, seed.tipo_padrao);
      if (!evento) {
        falhasExtracao++;
        console.warn(`[ingest] não foi possível extrair dados de ${candidato.url}`);
        continue;
      }

      itens.push({ evento, fonte_url: candidato.url, fonte_nome: seed.id });
    } catch (err) {
      if (err instanceof RobotsBloqueadoError) {
        console.warn(`[ingest] ${err.message}`);
        continue;
      }
      falhasExtracao++;
      console.error(`[ingest] erro processando ${candidato.url}:`, err);
    }
  }

  console.log(
    `[ingest] extração concluída — ${itens.length} eventos prontos para gravar, ${semMudanca} sem mudança, ${falhasExtracao} com falha`
  );

  const resultado = await escreverEventos(itens);

  console.log(
    `[ingest] concluído — novos: ${resultado.novos}, atualizados: ${resultado.atualizados}, ` +
      `em revisão: ${resultado.emRevisao}, duplicados ignorados: ${resultado.duplicadosIgnorados}, erros: ${resultado.erros}`
  );
}

main().catch((err) => {
  console.error("[ingest] falha fatal:", err);
  process.exitCode = 1;
});
