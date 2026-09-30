# Spec Delta

## MODIFIED Requirements

### Requirement: Indicação do estado de sessão
O sistema SHALL indicar de forma visível se há um usuário autenticado navegando no site.

#### Scenario: Visitante sem sessão
- **WHEN** ninguém está autenticado no navegador
- **THEN** o site exibe uma opção para entrar (login)

#### Scenario: Usuário com sessão ativa
- **WHEN** existe uma sessão autenticada ativa
- **THEN** o site exibe a foto de perfil do usuário no lugar da opção de entrar, e ao clicar nela é possível escolher entre ir para a página de perfil ou sair
