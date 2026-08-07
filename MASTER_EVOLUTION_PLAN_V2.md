# 🧠 MASTER EVOLUTION PLAN V2 — SYNAPSE HOSPITALITY PLATFORM
> **Documento Oficial de Engenharia Reversa, Arquitetura e Plano Diretor de Evolução**
> **Versão:** 2.0.0
> **Status:** Aprovado & Vigente
> **Diretriz Central:** *O Synapse NÃO é uma aplicação separada. O Synapse é a camada de inteligência distribuída integrada nativamente a cada um dos módulos existentes na plataforma oficial.*

---

## 1. ENGENHARIA REVERSA DA ARQUITETURA DE SISTEMAS

### 1.1 Visão Geral da Arquitetura (Full-Stack Monolith with Distributed AI)

A plataforma **Synapse Hospitality** opera como um monólito reativo full-stack de alta performance rodando sobre Node.js e React. A arquitetura conecta a interface visual ao motor de regras e pipelines de Inteligência Artificial sem fricção.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             FRONTEND (React 18 + Vite)                           │
│  ┌───────────────────────┐  ┌─────────────────────────┐  ┌────────────────────┐ │
│  │ Public Site / Portal  │  │ Admin Dashboard (PMS)   │  │ Guest Portal / App │ │
│  └───────────┬───────────┘  └────────────┬────────────┘  └─────────┬──────────┘ │
└──────────────┼───────────────────────────┼─────────────────────────┼────────────┘
               │ Rest / Fetch API          │ Webhook / JSON          │ React Query
               ▼                           ▼                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND (Express.js / Node.js)                        │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                              server.ts                                     │  │
