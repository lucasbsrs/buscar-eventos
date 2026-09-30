# Proposal

## Why

A busca por localização hoje aceita texto livre e casa por substring (`ilike '%termo%'`) contra `cidade_norm` e `estado`. Isso gera falsos positivos (ex: "SP" bate em qualquer cidade cujo nome contenha essas duas letras em sequência) e não tem suporte de índice eficiente para esse padrão de busca. Para o usuário, também não há nenhuma pista de quais cidades/estados realmente têm eventos — ele digita "no escuro" e só descobre se deu certo depois de ver (ou não ver) resultados.

## What Changes

- **BREAKING**: o filtro de localização deixa de ser um texto livre (`localizacao`) e passa a exigir a seleção de uma sugestão de uma lista (autocomplete). Não é mais possível submeter um termo livre que não bate exatamente com uma sugestão.
- O campo de busca de localização vira um combobox único que mistura itens de cidade (`"São Paulo, SP"`) e de estado inteiro (`"SP"`), com marcação visual distinta entre os dois tipos.
- As sugestões do autocomplete vêm exclusivamente de cidades/estados que já têm pelo menos um evento com `status = 'publicado'` — nunca sugerem um lugar sem eventos.
- A lista de sugestões é buscada no Server Component da home (junto com a busca de eventos) e passada como prop para o filtro, sem round-trip de rede adicional no cliente.
- O filtro passa a fazer correspondência exata (`estado` e, quando aplicável, `cidade`) em vez de `ilike` com normalização de acento.
- Os parâmetros de URL usados pelo filtro mudam de `localizacao` para `estado` e `cidade` (dois parâmetros explícitos).

## Capabilities

### New Capabilities
- `filtro-localizacao`: comportamento de busca/filtro de eventos por localização (cidade e estado), incluindo a fonte e a exatidão das sugestões oferecidas ao usuário.

### Modified Capabilities

(nenhuma — não existem specs de outras capacidades no projeto ainda)

## Impact

- `src/components/EventFilters.tsx`: campo de texto livre de localização substituído por um combobox com autocomplete obrigatório.
- `src/lib/db/eventos.ts`: `buscarEventos` passa a filtrar localização por igualdade exata em vez de `ilike`/normalização; nova função para listar as localizações disponíveis (distinct cidade/estado de eventos publicados).
- `src/app/page.tsx`: busca as localizações disponíveis e repassa como prop ao filtro.
- `src/app/api/eventos/route.ts`: parâmetros de query passam a ser `estado`/`cidade` em vez de `localizacao`.
- `src/types/evento.ts`: `FiltrosEvento.localizacao` é substituído por `estado`/`cidade`.
- Qualquer link ou favorito existente que use `?localizacao=` deixa de funcionar como filtro (parâmetro não reconhecido).
- `supabase/migration_unaccent.sql` (coluna gerada `cidade_norm` e seu índice): deixam de ser necessários para este filtro; decisão sobre remover ou manter fica registrada em `design.md`, não é aplicada nesta proposta.
