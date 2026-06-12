-- Habilita extensão de UUID
create extension if not exists "pgcrypto";

-- Tabela de eventos
create table if not exists eventos (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  descricao     text not null,
  tipo          text not null check (tipo in ('anime','games','hq','cosplay','tecnologia','rpg','cultura-pop','outro')),
  data_inicio   timestamptz not null,
  data_fim      timestamptz not null,
  cidade        text not null,
  estado        char(2) not null,
  local         text not null,
  endereco      text not null,
  imagem_url    text,
  site_url      text,
  preco_entrada numeric(10,2),
  gratuito      boolean not null default false,
  criado_por    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- Índices para os filtros usados na home
create index if not exists idx_eventos_estado      on eventos (estado);
create index if not exists idx_eventos_tipo        on eventos (tipo);
create index if not exists idx_eventos_data_inicio on eventos (data_inicio);
create index if not exists idx_eventos_nome        on eventos using gin (to_tsvector('portuguese', nome));

-- =============================================
-- Row Level Security (RLS)
-- =============================================
alter table eventos enable row level security;

-- Qualquer pessoa pode ler eventos
create policy "eventos_select_public"
  on eventos for select
  using (true);

-- Apenas usuários autenticados podem inserir
create policy "eventos_insert_authenticated"
  on eventos for insert
  to authenticated
  with check (auth.uid() = criado_por);

-- Organizador só edita/deleta os próprios eventos
create policy "eventos_update_owner"
  on eventos for update
  to authenticated
  using (auth.uid() = criado_por);

create policy "eventos_delete_owner"
  on eventos for delete
  to authenticated
  using (auth.uid() = criado_por);

-- =============================================
-- Dados de exemplo (execute apenas em dev)
-- =============================================
insert into eventos (nome, descricao, tipo, data_inicio, data_fim, cidade, estado, local, endereco, gratuito) values
  ('Anime Friends 2026', 'O maior festival de cultura japonesa do Brasil.', 'anime', '2026-07-10', '2026-07-13', 'São Paulo', 'SP', 'Expo Center Norte', 'R. José Bernardo Pinto, 333', false),
  ('Comic Con Experience 2026', 'O evento de cultura pop mais aguardado do ano.', 'cultura-pop', '2026-12-04', '2026-12-07', 'São Paulo', 'SP', 'São Paulo Expo', 'Rod. dos Imigrantes, km 1,5', false),
  ('GamesWeek BH', 'Festival de games e e-sports em Belo Horizonte.', 'games', '2026-08-22', '2026-08-24', 'Belo Horizonte', 'MG', 'Expominas', 'Av. Amazonas, 6200', true),
  ('RPGCon Rio', 'Convenção dedicada a RPG de mesa e board games.', 'rpg', '2026-09-05', '2026-09-07', 'Rio de Janeiro', 'RJ', 'Museu do Amanhã', 'Praça Mauá, 1', true);
