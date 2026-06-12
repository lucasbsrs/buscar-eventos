-- Habilita extensão unaccent
create extension if not exists unaccent;

-- Wrapper imutável necessário para usar unaccent em colunas geradas
create or replace function unaccent_immutable(text)
  returns text
  language sql
  immutable parallel safe
as $$
  select unaccent($1);
$$;

-- Coluna gerada com cidade normalizada (sem acento, minúsculo)
alter table eventos
  add column if not exists cidade_norm text
  generated always as (lower(unaccent_immutable(cidade))) stored;

-- Índice para acelerar a busca
create index if not exists idx_eventos_cidade_norm on eventos (cidade_norm);
