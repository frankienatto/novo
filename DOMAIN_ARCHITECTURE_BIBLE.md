# 🏛️ DOMAIN ARCHITECTURE BIBLE — SYNAPSE HOSPITALITY (VERSÃO 1.0)
> **Constituição Técnica e Arquitetural Definitiva da Plataforma Synapse Hospitality**  
> **Data de Emissão:** 04 de Agosto de 2026  
> **Status:** Aprovado & Vigente (Constituição Técnica Oficial)  
> **Padrões de Arquitetura:** DDD, Event-Driven Architecture, Modular Monolith, Clean Architecture, Distributed AI Agents Engine, Multi-Tenant Native & ADR-005.

---

## 1. DOMAIN-DRIVEN DESIGN (DDD) & BOUNDED CONTEXTS

A plataforma **Synapse Hospitality** adota o modelo de **Monólito Modular orientado a Eventos (*Modular Monolith with Event-Driven Communication*)**. Cada Bounded Context é isolado acoplado frouxamente, encapsulando suas próprias regras de negócio, entidades, agregados e repositórios.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             SYNAPSE BOUNDED CONTEXTS                             │
│                                                                                  │
│ ┌────────────────────────┐  ┌────────────────────────┐  ┌──────────────────────┐ │
│ │  PMS & Operations      │  │  Revenue & Channels    │  │  CRM & Guest Journey │ │
│ │  (Bookings, Rooms,     │  │  (Rate Manager,        │  │  (Guests, Profiles,  │ │
│ │   Housekeeping, Maint) │  │   Channel Manager, OTA)│  │   OmniChannel, AI)   │ │
│ └───────────┬────────────┘  └───────────┬────────────┘  └──────────┬───────────┘ │
└─────────────┼───────────────────────────┼──────────────────────────┼─────────────┘
              │                           │                          │
              ▼                           ▼                          ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            SYNAPSE EVENT BUS & ROUTER                            │
│           (Publica e Distribui Eventos de Domínio para Todos os Módulos)         │
└─────────────┬───────────────────────────┬──────────────────────────┬─────────────┘
              │                           │                          │
              ▼                           ▼                          ▼
┌─────────────┴────────────┐  ┌───────────┴────────────┐  ┌───────────┴───────────┐ │
│ Finance & Retail         │  │ Marketing & Growth     │  │ Executive & Governance│ │
│ (Financial, POS,         │  │ (Campaigns, Social,    │  │ (Decision Center,     │ │
│  Inventory, Procurement) │  │  Email Autopilot, Ads) │  │  Approval, Planning)  │ │
└──────────────────────────┘  └────────────────────────┘  └───────────────────────┘ │
```

---

## 2. MAPA DE DOMÍNIOS DETALHADO

O sistema é subdividido em 8 Macro-Contextos e 32 Subdomínios Especializados:

| Macro-Contexto | Subdomínios Integrantes | Responsabilidades Principais |
| :--- | :--- | :--- |
| **1. Property & Operations** | `Rooms`, `Accommodations`, `Beds`, `Housekeeping`, `Maintenance`, `Reception` | Gestão física de unidades, leitos, ciclo de limpeza de quartos, manutenção preventiva e fluxo presencial de check-in/out. |
| **2. Sales & Distribution** | `Bookings`, `DirectBooking`, `ChannelManager`, `RateManager`, `Pricing` | Ciclo de vida da reserva, precificação dinâmica, paridade de tarifas e sincronização OTA bidirecional (Booking, Airbnb, Expedia). |
| **3. Guest Experience & CRM** | `Guests`, `GuestJourney`, `OmniChannel`, `ConciergeAI`, `Reputation` | Perfil 360° do hóspede, histórico de estadias, atendimento multicanal (WhatsApp/Chat), IA de recomendação de serviços e gestão de avaliações. |
| **4. Finance & Retail** | `Financial`, `POS`, `Inventory`, `Procurement`, `Suppliers` | Fluxo de caixa, DRE em tempo real, lançamento de consumo no quarto, controle de estoque de bar/insumos e cotações de compras. |
| **5. Marketing & Growth** | `Marketing`, `AdCampaigns`, `SocialMedia`, `ContentStudio`, `EmailAutopilot` | Automação de réguas de comunicação, gestão de tráfego pago (Meta/Google Ads), criação de peças publicitárias por IA e estratégias de retenção. |
| **6. Team & Governance** | `Staff`, `TeamManager`, `Projects`, `Security` | Gestão de colaboradores, permissões de acesso (RBAC), escala de trabalho preditiva, projetos de obras e monitoramento CFTV/IoT. |
| **7. Multi-Tenant SaaS** | `SaaSAdmin`, `Organizations`, `Properties`, `Subscriptions` | Isolamento multi-inquilino, faturamento recorrente via Stripe, gestão de licenças e provisão de novas propriedades. |
| **8. AI & Executive Governance** | `Executive`, `DecisionCenter`, `ApprovalEngine`, `Planning`, `ExecutionTracker` | Orquestração do Executive Agent, consolidação do Health Score, fila de aprovação humana (ADR-005) e rastreamento de planos de ação. |

---

## 3. RELAÇÃO ENTRE DOMÍNIOS E MATRIZ DE ISOLAMENTO

### 3.1 Regras Rígidas de Dependência
1. **NUNCA Invocação Direta de Estado:** Um domínio jamais altera a tabela/coleção de outro domínio diretamente. Toda modificação cruzada deve ocorrer via **Eventos de Domínio (*Domain Events*)** ou chamadas a **Serviços de Domínio (*Domain Services*)**.
2. **Leitura Desacoplada (Read Models / Projections):** Para exibições consolidadas (ex: `GeneralAdminDashboard`), o domínio consome visualizações de agregados geradas por projeções assíncronas do Event Bus.
3. **Comunicação por Eventos:** Se o domínio de `Bookings` confirma um check-in, ele dispara o evento `GuestCheckedIn`. O domínio de `Housekeeping` reage marcando o quarto como "Ocupado", e o domínio de `Financial` reage reconhecendo a receita inicial.

```
   [Bookings Domain] ─────(Dispara: GuestCheckedIn)─────► [SYNAPSE EVENT BUS]
                                                                  │
         ┌────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┐
         ▼                                                        ▼                                                        ▼