│  │  - Auth Middleware (Firebase Admin Auth)                                   │  │
│  │  - Aloha Pro Webhook (IA Parser + Regex Fallback)                          │  │
│  │  - Stripe / PIX / Payment Gateways                                         │  │
│  └───────────────────────────────────┬────────────────────────────────────────┘  │
│                                      │                                           │
│  ┌───────────────────────────────────┴────────────────────────────────────────┐  │
│  │                /server/modules/ (Domain Business Modules)                 │  │
│  │  [PMS] [CRM] [Housekeeping] [Revenue] [Marketing] [SaaS] [Integrations] etc. │  │
│  └───────────────────────────────────┬────────────────────────────────────────┘  │
└──────────────────────────────────────┼───────────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
┌──────────────────────────────┐                            ┌───────────────────┐
│ FIREBASE FIRESTORE DATABASE  │                            │ GEMINI AI PIPELINE│
│ (Users, Bookings, Rooms,     │                            │ (@google/genai)   │
│  Products, Logs, Chat, etc.) │                            │ Gemini 2.5 Flash  │
└──────────────────────────────┘                            └───────────────────┘
```

---

### 1.2 Componentes e Tecnologias Core

| Camada | Tecnologia / Biblioteca | Função no Sistema |
| :--- | :--- | :--- |
| **Frontend Runtime** | React 18, Vite | SPA reativo e de carregamento instantâneo. |
| **Styling & Design System** | Tailwind CSS v3/v4 | Utilitários CSSResponsivo, suporte a temas (Light, Dark, Tropical). |
| **Componentes Visuais & Ícones** | Lucide React | Biblioteca padronizada de ícones para menus e KPIs. |
| **Gráficos & Dashboards** | Recharts, D3 | Visualização de dados financeiros, ocupação e performance de marketing. |
| **Animações** | Motion (`motion/react`) | Transições suaves entre seções e gavetas de controle. |
| **Backend Framework** | Express.js (`server.ts`) | Servidor HTTP REST e gerenciador de Webhooks. |
| **Inteligência Artificial** | `@google/genai` (Gemini 2.5 Flash / Pro) | Processamento de linguagem natural, parse estruturado de e-mails/webhooks, assistentes contextuais. |
| **Persistência / Database** | Firebase Firestore | Armazenamento de dados noSQL em tempo real para reservas, hóspedes, estoque e logs. |
| **Autenticação** | Firebase Authentication | Autenticação para hóspedes, equipe operacional e administradores. |
| **Pagamentos** | Stripe SDK, PIX Payload Engine | Processamento de cartão de crédito e geração de código PIX instantâneo. |

---

### 1.3 Estrutura Mapeada de Diretórios e Arquivos

```
/ (Raiz do Projeto)
├── App.tsx                        # Componente principal de roteamento e estado global
├── server.ts                      # Servidor Express com APIs REST e Pipeline Gemini AI
├── types.ts                       # Definições de interfaces TypeScript e Enums (1700+ linhas)
├── database.ts                    # Estado inicial, mock e definições de seed do sistema
├── metadata.json                  # Configurações de permissões do iFrame e capabilities
├── package.json                   # Dependências e scripts de execução
│
├── /components/                   # Visualizadores Frontend
│   ├── Header.tsx                 # Barra superior com troca de perfis e seletores
│   ├── PublicView.tsx             # Site público do hotel/hostel
│   ├── GuestPortalView.tsx        # WebApp do Hóspede (Guest Experience & Concierge)
│   ├── BookingView.tsx            # Motor de reservas diretas
│   ├── OnlineCheckinView.tsx      # Fluxo de pré-check-in digital do hóspede
│   ├── PreArrivalPortalView.tsx   # Portal de pré-chegada do hóspede
│   ├── PublicDigitalMenuView.tsx  # Cardápio digital do restaurante/bar
│   │
│   └── /admin/                    # Módulos Administrativos e Gestão
│       ├── AdminDashboard.tsx     # Shell do Admin com navegação lateral por 42 seções
│       ├── SynapseCommandPalette.tsx # Barra de comandos rápidos (Ctrl+K)
│       ├── SynapseAgentView.tsx   # Visualizador de status do Agente Synapse
│       ├── /dashboards/           # Visões de Dashboard personalizadas por função
│       │   ├── GeneralAdminDashboard.tsx
│       │   ├── ReceptionDashboard.tsx
│       │   ├── FinanceDashboard.tsx
│       │   ├── MarketingDashboard.tsx
│       │   ├── ManagerDashboard.tsx
│       │   ├── OperationalDashboard.tsx
│       │   ├── GrowthHubDashboard.tsx
│       │   └── MyTasksDashboard.tsx
│       └── [40+ arquivos de visões de módulos individuais...]
│
├── /server/                       # Lógica de Negócios do Servidor Express
│   └── /modules/                  # Módulos do Domínio de Negócios
│       ├── pms/                   # Gestão de Propriedade, Reservas e Ocupação
│       ├── crm/                   # Gestão de Relacionamento e Hóspedes
│       ├── housekeeping/          # Governança, Limpeza e Manutenção
│       ├── revenue/               # Gestão de Tarifas e Sincronização de Canais
│       ├── marketing/             # Campanhas, Redes Sociais e Automação de E-mail
│       ├── reception/             # Atendimento ao Cliente e Check-in/out
│       ├── saas/                  # Gestão Multi-tenant e Assinaturas
│       ├── ai/                    # Orquestrador de Agentes e Prompts
│       ├── directBooking/          # Motor de Vendas Diretas
│       ├── integration/           # OTA Channel Manager e Webhooks
│       └── maintenance/           # Manutenção e Chamados Operacionais
│
└── /services/                     # Camada de Serviços do Client Frontend
    ├── apiService.ts              # Comunicação REST com o backend
    ├── geminiService.ts           # Integração client-side com Gemini
    ├── alohaProService.ts         # Integração com Aloha Pro PMS Webhook
    ├── beds24Service.ts           # Integração com Beds24 Channel Manager
    ├── firebase.ts                # Inicialização do Firestore e Auth
    ├── marketingService.ts        # Utilitários de campanhas de marketing
    └── paymentService.ts          # Utilitários de pagamentos e Stripe
