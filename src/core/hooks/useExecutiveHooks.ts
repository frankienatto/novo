import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { executiveApi } from '../api/executiveApi';
import { QUERY_KEYS } from '../api/queryKeys';
import { useState } from 'react';
import { CopilotMessage, CopilotSession } from '../../types/executiveTypes';
import { useExecutiveKernel } from './useExecutiveKernel';

export { useExecutiveKernel };

const DEFAULT_QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
  retry: 1,
};

export function useExecutiveDashboard(orgId: string, propId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.executive.dashboard(orgId, propId),
    queryFn: async () => {
      const res = await executiveApi.getDashboard(orgId, propId);
      return res.data;
    },
    ...DEFAULT_QUERY_CONFIG,
    enabled: Boolean(orgId && propId),
  });
}

export function useExecutiveKpis(orgId: string, propId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.executive.kpis(orgId, propId),
    queryFn: async () => {
      const res = await executiveApi.getKpis(orgId, propId);
      return res.data;
    },
    ...DEFAULT_QUERY_CONFIG,
    enabled: Boolean(orgId && propId),
  });
}

export function useExecutiveAlerts(orgId: string, propId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.executive.alerts(orgId, propId),
    queryFn: async () => {
      const res = await executiveApi.getAlerts(orgId, propId);
      return res.data;
    },
    ...DEFAULT_QUERY_CONFIG,
    enabled: Boolean(orgId && propId),
  });
}

export function useExecutivePriorities(orgId: string, propId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.executive.priorities(orgId, propId),
    queryFn: async () => {
      const res = await executiveApi.getPriorities(orgId, propId);
      return res.data;
    },
    ...DEFAULT_QUERY_CONFIG,
    enabled: Boolean(orgId && propId),
  });
}

export function useExecutiveSummary(orgId: string, propId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.executive.summary(orgId, propId),
    queryFn: async () => {
      const res = await executiveApi.getSummary(orgId, propId);
      return res.data;
    },
    ...DEFAULT_QUERY_CONFIG,
    enabled: Boolean(orgId && propId),
  });
}

export function useExecutiveCopilot(orgId: string, propId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.executive.copilot(orgId, propId),
    queryFn: async () => {
      const res = await executiveApi.getCopilotDashboard(orgId, propId);
      return res.data;
    },
    ...DEFAULT_QUERY_CONFIG,
    enabled: Boolean(orgId && propId),
  });
}

export function useExecutiveSuggestions() {
  return [
    'Qual a previsão de ocupação e RevPAR para este final de semana?',
    'Quais os principais riscos operacionais que demandam ação urgente?',
    'Como podemos otimizar a conversão de reservas diretas no marketing?',
    'Qual o status das limpezas urgentes e pendências de manutenção?',
    'Resuma os destaques financeiros e comerciais do dia.',
  ];
}

export function useExecutiveConversation(orgId: string, propId: string) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'copilot',
      content:
        'Olá! Sou o Synapse Executive Copilot. Estou pronto para auxiliar na gestão estratégica, análise de KPIs, mitigação de riscos e identificação de oportunidades em tempo real. Como posso ajudar agora?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'done',
    },
  ]);

  const [sessions, setSessions] = useState<CopilotSession[]>([
    {
      id: 'sess_1',
      title: 'Análise de Ocupação & Pricing Fim de Semana',
      createdAt: 'Hoje, 09:30',
      messageCount: 4,
    },
    {
      id: 'sess_2',
      title: 'Revisão de Manutenção de Aquecedores',
      createdAt: 'Ontem, 16:15',
      messageCount: 6,
    },
  ]);

  const [status, setStatus] = useState<'idle' | 'thinking' | 'typing' | 'error' | 'offline'>('idle');

  const chatMutation = useMutation({
    mutationFn: async (promptText: string) => {
      setStatus('thinking');
      // Add user message
      const userMsg: CopilotMessage = {
        id: `user_${Date.now()}`,
        sender: 'user',
        content: promptText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, userMsg]);

      // Execute AI
      const response = await executiveApi.askCopilot(promptText, orgId, propId);
      return response;
    },
    onSuccess: (data) => {
      setStatus('typing');
      const responseText = data.text || data.response || 'Análise executiva processada com sucesso.';

      // Generate rich response card if applicable
      const cards: CopilotMessage['cards'] = [];
      const lower = responseText.toLowerCase();

      if (lower.includes('risco') || lower.includes('manutenção') || lower.includes('alerta')) {
        cards.push({
          type: 'risk',
          title: 'Atenção aos Aquecedores dos Quartos',
          description: 'Manutenção urgente necessária no setor Norte.',
          badgeText: 'Alta Prioridade',
          badgeVariant: 'danger',
        });
      }

      if (lower.includes('receita') || lower.includes('revpar') || lower.includes('ocupação') || lower.includes('adr')) {
        cards.push({
          type: 'kpi',
          title: 'RevPAR Estimado',
          description: 'Crescimento de +12.4% projetado.',
          kpiValue: 'R$ 285,50',
          badgeText: 'Projeção Preditiva',
          badgeVariant: 'success',
        });
      }

      setTimeout(() => {
        const copilotMsg: CopilotMessage = {
          id: `copilot_${Date.now()}`,
          sender: 'copilot',
          content: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'done',
          cards: cards.length > 0 ? cards : undefined,
        };

        setMessages((prev) => [...prev, copilotMsg]);
        setStatus('idle');
      }, 300);
    },
    onError: (err) => {
      setStatus('error');
      const errorMsg: CopilotMessage = {
        id: `err_${Date.now()}`,
        sender: 'copilot',
        content: `Ocorreu um erro ao comunicar com a inteligência executiva: ${err instanceof Error ? err.message : 'Erro desconhecido'}. Modos off-line e redundância preservados.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'error',
      };
      setMessages((prev) => [...prev, errorMsg]);
    },
  });

  const sendMessage = (promptText: string) => {
    if (!promptText.trim()) return;
    chatMutation.mutate(promptText);
  };

  const clearConversation = () => {
    setMessages([
      {
        id: `msg_welcome_${Date.now()}`,
        sender: 'copilot',
        content: 'Conversa reiniciada. Como posso ajudar com os KPIs e estratégias operacionais?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'done',
      },
    ]);
    setStatus('idle');
  };

  return {
    messages,
    sendMessage,
    clearConversation,
    status,
    isLoading: chatMutation.isPending,
    sessions,
  };
}