[Housekeeping Domain]                                   [Financial Domain]                                       [CRM Domain]
(Atualiza Status: Ocupado)                              (Reconhece Receita da Diária)                             (Inicia Régua de Boas-Vindas)
```

---

## 4. MAPEAMENTO DE ENTIDADES PRINCIPAIS DE DOMÍNIO

### 4.1 Entidades Core e Suas Chaves Únicas
- **Property (`PropertyId`):** Unidade física hoteleira (ex: Pousada Beach, Hotel Centro).
- **Room (`RoomId`):** Unidade habitacional (ex: Suíte 101, Chale 04).
- **Bed (`BedId`):** Leito individual em acomodação compartilhada ou dormitório.
- **Guest (`GuestId`):** Pessoa física/jurídica consumidora de serviços hoteleiros.
- **Booking (`BookingId`):** Contrato de hospedagem vinculado a um Hóspede, Quarto/Leito e Período.
- **Transaction (`TransactionId`):** Lançamento de débito/crédito no POS ou conta do quarto.
- **WorkOrder (`WorkOrderId`):** Ordem de serviço de manutenção preventiva ou corretiva.
- **ActionProposal (`ProposalId`):** Proposta gerada por Agente de IA pendente de aprovação humana (ADR-005).

---

## 5. VALUE OBJECTS (OBJETOS DE VALOR)

Value Objects são imutáveis e definidos estritamente por seus atributos:

- **Money:** `{ amount: number, currency: 'BRL' | 'USD' | 'EUR' }`
- **DateRange:** `{ checkIn: Date, checkOut: Date, nights: number }`
- **GuestContact:** `{ email: string, phone: string, whatsappFormatted: string }`
- **RoomOccupancy:** `{ adults: number, children: number, infants: number }`
- **RateRestriction:** `{ minStay: number, maxStay: number, closedToArrival: boolean }`
- **TaxDetail:** `{ issRate: number, tourismTax: number, serviceFee: number }`

---

## 6. AGGREGATES (AGREGADOS DE DOMÍNIO)

### 6.1 Booking Aggregate (`BookingAggregate`)
Encapsula o estado completo de uma reserva e garante que o total financeiro seja sempre consistente com os itens consumidos e pagamentos efetuados.
- **Raiz do Agregado:** `Booking`
- **Entidades Internas:** `BookingItem`, `PaymentRecord`, `GuestRef`
- **Invariantes (Regras Sagradas):**
  - O valor total da reserva jamais pode ser menor que a soma das diárias + taxas adicionais.
  - O check-out deve ser rigorosamente posterior ao check-in.
  - Não é possível realizar check-in em uma reserva com status `Cancelled` ou `NoShow`.

### 6.2 Property Inventory Aggregate (`InventoryAggregate`)
Garante que nenhum quarto seja reservado duas vezes para o mesmo período.
- **Raiz do Agregado:** `PropertyRoomInventory`
- **Invariantes:**
  - `AvailableRooms = TotalRooms - (BookedRooms + MaintenanceRooms + BlockedRooms)`.
  - Se `AvailableRooms < 0`, dispara alerta imediato de risco de Overbooking.

---

## 7. REPOSITÓRIOS (REPOSITORY PATTERN)

Cada domínio define interfaces abstratas de repositório no core e implementações concretas na camada de infraestrutura (Firestore / Cloud SQL):

- `IBookingRepository`: `findById()`, `findByDateRange()`, `save()`, `updateStatus()`
- `IGuestRepository`: `findById()`, `findByCpf()`, `findByEmail()`, `save()`
- `IRoomRepository`: `findAllByProperty()`, `updateCleaningStatus()`, `save()`
- `IFinancialRepository`: `saveTransaction()`, `getDailyCashFlow()`, `getDRE()`
- `IApprovalRepository`: `findPendingProposals()`, `approveProposal()`, `rejectProposal()`

---

## 8. SERVIÇOS DE DOMÍNIO (DOMAIN SERVICES)

Operações de negócio que envolvem múltiplos agregados ou regras complexas sem dono único:

1. **ReservationPricingService:** Calcula a tarifa final da reserva aplicando precificação dinâmica, cupons de desconto, taxas do canal OTA e impostos regionais.
2. **RoomAllocationService:** Encontra automaticamente a melhor combinação de quartos/leitos para otimizar o mapa de ocupação Gantt e minimizar dias órfãos (*gap nights*).
3. **AutomatedReconciliationService:** Reconcilia pagamentos via PIX/Stripe com lançamentos de receitas no módulo financeiro.
4. **MaintenanceEscalationService:** Escala ordens de serviço críticas de manutenção não atendidas em 30 minutos para a gerência geral.

---

## 9. EVENTOS DE DOMÍNIO (EXHAUSTIVE DOMAIN EVENTS)

Abaixo está o catálogo completo de eventos que alimentam a arquitetura reativa:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         SYNAPSE DOMAIN EVENTS CATALOG                            │
└──────────────────────────────────────────────────────────────────────────────────┘

 [RESERVAS & CANAIS]          [HÓSPEDES & RECEPTIVO]        [OPERAÇÕES & MANUTENÇÃO]
 ├── ReservationCreated       ├── GuestRegistered           ├── RoomDirty
 ├── ReservationConfirmed     ├── GuestCheckInPending       ├── RoomCleaned
 ├── ReservationModified      ├── GuestCheckedIn            ├── RoomInspected
 ├── ReservationCancelled     ├── GuestCheckedOut           ├── MaintenanceRequested
 └── OverbookingRiskDetected  └── GuestProfileUpdated       └── MaintenanceResolved

 [FINANCEIRO & PDV]           [MARKETING & IA]              [GOVERNANÇA & DECISÃO]
 ├── PaymentReceived          ├── CampaignLaunched          ├── ActionProposalCreated
 ├── POSItemSold              ├── EmailSentByAutopilot      ├── ActionProposalApproved
 ├── ExpenseRecorded          ├── ReviewSentimentAnalyzed   ├── ActionProposalRejected
 └── CashFlowUpdated          └── MarketingMixAdjusted      └── ExecutionCompleted
```

