# Arquitetura e Classificação da Suíte de Testes — Synapse Hospitality

Este documento estabelece a organização conceitual e de execução dos testes automatizados do Synapse Hospitality, garantindo determinismo, isolamento de rede e reprodutibilidade local sem dependência de credenciais externas.

---

## 1. Classificação Conceitual da Suíte

### A) Testes Unitários (Unit Tests)
- **Escopo**: Lógica pura de domínio, validações de payload, algoritmos, máquinas de estado, parsers, isolamento de tenant em memória e manipulação de entidades.
- **Isolamento**: 100% isolados de chamadas de rede externa, bancos de dados reais e serviços terceiros.
- **Principais Componentes**:
  - `GoalStateMachine`, `GoalRegistry`, `GoalPlanner` (`/server/modules/ai/goals/*`)
  - `AgentRouter`, `AgentEventBus`, `AgentSharedMemory` (`/server/modules/ai/orchestrator/*`)
  - Repositórios com mock local de banco em memória (`/server/test/mockFirestore.ts`)
  - Middlewares de autorização e tenant (`tenantMiddleware.test.ts`, `multiTenancyIsolation.test.ts`)

### B) Testes de Integração (Integration Tests)
- **Escopo**: Integração entre múltiplos módulos e serviços internos (ex.: `ExecutiveService`, `RevenueService`, `PlanningService`, `DecisionService`, `ApprovalService`, `ContextService`).
- **Infraestrutura**: Utilizam infraestrutura mockada localmente (`createMockFirestore`, mock de autenticação com ID tokens válidos e stub da API do Google Gemini).
- **Garantia**: Nenhuma conexão de rede remota (gRPC/HTTPS) é disparada; testes executam em menos de 100ms por suíte.

### C) Testes End-to-End (E2E Tests)
- **Escopo**: Validação dos fluxos completos de negócio da plataforma, simulando o ciclo de vida operacional:
  - Criação de planos estratégicos e metas autônomas.
  - Orquestração de múltiplos agentes com eventos e deliberação humana fechada (*Closed-Loop Deliberation*).
  - Verificação rigorosa do ADR-005: tarefas que requerem autorização humana entram em status `WAITING_APPROVAL`, geram itens no `ApprovalRepository`, e retomam a execução apenas após intervenção e decisão do usuário (`APPROVED` ou `REJECTED`).
  - Rotas da API REST (`/api/v1/*`) com autenticação, tenant isolation e resposta JSON estruturada (`apiRoutesE2E.test.ts`, `closedLoopAndGovernance.test.ts`).

### D) Testes de Integração Externa (External Integration Tests - Staging/Prod)
- **Escopo**: Testes que intencionalmente validam credenciais e contratos de API com serviços de terceiros reais:
  - Aloha PMS REST API & Webhooks
  - Beds24 OTA Channel Manager Sync
  - Stripe Payments Gateway
  - Google Gemini AI Live Generation (com cota corporativa)
- **Política**: NÃO são executados durante o runner de CI padrão (`vitest run`). Devem ser executados exclusivamente em pipelines dedicados ou sob demanda via flags de ambiente (`RUN_EXTERNAL_INTEGRATION_TESTS=true`).

---

## 2. Padrão de Mocking Determinístico

Para garantir que a suíte padrão execute com 100% de sucesso sem credenciais:
1. **Firestore In-Memory Mock**: Implementado em `/server/test/mockFirestore.ts`. Fornece suporte completo para `collection()`, `doc()`, `get()`, `set()`, `update()`, `delete()`, `where()`, `orderBy()`, `limit()` e transações em memória.
2. **Firebase Admin Auth Mock**: Mockado via `vi.mock('../../config/firebaseAdmin')` retornando tokens verificados com papéis de `DIRECTOR`, `MANAGER`, `OPERATOR`.
3. **Google GenAI Mock**: Mockado com `class MockGoogleGenAI` para fornecer respostas determinísticas imediatas sem consumir cota de IA ou gerar timeouts.

---

## 3. Comandos de Execução

```bash
# Executar a suíte padrão completa (Unit + Integration + E2E com infraestrutura local mockada):
npm test
# ou:
./node_modules/.bin/vitest run --maxWorkers=1

# Executar testes com cobertura de código:
npm run test -- --coverage
```
