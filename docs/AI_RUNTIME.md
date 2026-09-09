# Runtime de IA do Synapse

O runtime de IA é exclusivamente server-side. Cada execução exige identidade autenticada, `organizationId`, `propertyId` e ator derivados pelos middlewares; valores enviados no body não definem tenant.

## Provider e testes

`GeminiAiProvider` é usado em runtime. Sem `GEMINI_API_KEY`, produção falha fechada com erro de configuração; não há `fallback_mock`. Em testes, `DeterministicFakeAiProvider` é usado e não chama Gemini ou outro serviço externo.

## Contexto e privacidade

`ContextService.getContextForAgent` seleciona blocos mínimos por agente. A política remove documentos, dados de pagamento, tokens, secrets, e-mail, telefone, notas internas e identidade de hóspede por padrão. Conteúdo operacional e mensagens são delimitados como dados não confiáveis, nunca como instruções do sistema.

## Ações e governança

O catálogo `AGENT_ACTION_ALLOWLIST` só permite recomendações e propostas tipadas nesta fase. Não há execução direta por texto do modelo. Ações de decisão e planejamento exigem aprovação e usam as permissões existentes `view_dashboard` e `manage_planning`. Ações sem mapeamento RBAC semântico ficam `BLOCKED_BY_RBAC_MAPPING`.

São rejeitadas ações de cancelamento/exclusão de reservas, pagamento/refund, alteração de permissões, tenant, secrets ou dados. Execução operacional continua a passar pelos módulos Decision, Approval, Planning e Execution.

## Auditoria

Cada execução bem-sucedida gera um `aiRuns` server-only, com tenant, ator, agente, tipos de ação e resumo sanitizado. A coleção é `default-deny` nas Firestore Rules e não guarda prompt integral, PII, credenciais, tokens ou dados de pagamento.

## Operação

Variável necessária em runtime: `GEMINI_API_KEY`, somente no servidor. A validação final de Firestore Rules/transactions continua sendo release gate em CI ou ambiente isolado com Emulator; nenhum teste deve usar Firestore de produção.
