# MASTER EVOLUTION PLAN — SYNAPSE HOSPITALITY PLATFORM
> Documento Oficial de Arquitetura, Auditoria e Evolução Incremental
> Data: 04 de Agosto de 2026
> Autor: Lead Software Engineer — Synapse Hospitality

---

## 1. VISÃO GERAL E MUDANÇA OFICIAL DE DIREÇÃO

### 1.1 Premissa Fundamental
- **O Synapse NÃO é uma aplicação separada nem um layout alternativo.**
- O Synapse é a **camada de inteligência orquestradora e distribuída** de toda a plataforma de gestão hoteleira (PMS, CM, POS, Marketing, Operações).
- A plataforma oficial existente (`App.tsx` e `AdminDashboard.tsx`) é o produto oficial, com sua identidade visual, sidebar lateral, header e modais já consolidados.
- **Zero Ruptura de Interface**: Todos os menus, telas, layouts e funcionalidades existentes serão preservados. Nenhum menu será substituído, e nenhum `AppShell` paralelo será imposto.

---

## 2. ARQUITETURA DA CAMADA DE INTELIGÊNCIA DISTRIBUÍDA

### 2.1 Orquestração Multi-Agente
Cada módulo da plataforma possui seu **Agente Especializado dedicado**, que reside e atua **DENTRO** da interface do módulo correspondente. Todos os agentes especializados reportam e consolidam dados para o **Executive Agent (Synapse)**.

```
                         ┌─────────────────────────────┐
                         │   SYNAPSE EXECUTIVE AGENT   │
                         │   (Executive Copilot Chat)  │
                         └──────────────┬──────────────┘
                                        │ Orquestração & Consolidação
       ┌────────────────────────────────┼────────────────────────────────┐
       │                                │                                │
┌──────▼──────┐                  ┌──────▼──────┐                  ┌──────▼──────┐
│  Financial  │                  │   Revenue   │                  │ Housekeeping│
│    Agent    │                  │    Agent    │                  │    Agent    │
│ (Financeiro)│                  │  (Reservas) │                  │(Governança) │
└─────────────┘                  └─────────────┘                  └─────────────┘
       │                                │                                │
┌──────▼──────┐                  ┌──────▼──────┐                  ┌──────▼──────┐
│  Maintenance│                  │     CRM     │                  │   Retail    │
│    Agent    │                  │    Agent    │                  │    Agent    │
│(Manutenção) │                  │ (Hóspedes)  │                  │    (PDV)    │
└─────────────┘                  └─────────────┘                  └─────────────┘
```

---

## 3. MAPA DE MÓDULOS E SEUS AGENTES ESPECIALIZADOS

