# Tasks

## 1. Migração de banco e Storage

- [x] 1.1 Criar `supabase/migration_perfis.sql` com a tabela `perfis` e sua RLS (design.md #1), o bucket `avatars` e as políticas de `storage.objects` (design.md #4) — verificar que o arquivo existe e revisar o SQL manualmente (não há como testá-lo sem rodar no Supabase)
- [x] 1.2 Rodar `supabase/migration_perfis.sql` no SQL Editor do Supabase — verificar que a tabela `perfis` e o bucket `avatars` aparecem no painel do projeto

## 2. Server Actions e cálculo da foto exibida

- [x] 2.1 Criar `src/app/perfil/actions.ts` com a Server Action `salvarPerfil` (upsert de nome/sobrenome/data_nascimento/cidade/estado — todos opcionais, design.md #1/#2) — verificar que `npm run build` compila
- [x] 2.2 Adicionar `atualizarFoto` em `src/app/perfil/actions.ts`: valida tipo (`image/jpeg`, `image/png`, `image/webp`) e tamanho (máx. 4MB), faz upload para o bucket `avatars` no caminho `${user.id}/foto` com `upsert: true`, e grava a URL pública em `perfis.foto_url` (design.md #4/#5) — verificar manualmente: envio de imagem válida atualiza a foto; envio de arquivo que não é imagem suportada ou que excede 4MB é rejeitado sem alterar a foto atual (spec `perfil-usuario` - "Envio de foto válida" / "Envio rejeitado por formato ou tamanho")
- [x] 2.3 Criar `src/lib/perfil.ts` com uma função que retorna a foto a exibir para um usuário (`perfil?.foto_url ?? avatar_url do Google (se a identidade for google) ?? null`, design.md #3), reaproveitada pelo Header e pela página de perfil — verificar que `npm run build` compila

## 3. Página e formulário de perfil

- [x] 3.1 Criar `src/app/perfil/page.tsx`: Server Component assíncrono que exige sessão (`redirect("/entrar?redirect=/perfil")` sem sessão, mesmo padrão de `/eventos/novo`), lê o perfil existente via `.maybeSingle()` (ou valores vazios se não existir linha) e a foto exibida (helper da task 2.3) — verificar manualmente: acessar `/perfil` deslogado redireciona para `/entrar?redirect=/perfil` (spec `perfil-usuario` - "Visitante sem sessão é impedido de acessar o perfil")
- [x] 3.2 Criar `src/components/PerfilForm.tsx` (client component no padrão de `NovoEventoForm`/`CadastroForm`) com os campos Nome, Sobrenome, Data de Nascimento, Cidade (Input) e Estado (Select reaproveitando `ESTADOS_BR` de `@/types/evento`), e o botão "Sair" (Server Action `sair` de `@/lib/auth-actions`) — verificar manualmente: salvar com só um campo preenchido funciona sem erro; salvar com tudo vazio funciona sem erro (spec `perfil-usuario` - cenários de "Edição de dados pessoais opcionais"); clicar em "Sair" desloga
- [x] 3.3 Adicionar ao `PerfilForm` o input de foto (`accept="image/*"`) ligado a `atualizarFoto`, exibindo a foto atual (própria ou do Google, via `next/image`) e atualizando a prévia após o envio — verificar manualmente: usuário logado via Google sem foto própria vê a foto do Google na página de perfil (spec - "Usuário do Google sem foto própria"); após enviar uma foto própria, ela passa a ser a exibida

## 4. Menu de avatar no Header

- [x] 4.1 Criar `src/components/ui/dropdown-menu.tsx`, wrapper fino sobre `@base-ui/react/menu` (Root, Trigger, Portal, Positioner, Popup, Item, LinkItem), no mesmo padrão de `select.tsx`/`combobox.tsx` (design.md #7) — verificar que `npm run build` compila
- [x] 4.2 Criar `src/components/HeaderUserMenu.tsx` (client component: `Menu.Trigger` renderiza a foto ou um ícone de fallback quando não há foto nenhuma; `Menu.LinkItem` para "Perfil" levando a `/perfil`; `Menu.Item` com `onClick={() => sair()}` para "Sair") e atualizar `Header.tsx` para calcular a foto exibida (helper da task 2.3) e renderizar `<HeaderUserMenu />` no lugar do e-mail + botão "Sair" atuais (design.md #7) — verificar manualmente: deslogado continua mostrando "Entrar"; logado mostra a foto (ou ícone de fallback) e, ao clicar, abre um menu com "Perfil" e "Sair"; "Perfil" navega para `/perfil"; "Sair" desloga (spec `autenticacao-usuarios` MODIFIED - "Usuário com sessão ativa")

## 5. Configuração do Next.js

- [x] 5.1 Em `next.config.ts`, definir `experimental.serverActions.bodySizeLimit: "5mb"` e adicionar o host do Storage do Supabase (o mesmo domínio de `NEXT_PUBLIC_SUPABASE_URL`) a `images.remotePatterns` (design.md #6) — verificar que `npm run build` compila e que a foto de perfil salva no Storage renderiza via `next/image` sem erro de host não permitido

## 6. Verificação end-to-end

- [x] 6.1 Logar, acessar `/perfil`, preencher parte dos campos, salvar, recarregar a página e conferir que os valores persistiram
- [x] 6.2 Enviar uma foto de perfil válida e conferir que aparece na página de perfil e no menu do Header; tentar enviar um arquivo inválido (não-imagem ou maior que 4MB) e conferir que é rejeitado sem alterar a foto atual
- [x] 6.3 Com uma conta logada via Google que nunca enviou foto própria, conferir que a foto do Google aparece automaticamente no perfil e no Header; depois de enviar uma foto própria, conferir que ela não é substituída pela foto do Google em um novo login (spec `perfil-usuario` - "Foto própria não é substituída por login futuro do Google")
- [x] 6.4 Rodar `npm run lint` e `npm run build` no projeto completo e confirmar que nenhum erro novo foi introduzido (comparar com os avisos pré-existentes já conhecidos no projeto)
