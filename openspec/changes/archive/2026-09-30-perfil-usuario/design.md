# Design

## Context

Ver proposal.md para a motivação. Estado atual relevante:

- `auth.users` (Supabase Auth) não tem nenhum campo de perfil (nome, data de nascimento, cidade, estado, foto) — só e-mail/senha e, para login Google, o que o próprio Google retorna em `user.user_metadata` (tipicamente `avatar_url`/`picture`, `full_name`, `given_name`, `family_name`).
- `next.config.ts` já libera `lh3.googleusercontent.com` em `images.remotePatterns` desde o commit inicial do projeto — a intenção de usar a foto do Google via `next/image` já estava prevista antes deste change.
- `src/components/Header.tsx` (do change `autenticacao-usuarios`) é um Server Component assíncrono que já chama `createSupabaseServer().auth.getUser()` e, com sessão, mostra e-mail + botão "Sair" (Server Action `sair` de `src/lib/auth-actions.ts`).
- `src/app/eventos/novo/page.tsx` e `actions.ts` (mesmo change) estabelecem o padrão de página protegida: Server Component assíncrono que verifica `getUser()` e faz `redirect("/entrar?redirect=...")`, mais uma Server Action que verifica a sessão de novo de forma independente.
- `NovoEventoForm.tsx`/`CadastroForm.tsx`/`EntrarForm.tsx` estabelecem o padrão de formulário: client component com `useState` para erro/mensagem, `<form action={...}>` chamando uma Server Action que recebe `FormData`.
- `src/types/evento.ts` já exporta `ESTADOS_BR` (lista de UFs) reaproveitada em `NovoEventoForm` para o campo Estado — mesmo padrão serve aqui.
- O projeto usa `@base-ui/react` para todos os componentes de UI interativos (`select.tsx`, `popover.tsx`, `combobox.tsx`); o pacote expõe `@base-ui/react/menu` (Root, Trigger, Portal, Positioner, Popup, Item, LinkItem, Group, GroupLabel) — ainda não usado no projeto, mas é a peça certa para o menu "Perfil/Sair" no avatar do Header.
- Não existe nenhuma tabela além de `eventos` no banco, nem uso de Supabase Storage em lugar nenhum do projeto — ambos são novos para este change.
- Migrações de banco neste projeto são arquivos SQL versionados em `supabase/` (`schema.sql`, `migration_ingestion.sql`, `migration_unaccent.sql`) que o usuário roda manualmente no SQL Editor do Supabase — não há uma ferramenta de migração automatizada, e o app não tem a `SUPABASE_SERVICE_ROLE_KEY` disponível em `.env.local` para rodar SQL administrativo a partir do código.

## Goals / Non-Goals

**Goals:**
- Decidir onde os dados de perfil ficam armazenados e como a foto é servida.
- Decidir como a "foto do Google" convive com uma foto enviada pelo usuário sem nunca sobrescrevê-la automaticamente.
- Decidir a estrutura do menu do avatar no Header (Perfil/Sair) e o componente de UI usado.
- Registrar a migração SQL necessária (tabela + bucket) e os ajustes de configuração do Next.js (tamanho de upload, host de imagem).

**Non-Goals:**
- Edição de e-mail ou senha a partir do perfil — fora de escopo (ver proposal.md - Impact).
- Exclusão de conta.
- Qualquer validação de idade mínima a partir da data de nascimento — o campo é só armazenado, sem regra de negócio associada.
- Recorte/redimensionamento de imagem no upload — a imagem enviada é armazenada como está (dentro do limite de tamanho).
- Pré-preencher nome/sobrenome a partir dos dados do Google (`given_name`/`family_name`) — só a foto é aproveitada automaticamente, como pedido; nome/sobrenome ficam em branco até o usuário preencher.

## Decisions

