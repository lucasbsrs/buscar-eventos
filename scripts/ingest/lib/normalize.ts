// Remove acentos e normaliza caixa — mesma lógica usada para cidade_norm no
// banco (supabase/migration_unaccent.sql), reimplementada aqui em JS porque
// o dedup fuzzy roda nos scripts, não em SQL.
export function normalizarTexto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
