# 📖 PRODUCT BIBLE — SYNAPSE HOSPITALITY (VERSÃO 1.0)
> **Constituição Comercial e Técnica Oficial do Synapse Hospitality**  
> **Data de Emissão:** 04 de Agosto de 2026  
> **Autoridade:** Diretoria de Produto, Lead Engineering & Conselho de Arquitetura Synapse  

---

## 1. VISÃO DO PRODUTO

### 1.1 O que é o Synapse Hospitality
O **Synapse Hospitality** é a primeira plataforma de gestão hoteleira e hospitalidade impulsionada por **Inteligência Distribuída de Multi-Agentes Contextuais**. Diferente de PMSs (*Property Management Systems*) legados e isolados, o Synapse unifica em um ecossistema nativo e coeso:
- **PMS (Property Management System):** Mapa de reservas, ocupação, governança, recepção, manutenção e leitos.
- **CM (Channel Manager & Direct Booking):** Sincronização bidirecional em tempo real com OTAs (Booking.com, Airbnb, Expedia) e motor de reservas diretas sem comissão.
- **POS & Retail (Ponto de Venda):** Gestão de restobar, bar de praia, coworking e serviços adicionais com cobrança direta na conta do quarto.
- **Marketing AI & Engagement Lab:** Automação de campanhas de tráfego pago, orquestração de redes sociais e réguas de e-mail automatizadas.
- **Distributed AI Agents Layer:** Camada de inteligência contextualmente integrada aos 42 módulos operacionais da plataforma.

### 1.2 Qual Problema Resolve
A indústria da hospitalidade enfrenta quatro gargalos crônicos de eficiência:
1. **Fragmentação de Software (SaaS Fatigue):** Meios de hospedagem utilizam entre 5 e 12 softwares desconectados (PMS de um fornecedor, Channel Manager de outro, CRM externo, POS independente, Agência de tráfego pago), gerando perda de dados, erros de overbooking e alto custo recorrente.
2. **Trabalho Operacional Manual & Repetitivo:** Equipes gastam horas respondendo dúvidas repetitivas de hóspedes, cadastrando reservas manualmente vindo de e-mails/webhooks, alocando camareiras em planilhas e ajustando tarifas de forma reativa.
3. **Decisões Tarifárias por Achismo:** Falta de análise Preditiva de demanda em tempo real resulta em subprecificação em períodos de alta e ociosidade em períodos de baixa.
4. **Falta de Hiperpersonalização:** A jornada do hóspede é genérica, resultando em baixas taxas de consumo interno (*upsell*) e perda de receita não diária (*non-room revenue*).

### 1.3 Quem são seus Clientes
O Synapse Hospitality foi desenhado para atender desde propriedades independentes até redes com múltiplas propriedades e modelos híbridos de hospedagem:
- Hotéis Boutique e Hotéis Urbanos de Médio Porte
- Hostels, Pousadas de Praia e Ecoturismo
- Resorts, Condohotéis e Propriedades de Aluguel de Temporada (*Vacation Rentals*)
- Espaços Híbridos de Coworking, Coliving, Student Housing e Hospitalidade de Saúde

### 1.4 Proposta de Valor Unificada
> *"Conectar toda a operação hoteleira sob uma única plataforma inteligente onde a IA antecipa decisões, automatiza rotinas pesadas com supervisão humana e multiplica a lucratividade por quarto disponível (RevPAR) e por hóspede (TRevPAR)."*

---

## 2. MISSÃO

> **"Transformar a gestão de hospitalidade global através de inteligência operacional distribuída, eliminando o trabalho braçal, eliminando ruídos entre departamentos e permitindo que hoteleiros e suas equipes foquem no que realmente importa: a experiência memorável do hóspede."**

---

## 3. VISÃO

> **"Ser a plataforma operacional e de inteligência de hospitalidade mais admirada, utilizada e rentável do mundo até 2030, tornando-se o sistema operacional invisível que conecta milhões de leitos, hóspedes e agentes autônomos em tempo real."**

---

## 4. VALORES

1. **Hospitalidade em Primeiro Lugar (Human Touch Enhanced by AI):** A tecnologia e os agentes autônomos nunca substituem o toque humano, mas sim capacitam as equipes a servirem com mais empatia e agilidade.
2. **Precisão & Confiabilidade Absoluta:** Dados de reservas, caixa e hóspedes são sagrados. Zero margem para erros de cobrança ou overbooking.
3. **Aprovação Humana Consciente (Governance & Control):** A Inteligência Artificial propõe diagnósticos e estratégias, mas o controle final e a governança cabem ao gestor responsável.
4. **Zero Fricção & Simplicidade de Uso:** Interfaces fluidas, velozes, com feedback instantâneo e tempo de onboarding reduzido a minutos.
5. **Acessibilidade & Escalabilidade:** Tecnologia de nível corporativo (*enterprise-grade*) acessível para pousadas familiares e escalável para grandes redes multi-propriedades.

---

## 5. PRINCÍPIOS ARQUITETURAIS

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           SYNAPSE ARCHITECTURAL PILLARS                          │
│                                                                                  │
│   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐  │
│   │   ADR-005     │   │ Distributed   │   │   AI-First    │   │ Multi-Tenant  │  │
│   │Human Approval │   │ Intelligence  │   │ Native Core   │   │ & Cloud Native│  │
│   └───────┬───────┘   └───────┬───────┘   └───────┬───────┘   └───────┬───────┘  │
└───────────┼───────────────────┼───────────────────┼───────────────────┼──────────┘
            ▼                   ▼                   ▼                   ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           100% OPERATIONAL INTEGRITY                             │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 5.1 ADR-005 & Human Approval
Nenhuma ação autônoma com impacto financeiro, contratual, tarifário ou de alteração direta de dados de clientes é executada sem a chancela explícita de um operador humano (*Human-in-the-Loop*). A IA atua na proposição, triagem, rascunho e simulação de cenários; o gestor aprova com 1 clique no *Decision Center*.