| Módulo do Sistema (`adminTab`) | Agente Especializado | Responsabilidades do Agente | Localização da Interface do Agente |
| :--- | :--- | :--- | :--- |
| **Financeiro** (`financialManager`, `financeDashboard`) | **Financial Agent** | Análise de fluxo de caixa, DRE preditivo, detecção de anomalias em despesas e reconciliação bancária. | Tab interna "IA Financeira" em `FinancialManagerView.tsx`. |
| **Reservas / Cal. / Ocupação** (`bookings`, `calendar`, `rateManager`) | **Revenue Agent & Pricing Agent** | Sugestão de tarifas dinâmicas, controle de restrições, otimização de RevPAR e projeção de ocupação. | Painel interno de Revenue em `RateManagerView.tsx` e `BookingsView.tsx`. |
| **Quartos & Acomodações** (`rooms`, `units`) | **Room Intelligence Agent** | Otimização de alocação de quartos, bloqueios inteligentes e análise de inventário de leitos. | Widget de IA em `RoomsView.tsx`. |
| **Governança** (`housekeeping`) | **Housekeeping Agent** | Priorização automática de limpeza baseada na fila de check-ins/check-outs e rotas eficientes. | Painel de controle em `HousekeepingView.tsx`. |
| **Manutenção & Infra** (`maintenanceManager`, `equipment`) | **Maintenance Agent** | Manutenção preditiva, ordens de serviço automáticas para falhas em equipamentos e alertas críticos. | Aba de inteligência em `MaintenanceManagerView.tsx`. |
| **Vigilância & Segurança** (`vigilancia`) | **Security Agent** | Monitoramento de câmeras/sensores, detecção de anomalias físicas e protocolo de segurança. | Painel em `VigilanciaView.tsx`. |
| **Hóspedes & CRM** (`guests`, `guestJourney`, `guestProfile`) | **CRM & Guest Journey Agent** | Hiperpersonalização da jornada, pontuação de LTV, preferências e campanhas de retenção. | Aba "IA Journey" em `GuestsView.tsx` e `GuestJourneyAIView.tsx`. |
| **Parceiros & Experiências** (`partnerServices`, `coworking`) | **Experience Agent** | Recomendação de serviços terceirizados, passeios e automação de agendamentos de concierge. | Painel em `PartnerServicesView.tsx`. |
| **Integrações & OTAs** (`integrations`, `channelManager`) | **Integration Agent** | Sincronização de APIs, mapeamento de canais OTA, logs de auditoria e tarifários externos. | Painel de monitoramento em `ChannelManagerView.tsx` e `IntegrationsView.tsx`. |
| **Projetos & Obras** (`projects`) | **Project Manager Agent** | Gestão de cronograma, orçamento de expansões/reformas e alertas de desvio. | Aba interna em `ProjectsView.tsx`. |
| **Equipe & RH** (`staff`, `aiTeam`) | **HR & Team Manager Agent** | Escalas de trabalho, avaliação de desempenho, plano de integração e onboarding. | Painel em `AITeamManagerView.tsx` e `StaffView.tsx`. |
| **PDV & Restobar** (`pos`, `deliveryOrders`) | **Retail & POS Agent** | Harmonização de pratos/bebidas, sugestão de vendas cruzadas e controle de consumo. | Widget inteligente em `POSView.tsx`. |
| **Estoque & Lista de Compras** (`inventory`, `shoppingList`) | **Inventory Agent** | Previsão de ruptura de estoque, giro de insumos e geração automática de ordens de compra. | Painel de inteligência em `InventoryView.tsx`. |
| **Fornecedores & Suprimentos** (`suppliers`, `procurement`) | **Procurement & Supplier Agent** | Cotações automatizadas, avaliação de pontualidade e negociação de contratos de insumos. | Painel em `SupplierManagerView.tsx`. |
| **Marketing & Campanhas** (`growthHub`, `adCampaigns`, `socialMedia`, `emailAutopilot`) | **Marketing Orchestrator Agent** | Autopiloto de e-mails, criação de posts sociais, anúncios e otimização de ROI. | `MarketingOrchestratorView.tsx` e `AIMarketingLabView.tsx`. |
| **Diretoria & Gestão Central** (`generalAdmin`, `managerDashboard`, `managementCenter`) | **Executive Agent (Synapse)** | Consolidação holística de KPIs, Health Score, Decision Center, aprovações humanas e Executive Copilot. | `ManagementCenterView.tsx` e Gaveta Flutuante do Copilot na Topbar. |

---

## 4. PLANO DE MIGRAÇÃO E REORGANIZAÇÃO DE CÓDIGO

### 4.1 Desmontagem do "SynapseApp" Paralelo
- **Ação**: Desativar e remover o redirecionamento `case 'synapse'` de `App.tsx` que apontava para o `SynapseApp.tsx`.
- **Preservação de Código**: Todo o trabalho e esforço investido na criação dos componentes em `src/modules/*` será **reaproveitado de forma cirúrgica**, movendo os componentes para dentro das visões dos módulos oficiais em `components/admin/`:
  1. `src/modules/decision/*` (Decision Center, Human Approval, Planning, Execution Tracking) → Incorporados como sub-abas do `ManagementCenterView.tsx` (módulo de Gestão da Plataforma) e com botão de ação rápida no Header.
  2. `src/modules/executive/*` (Executive Dashboard, Health Score Card, Risk/Opportunity Cards) → Incorporados ao `ManagementCenterView.tsx` e `GeneralAdminDashboard.tsx`.
  3. `src/modules/copilot/*` (Executive Copilot Chat) → Conectado diretamente à gaveta/modal global de IA acionada pelo ícone de robô (`Bot`) na Topbar/Header principal.
  4. Services REST (`src/core/api/*`) → Mantidos e utilizados para alimentar via React Query os componentes dentro das visões oficiais do `components/admin/`.

