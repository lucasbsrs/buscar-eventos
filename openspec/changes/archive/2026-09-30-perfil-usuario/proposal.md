# Proposal

## Why

Hoje um usuário autenticado não tem nenhum lugar para ver ou editar seus próprios dados (nome, data de nascimento, cidade/estado) nem para definir uma foto de perfil, e o cabeçalho só oferece um botão de "Sair" solto ao lado do e-mail — não há uma página de conta. Quem faz login com Google também não tem sua foto do Google aproveitada em lugar nenhum, apesar do projeto já ter `lh3.googleusercontent.com` liberado em `next.config.ts` para isso. Este change adiciona uma página de perfil para o usuário logado completar seus dados e enviar uma foto, e reorganiza o cabeçalho em torno dela.

## What Changes

- Nova página `/perfil` (exige login) com campos opcionais: Nome, Sobrenome, Data de Nascimento, Cidade e Estado, salvos a qualquer momento (nenhum é obrigatório).
- Upload de foto de perfil na página `/perfil` (Supabase Storage); a foto enviada substitui qualquer foto anterior.
- Quando o usuário loga com Google e nunca enviou uma foto própria, a foto atual da conta Google é exibida automaticamente como foto de perfil. Uma vez enviada uma foto própria, ela nunca é sobrescrita automaticamente por um login futuro com Google.
- Botão "Sair" passa a existir também na página de perfil.
- **BREAKING (UX)**: no cabeçalho, o e-mail + botão "Sair" soltos são substituídos pela foto de perfil do usuário; clicar nela abre um menu com as opções "Perfil" (leva a `/perfil`) e "Sair".
- Nova tabela `perfis` no banco (dados complementares do usuário) e um bucket de Storage para as fotos — requer rodar uma migração SQL, na mesma convenção de `supabase/schema.sql`/`migration_ingestion.sql`.
- Ajuste em `next.config.ts`: aumento do limite de tamanho de corpo das Server Actions (upload de foto) e liberação do domínio de Storage do Supabase para `next/image`.

## Capabilities

### New Capabilities
- `perfil-usuario`: visualização e edição dos dados complementares do usuário logado (nome, sobrenome, data de nascimento, cidade, estado), upload de foto de perfil, e o comportamento de foto padrão vinda do Google.

### Modified Capabilities
- `autenticacao-usuarios`: o requisito "Indicação do estado de sessão" muda — com sessão ativa, o site passa a exibir a foto de perfil do usuário (em vez de e-mail + botão "Sair" direto), e ao clicar nela abre um menu com as opções "Perfil" e "Sair".

## Impact

- `src/app/perfil/page.tsx` (novo): página de perfil, exige sessão (mesmo padrão de `/eventos/novo`).
- `src/app/perfil/actions.ts` (novo): Server Actions para salvar os dados do perfil e para o upload da foto.
- `src/components/PerfilForm.tsx` (novo): formulário client component com os campos e o input de foto.
- Nova tabela `perfis` (SQL) com RLS restringindo cada usuário ao próprio registro, referenciando `auth.users(id)`.
- Novo bucket de Supabase Storage para fotos de perfil, com política restringindo escrita à própria pasta do usuário.
- `src/components/Header.tsx`: troca o e-mail + botão "Sair" por um componente de avatar com menu (Perfil / Sair) — novo `src/components/HeaderUserMenu.tsx` (client component) e possivelmente um novo `src/components/ui/dropdown-menu.tsx` (wrapper sobre `@base-ui/react/menu`, no mesmo padrão de `select.tsx`/`combobox.tsx`).
- `next.config.ts`: `experimental.serverActions.bodySizeLimit` (upload de foto) e novo host em `images.remotePatterns` para as fotos do bucket de Storage.
- Fora de escopo: edição de e-mail/senha, exclusão de conta, e qualquer validação de idade mínima a partir da data de nascimento.
