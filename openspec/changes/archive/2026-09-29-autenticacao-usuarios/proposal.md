# Proposal

## Why

Hoje ninguém consegue criar conta nem fazer login no Eventaku, mas o schema do banco (`supabase/schema.sql`) já foi construído esperando isso: a política de RLS `eventos_insert_authenticated` exige `to authenticated` e `auth.uid() = criado_por` para inserir um evento. Sem um sistema de login, o formulário de "Cadastrar evento" (`/eventos/novo`) depende de uma sessão autenticada que nunca existe — ou seja, a funcionalidade de cadastro de evento já está efetivamente quebrada para qualquer usuário real. Este change ativa o modelo de identidade que o banco já pressupõe, permitindo criar conta (e-mail/senha ou Google) e exigindo login para cadastrar eventos.

## What Changes

- Novo cadastro de conta por e-mail e senha, com confirmação de e-mail obrigatória (padrão do Supabase Auth) antes de a conta poder ser usada para cadastrar eventos.
- Novo login por e-mail e senha.
- Novo login com conta do Google (OAuth via Supabase Auth) — requer habilitar o provedor Google no painel do Supabase e criar credenciais OAuth no Google Cloud; esses passos de configuração externa são documentados no design, fora do código deste change.
- Novas páginas dedicadas `/entrar` e `/cadastro`.
- Novo estado de sessão no cabeçalho do site: link "Entrar" quando deslogado; indicação do usuário logado + ação "Sair" quando logado.
- **BREAKING**: `/eventos/novo` (e a Server Action que cria o evento) passam a exigir uma sessão autenticada. Quem tentar acessar deslogado é redirecionado para `/entrar`, retornando a `/eventos/novo` após autenticar. Isso passa a exercer de fato a política `eventos_insert_authenticated` que já existe no banco.
- O evento criado passa a gravar `criado_por` com o id do usuário autenticado (hoje esse campo nunca é preenchido pelo formulário manual de cadastro).
- Novo `src/proxy.ts` (convenção desta versão do Next.js, que renomeou `middleware.ts` para `proxy.ts`) para renovar os cookies de sessão do Supabase a cada requisição.

## Capabilities

### New Capabilities
- `autenticacao-usuarios`: criação de conta por e-mail/senha (com confirmação de e-mail), login por e-mail/senha, login com Google, encerramento de sessão, e o site refletir se há um usuário logado.
- `cadastro-eventos`: exigência de estar autenticado para cadastrar um evento, e a associação do evento criado ao usuário autenticado.

### Modified Capabilities

(nenhuma — não existe spec anterior cobrindo autenticação nem a regra de acesso ao cadastro de eventos; `filtro-localizacao`, a única capability hoje registrada, não é afetada)

## Impact

- `src/app/entrar/page.tsx` (novo): formulário de login por e-mail/senha + botão "Entrar com Google".
- `src/app/cadastro/page.tsx` (novo): formulário de criação de conta por e-mail/senha, com aviso de confirmação de e-mail.
- Uma rota de callback OAuth (novo, ex. `src/app/auth/callback/route.ts`): troca o código retornado pelo Google/Supabase por uma sessão.
- `src/proxy.ts` (novo): substitui o antigo `middleware.ts` (renomeado nesta versão do Next.js) para renovar a sessão do Supabase em cada requisição.
- Um cliente Supabase para Client Components (ex. `src/lib/supabase-browser.ts`, novo, via `createBrowserClient` de `@supabase/ssr`) — os clientes hoje existentes (`src/lib/supabase.ts`, `src/lib/supabase-server.ts`, `src/lib/supabase-admin.ts`) não cobrem esse caso.
- `src/app/eventos/novo/page.tsx` e `src/app/eventos/novo/actions.ts`: passam a exigir sessão autenticada; `criarEvento` grava `criado_por`.
- `src/components/Header.tsx`: novo estado de sessão (Entrar / usuário logado + Sair).
- Configuração externa (fora do código): habilitar e-mail/senha e o provedor Google no Supabase Auth; criar credenciais OAuth no Google Cloud; possíveis variáveis de ambiente novas para URL de redirecionamento — documentado no design.
- Fora de escopo: `src/lib/admin-auth.ts` e `/admin/revisao` continuam com o mecanismo de senha única atual (o próprio código já o trata como "stopgap enquanto o sistema de auth do app está desativado") — migrá-los para o novo sistema de autenticação não faz parte deste change.