---

## 5. REGRAS DE ORQUESTRAÇÃO E COMUNICAÇÃO ENTRE AGENTES

1. **Agente Especializado Local**:
   - Cada tela de módulo possui uma aba ou widget de IA especializado.
   - As ações geradas pelo agente local exigem **Aprovação Humana (ADR-005)** para alterações de estado com impacto financeiro ou operacional.
2. **Comunicação com o Executive Agent (Synapse)**:
   - Agentes locais sintetizam diagnósticos e enviam para a fila de eventos/alertas do Executive Agent.
   - O Executive Agent consolida o Health Score Global e exibe no Dashboard de Gestão Central.
3. **Segurança e Isolamento**:
   - Respeito estrito aos papéis do usuário (`currentUser.role`: Admin, Gerente, Recepção, Governança).
   - Operações sensíveis são executadas em modo *READ-ONLY & Proposal Mode* até que um gestor autorize no Decision Center.

---

## 6. CRONOGRAMA DE IMPLEMENTAÇÃO INCREMENTAL

### Fase 1: Incorporação do Executive Intelligence & Copilot na Plataforma Oficial (Próxima Etapa)
- Mover a experiência do **Executive Copilot Chat** para um Modal/Drawer global acessível a partir do botão `Bot` no Header da plataforma oficial.
- Incorporar os cards de **Executive Health Score**, **KPI Grid**, **Alertas Críticos** e **Prioridades** dentro de `components/admin/ManagementCenterView.tsx` e `components/admin/dashboards/GeneralAdminDashboard.tsx`.

### Fase 2: Incorporação do Decision Center & Human Approval no ManagementCenter
- Incorporar as abas de **Decision Center**, **Aprovações Pendentes**, **Planning Playbooks** e **Execution Tracker** dentro do `ManagementCenterView.tsx` existente, permitindo aos administradores aprovar ações de IA sem sair da plataforma principal.

### Fase 3: Enriquecimento dos Módulos Operacionais com Agentes Especializados
- Adicionar abas internas de IA nos módulos existentes:
  - `FinancialManagerView.tsx` → Painel do Financial Agent
  - `HousekeepingView.tsx` → Rotas eficientes do Housekeeping Agent
  - `MaintenanceManagerView.tsx` → Diagnósticos do Maintenance Agent
  - `RateManagerView.tsx` → Sugestões do Revenue & Pricing Agent

---

## 7. MATRIZ DE COMPONENTES E DESTINO DE MIGRAÇÃO

| Componente Criado em `src/modules/` | Módulo de Destino na Plataforma Oficial (`components/admin/`) |
| :--- | :--- |
| `src/modules/decision/DecisionDashboard.tsx` | `components/admin/ManagementCenterView.tsx` |
| `src/modules/approval/ApprovalDashboard.tsx` | `components/admin/ManagementCenterView.tsx` |
| `src/modules/planning/PlanningDashboard.tsx` | `components/admin/ManagementCenterView.tsx` |
| `src/modules/execution/ExecutionDashboard.tsx` | `components/admin/ManagementCenterView.tsx` |
| `src/modules/executive/ExecutiveOverview.tsx` | `components/admin/dashboards/GeneralAdminDashboard.tsx` |
| `src/modules/copilot/ExecutiveCopilotChat.tsx` | Gaveta Global do Header (`components/Header.tsx` e `components/admin/AdminDashboard.tsx`) |

---

*Aprovado por: Lead Software Engineer & Diretoria de Produtos Synapse Hospitality*
