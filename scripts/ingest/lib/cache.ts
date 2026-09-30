import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { podeAcessar, respeitarIntervalo } from "./robots";

const CACHE_DIR = path.join(process.cwd(), "scripts", "ingest", ".cache");
const CACHE_FILE = path.join(CACHE_DIR, "paginas.json");

const USER_AGENT =
  "EventakuBot/1.0 (+https://github.com/; agregador de eventos geek/otaku do Brasil)";

function carregarCache(): Record<string, string> {
  if (!existsSync(CACHE_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function salvarCache(cache: Record<string, string>): void {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

const cache = carregarCache();

export class RobotsBloqueadoError extends Error {
  constructor(url: string) {
    super(`robots.txt bloqueia o acesso a ${url}`);
    this.name = "RobotsBloqueadoError";
  }
}

// Busca uma página respeitando robots.txt e rate limit por domínio.
// Retorna null quando o conteúdo não mudou desde a última execução — o
// chamador deve pular a extração (evita reprocessar e reconsultar o LLM).
export async function buscarComCache(url: string): Promise<string | null> {
  if (!(await podeAcessar(url))) {
    throw new RobotsBloqueadoError(url);
  }

  await respeitarIntervalo(url);

  const resp = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} ao buscar ${url}`);
  }

  const html = await resp.text();
  const hash = createHash("sha256").update(html).digest("hex");

  if (cache[url] === hash) {
    return null;
  }

  cache[url] = hash;
  salvarCache(cache);
  return html;
}