### 5.2 Distributed Intelligence (Inteligência Distribuída)
O Synapse não é um robô isolado em um chat genérico. A inteligência é dividida em **Agentes Especializados Contextuais** que habitam nativamente os módulos operacionais (Financeiro, Governança, Marketing, Manutenção, CRM, etc.), reportando insights consolidados ao *Executive Agent*.

### 5.3 AI-First Architecture
Os fluxos de dados são estruturados para permitir que modelos de linguagem e visão computacional (Gemini 2.5 Flash / Pro) processem e-mails não estruturados, documentos de compras, mensagens de WhatsApp, imagens de monitoramento e feedbacks de hóspedes em tempo real.

### 5.4 Multi-Tenant & Multi-Property Native
Arquitetura de dados isolada por `tenantId` e `propertyId`, permitindo que grupos hoteleiros administrem múltiplas propriedades sob a mesma conta com controle de permissões por perfil (*RBAC - Role-Based Access Control*).

### 5.5 Cloud Native & Micro-SaaS Resilient
Infraestrutura leve rodando em containers Cloud Run e suporte a re-tentativas com fallbacks locais (*Regex & Heuristic Parsers*), garantindo disponibilidade de 99.99% mesmo em oscilações de cotas de APIs externas.

### 5.6 API-First & Open Integration
Todos os recursos do sistema expõem rotas REST e suportam Webhooks para integração bidirecional com ecossistemas externos (hardware de fechaduras eletrônicas, catracas, PABX, totens de check-in, contabilidade).

### 5.7 Modular & Non-Destructive Architecture
Nenhuma melhoria ou atualização substitui abruptamente interfaces consolidadas. A expansão ocorre por acoplamento incremental e componentes modulares reutilizáveis.

---

## 6. PERSONAS E CASOS DE USO

| Persona / Segmento | Desafio Principal | Solução Synapse Hospitality |
| :--- | :--- | :--- |
| **Hotel Boutique** | Cobrar tarifas que reflitam o valor da experiência e otimizar upsells. | Revenue Agent com Precificação Dinâmica e Guest Journey AI com sugestões de experiências exclusivas. |
| **Hostel & Albergue** | Gestão de leitos compartilhados, rotatividade alta e vendas de eventos/bar. | Gestão de camas por quarto, POS com integração de comanda no quarto e automação de grupos. |
| **Pousada de Praia / Serra** | Equipe enxuta acumulando recepção, compras, marketing e limpeza. | Shopping List AI, Housekeeping Agent automatizando rotas de camareiras e Email Autopilot de pré-chegada. |
| **Resort & Condohotel** | Múltiplos pontos de venda, complexidade de distribuição de receita e convenções. | POS Integrado, rateio financeiro multi-propriedade, CRM de grandes eventos e orquestrador de transporte. |
| **Coworking & Coliving** | Gestão de estadias de longa permanência (*long-stay*), créditos de mesa/reunião e faturamento recorrente. | Módulo Coworking com agendamento de salas, controle de acessos e cobrança de assinaturas periódicas. |
| **Hospital & Senior Living** | Gestão de leitos hospitalares, limpeza com rigidez sanitária e controle de dietas. | Rastreamento sanitário de quartos, escalonamento urgente no Maintenance/Housekeeping Agent e dietas no POS. |
| **Student Housing** | Contratos por semestre, vistorias de entrada/saída e comunicação interna em massa. | Módulo de contratos, vistoria com upload de fotos e OmniChannel para avisos no grupo de residentes. |
| **Property Manager (Short-stay)** | Sincronizar dezenas de apartamentos no Airbnb/Booking sem overbooking. | Channel Manager com Beds24/iCal, fechaduras eletrônicas e automação de pré-check-in digital. |

---

## 7. MATRIZ EXAUSTIVA DOS 42 MÓDULOS OPERACIONAIS

Abaixo está o detalhamento corporativo de cada um dos 42 módulos da plataforma oficial:

```
                               ┌────────────────────────────────────────────────┐
                               │       SYNAPSE 42 OPERATIONAL MODULES           │
                               └───────────────────────┬────────────────────────┘
                                                       │
        ┌───────────────────────┬──────────────────────┼───────────────────────┬───────────────────────┐
        ▼                       ▼                      ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐      ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│ CORE PMS      │       │ REVENUE & OTAS│      │ GUEST & CRM   │       │ OPERATIONS    │       │ MARKETING & AI│
│ - Calendar    │       │ - Rate Manager│      │ - Guests      │       │ - Housekeeping│       │ - Mkt Lab     │
│ - Rooms       │       │ - Channel Mgr │      │ - OmniChannel │       │ - Maintenance │       │ - Creative St.│
│ - Bookings    │       │ - Direct Book │      │ - Guest Journ.│       │ - Inventory   │       │ - Email Auto  │
│ - Staff       │       │ - Dynamic Prc │      │ - Reputation  │       │ - POS & Rest. │       │ - Strategy AI │
└───────────────┘       └───────────────┘      └───────────────┘       └───────────────┘       └───────────────┘
```

### 1. Visão Geral / Painel Principal (`dashboard`)
- **Objetivo:** Concentrar KPIs críticos da propriedade em tempo real (taxa de ocupação, RevPAR, ADR, check-ins do dia, receita diária).
- **Usuários:** Gerentes Gerais, Administradores, Proprietários.
- **Responsabilidades:** Exibir gráficos de desempenho, alertas operacionais urgentes e atalhos de ação.
- **KPIs:** Occupancy Rate (%), RevPAR (R$), ADR (R$), Total Revenue (R$).
- **Integrações:** Firestore Aggregate Service, Calendar API.
- **Agente Responsável:** Executive Agent (Synapse Orchestrator).

### 2. Mapa de Reservas - Gantt (`calendar`)
- **Objetivo:** Oferecer um calendário visual drag-and-drop para alocação e gerenciamento de quartos/leitos.
- **Usuários:** Recepcionistas, Operadores de Reservas, Gerente Operacional.
- **Responsabilidades:** Troca de quartos, arraste de datas, atalho para check-in/out rápido, identificador de status da limpeza.
- **KPIs:** Ocupação Diária, Inconsistências de Bloqueio, Quartos Ocupados vs Sujos.
- **Integrações:** Beds24 iCal, Aloha Pro Webhook, Rooms Database.
- **Agente Responsável:** Revenue Agent & Room Intelligence Agent.

