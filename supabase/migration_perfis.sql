-- Tabela de dados complementares do usuário (nome, sobrenome, data de
-- nascimento, cidade, estado, foto de perfil). Todos os campos são opcionais.
create table if not exists perfis (
  id               uuid primary key references auth.users(id) on delete cascade,
  nome             text,
  sobrenome        text,
  data_nascimento  date,
  cidade           text,
  estado           char(2),
  foto_url         text,
  atualizado_em    timestamptz not null default now()
);

alter table perfis enable row level security;

create policy "perfis_select_own"
  on perfis for select
  to authenticated
  using (auth.uid() = id);

create policy "perfis_upsert_own"
  on perfis for insert
  to authenticated
  with check (auth.uid() = id);

create policy "perfis_update_own"
  on perfis for update
  to authenticated
  using (auth.uid() = id);

-- =============================================
-- Storage: bucket de fotos de perfil
-- =============================================

insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

-- Cada usuário só pode gravar/atualizar dentro da própria pasta
-- (caminho no formato "<user_id>/foto").
create policy "avatars_write_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Leitura pública: a foto de perfil não é dado sensível.
create policy "avatars_read_public"
  on storage.objects for select
  using (bucket_id = 'avatars');
