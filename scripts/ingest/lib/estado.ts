import { ESTADOS_BR, ESTADOS_NOMES } from "../../../src/types/evento";
import { normalizarTexto } from "./normalize";

const NOME_PARA_UF = new Map(
  Object.entries(ESTADOS_NOMES).map(([uf, nome]) => [normalizarTexto(nome), uf])
);

const UFS_VALIDAS = new Set<string>(ESTADOS_BR);

// Aceita tanto a sigla ("SP") quanto o nome por extenso ("São Paulo", sem
// acento tudo bem) — schema.org/Event costuma vir com addressRegion por
// extenso, o LLM às vezes também escreve por extenso.
export function ufDoEstado(valor: string): string | null {
  const limpo = valor.trim().toUpperCase();
  if (UFS_VALIDAS.has(limpo)) return limpo;
  return NOME_PARA_UF.get(normalizarTexto(valor)) ?? null;
}