---

## 10. FLUXO DE EVENTOS & EVENT BUS ENGINE

```
┌──────────────────┐       ┌───────────────────────────┐       ┌──────────────────┐
│ Event Publisher  ├──────►│   SYNAPSE EVENT ROUTER    ├──────►│ Event Subscriber │
│ (ex: Bookings)   │       │   (InMemory / Firestore)  │       │ (ex: Financial)  │
└──────────────────┘       └─────────────┬─────────────┘       └──────────────────┘
                                         │
                                         ▼
                           ┌───────────────────────────┐
                           │   EVENT AUDIT LOG DB      │
                           │  (Rastreabilidade Total)  │
                           └───────────────────────────┘
```

1. **Emissão:** Quando uma alteração de estado ocorre em um domínio, a entidade dispara um evento tipado.
2. **Roteamento:** O `SynapseEventRouter` recebe a mensagem e a encaminha para os assinantes registrados.
3. **Auditoria:** Todo evento é persistido em uma coleção de auditoria imutável (`eventLogs`), permitindo auditoria completa e *Event Sourcing* para reconstrução de histórico.

---

## 11. MODELO DE COMUNICAÇÃO DOS AGENTES DISTRIBUÍDOS

Para respeitar os princípios de desacoplamento, **os agentes de IA NUNCA se chamam diretamente via métodos síncronos**. A cooperação ocorre via eventos:

