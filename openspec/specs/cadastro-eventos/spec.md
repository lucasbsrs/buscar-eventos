# Cadastro de Eventos Specification

## Purpose

Define quem pode cadastrar um evento no Eventaku e a quem o evento criado fica associado.

## Requirements

### Requirement: Cadastro de evento exige usuário autenticado
O sistema SHALL exigir uma sessão autenticada para cadastrar um evento. O sistema SHALL NOT criar um evento a partir de uma requisição sem sessão autenticada, mesmo que ela não passe pela tela de cadastro.

#### Scenario: Visitante sem sessão é impedido de acessar o cadastro
- **WHEN** um visitante sem sessão autenticada tenta acessar a página de cadastro de evento
- **THEN** ele é redirecionado para a tela de login em vez de ver o formulário

#### Scenario: Submissão sem sessão é rejeitada
- **WHEN** uma requisição para criar um evento chega sem uma sessão autenticada válida
- **THEN** o sistema rejeita a criação e nenhum evento é salvo

### Requirement: Retorno ao cadastro após login
O sistema SHALL retornar o usuário à página de cadastro de evento após ele se autenticar com sucesso, quando o login tiver sido acionado a partir dessa página.

#### Scenario: Usuário completa o login e volta ao formulário
- **WHEN** um visitante é redirecionado ao login a partir da página de cadastro de evento e completa a autenticação com sucesso
- **THEN** ele é levado de volta à página de cadastro de evento

### Requirement: Evento criado é associado ao autor autenticado
O sistema SHALL registrar o usuário autenticado como autor do evento no momento da criação.

#### Scenario: Evento criado registra o autor
- **WHEN** um usuário autenticado cadastra um evento com sucesso
- **THEN** o evento salvo tem esse usuário registrado como autor
