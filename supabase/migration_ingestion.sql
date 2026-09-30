-- =============================================
-- Suporte a ingestão automatizada de eventos (scraper)
-- =============================================

alter table eventos
  add column if not exists origem         text not null default 'manual'
    check (origem in ('manual', 'scraper')),
  add column if not exists fonte_nome     text,
  add column if not exists fonte_url      text,
  add column if not exists external_id    text,
  add column if not exists status         text not null default 'publicado'
    check (status in ('publicado', 'pendente_revisao', 'rejeitado')),
  add column if not exists confianca      numeric(3,2),
  add column if not exists atualizado_em  timestamptz not null default now();

-- Evita reinserir o mesmo evento a cada execução do pipeline
create unique index if not exists idx_eventos_fonte_url
  on eventos (fonte_url) where fonte_url is not null;

-- Apoio à checagem fuzzy de duplicidade (mesmo evento, fontes diferentes).
-- Usa lower(nome) em vez de unaccent_immutable(nome) para não depender da
-- extensão unaccent estar habilitada/no search_path — a normalização de
-- acento fica a cargo do script de escrita (fase 1), não do índice.
create index if not exists idx_eventos_dedup_fuzzy
  on eventos (lower(nome), cidade_norm, data_inicio);
