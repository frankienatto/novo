import { AdminSection } from './types';

export const tooltipTexts: Record<AdminSection, string> = {
    dashboard: 'Visão geral do dia, com resumos e alertas gerados por IA para uma gestão proativa.',
    management_center: 'Relatório de gestão de alto nível que cruza dados de todas as áreas para fornecer insights estratégicos.',
    synapse_agent: 'Seu assistente de IA. Dê comandos em linguagem natural para executar tarefas complexas na plataforma.',
    calendar: 'Visão "timeline" de todas as reservas por quarto. Permite arrastar e soltar para alterar datas ou quartos.',
    bookings: 'Lista detalhada de todas as reservas, com filtros e ações rápidas como check-in e check-out.',
    rooms: 'Gerencie suas acomodações, adicione ou edite quartos e altere seu status (Disponível, Limpeza, Manutenção).',
    housekeeping: 'Painel focado na equipe de limpeza, mostrando quais quartos precisam de limpeza ou inspeção.',
    vigilancia: 'Central de monitoramento por câmeras, com detecção de movimento e análise de eventos por IA.',
    rate_manager: 'Crie planos de tarifas e restrições. Inclui o módulo de Precificação Dinâmica com IA.',
    channel_manager: 'Sincronize sua disponibilidade e tarifas com OTAs (Booking.com, Airbnb) para evitar overbooking.',
    guests: 'CRM dos hóspedes. Veja o perfil de cada um, histórico de estadias e modere a comunidade.',
    pos: 'Ponto de Venda para registrar vendas de produtos e serviços, com a opção de lançar na conta do quarto.',
    partner_services: 'Gerencie e venda passeios e serviços de parceiros, com cálculo de comissão.',
    staff: 'Gerencie os perfis de funcionários, defina cargos e personalize as permissões de acesso à plataforma.',
    projects: 'Ferramenta de gestão de projetos (ex: "Reforma da Piscina"), com kanban de tarefas e controle financeiro.',
    financial_manager: 'Controle despesas, fluxo de caixa e relatórios de receita. Inclui precificação de cardápio com IA.',
    inventory: 'Controle o estoque de produtos vendidos no PDV.',
    shopping_list: 'Assistente de IA que gera listas de compras com base no estoque baixo, eventos e projetos.',
    reports: 'Gere relatórios de performance com KPIs importantes como ADR, RevPAR e Taxa de Ocupação.',
    team_manager_ai: 'Use a IA para criar escalas de trabalho otimizadas, planos de integração e analisar a performance da equipe.',
    omni_channel: 'Centralize o atendimento ao cliente de diversos canais (Instagram, Website) em uma única caixa de entrada.',
    internal_chat: 'Chat interno para comunicação rápida e eficiente entre os membros da equipe.',
    marketing_dashboard: 'Hub de marketing com insights e ações recomendadas pela IA para impulsionar suas vendas.',
    ai_strategy_consultant: 'A IA como seu consultor: faz diagnóstico do negócio, sugere preços, pacotes e simula cenários de expansão.',
    ai_marketing_lab: 'Ferramentas de pesquisa de mercado com IA, como análise de concorrentes e assistente de criativos.',
    creative_studio: 'Sua suíte criativa: defina a identidade da marca e gere ideias de campanhas, prompts de imagem e roteiros de vídeo.',
    social_media: 'Agende e planeje posts para as redes sociais. A IA pode gerar um plano de conteúdo semanal completo.',
    ad_campaign_manager: 'Gerencie suas campanhas de anúncios. A IA pode criar a estrutura completa de uma campanha e otimizá-la.',
    email_autopilot: 'Automatize o envio de emails para cada etapa da jornada do hóspede, com conteúdo gerado por IA.',
    marketing_orchestrator: 'Defina um objetivo de alto nível e a IA cria e executa o plano de marketing completo para você.',
    ai_engagement_agent: 'Uma IA que simula o comportamento do seu público-alvo para "aquecer" o pixel de rastreamento, melhorando a eficácia dos anúncios.',
    guest_journey_ai: 'Monitore a satisfação de cada hóspede em tempo real e planeje ações proativas para garantir a melhor experiência.',
    property_settings: 'Configure as informações da sua propriedade, personalize a aparência do site público, painel admin e portal do hóspede.',
    my_subscription: 'Gerencie sua assinatura da plataforma Synapse, veja detalhes do seu plano e histórico de faturamento.',
    saas_admin: '(Super Admin) Gerencie todas as propriedades (clientes) cadastradas na plataforma.',
    subscriptions: '(Super Admin) Crie e gerencie os planos de assinatura (Essencial, Crescimento, etc.) oferecidos aos clientes.',
    maintenance_manager: 'Gerencie equipamentos do hostel, agende manutenções preventivas e crie ordens de serviço para consertos.',
    supplier_manager: 'Mantenha um registro de seus fornecedores, crie e acompanhe ordens de compra e receba itens no estoque.',
    integrations: 'Gerencie a conexão com PMS, POS e APIs externas.',
    reputation_manager: 'Gerencie a reputação online do seu hostel, respondendo a avaliações e analisando o sentimento dos hóspedes.',
    coworking: 'Gerencie planos de acesso, mesas disponíveis e check-ins de usuários no espaço de coworking.',
    delivery_orders: 'Gerencie pedidos e logística de delivery para o serviço de tele-entrega.'
};

export const helpAgentSystemInstruction = `
Você é o Agente de Ajuda da plataforma "Synapse Hospitality Suite", um sistema completo de gestão para hostels e hotéis. Seu único propósito é responder a perguntas dos usuários sobre como usar a plataforma. Seja claro, didático e amigável.

Baseie suas respostas exclusivamente na documentação fornecida. Não invente funcionalidades. Se você não sabe a resposta, diga "Não encontrei informações sobre isso, mas posso te ajudar com outras funcionalidades da plataforma."

Estruture suas respostas com clareza, usando negrito para destacar funcionalidades e listas para passos.

Exemplo de pergunta: "Como funciona a precificação dinâmica?"
Exemplo de resposta:
"A **Precificação Dinâmica** é uma ferramenta poderosa encontrada no módulo **Tarifas e Restrições**!

Funciona assim:
1.  A IA analisa diversos fatores como:
    *   Demanda atual e futura (baseada nas reservas).
    *   Eventos locais e feriados.
    *   Dados históricos de ocupação.
2.  Com base nessa análise, ela sugere o **preço ideal** para suas diárias, buscando maximizar sua receita.
3.  Você pode revisar as sugestões e aplicá-las com um único clique.

Isso te ajuda a não deixar dinheiro na mesa durante a alta temporada e a atrair mais hóspedes na baixa temporada!"
`;