```
┌───────────────────────┐                               ┌───────────────────────┐
│     REVENUE AGENT     │                               │    INVENTORY AGENT    │
└───────────┬───────────┘                               └───────────▲───────────┘
            │                                                       │
            │ Dispara Evento:                                       │ Escuta Evento:
            │ "HighOccupancyProjected"                              │ "HighOccupancyProjected"
            ▼                                                       │
┌───────────────────────────────────────────────────────────────────┴───────────────────┐
│                              SYNAPSE DISTRIBUTED EVENT BUS                            │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

1. O **Revenue Agent** detecta ocupação de 95% para o fim de semana e publica `HighOccupancyProjected`.
2. O **Inventory Agent** escuta o evento e gera uma proposta de compra adicional de insumos de café da manhã.
3. O **Housekeeping Agent** escuta o evento e gera uma proposta de remanejamento de escala de camareiras.
4. O **Executive Agent** consolida os dois rascunhos e exibe a pauta unificada no *Decision Center* para autorização do gestor.

---

## 12. MODELO DE SEGURANÇA, PERMISSÕES & GOVERNANÇA

### 12.1 Hierarquia de Acesso (RBAC)
- **Role 1 - SuperAdmin (SaaS Owner):** Acesso global a todos os tenants e configurações de infraestrutura.
- **Role 2 - Property Owner / Director:** Acesso total à propriedade, relatórios financeiros, DRE e aprovações do Decision Center.
- **Role 3 - General Manager:** Acesso operacional e administrativo completo, exceção para alterações contratuais de plano.
- **Role 4 - Receptionist:** Acesso a reservas, calendário, mapa de quartos, check-in/out e lançamentos do POS.
- **Role 5 - Housekeeper / Maintenance:** Acesso exclusivo ao módulo móvel de tarefas de limpeza e chamados de manutenção.

### 12.2 Isolamento Multi-Tenant & Multi-Property
Todas as consultas ao Firestore/Database contêm obrigatoriamente os filtros de contexto:
```typescript
query(collection(db, 'bookings'), where('tenantId', '==', currentTenantId), where('propertyId', '==', activePropertyId))
```

### 12.3 Protocolo ADR-005 & Audit Trail
Qualquer ação de agente autônomo que envolva alteração tarifária acima de 10%, alteração contratual, reembolso financeiro ou exclusão de dados passa pelo fluxo **Proposal -> Decision Center -> Human Approval**. O log de auditoria armazena quem aprovou, timestamp e IP.

---

## 13. MODELO DE PERSISTÊNCIA & EVOLUÇÃO HYBRID/CLOUD SQL

### 13.1 Estado Atual (Firestore Collections Schema)
- `/properties/{propertyId}`
- `/properties/{propertyId}/rooms/{roomId}`
- `/properties/{propertyId}/bookings/{bookingId}`
- `/properties/{propertyId}/guests/{guestId}`
- `/properties/{propertyId}/transactions/{transactionId}`
- `/properties/{propertyId}/actionProposals/{proposalId}`

### 13.2 Estratégia de Migração Futura (Cloud SQL / PostgreSQL Hybrid)
Para operações de grande porte ou redes com mais de 5.000 leitos, a plataforma suportará modelo híbrido:
- **Firestore:** Leitura rápida, sincronização em tempo real de chats, calendário reativo e portal do hóspede.
- **Cloud SQL (PostgreSQL com Drizzle ORM):** Consultas relacionais complexas de BI, conciliação contábil, DRE e agregação financeira massiva.

---

## 14. ESTRATÉGIA OFFLINE & RESILIÊNCIA

1. **Client-Side Storage (IndexedDB / LocalStorage):** A interface do usuário mantém cache de dados essenciais (mapa de quartos, lista de hóspedes do dia).
2. **Fila de Sincronização Assíncrona (Sync Queue):** Lançamentos de consumo no POS ou atualizações de limpeza feitas em áreas sem Wi-Fi entram na fila local e são sincronizadas automaticamente assim que a conexão restabelece.
3. **Optimistic UI Updates:** Alterações no Gantt de reservas atualizam a interface instantaneamente, revertendo suavemente caso a validação no servidor falhe.

---

## 15. ESTRATÉGIA DE ESCALABILIDADE (100 A 10.000 HOTÉIS)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            SCALABILITY ARCHITECTURE                              │
│                                                                                  │
│   ┌────────────────────┐      ┌────────────────────┐      ┌───────────────────┐  │
│   │ 100 Hotéis         ├─────►│ 1.000 Hotéis       ├─────►│ 10.000 Hotéis     │  │
│   │ Monólito Cloud Run │      │ Sharding por Tenant│      │ Multi-Region Cloud│  │
│   └────────────────────┘      └────────────────────┘      └───────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

- **Fase 1 (100 Hotéis):** Containers Cloud Run com auto-scaling instantâneo (scale-to-zero quando ocioso, expansão para centenas de instâncias sob demanda).
- **Fase 2 (1.000 Hotéis):** Sharding de banco de dados por região/tenant e isolamento de Workers de segundo plano para processamento de webhooks OTA.
- **Fase 3 (10.000 Hotéis):** Multi-Region deployment (US, Europe, LATAM) com roteamento Anycast de baixa latência e leitura em réplicas locais.

---

## 16. ESTRATÉGIA DE PLUGINS & EXTENSIBILIDADE

A plataforma possui arquitetura de plugins desacoplada onde desenvolvedores parceiros podem estender a funcionalidade através de:
1. **Custom UI Widgets:** Injeção de componentes visuais em abas dedicadas do Admin.
2. **Event Listeners Webhooks:** Assinatura de eventos de domínio em tempo real para sincronização com sistemas legados (ex: ERPs fiscais locais).
3. **Custom AI Agents:** Módulos de IA customizados integrados ao barramento de propostas do *Decision Center*.

---

## 17. ESTRATÉGIA DE APIS PÚBLICAS & VERSIONAMENTO

- **Padrão REST v1:** Endpoints expostos via `/api/v1/...` protegidos por Bearer API Keys.
- **Rate Limiting:** Proteção por token bucket (ex: 100 req/min por propriedade em planos padrão; 1.000 req/min em planos Enterprise).
- **Webhooks de Saída:** Notificações instantâneas enviadas para URLs cadastradas pelo cliente ao ocorrer `ReservationCreated`, `PaymentReceived`, etc.

---

## 18. ESTRATÉGIA PARA SDK

Disponibilização do pacote oficial `@synapse/sdk` em TypeScript/Node.js para facilitação de integrações por desenvolvedores terceiros:

```typescript
import { SynapseClient } from '@synapse/sdk';

