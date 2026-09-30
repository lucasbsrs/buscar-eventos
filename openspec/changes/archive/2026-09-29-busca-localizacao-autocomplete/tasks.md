# Tasks

## 1. Camada de dados: contrato e filtro exato

- [x] 1.1 Em `src/types/evento.ts`, trocar `FiltrosEvento.localizacao?: string` por `estado?: string` e `cidade?: string`, e adicionar o tipo `LocalizacaoSugestao` (união cidade/estado com `label`, ver design.md #2)
- [x] 1.2 Reescrever o filtro de localização em `buscarEventos` (`src/lib/db/eventos.ts`) para correspondência exata: `estado` sozinho filtra por estado, `cidade` sempre vem acompanhada de `estado` (design.md #8); remover a função `normalizar()` e o cruzamento por `ESTADOS_NOMES` (import incluso), que deixam de ser necessários
- [x] 1.3 Adicionar `listarLocalizacoesDisponiveis()` em `src/lib/db/eventos.ts`: busca `cidade, estado` de eventos com `status = publicado`, deduplica em memória e retorna `LocalizacaoSugestao[]` com estados (sempre que houver ao menos um evento publicado no estado, design.md #4) e cidades (par cidade+estado distinto, design.md #5)
- [x] 1.4 Atualizar `src/app/api/eventos/route.ts` para ler `estado`/`cidade` da query string em vez de `localizacao`
- [x] 1.5 Atualizar `src/app/page.tsx` para montar `filtros` a partir de `params.estado`/`params.cidade` em vez de `params.localizacao`
- [x] 1.6 Verificar que `npm run build` compila sem erros, sem nenhuma referência restante a `FiltrosEvento.localizacao`

## 2. Combobox de localização (UI)

- [x] 2.1 Criar `src/components/ui/combobox.tsx`, wrapper fino sobre `@base-ui/react/combobox` (Root, Input, Popup, Item, Group, GroupLabel, Empty, Clear, Value), no mesmo padrão de `data-slot`/`cn(...)` usado em `select.tsx` e `popover.tsx` (design.md #1); verificar que `npm run build` compila com o novo arquivo
- [x] 2.2 Em `EventFilters.tsx`, substituir o `Input` de texto livre de localização pelo novo combobox recebendo `locations: LocalizacaoSugestao[]` como prop; ao selecionar um item, gravar `estado`(+`cidade`, se aplicável) na URL, e ao limpar a seleção (`Combobox.Clear`), remover os dois parâmetros juntos (design.md #9); texto digitado sem seleção não deve alterar a URL (spec: "Usuário digita texto e não seleciona nenhuma sugestão")
- [x] 2.3 Agrupar as sugestões em duas seções ("Estados" e "Cidades") com `Combobox.Group`/`GroupLabel` e ícones distintos por tipo (design.md #3), e exibir `Combobox.Empty` quando nenhuma sugestão corresponde ao texto digitado
- [x] 2.4 Criar `EventFiltersSkeleton` com o mesmo layout de `EventFilters` (inputs desabilitados) para servir de fallback de carregamento (design.md #6)
- [x] 2.5 Rodar `npm run dev`, abrir a home, digitar o início do nome de uma cidade conhecida da base, selecionar a sugestão de cidade e conferir que a URL passa a ter `?estado=..&cidade=..`; repetir selecionando uma sugestão de estado e conferir que só `estado` é setado

## 3. Integração na home com streaming

- [x] 3.1 Em `src/app/page.tsx`, criar o componente async `FiltrosComLocalizacoes` (chama `listarLocalizacoesDisponiveis()` e renderiza `<EventFilters locations={...} />`) e trocar o atual `<Suspense><EventFilters /></Suspense>` por `<Suspense fallback={<EventFiltersSkeleton />}><FiltrosComLocalizacoes /></Suspense>` (design.md #6)
- [x] 3.2 Com `npm run dev`, verificar que o hero da home aparece imediatamente e o bloco de filtros aparece logo em seguida (skeleton visível brevemente), sem erros no console do navegador nem no terminal

## 4. Verificação end-to-end dos cenários do spec

- [x] 4.1 Com dados reais/seed no Supabase, verificar manualmente cada cenário de `specs/filtro-localizacao/spec.md`: (a) cidade com evento publicado aparece nas sugestões e cidade sem evento publicado não aparece; (b) selecionar uma sugestão de cidade aplica o filtro e retorna só eventos dessa cidade+estado; (c) selecionar uma sugestão de estado retorna eventos de todas as cidades desse estado; (d) digitar texto sem selecionar nenhuma sugestão não aplica filtro algum; (e) limpar a localização selecionada remove o filtro e volta a listar todos os eventos
- [x] 4.2 Rodar `npm run lint` e `npm run build` no projeto completo e confirmar que ambos passam sem erros
