# Design

## Context

Hoje `buscarEventos` (`src/lib/db/eventos.ts`) filtra localização com `ilike` sobre `cidade_norm` (coluna gerada `lower(unaccent(cidade))`, ver `supabase/migration_unaccent.sql`) e sobre `estado`, mais uma tentativa manual de resolver nome de estado por extenso para sigla via `ESTADOS_NOMES`. `EventFilters.tsx` é um client component que lê/escreve parâmetros de URL diretamente (`localizacao`, `nome`, `tipo`, `data_inicio`, `data_fim`) e não recebe nenhuma prop de dados — tudo vem de `useSearchParams`.

O projeto já usa `@base-ui/react` como base para os componentes em `src/components/ui` (ver `select.tsx`, `popover.tsx`), sem `cmdk` ou outra lib de combobox. Ver proposal.md para a motivação da mudança.

## Goals / Non-Goals

**Goals:**
- Definir de onde vem a lista de sugestões, como ela é moldada e como é filtrada no cliente sem round-trip de rede.
- Definir o componente de combobox a usar e como ele distingue visualmente "cidade" de "estado".
- Definir a nova forma de filtrar no banco (correspondência exata) e o novo contrato de `FiltrosEvento`/parâmetros de URL/API.
- Decidir o que fazer com `cidade_norm`/`migration_unaccent.sql` nesta mudança.

**Non-Goals:**
- Busca "fuzzy" ou tolerante a erro de digitação nas sugestões (ex.: corrigir "Sao Paulo" sem acento) — o filtro de texto do combobox usa correspondência simples de substring: fora de escopo, não é requisito do spec.
- Paginação/virtualização da lista de sugestões — o volume esperado (cidades/estados distintos com eventos publicados) é pequeno.
- Migração ou remoção da coluna `cidade_norm`/índice/extensão `unaccent` no banco — decisão registrada abaixo, execução fica para uma mudança futura.

## Decisions

### 1. Combobox: usar `@base-ui/react/combobox`, sem nova dependência
O pacote `@base-ui/react` (já usado por `Select` e `Popover` em `src/components/ui`) expõe um primitivo `combobox` completo (`Root`, `Input`, `Popup`, `Item`, `Group`, `GroupLabel`, `Empty`, `Clear`, `Value`, `Collection`), com suporte a valor de item como objeto (`{ value, label }` ou customizado via `itemToStringLabel`/`isItemEqualToValue`) e a `value`/`onValueChange` controlados.
- **Alternativas consideradas**: adicionar `cmdk` (padrão comum em shadcn) — rejeitado por introduzir uma segunda lib de combobox quando o projeto já padronizou em `@base-ui/react`; implementar um combobox do zero sobre `Popover` + `Input` — rejeitado por reimplementar teclado/ARIA que o primitivo já resolve.
- Criar `src/components/ui/combobox.tsx` seguindo o mesmo padrão de wrapper fino (`data-slot`, `cn(...)`) usado em `select.tsx`/`popover.tsx`.

### 2. Modelo de valor do item
Cada sugestão é um objeto:
```ts
type LocalizacaoSugestao =
  | { tipo: "estado"; estado: string; label: string }
  | { tipo: "cidade"; estado: string; cidade: string; label: string };
```
`label` já vem pronto do servidor (`"São Paulo, SP"` para cidade, `"SP"` para estado) para não duplicar formatação no cliente. Igualdade de item usa `isItemEqualToValue` comparando `tipo` + `estado` + `cidade`.

### 3. Distinção visual cidade/estado: `Combobox.Group` + `Combobox.GroupLabel`
As sugestões são agrupadas em duas seções ("Estados" e "Cidades") usando `Combobox.Group`/`GroupLabel`, e cada `Combobox.Item` de estado recebe um ícone diferente do de cidade (ex.: `MapPin` vs. `Map` de `lucide-react`, já uma dependência do projeto). Atende ao requisito "Sugestões distinguem cidade e estado inteiro" sem exigir nenhuma lib nova.
- **Alternativa considerada**: um badge de texto ("Estado"/"Cidade") ao lado do label — descartada em favor de ícone + agrupamento, mais compacto e já é o padrão de agrupamento nativo do primitivo.

### 4. Estado aparece como sugestão sempre que há evento publicado nele
O requisito do spec ("Estado com eventos em múltiplas cidades aparece como item de estado") só cobre explicitamente o caso de múltiplas cidades. Decisão: mostrar a sugestão de estado sempre que existir pelo menos um evento publicado nesse estado (independente do número de cidades distintas) — é um superconjunto que já satisfaz o cenário descrito, evita uma regra especial ("só mostrar estado se >1 cidade") e mantém a consulta de sugestões simples (um único `select distinct estado, cidade`). Selecionar o estado nesse caso apenas amplia a busca para "qualquer cidade desse estado", o que é coerente mesmo com uma única cidade hoje.

