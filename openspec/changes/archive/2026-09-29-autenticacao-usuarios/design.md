# Design

## Context

Ver proposal.md para a motivação. Estado atual relevante:

- `supabase/schema.sql` já tem `eventos.criado_por uuid references auth.users(id)` e RLS (`eventos_insert_authenticated`, `..._update_owner`, `..._delete_owner`) todas condicionadas a `auth.uid()` — ou seja, o banco já pressupõe Supabase Auth, só falta o app usá-lo.
- `src/lib/supabase-server.ts` já existe e usa `createServerClient` de `@supabase/ssr` (v0.10.3) com adaptador de cookies do App Router — a peça certa para ler/gravar sessão em Server Components, Server Actions e Route Handlers.
- `src/app/eventos/novo/actions.ts` (`criarEvento`) já insere eventos via esse client, mas nunca preenche `criado_por` e não verifica sessão — hoje, com RLS habilitada, esse insert já deveria falhar para qualquer usuário sem sessão (não há como ter uma).
- `NovoEventoForm.tsx` estabelece o padrão do projeto para formulários: client component com `useState` para erro local, chamando uma Server Action que recebe `FormData` e retorna `{ error: string } | void`.
- `src/lib/admin-auth.ts` implementa um mecanismo de senha única via cookie HMAC para `/admin/revisao`, explicitamente descrito no próprio código como "stopgap enquanto o sistema de auth do app está desativado". Fora de escopo (ver proposal.md - Impact).
- Este projeto roda em uma versão do Next.js que renomeou `middleware.ts` para `proxy.ts` (mesma função, `export default function proxy(request)`, roda em runtime Node.js por padrão) — confirmado em `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`. Não existe `middleware.ts` neste projeto hoje.

## Goals / Non-Goals

**Goals:**
- Decidir o provedor de autenticação e por que reaproveitar o Supabase Auth em vez de introduzir outro.
- Decidir onde e como a sessão é lida/verificada em cada camada (Server Components, Server Actions, e o novo `proxy.ts`).
- Decidir o fluxo de login com Google (PKCE via Supabase) e a rota de callback.
- Decidir como `/eventos/novo` passa a exigir sessão e como o redirecionamento de volta funciona.
- Registrar os passos de configuração externa (Google Cloud + painel do Supabase) necessários, já que não são automatizáveis por código.

**Non-Goals:**
- Fluxo de "esqueci minha senha" / redefinição de senha — não foi pedido, fica para uma mudança futura.
- Unificar/mesclar uma conta de e-mail/senha com uma conta Google que use o mesmo e-mail — se isso colidir, vale o comportamento padrão do Supabase Auth (tipicamente recusa o segundo cadastro); não é tratado especialmente aqui.
- Edição de perfil, "lembrar de mim", múltiplos fatores de autenticação, limitação de tentativas de login — fora de escopo.
- Migrar `/admin/revisao` para o novo sistema de autenticação (ver proposal.md - Impact).

## Decisions

### 1. Provedor de autenticação: Supabase Auth (nativo), não uma lib de auth à parte
O schema já modela identidade via `auth.users` e RLS condicionada a `auth.uid()`; o projeto já depende de `@supabase/ssr` e `@supabase/supabase-js`. Introduzir NextAuth/Clerk/Auth.js exigiria um modelo de usuário paralelo e reescrever a RLS já existente.
- **Alternativa considerada**: Auth.js (NextAuth) com adapter customizado para Supabase — descartada por duplicar o que o Supabase Auth já resolve nativamente (e-mail/senha, OAuth Google, confirmação de e-mail, cookies de sessão).

### 2. Sem cliente Supabase para o navegador — tudo via Server Actions
Cadastro, login por e-mail/senha e o início do login com Google são implementados como Server Actions (`"use server"`) usando `createSupabaseServer()`, no mesmo padrão de `criarEvento`/`NovoEventoForm.tsx`: formulário client component com `useState` para erro/mensagem local, `<form action={...}>` chamando a Server Action.
- Login com Google: a Server Action chama `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } })`, que no servidor apenas retorna `{ data: { url } }` (não navega sozinho); a própria Server Action faz `redirect(url)` para a tela de consentimento do Google.
- **Alternativa considerada**: criar `src/lib/supabase-browser.ts` (`createBrowserClient`) e mover os formulários para chamadas client-side (`supabase.auth.signInWithPassword` etc. direto no navegador) — descartada porque não traz benefício aqui (não há necessidade de um listener de estado de sessão em tempo real no cliente) e foge do padrão já estabelecido no projeto de Server Actions com `FormData`.

### 3. `src/proxy.ts` renova a sessão a cada requisição
Cria-se `src/proxy.ts` (não `middleware.ts` — ver Context) que instancia um `createServerClient` com os cookies da requisição/resposta e chama `supabase.auth.getUser()`, permitindo que o SDK renove o token de sessão e regrave o cookie quando necessário. Matcher exclui assets estáticos:
```ts
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```
Sem isso, sessões podem expirar de forma inconsistente entre Server Components (comportamento padrão documentado do `@supabase/ssr` com Next.js App Router).