```

---

## 2. INVENTÁRIO COMPLETO DOS 42 MÓDULOS ADMINISTRATIVOS (`AdminSection`)

Abaixo está o mapeamento exaustivo dos 42 módulos acessíveis pelo menu do Admin Dashboard. Todos os módulos permanecem ativos e intactos na plataforma.

| # | Chave (`AdminSection`) | Nome Visual do Módulo | Componente React Responsável | Status do Módulo | Consumo de API / Integração |
|---|---|---|---|---|---|
| 1 | `dashboard` | Visão Geral / Painel Principal | `AdminDashboard.tsx` + Sub-dashboards | 100% Funcional | Firestore + REST `/api/health` |
| 2 | `calendar` | Mapa de Reservas (Gantt) | `CalendarView.tsx` | 100% Funcional | Firestore (`bookings`, `rooms`) |
| 3 | `rooms` | Gestão de Unidades & Camas | `RoomsView.tsx` | 100% Funcional | Firestore (`rooms`) |
| 4 | `bookings` | Reservas & Ocupação | `BookingsView.tsx` | 100% Funcional | Firestore (`bookings`, `guests`) |
| 5 | `guests` | Hóspedes & CRM | `GuestsView.tsx`, `GuestProfileView.tsx` | 100% Funcional | Firestore (`guests`) |
| 6 | `staff` | Equipe & Permissões | `StaffView.tsx` | 100% Funcional | Firestore (`staff`) |
| 7 | `housekeeping` | Governança & Limpeza | `HousekeepingView.tsx` | 100% Funcional | Firestore (`staffTasks`, `rooms`) |
| 8 | `team_manager_ai` | Gestor de Equipe com IA | `AITeamManagerView.tsx` | Funcional + IA | Gemini AI + Firestore (`staffTasks`) |
| 9 | `pos` | Ponto de Venda (POS) / Bar | `POSView.tsx` | 100% Funcional | Firestore (`products`, `transactions`) |
| 10 | `coworking` | Espaço Coworking | `CoworkingView.tsx` | Funcional | Firestore (`products`, `bookings`) |
| 11 | `delivery_orders` | Pedidos & Deliveries | `DeliveryOrdersView.tsx` | Funcional | Firestore (`transactions`) |
| 12 | `financial_manager` | Gestão Financeira | `FinancialManagerView.tsx` | 100% Funcional | Firestore (`expenses`, `transactions`) |
| 13 | `inventory` | Controle de Estoque | `InventoryView.tsx` | 100% Funcional | Firestore (`products`) |
| 14 | `shopping_list` | Lista de Compras Intuitiva | `ShoppingListView.tsx` | Funcional + IA | Gemini AI + Firestore (`shoppingLists`) |
| 15 | `social_media` | Gestão de Redes Sociais | `SocialMediaManagerView.tsx` | Funcional | Simulação API Meta/Instagram |
| 16 | `ad_campaign_manager` | Gestor de Tráfego Pago | `AdCampaignManagerView.tsx` | Funcional | API Meta/Google/TikTok Ads |
| 17 | `reports` | Relatórios Relatórios BI | `ReportsView.tsx` | 100% Funcional | Recharts + Firestore Aggregate |
| 18 | `omni_channel` | Central de Atendimento Omni | `OmniChannelView.tsx` | 100% Funcional | Firestore (`chatConversations`) |
| 19 | `internal_chat` | Comunicação Interna | `InternalChatView.tsx` | 100% Funcional | Firestore (`chatConversations`) |
| 20 | `ai_strategy_consultant` | Consultor Estratégico IA | `AIStrategyConsultantView.tsx` | Funcional + IA | Gemini AI Execution Pipeline |
| 21 | `ai_marketing_lab` | Laboratório de Marketing IA | `AIMarketingLabView.tsx` | Funcional + IA | Gemini AI Execution Pipeline |
| 22 | `creative_studio` | Estúdio Criativo (Artes/Posts) | `CreativeStudioView.tsx` | Funcional + IA | Gemini Image Gen + Text API |
| 23 | `property_settings` | Configurações da Propriedade | `SettingsView.tsx` | 100% Funcional | Firestore (`properties`) |
| 24 | `projects` | Gestão de Projetos & Obras | `ProjectsView.tsx` | Funcional | Firestore (`projects`) |
| 25 | `ai_engagement_agent` | Agente de Engajamento Social | `AIEngagementAgentView.tsx` | Funcional + IA | Gemini AI + Social Media Sim |
| 26 | `marketing_orchestrator` | Orquestrador de Marketing | `MarketingOrchestratorView.tsx` | Funcional + IA | Gemini AI Marketing Mix Pipeline |
| 27 | `management_center` | Centro de Controle Executivo | `ManagementCenterView.tsx` | Funcional | Firestore Aggregate Analytics |
| 28 | `saas_admin` | Administração Multi-tenant | `SaaSAdminView.tsx` | Funcional | Firestore Multi-tenant Config |
| 29 | `subscriptions` | Planos de Assinatura | `SubscriptionManagerView.tsx` | Funcional | Firestore (`subscriptionPlans`) |
| 30 | `synapse_agent` | Painel de Controle Synapse | `SynapseAgentView.tsx` | 100% Funcional | Estado Global do Synapse Agent |
| 31 | `rate_manager` | Gestor de Tarifas & Regras | `RateManagerView.tsx` | 100% Funcional | Firestore (`ratePlans`, `restrictions`) |
| 32 | `channel_manager` | Channel Manager (OTAs) | `ChannelManagerView.tsx` | 100% Funcional | Integrado com Aloha Pro / Beds24 |
| 33 | `my_subscription` | Minha Assinatura SaaS | `MySubscriptionView.tsx` | Funcional | Stripe Billing Portal / Firestore |
| 34 | `guest_journey_ai` | Jornada Inteligente do Hóspede| `GuestJourneyAIView.tsx` | Funcional + IA | Gemini AI Context Builder |
| 35 | `partner_services` | Serviços de Parceiros & Toures | `PartnerServicesView.tsx` | Funcional | Firestore (`partnerServices`) |
| 36 | `vigilancia` | Monitoramento & CFTV | `VigilanciaView.tsx`, `SurveillanceDashboard.tsx` | Funcional | WebRTC / Motion Alerts Sim |
| 37 | `marketing_dashboard` | Dashboard da Equipe de Mkt | `dashboards/MarketingDashboard.tsx` | Funcional | Firestore + Recharts Analytics |
| 38 | `email_autopilot` | Piloto Automático de E-mails | `EmailAutopilotView.tsx` | Funcional + IA | Gemini AI + Email Templates |
| 39 | `maintenance_manager` | Gestão de Manutenção | `MaintenanceManagerView.tsx` | Funcional | Firestore (`workOrders`, `equipment`) |
| 40 | `supplier_manager` | Gestão de Fornecedores | `SupplierManagerView.tsx` | Funcional | Firestore (`suppliers`, `purchaseOrders`) |
| 41 | `integrations` | Central de Sincronização & APIs | `IntegrationsView.tsx` | 100% Funcional | Logs de Sincronização e Webhooks |
| 42 | `reputation_manager` | Gestão de Reputação & Avaliação | `ReputationManagerView.tsx` (via Reviews) | Funcional | Firestore (`reviews`) + Sentiment AI |

---

## 3. MAPEAMENTO EXAUSTIVO DOS AGENTES DE IA EXISTENTES

O Synapse opera como uma **massa de inteligência distribuída** cujas capacidades inteligentes estão distribuídas entre múltiplos especialistas contextuais:

```
                                  ┌────────────────────────┐
                                  │ SYNAPSE ORCHESTRATOR   │
                                  │  (Kernel no server.ts) │
                                  └───────────┬────────────┘
                                              │
        ┌─────────────────────────────────────┼─────────────────────────────────────┐
        ▼                                     ▼                                     ▼
┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐
│ AGENTES OPERACIONAIS    │       │ AGENTES DE MARKETING    │       │ AGENTES DE EXPERIÊNCIA  │
│ - Team Manager AI       │       │ - Strategy Consultant   │       │ - Concierge AI (Guest)  │
│ - Shopping List AI      │       │ - Marketing Lab         │       │ - Guest Journey AI      │
│ - Maintenance AI        │       │ - Creative Studio       │       │ - Reputation & Sentiment│
│ - Revenue & Rate AI     │       │ - Email Autopilot       │       │ - OmniChannel AI        │
└─────────────────────────┘       └─────────────────────────┘       └─────────────────────────┘
```

### Detalhamento dos Agentes Existentes:

1. **Synapse Core Orchestrator (`synapse_orchestrator`)**
   - **Localização:** Backend (`/server.ts` - `runGeminiCoreExecution`)
   - **Propósito:** Processa e-mails e notificações do Aloha Pro Webhook, extraindo dados de reservas de forma estruturada via JSON Schema. Possui sistema de fallback baseado em heurística/regex se a chave Gemini não estiver presente.

2. **Team Manager AI (`team_manager_ai`)**
   - **Localização:** Módulo `team_manager_ai` (`AITeamManagerView.tsx`)
   - **Propósito:** Analisa carga de trabalho da equipe, sugere redistribuição de tarefas de governança e prioriza demandas de manutenção preventiva.

3. **AI Strategy Consultant (`ai_strategy_consultant`)**
   - **Localização:** Módulo `ai_strategy_consultant` (`AIStrategyConsultantView.tsx`)
   - **Propósito:** Executa análises SWOT e diagnósticos financeiros para otimizar ocupação, sugerir pacotes promocionais para baixa temporada e calcular RevPAR ideal.

4. **AI Marketing Lab & Orchestrator (`ai_marketing_lab` / `marketing_orchestrator`)**
   - **Localização:** Módulo `marketing_orchestrator` (`MarketingOrchestratorView.tsx`)
   - **Propósito:** Constrói planos de mídia (Marketing Mix), distribuindo orçamento entre Google Ads, Meta Ads e TikTok Ads de acordo com a meta da propriedade.

5. **Creative Studio AI (`creative_studio`)**
   - **Localização:** Módulo `creative_studio` (`CreativeStudioView.tsx`)
   - **Propósito:** Gera copies persuasivas e chamadas para mídias sociais, sugerindo também prompts visuais para geração de imagens publicitárias.

6. **Email Autopilot AI (`email_autopilot`)**
   - **Localização:** Módulo `email_autopilot` (`EmailAutopilotView.tsx`)
   - **Propósito:** Cria réguas de e-mail personalizadas para pré-chegada, confirmação de reserva, pós-checkout e ofertas de reconexão.

7. **Guest Journey AI (`guest_journey_ai`)**
   - **Localização:** Módulo `guest_journey_ai` (`GuestJourneyAIView.tsx`)
   - **Propósito:** Monitora os pontos de contato do hóspede durante sua estadia, sugerindo upsells de serviços (passeios, coworking, consumação no bar) no momento exato.

8. **AI Concierge (`concierge_ai`)**
   - **Localização:** Portal do Hóspede (`GuestPortalView.tsx`)
   - **Propósito:** Atende o hóspede 24/7 tirando dúvidas sobre Wi-Fi, horários de café da manhã, dicas de praias e passeios na região.

---

## 4. MAPEAMENTO DE INTEGRAÇÕES & APIS

```
                                  ┌───────────────────────────┐
                                  │ SYNAPSE INTEGRATIONS ENGINE│
                                  └─────────────┬─────────────┘
                                                │
         ┌──────────────────────────────────────┼──────────────────────────────────────┐
         ▼                                      ▼                                      ▼