const synapse = new SynapseClient({ apiKey: process.env.SYNAPSE_API_KEY });

// Criar reserva via SDK
const booking = await synapse.bookings.create({
  guestId: 'gst_123',
  roomId: 'rm_101',
  dateRange: { checkIn: '2026-09-01', checkOut: '2026-09-05' }
});
```

---

## 19. ESTRATÉGIA PARA MARKETPLACE DE ADD-ONS

- **Developer Portal:** Painel onde desenvolvedores registram seus aplicativos, gerenciam credenciais e definem preços de assinatura.
- **App Verification & Security Audit:** Todos os aplicativos cadastrados passam por varredura automática de segurança e validação de escopos OAuth/RBAC antes da aprovação na vitrine pública.

---

## 20. VISÃO ARQUITETURAL PARA OS PRÓXIMOS 5 ANOS (2026 - 2031)

Em 5 anos, o Synapse Hospitality será um **Ecossistema Autónomo Totalmente Distribuído**, onde:
1. **Zero Data Entry:** 100% das reservas, notas fiscais, interações e ordens de compras serão capturadas e processadas sem necessidade de digitação humana.
2. **Predictive Hospitality:** O sistema antecipará a chegada de hóspedes e suas preferências de climatização/gastronomia antes do check-in.
3. **Decentralized Multi-Property Network:** Grupos hoteleiros gerenciarão milhares de propriedades em diferentes continentes com visibilidade consolidação em milissegundos e conformidade fiscal local garantida.

---

*Fim da Constituição Técnica Oficial DOMAIN_ARCHITECTURE_BIBLE.md*
