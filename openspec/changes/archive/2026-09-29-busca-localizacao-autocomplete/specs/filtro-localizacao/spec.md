# Spec Delta

## Purpose

Define como o usuário encontra e seleciona uma localização (cidade ou estado) para filtrar a lista de eventos, garantindo que toda sugestão oferecida corresponda a eventos que realmente existem.

## ADDED Requirements

### Requirement: Sugestões vêm apenas de eventos publicados
O sistema SHALL oferecer, como sugestões de localização, apenas cidades e estados que tenham pelo menos um evento com `status = publicado`. O sistema SHALL NOT sugerir uma cidade ou estado sem nenhum evento publicado associado.

#### Scenario: Cidade com eventos publicados aparece nas sugestões
- **WHEN** existe pelo menos um evento publicado em "Curitiba, PR"
- **THEN** "Curitiba, PR" aparece na lista de sugestões de localização

#### Scenario: Cidade sem eventos publicados não aparece nas sugestões
- **WHEN** não existe nenhum evento com `status = publicado` em "Manaus, AM" (pode haver eventos com outro status)
- **THEN** "Manaus, AM" não aparece na lista de sugestões de localização

### Requirement: Seleção de localização é obrigatória
O sistema SHALL exigir que o usuário escolha uma sugestão da lista para aplicar um filtro de localização. O sistema SHALL NOT aplicar como filtro um texto digitado que não corresponda exatamente a uma sugestão disponível.

#### Scenario: Usuário escolhe uma sugestão da lista
- **WHEN** o usuário digita "curi" e seleciona a sugestão "Curitiba, PR"
- **THEN** o filtro de localização é aplicado para "Curitiba, PR"

#### Scenario: Usuário digita texto e não seleciona nenhuma sugestão
- **WHEN** o usuário digita "curitibaaaa" (sem corresponder a nenhuma sugestão) e não seleciona nenhum item da lista
- **THEN** nenhum filtro de localização é aplicado à busca de eventos

### Requirement: Sugestões distinguem cidade e estado inteiro
O sistema SHALL oferecer, na mesma lista de sugestões, itens que representam uma cidade específica (ex: "São Paulo, SP") e itens que representam um estado inteiro (ex: "SP"). O sistema SHALL exibir esses dois tipos de item de forma visualmente distinguível na lista de sugestões.

#### Scenario: Estado com eventos em múltiplas cidades aparece como item de estado
- **WHEN** existem eventos publicados em mais de uma cidade do estado "SP"
- **THEN** "SP" aparece como sugestão de estado, além das sugestões de cada cidade individual

### Requirement: Filtro aplica correspondência exata
O sistema SHALL filtrar eventos por correspondência exata com a cidade e/ou estado selecionados na sugestão escolhida, sem correspondência parcial ou aproximada.

#### Scenario: Seleção de uma cidade filtra apenas eventos dessa cidade e estado
- **WHEN** o usuário seleciona a sugestão "Curitiba, PR"
- **THEN** a busca retorna apenas eventos publicados cuja cidade seja exatamente "Curitiba" e estado seja exatamente "PR"

#### Scenario: Seleção de um estado filtra eventos de todas as cidades do estado
- **WHEN** o usuário seleciona a sugestão de estado "SP"
- **THEN** a busca retorna eventos publicados de qualquer cidade cujo estado seja exatamente "SP"

### Requirement: Limpar filtro de localização
O sistema SHALL permitir que o usuário remova a localização selecionada, voltando a busca de eventos ao estado sem filtro de localização.

#### Scenario: Usuário limpa a localização selecionada
- **WHEN** o usuário tem uma localização selecionada e aciona a ação de limpar esse filtro
- **THEN** a busca de eventos deixa de considerar qualquer filtro de cidade ou estado