### 1. Nova tabela `perfis`, não `user_metadata`
Dados estruturados (cidade/estado no mesmo formato de `eventos`, data de nascimento) cabem melhor em uma tabela própria do que no blob JSON `user_metadata` do Supabase Auth (que a própria documentação do Supabase recomenda manter mínimo). Segue o mesmo padrão já usado por `eventos.criado_por`: chave estrangeira para `auth.users(id)`.
```sql
create table if not exists perfis (
  id             uuid primary key references auth.users(id) on delete cascade,
  nome           text,
  sobrenome      text,
  data_nascimento date,
  cidade         text,
  estado         char(2),
  foto_url       text,
  atualizado_em  timestamptz not null default now()
);

alter table perfis enable row level security;

create policy "perfis_select_own" on perfis for select
  to authenticated using (auth.uid() = id);

create policy "perfis_upsert_own" on perfis for insert
  to authenticated with check (auth.uid() = id);

create policy "perfis_update_own" on perfis for update
  to authenticated using (auth.uid() = id);
```
Todos os campos são opcionais (nenhum `not null`), refletindo a decisão de que nada é obrigatório.
- **Alternativa considerada**: guardar tudo em `user_metadata` via `supabase.auth.updateUser({ data: {...} })` — descartada por misturar dados de perfil com metadados de auth e dificultar evolução futura (ex.: nunca dá para fazer `select`/índice sobre um campo dentro do JSON de auth sem funções especiais).

### 2. Sem linha em `perfis` até o primeiro salvamento
A página de perfil lê `perfis` com `.select().eq("id", user.id).maybeSingle()`; se não existir linha, todos os campos aparecem vazios (não é criada uma linha "vazia" automaticamente). Salvar o formulário faz um `upsert` (`onConflict: "id"`). Evita lógica de criação automática de linha em vários pontos do código (login, callback OAuth etc.) para um caso que já é tratado naturalmente como "ainda não preenchido".

### 3. Foto do Google: nunca persistida, só usada como fallback de leitura
Em vez de copiar a foto do Google para `perfis.foto_url` em algum momento do login, a foto exibida é sempre calculada assim, onde quer que seja mostrada (Header, página de perfil):
```
fotoExibida = perfil?.foto_url ?? (identidade Google presente ? user.user_metadata.avatar_url ?? user.user_metadata.picture : null) ?? null
```
Isso satisfaz as duas regras da spec ao mesmo tempo, sem nenhum código extra: enquanto `perfis.foto_url` for nulo, a foto atual do Google (lida ao vivo da sessão) aparece; assim que o usuário envia uma foto própria, `perfis.foto_url` deixa de ser nulo e passa a ganhar sempre, independentemente do que aconteça com a conta Google depois.
- **Alternativa considerada**: gravar a URL do Google em `perfis.foto_url` no primeiro login — descartada porque exigiria uma exceção ("só sobrescreve se ainda for a foto herdada do Google, nunca se for uma enviada manualmente"), enquanto a leitura ao vivo já resolve isso sem estado extra.

### 4. Upload de foto: Storage bucket `avatars`, escrita restrita à própria pasta
```sql
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

create policy "avatars_write_own" on storage.objects for insert
  to authenticated with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own" on storage.objects for update
  to authenticated using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_read_public" on storage.objects for select
  using (bucket_id = 'avatars');
```
Bucket público para leitura (a foto de perfil não é dado sensível e isso permite usar `getPublicUrl` direto, sem URL assinada). Caminho do arquivo é sempre `${user.id}/foto` (sem variar por nome original), com `upsert: true` no upload — substitui a foto anterior no mesmo caminho em vez de acumular arquivos órfãos a cada envio.

### 5. Upload via Server Action, com validação antes de subir
Uma Server Action dedicada (`atualizarFoto`, em `src/app/perfil/actions.ts`) recebe o `File` via `FormData`, valida `type` (`image/jpeg`, `image/png` ou `image/webp`) e tamanho (máx. 4MB) antes de chamar `supabase.storage.from("avatars").upload(...)`; rejeita com uma mensagem de erro sem tocar no Storage caso a validação falhe (spec: "Envio rejeitado por formato ou tamanho"). Usa `createSupabaseServer()` (client vinculado à sessão do usuário via cookies), então as políticas de `storage.objects` acima já se aplicam corretamente com o `auth.uid()` real.