### 3. Gestão de Unidades & Camas (`rooms`)
- **Objetivo:** Cadastro e controle de características de suítes, quartos privativos e leitos em dormitórios compartilhados.
- **Usuários:** Gerente de Operações, Governança.
- **Responsabilidades:** Configurar amenidades, capacidades de hóspedes, fotos e status do quarto (Livre, Ocupado, Manutenção, Bloqueado).
- **KPIs:** Leitos Disponíveis, Leitos em Manutenção, Capacidade Máxima.
- **Integrações:** Housekeeping Module, Maintenance Module.
- **Agente Responsável:** Room Intelligence Agent.

### 4. Reservas & Ocupação (`bookings`)
- **Objetivo:** Listagem completa, busca avançada e criação manual de reservas diretas e oriundas de OTAs.
- **Usuários:** Equipe de Recepção, Central de Reservas.
- **Responsabilidades:** Registrar hóspedes, vincular tarifas, processar adiantamentos e registrar pagamentos adicionais.
- **KPIs:** Total de Reservas Ativas, Origem da Reserva (Direta vs OTA), Ticket Médio por Reserva.
- **Integrações:** Stripe, PIX Generator, OTA Webhooks.
- **Agente Responsável:** Revenue Agent.

### 5. Hóspedes & CRM (`guests`)
- **Objetivo:** Banco de dados unificado de perfis de hóspedes, histórico de estadias, preferências e pontuação de LTV.
- **Usuários:** Recepcionista, Gerente de CRM, Concierge.
- **Responsabilidades:** Armazenar documentos (CPF/Passaporte), hábitos, restrições alimentares e observações VIP.
- **KPIs:** LTV (Lifetime Value), Taxa de Retorno (% Re-booking), NPS Individual.
- **Integrações:** Guest Journey AI, OmniChannel.
- **Agente Responsável:** CRM & Guest Journey Agent.

### 6. Equipe & Permissões (`staff`)
- **Objetivo:** Gestão de colaboradores, atribuição de cargos e controle de níveis de acesso por módulo.
- **Usuários:** Recursos Humanos, Gerente Geral, Admin.
- **Responsabilidades:** Cadastrar funcionários, definir papéis (Admin, Recepção, Governança, Bar) e escala de folgas.
- **KPIs:** Total de Colaboradores Ativos, Produtividade por Setor, Horas Trabalhadas.
- **Integrações:** Firebase Authentication, Staff Tasks.
- **Agente Responsável:** HR & Team Manager Agent.

### 7. Governança & Limpeza (`housekeeping`)
- **Objetivo:** Organização do fluxo de limpeza diária, arrumação de quartos de saída e vistorias.
- **Usuários:** Governança, Camareiras, Limpeza.
- **Responsabilidades:** Atribuir tarefas de arrumação por camareira, atualizar status do quarto em tempo real, alertar objetos esquecidos.
- **KPIs:** Tempo Médio de Limpeza por Quarto, Taxa de Quartos Liberados no Horário, Reclamações de Limpeza.
- **Integrações:** Calendar View, Staff Module.
- **Agente Responsável:** Housekeeping Agent.

### 8. Gestor de Equipe com IA (`team_manager_ai`)
- **Objetivo:** Otimizar e balancear a escala de trabalho da equipe operacional usando algoritmos preditivos.
- **Usuários:** Gerente de Operações, RH.
- **Responsabilidades:** Redistribuir tarefas em dias de pico de check-in, sugerir folgas na baixa e prever gargalos de atendimento.
- **KPIs:** Nível de Sobrecarga da Equipe, Eficiência de Atendimento.
- **Integrações:** Gemini AI, Staff Tasks Engine.
- **Agente Responsável:** Team Manager AI Agent.

### 9. Ponto de Venda - POS / Bar (`pos`)
- **Objetivo:** Sistema de caixa e comandas para restaurante, bar de praia, conveniência e serviços extras.
- **Usuários:** Atendentes de Bar, Garçons, Recepcionistas.
- **Responsabilidades:** Abrir e fechar comandas, lançar consumo direto na conta do quarto do hóspede, imprimir comprovantes.
- **KPIs:** Faturamento Diário do POS, Ticket Médio do Restaurante, Itens Mais Vendidos.
- **Integrações:** Inventory Module, Financial Manager, Receipt Printing.
- **Agente Responsável:** Retail & POS Agent.

### 10. Espaço Coworking (`coworking`)
- **Objetivo:** Gestão de estações de trabalho, salas de reunião privativas e estadias *workation*.
- **Usuários:** Gerente de Coworking, Recepcionista.
- **Responsabilidades:** Controlar agendamentos de salas por hora/dia, créditos de impressão e check-in de coworkers.
- **KPIs:** Taxa de Ocupação do Coworking, Receita por M² de Coworking.
- **Integrações:** POS System, Booking Engine.
- **Agente Responsável:** Experience Agent.

### 11. Pedidos & Deliveries (`delivery_orders`)
- **Objetivo:** Controle de pedidos de refeição internos (room service) e pedidos externos para a comunidade.
- **Usuários:** Cozinha, Bar, Entregadores.
- **Responsabilidades:** Rastrear status do pedido (Recebido, Em Preparo, Saiu para Entrega, Entregue).
- **KPIs:** Tempo de Preparo, Avaliação do Prato, Faturamento do Room Service.
- **Integrações:** POS Module, OmniChannel Chat.
- **Agente Responsável:** Retail & POS Agent.

### 12. Gestão Financeira (`financial_manager`)
- **Objetivo:** Controle de fluxo de caixa, DRE simplificado, contas a pagar, contas a receber e conciliação bancária.
- **Usuários:** Diretor Financeiro, Contabilidade, Gerente Geral.
- **Responsabilidades:** Registrar despesas operacionais (fornecedores, energia, salários), visualizar margem de lucro e lançamentos do POS/Reservas.
- **KPIs:** EBITDA, Margem Operacional (%), Fluxo de Caixa Líquido, Contas Em Atraso.
- **Integrações:** Stripe, Mercado Pago, POS, Shopping List.
- **Agente Responsável:** Financial Agent.

