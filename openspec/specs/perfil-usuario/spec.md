# Perfil de Usuário Specification

## Purpose

Define a página de perfil do usuário logado: quais dados complementares ele pode ver e editar, como a foto de perfil é definida (enviada por ele ou vinda do Google), e o acesso à ação de sair a partir dessa página.

## Requirements

### Requirement: Página de perfil exige usuário autenticado
O sistema SHALL exigir uma sessão autenticada para acessar a página de perfil.

#### Scenario: Visitante sem sessão é impedido de acessar o perfil
- **WHEN** um visitante sem sessão autenticada tenta acessar a página de perfil
- **THEN** ele é redirecionado para a tela de login em vez de ver a página de perfil

### Requirement: Edição de dados pessoais opcionais
O sistema SHALL permitir que o usuário autenticado salve nome, sobrenome, data de nascimento, cidade e estado. Nenhum desses campos SHALL ser obrigatório para salvar o perfil.

#### Scenario: Usuário salva o perfil parcialmente preenchido
- **WHEN** o usuário preenche apenas o nome e salva o perfil
- **THEN** o perfil é salvo com o nome informado e os demais campos vazios

#### Scenario: Usuário salva o perfil totalmente vazio
- **WHEN** o usuário aciona salvar sem preencher nenhum campo
- **THEN** o perfil é salvo sem erro, com todos os campos vazios

### Requirement: Upload de foto de perfil
O sistema SHALL permitir que o usuário autenticado envie uma imagem como foto de perfil, substituindo qualquer foto anterior. O sistema SHALL rejeitar um envio que não seja um formato de imagem suportado ou que exceda o tamanho máximo permitido, sem alterar a foto de perfil atual.

#### Scenario: Envio de foto válida
- **WHEN** o usuário envia um arquivo de imagem dentro do formato e tamanho suportados
- **THEN** a foto de perfil é atualizada e passa a ser exibida no lugar da anterior

#### Scenario: Envio rejeitado por formato ou tamanho
- **WHEN** o usuário tenta enviar um arquivo que não é uma imagem suportada, ou que excede o tamanho máximo permitido
- **THEN** o envio é rejeitado e a foto de perfil atual permanece inalterada

### Requirement: Foto padrão a partir da conta Google
Quando o usuário autenticado por meio do Google nunca tiver enviado uma foto de perfil própria, o sistema SHALL exibir a foto atual da conta Google como foto de perfil. O sistema SHALL NOT substituir automaticamente uma foto de perfil enviada pelo usuário por uma foto vinda do Google.

#### Scenario: Usuário do Google sem foto própria
- **WHEN** um usuário autenticado via Google nunca enviou uma foto de perfil própria
- **THEN** a foto atual da conta Google usada no login é exibida como foto de perfil

#### Scenario: Foto própria não é substituída por login futuro do Google
- **WHEN** um usuário que já enviou uma foto de perfil própria loga novamente com uma conta Google cuja foto mudou
- **THEN** a foto de perfil exibida continua sendo a foto própria enviada anteriormente

### Requirement: Encerrar sessão a partir do perfil
O sistema SHALL oferecer, na página de perfil, uma forma de encerrar a sessão do usuário autenticado.

#### Scenario: Usuário sai da conta pela página de perfil
- **WHEN** o usuário autenticado aciona a ação de sair na página de perfil
- **THEN** a sessão é encerrada e o sistema passa a tratá-lo como visitante
