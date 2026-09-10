# Auditoria do Firebase Web SDK

## Regra de runtime

Em staging e produção, `services/apiService.ts` calcula `allowDevelopmentFixtures`
com `import.meta.env.DEV`. Quando falso, listeners do Firestore Web não são
iniciados como fonte operacional, todas as escritas via `saveToFirestore` e
`deleteFromFirestore` falham fechadas e o estado PMS é carregado apenas pelas
APIs canônicas autenticadas.

| Classificação | Escopo | Decisão |
| --- | --- | --- |
| A — DEMO_ONLY | Fixtures, `localDefaultDb`, `saveToFirestore`, `deleteFromFirestore` e mutações legadas em `apiService` | Permitidos somente com `import.meta.env.DEV`; bloqueados em staging/produção. |
| B — SAFE_CLIENT_READ | Firebase Auth no navegador e configuração pública Firebase | Necessários para login e obtenção do bearer token; não são autoridade de tenant nem financeira. |
| C — LIVE_OPERATIONAL_INVALID | Escrita direta do browser em reservations, payment records, guest identities, rooms/units ou tarefas | Não permitida. Ações canônicas usam APIs PMS, CRM, housekeeping, public booking e payment core. |
| D — AUTH/INFRASTRUCTURE_JUSTIFIED | Inicialização Firebase/Auth e obtenção de ID token | Mantidos, pois são o limite de autenticação do cliente. |

## Calendário

`CalendarView` consome o estado PMS canônico já hidratado pelo runtime. Em
staging/produção, criação por seleção e drag/drop/resize permanecem desabilitados
porque não existe endpoint de alteração de estadia com garantia transacional de
`occupancyLocks`. Blocos legados também não são renderizados fora de demo.

## Identificadores legados e multi-propriedade

`org_dev_default`, `prop_dev_default`, `beach`, `sanctuary`, `P01` e `P02`
foram classificados como **DEMO/FIXTURE_TEST** quando aparecem em fixtures,
branding ou no ramo `allowDevelopmentFixtures`. Eles não são usados para
resolver tenant ou property em staging/produção: o contexto operacional vem da
sessão SaaS autenticada e os serviços canônicos rejeitam contexto ausente.

Os métodos legados de POS, mesas, despesas, delivery, projetos e tarefas que
ainda possuem normalizações como `propertyId || 'beach'` pertencem ao ramo demo
de `apiService`; qualquer tentativa de persistência pelo browser em runtime
live falha com `CLIENT_FIRESTORE_WRITES_DISABLED`. A migração desses módulos
para APIs canônicas continua necessária antes de anunciá-los como operação live.

## Limite conhecido

Módulos legados de POS, finanças, projetos e operações continuam disponíveis como
fixtures no modo demo. Eles não podem ser tratados como funcionalidades
operacionais em staging/produção até serem migrados para APIs canônicas próprias.

## Evidência de bloqueio e pendências concretas

O bloqueio de persistência é centralizado em `services/apiService.ts` nas funções
`saveToFirestore` e `deleteFromFirestore`: fora de `import.meta.env.DEV`, ambas
lançam `CLIENT_FIRESTORE_WRITES_DISABLED` antes de chamar o Firebase Web SDK.
Além disso, `startSync` retorna antes de criar qualquer `onSnapshot` em runtime
live. Portanto, não há escrita operacional direta ativa no browser em staging.

As telas abaixo ainda são **demo-only/fail-closed em live**, e não devem ser
rotuladas como integrações canônicas até terem APIs próprias:

| Arquivo | Função/trecho | Motivo do bloqueio |
| --- | --- | --- |
| `components/admin/POSView.tsx` | filtros e mesas `propertyId || 'beach'` | não existe API canônica de POS/mesas nesta superfície. |
| `components/admin/FinancialManagerView.tsx` | agregação de transações/despesas por `db` | não existe API financeira canônica para essas mutações. |
| `components/admin/ProjectsView.tsx` | `TaskDetailModal.handleSave` | tarefas/comentários/anexos dependem do contrato legado de `db`. |
| `components/admin/dashboards/FinanceDashboard.tsx` | `todayStats` e seletor Beach/Santuário | depende de bookings/transações/despesas legados. |
| `components/admin/dashboards/ManagerDashboard.tsx` | `operationalData` | lê reviews/tarefas do `db` legado. |
| `components/admin/dashboards/ReceptionDashboard.tsx` | check-in/check-out via props legadas | precisa ser substituído pelo runtime Reception canônico antes de uso live. |

Essas telas não podem ser corrigidas sem introduzir múltiplas APIs de domínio
(POS, financeiro, projetos e gestão de pessoas), o que excede o escopo P0 de
segurança e criaria uma arquitetura paralela. O bloqueio central impede que
elas modifiquem Firestore em staging/produção; a navegação live deve expor
apenas os módulos canônicos já integrados.