### 13. Controle de Estoque (`inventory`)
- **Objetivo:** Gestão de insumos de alimentos, bebidas, itens de frigobar, produtos de limpeza e amenidades.
- **Usuários:** Almoxarife, Comprador, Barman, Governança.
- **Responsabilidades:** Dar baixa automática de itens vendidos no POS, alertar ponto de pedido e estoque mínimo.
- **KPIs:** Giro de Estoque, Valor Total do Estoque, Perdas e Validades.
- **Integrações:** POS, Shopping List Module, Supplier Manager.
- **Agente Responsável:** Inventory Agent.

### 14. Lista de Compras Intuitiva (`shopping_list`)
- **Objetivo:** Geração automática e inteligente de cotações e listas de compras baseadas na previsão de ocupação.
- **Usuários:** Comprador, Gerente Operacional.
- **Responsabilidades:** Comparar preços de fornecedores, sugerir quantidades ideais para os próximos 15 dias e emitir ordens de compra.
- **KPIs:** Economia em Compras (R$), Tempo de Reposição, Índice de Ruptura de Estoque.
- **Integrações:** Gemini AI, Inventory Database, Supplier Manager.
- **Agente Responsável:** Inventory & Procurement Agent.

### 15. Gestão de Redes Sociais (`social_media`)
- **Objetivo:** Planejamento, agendamento de publicações e monitoramento de engajamento no Instagram e Facebook.
- **Usuários:** Equipe de Marketing, Community Manager.
- **Responsabilidades:** Visualizar calendário de postagens, rascunhar legendas e analisar métricas de curtidas e alcance.
- **KPIs:** Engajamento Social, Alcance Orgânico, Leads Gerados via Social.
- **Integrações:** Meta Graph API Simulator, Creative Studio.
- **Agente Responsável:** Marketing Orchestrator Agent.

### 16. Gestor de Tráfego Pago (`ad_campaign_manager`)
- **Objetivo:** Criação, monitoramento e otimização de campanhas de tráfego no Google Ads, Meta Ads e TikTok Ads.
- **Usuários:** Gestor de Tráfego, Diretor de Marketing.
- **Responsabilidades:** Acompanhar ROI por campanha, custo por clique (CPC) e custo de aquisição de reserva direta (CAC).
- **KPIs:** ROAS (Return on Ad Spend), CAC (Custo de Aquisição de Cliente), Taxa de Conversão da Landing Page.
- **Integrações:** Marketing Mix Pipeline, Direct Booking Engine.
- **Agente Responsável:** Marketing Orchestrator Agent.

### 17. Relatórios BI & Analytics (`reports`)
- **Objetivo:** Central de inteligência de dados com gráficos avançados, comparativos anuais e exportação de relatórios em PDF/Excel.
- **Usuários:** Investidores, Diretores, Gerentes de Unidade.
- **Responsabilidades:** Analisar histórico de ocupação, origem de hóspedes por estado/país e curva de receita.
- **KPIs:** RevPAR, TRevPAR, GOPPAR, Cancelation Rate.
- **Integrações:** Recharts Engine, Firestore Aggregate DB.
- **Agente Responsável:** Executive Agent (Synapse).

### 18. Central de Atendimento OmniChannel (`omni_channel`)
- **Objetivo:** Caixa de entrada unificada para atendimento de clientes via WhatsApp, Instagram Direct, WebChat e E-mail.
- **Usuários:** Equipe de Vendas, Recepção, Suporte.
- **Responsabilidades:** Centralizar conversas, encaminhar para atendentes humanos, acionar o robô de reservas diretas.
- **KPIs:** Tempo Médio de Primeira Resposta, Taxa de Conversão do Chat em Reserva, NPS do Atendimento.
- **Integrações:** WhatsApp Business API, Gemini Concierge.
- **Agente Responsável:** OmniChannel & CRM Agent.

### 19. Comunicação Interna (`internal_chat`)
- **Objetivo:** Canal de chat e avisos corporativos seguro entre setores (Recepção <-> Governança <-> Manutenção).
- **Usuários:** Todos os funcionários cadastrados.
- **Responsabilidades:** Troca de mensagens rápidas, envio de fotos de avarias de quartos e avisos de reuniões.
- **KPIs:** Tempo de Resolução de Incidências Internas.
- **Integrações:** Staff Database, Real-time Chat Engine.
- **Agente Responsável:** HR & Team Manager Agent.

### 20. Consultor Estratégico IA (`ai_strategy_consultant`)
- **Objetivo:** Módulo de diagnóstico estratégico de negócios impulsionado por inteligência artificial.
- **Usuários:** Proprietários, Consultores, Gerentes Gerais.
- **Responsabilidades:** Gerar análises SWOT automáticas, simular impacto de reformas e comparar desempenho com o mercado local.
- **KPIs:** Health Score da Propriedade, Potencial de Incremento de Receita.
- **Integrações:** Gemini 2.5 Pro Pipeline.
- **Agente Responsável:** AI Strategy Consultant Agent.

### 21. Laboratório de Marketing IA (`ai_marketing_lab`)
- **Objetivo:** Ambiente de experimentação para teste de abordagens comerciais, mensagens promocionais e personas.
- **Usuários:** Equipe de Marketing, Copywriters.
- **Responsabilidades:** Gerar variações de títulos de anúncios, testar gatilhos mentais e simular taxas de abertura.
- **KPIs:** A/B Test Win Rate, CTR Projetado.
- **Integrações:** Gemini AI Execution Pipeline.
- **Agente Responsável:** Marketing Orchestrator Agent.

