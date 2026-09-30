# Tasks

## 1. Configuração externa do Supabase Auth (necessária só para o login com Google)

- [x] 1.1 Confirmar no painel do Supabase Auth (Authentication → Providers) que o provedor "Email" está habilitado com confirmação de e-mail obrigatória (comportamento padrão) — verificar visualmente no painel
- [x] 1.2 Criar credenciais OAuth no Google Cloud Console (tela de consentimento + Client ID/Secret, URI de redirecionamento `<url-do-projeto-supabase>/auth/v1/callback`) e habilitar o provedor "Google" no Supabase Auth com essas credenciais (design.md - Migration Plan) — verificar que o provedor aparece habilitado em Authentication → Providers
- [x] 1.3 Em Supabase Auth → URL Configuration, definir a Site URL e adicionar `<url-do-app>/auth/callback` (dev: `http://localhost:3000/auth/callback`) às Redirect URLs — verificar que a URL aparece salva na configuração

## 2. Sessão em toda requisição

- [x] 2.1 Criar `src/proxy.ts` que instancia `createServerClient` com os cookies da requisição, chama `supabase.auth.getUser()` para renovar a sessão, e exclui assets estáticos via `matcher` (design.md #3) — verificar que `npm run build` compila e que `npm run dev` continua servindo a home e `/eventos/novo` normalmente
- [x] 2.2 Criar `src/app/auth/callback/route.ts` (Route Handler `GET`) que lê `code`/`next` da URL, chama `exchangeCodeForSession(code)` via `createSupabaseServer()` e redireciona para `next ?? "/"` (design.md #4) — verificar que `npm run build` compila; acessar a rota manualmente sem `code` não derruba o servidor (erro tratado ou redirect razoável)

## 3. Cadastro e login por e-mail/senha

- [x] 3.1 Criar `src/app/cadastro/actions.ts` com a Server Action `cadastrar` (valida e-mail e senha ≥ 8 caracteres com Zod antes de chamar `supabase.auth.signUp`, design.md #7) e `src/app/cadastro/page.tsx` + `CadastroForm` (client component no padrão de `NovoEventoForm.tsx`, com `useState` para erro/mensagem) — verificar com `npm run dev`: senha fraca mostra erro sem chamar o Supabase; cadastro válido mostra mensagem de confirmação de e-mail (spec `autenticacao-usuarios` - "Cadastro com e-mail e senha válidos" / "Cadastro rejeitado por senha fraca")
- [x] 3.2 Criar `src/app/entrar/actions.ts` com a Server Action `entrar` (mapeia "e-mail não confirmado" e "credenciais inválidas" para mensagens em PT-BR, design.md #8; após sucesso, `redirect` para o parâmetro `redirect` da URL ou `/`, design.md #5) e `src/app/entrar/page.tsx` + `EntrarForm` lendo `?redirect=` — verificar manualmente: login com e-mail ainda não confirmado mostra a mensagem correta e não autentica; login com credenciais corretas e e-mail confirmado redireciona para `/` (spec `autenticacao-usuarios` - "Login bloqueado antes da confirmação" / "Login com credenciais corretas")
- [x] 3.3 Adicionar `entrarComGoogle` em `src/app/entrar/actions.ts` (`signInWithOAuth({ provider: "google", options: { redirectTo } })` propagando o `redirect` da página via `next` na URL de callback, design.md #4/#5) e o botão "Entrar com Google" em `/entrar` — verificar manualmente (com a config da task 1.2/1.3 concluída): o clique leva à tela de consentimento do Google e volta autenticado para a página de origem (spec `autenticacao-usuarios` - "Primeiro acesso via Google" / "Acesso recorrente via Google")

## 4. Header reflete sessão e logout

- [x] 4.1 Criar `src/lib/auth-actions.ts` com a Server Action `sair` (`supabase.auth.signOut()` + `redirect("/")`) — verificar que `npm run build` compila
- [x] 4.2 Tornar `src/components/Header.tsx` um Server Component assíncrono que lê `createSupabaseServer().auth.getUser()` e exibe "Entrar" (link para `/entrar`) sem sessão, ou o e-mail do usuário + botão "Sair" com sessão (design.md #10) — verificar manualmente: deslogado mostra "Entrar"; logado mostra e-mail + "Sair"; clicar em "Sair" volta ao estado deslogado (spec `autenticacao-usuarios` - "Visitante sem sessão" / "Usuário com sessão ativa" / "Usuário sai da conta")

## 5. Gatear cadastro de evento

- [x] 5.1 Tornar `src/app/eventos/novo/page.tsx` assíncrono: checa `getUser()` e, sem sessão, `redirect("/entrar?redirect=/eventos/novo")` antes de renderizar o formulário (design.md #6) — verificar manualmente: acessar `/eventos/novo` deslogado redireciona para `/entrar?redirect=/eventos/novo` (spec `cadastro-eventos` - "Visitante sem sessão é impedido de acessar o cadastro")
- [x] 5.2 Atualizar `criarEvento` (`src/app/eventos/novo/actions.ts`) para checar `getUser()` de forma independente da página (retornando `{ error }` sem sessão) e gravar `criado_por: user.id` no insert (design.md #6) — verificar manualmente: evento cadastrado autenticado salva com `criado_por` preenchido; chamar a action sem sessão (ex. via ferramenta de rede do navegador reenviando a requisição sem cookies) não cria evento (spec `cadastro-eventos` - "Submissão sem sessão é rejeitada" / "Evento criado registra o autor")

## 6. Verificação end-to-end

- [x] 6.1 Fluxo completo por e-mail/senha: cadastrar conta nova → confirmar e-mail pelo link recebido → logar → cadastrar um evento → conferir que o evento aparece com esse usuário como autor
- [x] 6.2 Fluxo completo com Google (requer grupo 1 concluído): a partir de `/eventos/novo` deslogado, clicar em "Entrar com Google" → conferir que volta autenticado direto para `/eventos/novo` (spec `cadastro-eventos` - "Usuário completa o login e volta ao formulário")
- [x] 6.3 Rodar `npm run lint` e `npm run build` no projeto completo e confirmar que nenhum erro novo foi introduzido (comparar com os avisos pré-existentes já conhecidos no projeto)