### 6. `next.config.ts`: aumentar `bodySizeLimit` e liberar host do Storage
```ts
experimental: {
  serverActions: { bodySizeLimit: "5mb" },
},
images: {
  remotePatterns: [
    // ...existentes
    { protocol: "https", hostname: "hscezbhsnotjrwsdnkqs.supabase.co" },
  ],
},
```
O limite padrão de 1MB do corpo de Server Actions (documentado em `node_modules/next/dist/docs/.../serverActions.md`) é pequeno demais para uma foto de celular; 5MB dá margem sobre o limite de validação de 4MB (overhead do multipart). O host de Storage é o mesmo projeto já usado em `NEXT_PUBLIC_SUPABASE_URL` — precisa ser hardcoded porque `remotePatterns` é resolvido em build-time e não aceita uma variável de ambiente diretamente.

### 7. Menu do avatar no Header: novo wrapper `ui/dropdown-menu.tsx` + `HeaderUserMenu`
`src/components/ui/dropdown-menu.tsx`: wrapper fino sobre `@base-ui/react/menu` (Root, Trigger, Portal, Positioner, Popup, Item, LinkItem), no mesmo padrão de `select.tsx`/`combobox.tsx`.
`src/components/HeaderUserMenu.tsx` (client component): recebe `fotoUrl: string | null` e `email: string` como props; `Menu.Trigger` renderiza a foto (via `next/image`) ou um ícone de fallback (`UserCircle` do `lucide-react`) quando não há foto nenhuma; o popup tem um `Menu.LinkItem` para "Perfil" (`href="/perfil"`) e um `Menu.Item` para "Sair" com `onClick={() => sair()}` — chamando a Server Action `sair()` (já existente em `src/lib/auth-actions.ts`) diretamente do client component, sem precisar de um `<form>` (Server Actions podem ser chamadas como função a partir de um Client Component).
`Header.tsx` continua Server Component: calcula `fotoUrl` (decisão 3) lendo `perfis` e `user.user_metadata`, e passa para `<HeaderUserMenu />`.
- **Alternativa considerada**: manter o botão "Sair" solto e só adicionar um link "Perfil" ao lado — descartada porque o usuário pediu explicitamente o comportamento de clicar na foto abrir um menu com as duas opções.

## Risks / Trade-offs

- Upload de imagem grande ou de tipo arbitrário → mitigado pela validação de tipo/tamanho na Server Action antes de subir ao Storage (decisão 5).
- Política de Storage mal escrita poderia permitir um usuário sobrescrever a foto de outro → mitigado restringindo insert/update de `storage.objects` à própria pasta (`(storage.foldername(name))[1] = auth.uid()::text`), replicando o mesmo princípio de `auth.uid() = criado_por` já usado em `eventos`.
- Header ganha mais uma consulta por requisição (tabela `perfis`, além de `auth.getUser()`) → aceito; é uma leitura simples por chave primária, e o Header já é totalmente dinâmico desde o change anterior.
- Hostname do Storage hardcoded em `next.config.ts` amarra a configuração a este projeto Supabase específico → aceito, é a mesma convenção já usada para os outros hosts de imagem do projeto.

## Migration Plan

1. Rodar a migração SQL (`supabase/migration_perfis.sql`, criada durante a implementação) no SQL Editor do Supabase: cria a tabela `perfis` com RLS e o bucket `avatars` com as políticas de Storage.
2. Deploy do código.
3. Rollback: sem migração destrutiva — reverter é só reverter o deploy; a tabela e o bucket novos ficam inertes (não usados) se o código for revertido.