### 22. Estúdio Criativo (`creative_studio`)
- **Objetivo:** Ferramenta interna para criação de textos publicitários, briefings visuais e sugestões de artes para redes sociais.
- **Usuários:** Designers, Marketing.
- **Responsabilidades:** Gerar copies em múltiplos idiomas, sugerir paletas de cores e paletas visuais para campanhas.
- **KPIs:** Tempo de Produção de Peças de Marketing.
- **Integrações:** Gemini Text & Image Generation Pipeline.
- **Agente Responsável:** Creative Studio AI Agent.

### 23. Configurações da Propriedade (`property_settings`)
- **Objetivo:** Cadastro de dados cadastrais do hotel, horário de check-in/out, regras de cancelamento, fotos e políticas.
- **Usuários:** Administrador do Sistema.
- **Responsabilidades:** Definir moeda padrão, fuso horário, regras de pets, taxa de serviço e dados fiscais.
- **KPIs:** Nível de Conclusão do Perfil da Propriedade (%).
- **Integrações:** Firestore Properties Collection.
- **Agente Responsável:** System Integration Agent.

### 24. Gestão de Projetos & Obras (`projects`)
- **Objetivo:** Acompanhamento de cronograma, custos e marcos de reformas, expansões e melhorias estruturais.
- **Usuários:** Engenheiros, Proprietários, Gerente Geral.
- **Responsabilidades:** Registrar tarefas de obra, orçamento previsto vs realizado e fotos de evolução.
- **KPIs:** Desvio de Orçamento de Obra (%), Progresso do Cronograma (%).
- **Integrações:** Financial Manager, Supplier Manager.
- **Agente Responsável:** Project Manager Agent.

### 25. Agente de Engajamento Social (`ai_engagement_agent`)
- **Objetivo:** Monitoramento automatizado de menções à marca, respostas inteligentes a comentários e mensagens diretas.
- **Usuários:** Community Manager, Marketing.
- **Responsabilidades:** Sugerir respostas gentis a dúvidas públicas e direcionar reclamações para a gerência.
- **KPIs:** Taxa de Resposta em Redes Sociais (%), Sentimento do Público.
- **Integrações:** Social Media Manager, Gemini AI.
- **Agente Responsável:** Social Engagement AI Agent.

### 26. Orquestrador de Marketing (`marketing_orchestrator`)
- **Objetivo:** Visão unificada de todo o funil de marketing (Mídias Sociais, Ads, E-mails e Conversões no Site).
- **Usuários:** CMO, Diretor de Marketing.
- **Responsabilidades:** Equilibrar investimentos entre canais de acordo com a meta mensal de reservas diretas.
- **KPIs:** Blended ROAS, Porcentagem de Vendas Diretas vs OTAs.
- **Integrações:** Ad Campaign Manager, Email Autopilot, Social Media.
- **Agente Responsável:** Marketing Orchestrator Agent.

### 27. Centro de Controle Executivo (`management_center`)
- **Objetivo:** Painel de controle consolidado com *Decision Center*, aprovação humana de ações de IA e métricas de risco.
- **Usuários:** C-Level, Proprietários, Diretores Regionais.
- **Responsabilidades:** Aprovar/rejeitar propostas de IA, acompanhar a fila de execuções automatizadas e verificar conformidade ADR-005.
- **KPIs:** Pending Approvals, Executive Health Score, Action Approval Rate.
- **Integrações:** Synapse Distributed Agents Engine.
- **Agente Responsável:** Executive Agent (Synapse).

### 28. Administração Multi-Tenant SaaS (`saas_admin`)
- **Objetivo:** Painel de super-administração para gestão de contas hoteleiras contratantes da plataforma Synapse.
- **Usuários:** Equipe de Operações Synapse (Internal Team).
- **Responsabilidades:** Ativar novas propriedades, monitorar uso de recursos, logs de segurança e suporte técnico.
- **KPIs:** MRR (Monthly Recurring Revenue), Churn Rate, Total Properties Active.
- **Integrações:** Multi-Tenant Core Firestore, Subscription Engine.
- **Agente Responsável:** System Admin Agent.

### 29. Planos de Assinatura (`subscriptions`)
- **Objetivo:** Gerenciamento dos planos do software (Basic, Pro, Enterprise) e adição de módulos *add-on*.
- **Usuários:** Proprietário da Conta.
- **Responsabilidades:** Alternar planos, adicionar novas unidades/propriedades e gerenciar licenças de usuários.
- **KPIs:** Custo Mensal da Assinatura, Módulos Ativos.
- **Integrações:** Stripe Billing Portal.
- **Agente Responsável:** SaaS Billing Agent.

### 30. Painel do Agente Synapse (`synapse_agent`)
- **Objetivo:** Visualizador central da saúde, status de execução e logs de pensamento do motor de Inteligência Artificial.
- **Usuários:** Administrador de TI, Gerente de Inovação.
- **Responsabilidades:** Monitorar requisições para a API Gemini, cotas utilizadas, tempo médio de resposta e erros de parsing.
- **KPIs:** AI Success Rate (%), Latência Média da IA (ms), Cotas Restantes.
- **Integrações:** Gemini API Health Monitor.
- **Agente Responsável:** Executive Agent (Synapse Kernel).

### 31. Gestor de Tarifas & Regras (`rate_manager`)
- **Objetivo:** Configuração de planos tarifários (Tarifa Padrão, Não Reembolsável, Café Incluso), tarifas flutuantes e restrições.
- **Usuários:** Revenue Manager, Gerente de Vendas.
- **Responsabilidades:** Definir stay mínimo, datas bloqueadas, suplementos por hóspede extra e regras de precificação dinâmica.
- **KPIs:** Variação Média de Tarifa, Paridade Tarifária entre Canais.
- **Integrações:** Channel Manager, Booking Engine.
- **Agente Responsável:** Revenue & Pricing Agent.

### 32. Channel Manager OTAs (`channel_manager`)
- **Objetivo:** Central de sincronização de disponibilidade e tarifas com Booking.com, Airbnb, Expedia, Hostelworld e Agoda.
- **Usuários:** Revenue Manager, Operador de Reservas.
- **Responsabilidades:** Sincronizar preços e bloqueios em tempo real, evitando overbooking e mantendo histórico de logs.
- **KPIs:** Sync Success Rate (%), Duração Média da Sincronização (s), Erros de Mapeamento.
- **Integrações:** Aloha Pro Webhook, Beds24 iCal Sync, Direct OTA APIs.
- **Agente Responsável:** Integration Agent.