### 4. Rota de callback OAuth: `src/app/auth/callback/route.ts`
Route Handler (`GET`) que recebe `?code=...&next=...` do redirecionamento do Google/Supabase, chama `supabase.auth.exchangeCodeForSession(code)` usando `createSupabaseServer()` (grava os cookies de sessão) e então `redirect(next ?? "/")`. O parâmetro `next` é o mesmo mecanismo de retorno usado no login por e-mail/senha (decisão 5), passado adiante dentro de `redirectTo` quando a Server Action inicia o `signInWithOAuth`.

### 5. Retorno pós-login via parâmetro `redirect` na URL de `/entrar`
`/entrar` aceita `?redirect=/eventos/novo`. O formulário de e-mail/senha inclui esse valor como campo oculto; a Server Action de login faz `redirect(redirectParam || "/")` após `signInWithPassword` bem-sucedido. Para o botão "Entrar com Google" na mesma página, o `redirectTo` passado a `signInWithOAuth` é `${origin}/auth/callback?next=${redirectParam || "/"}`, fechando o mesmo mecanismo pelas duas vias (decisão 4).

### 6. Página `/eventos/novo` exige sessão em duas camadas (defesa em profundidade)
- **Página** (`src/app/eventos/novo/page.tsx`): vira Server Component assíncrono, lê `supabase.auth.getUser()`; sem usuário, `redirect("/entrar?redirect=/eventos/novo")` antes de renderizar o formulário.
- **Server Action** (`criarEvento`): também verifica `getUser()` de forma independente antes do insert, retornando `{ error: "..." }` se não houver sessão, e passa `criado_por: user.id` no insert. Isso segue a orientação do próprio guia de autenticação do Next.js lido em `node_modules/next/dist/docs/01-app/02-guides/authentication.md`: uma verificação apenas na página/proxy não é suficiente porque uma Server Action pode ser invocada diretamente. A política `eventos_insert_authenticated` do banco permanece como uma terceira barreira (defesa em profundidade), não a única.

### 7. Validação de e-mail/senha com Zod (já é dependência do projeto)
Cadastro valida com um schema Zod simples antes de chamar `supabase.auth.signUp`: e-mail em formato válido, senha com no mínimo 8 caracteres. Em caso de falha, a Server Action retorna `{ error }` no mesmo formato que `criarEvento` já usa, sem chamar o Supabase.
- **Alternativa considerada**: confiar só na validação padrão do Supabase (mínimo de 6 caracteres) — descartada por ser mais fraca que o esperado e por não cobrir o cenário do spec de forma clara e previsível.

### 8. Mensagens de erro conhecidas mapeadas para PT-BR
`signInWithPassword` e `signUp` retornam erros do Supabase em inglês (ex.: `"Invalid login credentials"`, `"Email not confirmed"`). A Server Action mapeia os poucos códigos/mensagens conhecidos relevantes aos cenários do spec para texto em PT-BR amigável; qualquer outro erro cai em uma mensagem genérica, sem tentar traduzir exaustivamente todos os erros possíveis do Supabase.

### 9. Nenhuma variável de ambiente nova no app
`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` (já existentes) bastam — e-mail/senha e o Client ID/Secret do Google ficam configurados inteiramente no painel do Supabase Auth, não neste código.

### 10. Header.tsx vira Server Component assíncrono
Passa a chamar `createSupabaseServer().auth.getUser()` diretamente (mesmo padrão recomendado no guia do Next.js: buscar o usuário no layout/header, fazer a checagem de autorização propriamente dita na página específica — decisão 6). Exibe "Entrar" (linkando para `/entrar`) quando não há usuário, ou e-mail do usuário + ação "Sair" (Server Action `sair` → `supabase.auth.signOut()` + `redirect("/")`) quando há.

## Risks / Trade-offs

- Configuração do provedor Google (Google Cloud + painel do Supabase) é manual e externa ao código → Mitigação: passos documentados no Migration Plan; e-mail/senha funciona independentemente disso, então não bloqueia o restante do change.
- Esquecer de manter `src/proxy.ts` cobrindo as rotas certas pode causar sessão expirando de forma inconsistente → Mitigação: matcher exclui só assets estáticos, cobrindo todas as rotas de navegação e Server Actions.
- Duplicidade de sistemas de auth (`/admin/revisao` com senha única vs. o novo Supabase Auth) → aceito como Non-Goal; candidato natural a uma consolidação futura, não tratado aqui.
- Colisão de e-mail entre cadastro por senha e login Google → comportamento padrão do Supabase Auth se aplica (ver Non-Goals); não é uma regressão em relação a hoje, já que hoje nenhum dos dois existe.

## Migration Plan

1. No painel do Supabase Auth do projeto: confirmar que o provedor "Email" está habilitado com confirmação de e-mail exigida (comportamento padrão).
2. No painel do Supabase Auth: habilitar o provedor "Google", criando um OAuth Client ID/Secret no Google Cloud Console (tela de consentimento OAuth + URI de redirecionamento apontando para `<url-do-projeto-supabase>/auth/v1/callback`) e colando as credenciais no Supabase.
3. Configurar em Supabase Auth → URL Configuration a Site URL e as Redirect URLs adicionais para incluir `<url-do-app>/auth/callback` (em dev, `http://localhost:3000/auth/callback`).
4. Deploy do código (sem migração de banco — `schema.sql` já cobre tudo).
5. Rollback: como não há migração de banco, reverter é apenas reverter o deploy do código; as configurações do passo 1-3 podem permanecer no Supabase sem efeito colateral caso o deploy seja revertido.