### 5. Fonte e formato das sugestões: nova função no data layer
Nova função em `src/lib/db/eventos.ts`:
```ts
export async function listarLocalizacoesDisponiveis(): Promise<LocalizacaoSugestao[]>
```
Implementação: `select("cidade, estado").eq("status", "publicado")` e depois deduplicação/agrupamento em memória (JS) — o cliente Supabase-js não expõe `DISTINCT` diretamente e o volume de linhas (eventos publicados) é pequeno o suficiente para deduplicar em memória sem custo relevante. Gera as duas listas (estados distintos, pares cidade+estado distintos) e monta os objetos `LocalizacaoSugestao` com `label` pronto.
- **Alternativa considerada**: view/RPC no Postgres com `DISTINCT` — descartada por adicionar uma migração de banco a uma mudança cujo escopo (proposal.md) é a camada de aplicação; pode ser revisitada se o volume crescer.
- `LocalizacaoSugestao` fica em `src/types/evento.ts`, junto dos outros tipos do domínio.

### 6. Busca das sugestões: Server Component dedicado + `Suspense`, seguindo o padrão de `ListaEventos`
`EventFilters` passa a receber `locations: LocalizacaoSugestao[]` como prop em vez de buscar nada. Para não bloquear o primeiro paint da home (hero + shell dos filtros) enquanto a query de localizações roda, `src/app/page.tsx` ganha um componente async dedicado, no mesmo padrão que já existe para `ListaEventos`:
```tsx
async function FiltrosComLocalizacoes() {
  const locations = await listarLocalizacoesDisponiveis();
  return <EventFilters locations={locations} />;
}
```
renderizado como `<Suspense fallback={<EventFiltersSkeleton />}><FiltrosComLocalizacoes /></Suspense>`, substituindo o `<Suspense><EventFilters /></Suspense>` atual (que hoje só existe por causa do requisito do Next de envolver `useSearchParams` em `Suspense`, já que `EventFilters` não busca nada). `EventFiltersSkeleton` é um placeholder estático do mesmo layout (inputs desabilitados) para evitar salto de layout.
- **Alternativa considerada**: buscar localizações no topo de `Home` e passar como prop, sem novo `Suspense` — descartada porque bloquearia o retorno de `Home` (e portanto o hero) até a query de localizações terminar, perdendo o streaming que a página já tem hoje.

### 7. Filtro de texto no combobox: usa o filtro client-side padrão do primitivo
Como a lista completa já chega via prop (sem round-trip), a digitação no combobox filtra em memória usando o comportamento default de `Combobox.Root` (substring, case-insensitive) sobre `label`. Não é implementada normalização de acento no cliente (ver Non-Goals) — os exemplos do spec ("curi" → "Curitiba") não exigem isso.

### 8. Filtro exato no banco: `estado` obrigatório para filtrar por `cidade`
```ts
if (filtros.cidade) {
  query = query.eq("cidade", filtros.cidade).eq("estado", filtros.estado);
} else if (filtros.estado) {
  query = query.eq("estado", filtros.estado);
}
```
Um filtro de cidade sempre inclui também o `estado` da sugestão selecionada, mesmo internamente — nomes de cidade se repetem entre estados brasileiros (ex.: existe mais de uma cidade "Bom Jesus"), então filtrar só por `cidade` produziria falsos positivos entre estados. Isso é interno a `buscarEventos`: o combobox só emite pares `cidade`+`estado` consistentes (nunca cidade sem estado), então a UI não precisa se preocupar com isso.
Toda a lógica de `normalizar()` e o cruzamento de `ESTADOS_NOMES` por nome por extenso é removida de `eventos.ts` — não é mais necessária com correspondência exata.

### 9. Contrato de dados: `localizacao` → `estado` + `cidade`
- `FiltrosEvento.localizacao?: string` é removido; adiciona `estado?: string` e `cidade?: string`.
- `src/app/api/eventos/route.ts` lê `estado`/`cidade` da query string em vez de `localizacao`.
- `EventFilters` escreve/lê `estado` e `cidade` na URL (em vez de `localizacao`), e limpa os dois juntos ao limpar a localização (um único valor de combobox controla ambos os parâmetros).
- Todo o contrato muda em um único deploy atômico (release da UI nova junto com a API nova) — não há período intermediário em que cliente antigo fale com API nova ou vice-versa, então não é necessário suporte a ambos os formatos em paralelo.

### 10. `cidade_norm` / `migration_unaccent.sql`: mantidos, sem migração nesta mudança
A coluna gerada, o índice e a extensão `unaccent` deixam de ser lidos por `buscarEventos`, mas nenhuma migração de remoção é feita aqui. Motivo: remover coluna/índice é uma operação de banco com seu próprio raio de risco, e o proposal já registra explicitamente essa decisão como fora do escopo desta mudança (ver proposal.md - Impact). Fica como possível limpeza futura, depois de validar em produção que o novo filtro está correto.

## Risks / Trade-offs

- **BREAKING**: links/favoritos salvos com `?localizacao=...` param silenciosamente deixam de filtrar (parâmetro não reconhecido) → aceito pelo proposal; sem mitigação nesta mudança.
- `cidade_norm`/índice ficam órfãos no banco (gravados a cada insert, nunca lidos) → mitigação: cleanup registrado como follow-up (decisão 10), não bloqueia esta mudança.
- Um novo `Suspense` em torno dos filtros atrasa a interatividade de *todos* os filtros (não só localização) até a query de localizações responder → mitigação: `EventFiltersSkeleton` com o mesmo layout para evitar salto visual; a query é uma leitura simples e pequena.
- Filtro de texto do combobox não é tolerante a acento/maiúsculas de forma customizada, só o comportamento default do primitivo → aceito como Non-Goal; revisitar se usuários reportarem problema real.