### 33. Minha Assinatura SaaS (`my_subscription`)
- **Objetivo:** Portal do cliente para visualização de faturas, download de notas fiscais e alteração de cartão de crédito.
- **Usuários:** Gestor Financeiro da Propriedade.
- **Responsabilidades:** Gerenciar dados de cobrança da assinatura Synapse.
- **KPIs:** Status do Pagamento da Assinatura (Adimplente / Inadimplente).
- **Integrações:** Stripe Customer Portal.
- **Agente Responsável:** SaaS Billing Agent.

### 34. Jornada Inteligente do Hóspede (`guest_journey_ai`)
- **Objetivo:** Mapeamento visual de cada passo da experiência do hóspede (Reserva -> Pré-Chegada -> Check-in -> Estadia -> Checkout -> Pós-Venda).
- **Usuários:** Guest Relations Manager, Concierge.
- **Responsabilidades:** Identificar momentos ideais para oferecer upgrade de quarto, passeios, jantar especial ou pedido de avaliação.
- **KPIs:** Conversão de Upsell (R$), NPS da Experiência.
- **Integrações:** Guests CRM, Gemini Context Builder.
- **Agente Responsável:** CRM & Guest Journey Agent.

### 35. Serviços de Parceiros & Tours (`partnerServices`)
- **Objetivo:** Gestão da vitrine de serviços terceirizados (transfer, passeios de barco, aluguel de veículos, massagens).
- **Usuários:** Concierge, Recepção.
- **Responsabilidades:** Cadastrar parceiros locais, comissão do hotel por venda e emitir vouchers para hóspedes.
- **KPIs:** Receita de Comissões de Parceiros (R$), Total de Vouchers Emitidos.
- **Integrações:** Guest Portal, POS Module.
- **Agente Responsável:** Experience Agent.

### 36. Monitoramento & Vigilância (`vigilancia`)
- **Objetivo:** Central de monitoramento visual e recepção de alertas de movimento ou sensores IoT das áreas comuns.
- **Usuários:** Equipe de Segurança, Gerente Noturno.
- **Responsabilidades:** Visualizar feeds de câmeras, verificar alertas de ruído/movimento fora do horário e registrar ocorrências.
- **KPIs:** Incidentes de Segurança Registrados, Tempo de Resposta a Alertas.
- **Integrações:** Surveillance Dashboard, Sensor Webhooks.
- **Agente Responsável:** Security Agent.

### 37. Dashboard de Marketing (`marketing_dashboard`)
- **Objetivo:** Visão analítica focada exclusivamente no desempenho de campanhas de captação de hóspedes e marca.
- **Usuários:** Equipe de Marketing, Agência Parceira.
- **Responsabilidades:** Acompanhar evolução de tráfego no motor de reservas, leads capturados e vendas diretas.
- **KPIs:** Conversão do Funil de Reservas, Custo por Lead, Origem do Tráfego.
- **Integrações:** Ad Campaign Manager, Google Analytics Simulator.
- **Agente Responsável:** Marketing Orchestrator Agent.

### 38. Piloto Automático de E-mails (`email_autopilot`)
- **Objetivo:** Configuração de réguas automatizadas de e-mail marketing acionadas por eventos da reserva.
- **Usuários:** Marketing, Guest Relations.
- **Responsabilidades:** Enviar confirmação com código QR de check-in, guia do destino pré-chegada e pesquisa NPS no checkout.
- **KPIs:** Taxa de Abertura de E-mails (%), Taxa de Clique (CTR), Unsubscribe Rate.
- **Integrações:** Gemini AI Email Writer, Bookings Database.
- **Agente Responsável:** Email Autopilot Agent.

### 39. Gestão de Manutenção (`maintenance_manager`)
- **Objetivo:** Acompanhamento de ordens de serviço (OS) para reparos prediais, equipamentos, ar-condicionado e instalações.
- **Usuários:** Equipe de Manutenção, Governança, Gerência.
- **Responsabilidades:** Abrir chamados de avaria com foto, definir prioridade (Baixa, Média, Crítica) e controlar custos de peças.
- **KPIs:** Tempo Médio de Resolução de OS (horas), Custo de Manutenção Preventiva vs Corretiva.
- **Integrações:** Rooms Module, Internal Chat, Supplier Manager.
- **Agente Responsável:** Maintenance Agent.

### 40. Gestão de Fornecedores (`supplier_manager`)
- **Objetivo:** Cadastro de parceiros comerciais, distribuidores de insumos, prestadores de serviço e histórico de compras.
- **Usuários:** Comprador, Financeiro.
- **Responsabilidades:** Manter contatos, condições de pagamento pactuadas e avaliar pontualidade dos fornecedores.
- **KPIs:** Rating de Pontualidade de Fornecedores, Total Comprado por Fornecedor.
- **Integrações:** Shopping List, Financial Manager.
- **Agente Responsável:** Procurement & Supplier Agent.

### 41. Central de Integrações & APIs (`integrations`)
- **Objetivo:** Monitor de conexões ativas com plataformas externas, chaves de API, Webhooks e logs de sincronização.
- **Usuários:** Administrador de TI, Integrador.
- **Responsabilidades:** Verificar status do Aloha Pro Webhook, chaves do Stripe, credenciais do WhatsApp e webhook de leitos.
- **KPIs:** Integration Uptime (%), Erros de Webhook (24h).
- **Integrações:** Aloha Pro, Beds24, Stripe, Gemini, WhatsApp APIs.
- **Agente Responsável:** System Integration Agent.