┌───────────────────────────┐        ┌───────────────────────────┐        ┌───────────────────────────┐
│ OTAs & CHANNEL MANAGERS   │        │ PAYMENT GATEWAYS          │        │ ADS & SOCIAL MEDIA        │
│ - Aloha Pro Webhook       │        │ - Stripe Payment Intents  │        │ - Meta Ads (Insta/FB)     │
│ - Beds24 iCal / API       │        │ - PIX Payload Generator   │        │ - Google Ads              │
│ - Booking.com             │        │ - Mercado Pago            │        │ - TikTok Ads              │
│ - Airbnb / Expedia        │        │ - PayPal                  │        │ - WhatsApp Business       │
└───────────────────────────┘        └───────────────────────────┘        └───────────────────────────┘
```

1. **Aloha Pro Webhook Integration:**
   - Endpoint: `POST /api/webhooks/aloha-pro`
   - Funcionamento: Recebe e-mails de notificação de reservas não estruturados, executa o Gemini AI Schema Parser e grava automaticamente o Hóspede (`guests`), a Reserva (`bookings`), o Quarto atribuído (`rooms`) e o Log de Sincronização (`integrationSyncLogs`).

2. **Beds24 & iCal Channel Synchronization:**
   - Rota e Serviço: `/services/beds24Service.ts`
   - Sincroniza calendários no formato iCal bidirecionalmente para evitar overbooking entre Booking.com, Airbnb e motor de reservas direto.

3. **Stripe & PIX Payment Gateway:**
   - Endpoint: `POST /api/create-payment-intent` & `POST /api/create-pix-payment`
   - Permite pagamento instantâneo por cartão via Stripe e gera payload PIX com copia-e-cola e código QR estipulado para expirar em 30 minutos.

---

## 5. MAPEAMENTO DO MODELO DE DADOS & ENTIDADES FIRESTORE

A estrutura noSQL no Firestore e tipada em `types.ts` é composta por 25+ coleções principais:

```
FIRESTORE DATABASE SCHEMA
├── properties/                  # Dados cadastrais das unidades (Beach, Santuário)
├── rooms/                       # Quartos, leitos, status de limpeza e controles IoT
├── guests/                      # Perfil completo do hóspede, histórico, pontos e preferências
├── bookings/                    # Reservas, check-in/out, adicionais, origem e valores
├── staff/                       # Funcionários, papéis, permissões de acesso e fotos
├── staffTasks/                  # Tarefas de manutenção, limpeza e governança
├── products/                    # Itens de estoque do bar, recepção, amenities e valores
├── transactions/                # Vendas do POS, contas de quarto e forma de pagamento
├── expenses/                    # Despesas operacionais do hotel (luz, água, salários)
├── ratePlans/                   # Planos tarifários (padrão, não reembolsável, café incluso)
├── restrictions/                # Restrições de estancia mínima e bloqueios de data
├── chatConversations/           # Histórico de conversas do OmniChannel e chat interno
├── integrationSyncLogs/        # Logs de sincronização do Webhook Aloha Pro e OTAs
├── reviews/                     # Avaliações dos hóspedes e análise de sentimento por IA
├── shoppingLists/               # Listas de compras automáticas e estoque
├── projects/                    # Obras e melhorias estruturais da propriedade
├── adCampaigns/                 # Campanhas de tráfego pago (Meta, Google, TikTok)
└── partnerServices/             # Serviços terceirizados (passeios, aluguel de pranchas)
```

---

## 6. AUDITORIA TÉCNICA E QUALIDADE DE CÓDIGO

### 6.1 Pontos Fortes Identificados
- **Coesão e Riqueza de UI:** Design moderno com Tailwind CSS, sem clichês genéricos. Suporte a temas personalizados (Padrão, Moderno, Dark Elegance, Tropical).
- **Tratamento de Fallbacks em IA:** O pipeline Gemini do `server.ts` conta com sistema de parsing Regex/Heurístico que previne queda da aplicação em cenários de ausência de chave de API ou atingimento de cotas.
- **Isolamento de Credenciais:** Chaves de API e secrets são mantidos estritamente no backend (`server.ts`).

### 6.2 Pontos de Atenção (Débito Técnico Mapeado no Backlog)
- **Tamanho dos Arquivos do Servidor:** `server.ts` concentra rotas de API, middlewares e parsing de webhook em um único arquivo. Recomendada a modularização incremental mantendo a estabilidade.
- **Declaração de Tipos Repetida:** `types.ts` possui 1700+ linhas, contendo enums e tipos que podem ser segmentados por subdomínio.

---

## 7. PLANO DIRETO DE EVOLUÇÃO (MASTER EVOLUTION PLAN V2)

### 7.1 A Filosofia Synapse Distributed Intelligence

> **Diretriz Absoluta:** NUNCA criar uma "segunda aplicação", um "segundo menu" ou uma "interface paralela".
> O Synapse é a inteligência contextual que habita **dentro** dos 42 módulos existentes.

```
       ┌─────────────────────────────────────────────────────────────┐
       │                ESTRUTURA VISUAL OFICIAL (PMS)               │
       │   [Menu Lateral Existente]  |  [Dashboard e Seção Atual]   │
       └──────────────────────────────┬──────────────────────────────┘
                                      │
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │          CAMADA INTEGRA DA DE INTELIGÊNCIA SYNAPSE           │
       │                                                             │
       │   • [Synapse Context Bar] em cada tela                      │
       │   • Insights preditivos no topo das tabelas                 │
       │   • Sugestões de ação com 1 clique (Aprovar, Aplicar)      │
       │   • Automação silenciosa em segundo plano                  │
       └─────────────────────────────────────────────────────────────┘
