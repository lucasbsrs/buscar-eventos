# Autenticação de Usuários Specification

## Purpose

Define como um visitante cria uma conta e autentica no Eventaku, por e-mail e senha ou por login com o Google, e como o site reflete se há uma sessão ativa.

## Requirements

### Requirement: Cadastro de conta por e-mail e senha
O sistema SHALL permitir que um visitante crie uma conta informando e-mail e senha. O sistema SHALL rejeitar o cadastro quando o e-mail não tiver um formato válido ou a senha não atender ao critério mínimo de segurança definido pelo sistema.

#### Scenario: Cadastro com e-mail e senha válidos
- **WHEN** um visitante informa um e-mail em formato válido e uma senha que atende ao critério mínimo
- **THEN** uma conta é criada para esse e-mail

#### Scenario: Cadastro rejeitado por senha fraca
- **WHEN** um visitante tenta se cadastrar com uma senha que não atende ao critério mínimo de segurança
- **THEN** o cadastro é rejeitado e nenhuma conta é criada

### Requirement: Confirmação de e-mail obrigatória
O sistema SHALL exigir que o e-mail da conta seja confirmado antes que ela possa ser usada para logar ou cadastrar eventos. O sistema SHALL NOT autenticar uma conta cujo e-mail ainda não foi confirmado.

#### Scenario: Login bloqueado antes da confirmação
- **WHEN** um usuário que acabou de se cadastrar tenta logar antes de confirmar o e-mail
- **THEN** o login é recusado e o sistema informa que é necessário confirmar o e-mail

#### Scenario: Login liberado após confirmação
- **WHEN** um usuário confirma o e-mail através do link recebido e em seguida tenta logar com e-mail e senha corretos
- **THEN** o login é bem-sucedido

### Requirement: Login por e-mail e senha
O sistema SHALL autenticar um usuário com e-mail confirmado quando ele informar o e-mail e a senha corretos, iniciando uma sessão. O sistema SHALL NOT iniciar uma sessão quando a senha informada estiver incorreta.

#### Scenario: Login com credenciais corretas
- **WHEN** um usuário com e-mail confirmado informa o e-mail e a senha corretos
- **THEN** uma sessão é iniciada para esse usuário

#### Scenario: Login com senha incorreta
- **WHEN** um usuário informa um e-mail cadastrado e uma senha incorreta
- **THEN** o login é recusado e nenhuma sessão é iniciada

### Requirement: Login com Google
O sistema SHALL permitir que um visitante entre usando uma conta do Google. Quando não existir conta associada ao e-mail do Google usado, o sistema SHALL criar uma conta automaticamente a partir desse login.

#### Scenario: Primeiro acesso via Google
- **WHEN** um visitante sem conta prévia no Eventaku entra com uma conta do Google
- **THEN** uma conta é criada automaticamente associada a esse e-mail e uma sessão é iniciada

#### Scenario: Acesso recorrente via Google
- **WHEN** um usuário que já possui conta associada a esse e-mail do Google entra novamente com o Google
- **THEN** uma sessão é iniciada na conta existente, sem criar uma conta duplicada

### Requirement: Encerrar sessão
O sistema SHALL permitir que um usuário autenticado encerre sua sessão.

#### Scenario: Usuário sai da conta
- **WHEN** um usuário autenticado aciona a ação de sair
- **THEN** a sessão é encerrada e o sistema passa a tratá-lo como visitante

### Requirement: Indicação do estado de sessão
O sistema SHALL indicar de forma visível se há um usuário autenticado navegando no site.

#### Scenario: Visitante sem sessão
- **WHEN** ninguém está autenticado no navegador
- **THEN** o site exibe uma opção para entrar (login)

#### Scenario: Usuário com sessão ativa
- **WHEN** existe uma sessão autenticada ativa
- **THEN** o site exibe a foto de perfil do usuário no lugar da opção de entrar, e ao clicar nela é possível escolher entre ir para a página de perfil ou sair