### 42. Gestão de Reputação & Sentimento (`reputation_manager`)
- **Objetivo:** Monitoramento e análise de avaliações deixadas no Google Reviews, Booking.com e TripAdvisor por Inteligência Artificial.
- **Usuários:** Gerente Geral, Guest Relations.
- **Responsabilidades:** Analisar sentimento das avaliações (Positivo, Neutro, Negativo), identificar temas recorrentes (barulho, café, ar) e rascunhar respostas elegantes.
- **KPIs:** Nota Média de Reputação, Sentimento Positivo (%), Taxa de Resposta a Reviews.
- **Integrações:** Gemini Sentiment Analysis API.
- **Agente Responsável:** Reputation & Sentiment AI Agent.

---

## 8. ECOSSISTEMA DE AGENTES DISTRIBUÍDOS

```
                               ┌──────────────────────────────────┐
                               │     EXECUTIVE AGENT (SYNAPSE)    │
                               │  - Consolida KPIs e Alertas     │
                               │  - Gerencia Fila de Aprovações  │
                               └────────────────┬─────────────────┘
                                                │
         ┌──────────────────────────────────────┼──────────────────────────────────────┐
         ▼                                      ▼                                      ▼
┌──────────────────┐                  ┌──────────────────┐                  ┌──────────────────┐
│ FINANCIAL AGENT  │                  │  REVENUE AGENT   │                  │ HOUSEKEEPING AGENT│
│ - Fluxo de Caixa │                  │ - Pricing Dinâmico│                  │ - Rotas Otimizadas│
│ - Detecção Anom. │                  │ - Previsão Ocup. │                  │ - Fila de Quartos│
└──────────────────┘                  └──────────────────┘                  └──────────────────┘
         │                                      │                                      │
         ▼                                      ▼                                      ▼
┌──────────────────┐                  ┌──────────────────┐                  ┌──────────────────┐
│ MAINTENANCE AGENT│                  │   CRM & GUEST    │                  │  RETAIL & POS    │
│ - Mnt. Preditiva │                  │ - Upsell Exper.  │                  │ - Sugestão Vendas│
│ - Prevenção Mínima│                 │ - Perfil Hóspede │                  │ - Combos & Bar   │
└──────────────────┘                  └──────────────────┘                  └──────────────────┘
```

### 8.1 Como Trabalham
Cada agente é especializado em um subdomínio funcional específico. Eles operam monitorando eventos do banco de dados (novas reservas, check-outs, mudanças de estoque, novas avaliações) e geram **propostas operacionais acionáveis** (*Action Proposals*).

### 8.2 Como Cooperam
Quando o **Revenue Agent** identifica um aumento repentino na taxa de ocupação para o final de semana seguinte, ele:
1. Notifica o **Executive Agent** sobre a oportunidade de aumento de tarifa.
2. Aciona o **Inventory Agent** para recalcular a necessidade de compras do café da manhã e bar.
3. Alerta o **Team Manager Agent** para ajustar a escala de camareiras na segunda-feira subsequente.

### 8.3 Como Escalam
Os agentes operam de forma assíncrona sobre mensageria e eventos no backend. Em momentos de pico (e.g., centenas de webhooks simultâneos de reservas em datas festivas), as requisições entram em fila de prioridade, prevenindo lentidão na interface do usuário.

---

## 9. FLUXO OPERACIONAL COMPLETO DA HOSPEDAGEM

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  1. RESERVA  ├────►│2.PRÉ-CHEGADA ├────►│ 3. CHECK-IN  ├────►│  4. ESTADIA  ├────►│ 5. CHECKOUT  │
│  (Direta/OTA)│     │(Pré-Check-in)│     │(Doc & Chave) │     │(POS & Upsell)│     │ & PÓS-VENDA  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

1. **Jornada de Reserva (Direct Booking & OTA):** O hóspede efetua a reserva pelo site público (`PublicView.tsx` / `BookingView.tsx`) ou por uma OTA. O webhook sincroniza no sistema em tempo real via Aloha Pro/Beds24, criando o perfil no `guests` e a reserva no `bookings`.
2. **Jornada de Pré-Chegada:** O `Email Autopilot` envia uma mensagem no WhatsApp do hóspede com link para o `OnlineCheckinView.tsx`. O hóspede envia foto do documento e assina digitalmente no `SignaturePad.tsx`.
3. **Chegada & Check-in:** Na recepção, o operador confirma o pré-check-in no `ReceptionDashboard.tsx` com 1 clique, vincula o quarto alocado no `CalendarView.tsx` e libera o acesso.
4. **Estadia & Consumo Ativo:** Durante a estadia, o hóspede acessa o `GuestPortalView.tsx` para solicitar room service, agendar passeios via `partnerServices` e pedir dicas ao `Concierge AI`. Cada consumo de bar/restaurante é lançado via `POSView.tsx` diretamente na conta do quarto.
5. **Governança & Manutenção em Tempo Real:** Conforme os quartos são desocupados no checkout, o status no `HousekeepingView.tsx` muda para "Sujo". A camareira visualiza a rota no aplicativo móvel e atualiza para "Limpo e Inspecionado".
6. **Checkout & Fechamento Financeiro:** O hóspede realiza o checkout presencialmente ou via app. O saldo devedor do POS/diárias é liquidado via PIX ou cartão de crédito (`Stripe`). A conta é encerrada e enviada para o `FinancialManagerView.tsx`.
7. **Pós-Venda & Reputação:** 2 horas após o checkout, o `Email Autopilot` envia uma pesquisa NPS. A resposta é analisada pelo `Reputation Manager AI` para alimentar a inteligência de retenção.

---

## 10. ROADMAP ESTRATÉGICO DE DESENVOLVIMENTO

### 10.1 Curto Prazo (Etapas 1 a 3 do Master Evolution Plan V2)
- Fortalecimento total do Kernel de IA e garantia de fallbacks sem atrito.
- Distribuição de badges de inteligência de ocupação no mapa de reservas.
- Automação de tags de perfil do hóspede e sentiment análise no CRM.

### 10.2 Médio Prazo (Etapas 4 a 6 do Master Evolution Plan V2)
- Otimização algorítmica das rotas de limpeza da governança.
- Conexão da previsão de ocupação com a geração automática da lista de compras.
- Lançamento do orquestrador de campanhas de tráfego direto.