```

---

### 7.2 Roteiro Sequencial de Implementação (Roadmap por Etapas)

Conforme estabelecido nas regras do projeto, **as etapas serão executadas estritamente uma por vez**, mediante autorização prévia do usuário para cada avanço.

#### **ETAPA 1 — Fortalecimento do Kernel e Fallbacks do Synapse**
- **Objetivo:** Garantir estabilidade de 100% no pipeline Gemini AI, fortalecendo fallbacks e gerenciamento de cotas.
- **Módulos Impactados:** `server.ts`, `/services/geminiService.ts`
- **Entrega:** Execução limpa do orquestrador com suporte a re-tentativas automáticas sem impacto na interface.

#### **ETAPA 2 — Distribuição de IA no Módulo de Reservas & Calendário**
- **Objetivo:** Adicionar previsões de ocupação e otimização tarifária direto no mapa de reservas (`calendar` e `bookings`).
- **Módulos Impactados:** `CalendarView.tsx`, `BookingsView.tsx`
- **Entrega:** Badge contextual do Synapse indicando sugestões de ajuste de preços por alta demanda.

#### **ETAPA 3 — Distribuição de IA no CRM & Jornada do Hóspede**
- **Objetivo:** Enriquecer o cadastro de hóspedes (`guests`) com resumo de perfil por IA e recomendação de pré-atendimento.
- **Módulos Impactados:** `GuestsView.tsx`, `GuestProfileView.tsx`
- **Entrega:** Análise de sentimento e tag de preferências automáticas em cada perfil.

#### **ETAPA 4 — Distribuição de IA na Governança & Manutenção**
- **Objetivo:** Otimização da ordem de limpeza e manutenção preditiva dos quartos (`housekeeping`, `maintenance_manager`).
- **Módulos Impactados:** `HousekeepingView.tsx`, `MaintenanceManagerView.tsx`
- **Entrega:** Roteirização inteligente de limpeza para camareiras com base nos horários de check-in/out.

#### **ETAPA 5 — Distribuição de IA no Financeiro, Compras & Estoque**
- **Objetivo:** Sugestão inteligente de reposição de estoque (`inventory`, `shopping_list`) e previsão de fluxo de caixa (`financial_manager`).
- **Módulos Impactados:** `FinancialManagerView.tsx`, `InventoryView.tsx`, `ShoppingListView.tsx`
- **Entrega:** Lista de compras gerada automaticamente com base na ocupação projetada para os próximos 15 dias.

#### **ETAPA 6 — Distribuição de IA no Marketing, Redes Sociais e Vendas Diretas**
- **Objetivo:** Integração total dos agentes de marketing dentro do orquestrador de campanhas (`ad_campaign_manager`, `social_media`, `email_autopilot`).
- **Módulos Impactados:** `AdCampaignManagerView.tsx`, `SocialMediaManagerView.tsx`, `EmailAutopilotView.tsx`
- **Entrega:** Criação e disparo automatizado de anúncios com ajuste orçamentário inteligente.

---

## 8. REGISTRO DE DECISÕES ARQUITETURAIS (ADR)

- **ADR-001 (Consolidação de Placa Única):** Fica estritamente vetada a criação de novos painéis ou shells para o Synapse. A interface oficial e única é o `AdminDashboard.tsx`.
- **ADR-002 (Priorização de Resiliência Backend):** Todas as chamadas de Inteligência Artificial devem rodar no backend (`server.ts`), utilizando schemas JSON estritos com tratadores de erro e fallbacks por regras locais.
- **ADR-003 (Princípio da Menor Alteração):** Nenhuma biblioteca ou tela existente será removida. Cada alteração adicionará valor de forma aditiva e cirúrgica.

---
*Fim do Documento Oficial MASTER_EVOLUTION_PLAN_V2.md*