### 10.3 Longo Prazo (Visão de Produto 12-36 Meses)
- Integração nativa com hardware de fechaduras biométricas/NFC sem necessidade de chave física.
- Expansão da rede de marketplace de parceiros locais com comissionamento automatizado via PIX Split.
- Módulo de contabilidade preditiva com exportação fiscal automática para contadores regionais.

---

## 11. ANÁLISE COMPARATIVA E DIFERENCIAIS COMPETITIVOS

| Plataforma | Posicionamento de Mercado | Onde o Synapse Hospitality se Diferencia |
| :--- | :--- | :--- |
| **Cloudbeds** | PMS Cloud popular para hotéis médios. | O Cloudbeds exige add-ons pagos para CRM/Marketing e não possui agentes de IA integrados à operação. O Synapse oferece IA nativa e ecossistema all-in-one. |
| **Mews** | PMS moderno com foco em experiência digital. | Mews foca prioritariamente em grandes hotéis urbanos com alto custo por quarto. O Synapse atende modelos híbridos (pousadas, hostels, coworking) com custo democrático. |
| **Oracle Opera** | PMS corporativo legado para multinacionais. | Interface extremamente complexa, treinamento de meses e servidor local pesado. O Synapse oferece onboarding em minutos e navegação instantânea. |
| **Hostaway / Guesty** | Foco exclusivo em Vacation Rentals / Airbnb. | Fortes em canal de distribuição curta, mas fracos em gestão de restobar/POS, governança complexa e gestão financeira profunda. O Synapse une o melhor do PMS com aluguel de temporada. |
| **Apaleo** | PMS de API aberta para desenvolvedores. | Exige um time de tecnologia interno para construir a interface. O Synapse é uma solução pronta para uso (*out-of-the-box*) com API totalmente aberta. |

---

## 12. ESTRATÉGIA SAAS & MODELO DE NEGÓCIOS

### 12.1 Estrutura de Planos
1. **Synapse Essential (Pousadas & Propriedades até 15 quartos):** PMS completo, Gestão de Canais básicos, POS e suporte por chat.
2. **Synapse Professional (Hotéis & Hostels de 16 a 60 quartos):** Todos os recursos do Essential + Multi-Agentes de IA (Financial, Revenue, Marketing), WhatsApp OmniChannel e Autopiloto de E-mail.
3. **Synapse Enterprise & Groups (Redes & Resorts):** Múltiplas propriedades, suporte dedicado 24/7, SLA garantido, acesso a APIs personalizadas e treinamento presencial/remoto da equipe.

### 12.2 Canais de Expansão (Growth Flywheel)
- **Marketplace de Integrações:** Desenvolvedores e parceiros locais podem criar add-ons para a plataforma Synapse.
- **Programa White Label:** Permite que agências de marketing hoteleiro e consultorias operem a plataforma sob sua própria marca para seus clientes.

---

## 13. ESTRATÉGIA DE GOVERNAÇA DE IA & HUMAN APPROVAL

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          GOVERNANÇA DE IA - RASCUNHO & APROVAÇÃO                  │
│                                                                                  │
│   ┌────────────────────┐      ┌────────────────────┐      ┌───────────────────┐  │
│   │ Evento de Mercado  ├─────►│ Proposta da IA     ├─────►│ Decision Center   │  │
│   │ (ex: Pico Ocupação)│      │ (Rascunho)         │      │ (Gestor Visualiza)│  │
│   └────────────────────┘      └────────────────────┘      └─────────┬─────────┘  │
└─────────────────────────────────────────────────────────────────────┼────────────┘
                                                                      │
                                                     ┌────────────────┴────────────────┐
                                                     ▼                                 ▼
                                           ┌───────────────────┐             ┌───────────────────┐
                                           │  APROVADO (1-Click│             │    REJEITADO      │
                                           │  Ação Executada)  │             │   (Descartado)    │
                                           └───────────────────┘             └───────────────────┘
```

1. **Geração de Proposta (*Proposal State*):** Nenhuma alteração no banco de dados ocorre de imediato. A IA grava uma proposta com justificativa e simulação do impacto financeiro/operacional.
2. **Notificação no Centro de Controle:** O gestor recebe uma notificação discreta no `ManagementCenterView.tsx` ou na Topbar da plataforma.
3. **Decisão Consciente:** O gestor revisa os dados, ajusta parâmetros se desejar e clica em **Aprovar**. Somente neste instante a ação é consolidada na operação.

---

## 14. ARQUITETURA DE FUTURO (VISÃO 3 ANOS)

Em 3 anos, o Synapse Hospitality será o **padrão de inteligência operacional de hospitalidade**, permitindo que:
- Hotéis operem com até 60% menos custos administrativos e zero erros de overbooking.
- Hóspedes façam check-in por reconhecimento facial ou NFC diretamente no quarto em menos de 5 segundos.
- O Revenue Agent ajuste tarifas dinâmicas em micro-intervalos de acordo com variações do tempo, voos locais, grandes shows e taxa de ocupação concorrente.

---

## 15. O MANIFESTO SYNAPSE HOSPITALITY

```
===================================================================================
                                MANIFESTO SYNAPSE
===================================================================================

Nós acreditamos que a hospitalidade é a arte humana mais nobre que existe: 
a arte de acolher, cuidar e criar memórias inesquecíveis.

Nenhum profissional da hospitalidade nasceu para passar o dia preenchendo planilhas,
copiando dados de e-mails para sistemas antigos ou brigando com softwares lentos.

Nós rejeitamos a complexidade inútil.
Nós rejeitamos sistemas isolados que não se conversam.
Nós rejeitamos a tecnologia que se coloca à frente do abraço e do sorriso na recepção.

O Synapse nasceu para ser a mente invisível que cuida do pesado, do repetitivo e do complexo.
Uma inteligência leal que trabalha 24 horas por dia para proteger a margem do hotel,
cuidar da equipe e antecipar cada desejo do hóspede.

Tecnologia de ponta a serviço da hospitalidade de coração.
Isso é o Synapse Hospitality.

===================================================================================
```

---
*Aprovado oficialmente e promulgado como a Bíblia de Produto do Synapse Hospitality.*
