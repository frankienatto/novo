import React, { useState } from 'react';
import { DBState, IntegrationSettings, IntegrationSyncLog, IntegrationBillingMapping, ExternalAPIKey } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Network, 
    RefreshCw, 
    Key, 
    Receipt, 
    History, 
    CheckCircle2, 
    AlertCircle, 
    Settings, 
    Plus, 
    Copy, 
    ArrowRight,
    Cloud,
    ExternalLink,
    Zap,
    Code,
    Trash2
} from 'lucide-react';
import { Section } from './shared';
import { eventBus } from '../../services/apiService';

interface IntegrationsViewProps {
    db: DBState;
    onUpdateIntegration: (id: string, updates: Partial<IntegrationSettings>) => Promise<void>;
    onSyncNow: (platform: string) => Promise<void>;
    onAddMapping: (mapping: Omit<IntegrationBillingMapping, 'id'>) => Promise<void>;
    onAddAPIKey: (name: string, scope: 'Leitura' | 'Leitura/Escrita') => Promise<void>;
    onDeleteAPIKey: (id: string) => Promise<void>;
}

const IntegrationsView: React.FC<IntegrationsViewProps> = ({ 
    db, 
    onUpdateIntegration, 
    onSyncNow, 
    onAddMapping,
    onAddAPIKey,
    onDeleteAPIKey
}) => {
    const { 
        integrationSettings = [], 
        integrationSyncLogs = [], 
        integrationBillingMappings = [], 
        externalApiKeys = [] 
    } = db;
    const [isSyncing, setIsSyncing] = useState(false);
    const [activeTab, setActiveTab] = useState<'integrations' | 'logs' | 'api' | 'mapping'>('integrations');
    const [configuringId, setConfiguringId] = useState<string | null>(null);
    const [configFormData, setConfigFormData] = useState({ apiKey: '', propertyId: '' });

    // Webhook Simulator State
    const [showSimulator, setShowSimulator] = useState(false);
    const [simulatedContent, setSimulatedContent] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationResult, setSimulationResult] = useState<any>(null);

    const simulatedTemplates = {
        airbnb: `NOTIFICAÇÃO DE RESERVA CONFIRMADA - AIRBNB
Olá Forest House Beach,
Sua reserva com Gabriel Rezende está confirmada!

Detalhes da Estadia:
Hóspede principal: Gabriel Rezende
Check-in: 2026-06-14 (a partir das 14:00)
Check-out: 2026-06-17 (até às 11:00)
Acomodação: Quarto 05 - Casal c/ ar
Número de hóspedes: 2 adultos
Canal: Airbnb

Detalhamento financeiro:
Preço da diária: R$ 200,00 x 3 diárias
Valor líquido a receber: R$ 600,00`,

        booking: `Reserva confirmada - Booking.com
Número de referência: 4038291845
Código PIN: 4893

Prezado parceiro, uma nova reserva foi realizada para a sua propriedade Forest House Beach.

Nome do cliente: Mariana de Albuquerque
Check-in: 2026-06-18
Check-out: 2026-06-23
Noite(s): 5
Quarto reservado: Quarto 10 - Comp. Feminino (4 camas)
Número de hóspedes: 1 hóspede
Forma de pagamento: Pago online via Booking

Resumo do Preço:
Preço total da reserva: R$ 400,00 (Taxas inclusas)`,

        direto: `Assunto: [Aloha Pro] Nova reserva manual efetuada pelo site
Mensagem:
Hóspede: Thiago Ramos de Oliveira
E-mail do hóspede: thiago.ramos@example.com
Telefone: (48) 99123-4567

Período de hospedagem:
Check-in: 2026-06-20
Check-out: 2026-06-25
Quantidade de hóspedes: 2 hóspedes
Quarto sugerido: Quarto 04 - Individual/Casal s/ ar
Valor Cobrado: R$ 600,00 BRL
Dispositivo de entrada: Mobile Web`,

        plataforma_propria: `CONFIRMAÇÃO DE RESERVA DIRETAMENTE PELO NOSSO PORTAL DO CLIENTE - FOREST HOUSE
E-mail de Notificação de Compra

Hóspede Associado: Renato Neves Santos
E-mail: renatoneves@yahoo.com.br
Telefone: (11) 98765-4321

Dados da Reserva:
Código de Reserva: FH-893012
Acomodação Selecionada: Quarto 10 - Comp. Feminino (4 camas)
Check-in: 2026-06-25
Check-out: 2026-06-28
Adultos: 2 | Crianças: 0
Total Geral do Período: R$ 750,00 BRL
Meio de Pagamento Escolhido: Pix Online`
    };

    const handleRunSimulation = async () => {
        if (!simulatedContent.trim()) {
            eventBus.emit('new-toast', { type: 'error', title: 'Falha', message: 'Por favor, insira o conteúdo do e-mail/notificação no simulador.' });
            return;
        }
        setIsSimulating(true);
        setSimulationResult(null);

        try {
            const response = await fetch('/api/webhooks/aloha-pro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-aloha-secret': 'aloha_pro_sec_3218739a8'
                },
                body: JSON.stringify({ content: simulatedContent })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Falha de requisição no servidor.');
            }

            const data = await response.json();
            setSimulationResult(data);
            eventBus.emit('new-toast', { 
                type: 'success', 
                title: 'Simulação Executada!', 
                message: `Webhook processado. Reserva de ${data.parsedData?.guestName || 'Hóspede'} criada com sucesso!` 
            });
        } catch (err: any) {
            console.error("Simulation error:", err);
            eventBus.emit('new-toast', { 
                type: 'error', 
                title: 'Erro na Simulação', 
                message: err.message || 'Erro de comunicação.' 
            });
        } finally {
            setIsSimulating(false);
        }
    };

    const selectedIntegration = integrationSettings.find(s => s.id === configuringId);

    const handleSync = async (platform: string) => {
        setIsSyncing(true);
        try {
            await onSyncNow(platform);
            eventBus.emit('new-toast', { 
                type: 'success', 
                title: 'Sincronização Concluída', 
                message: `Os dados do ${platform} foram atualizados com sucesso.` 
            });
        } catch (error) {
            eventBus.emit('new-toast', { 
                type: 'error', 
                title: 'Erro na Sincronização', 
                message: `Não foi possível sincronizar com ${platform}.` 
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSaveConfig = async () => {
        if (!configuringId) return;
        try {
            await onUpdateIntegration(configuringId, { 
                apiKey: configFormData.apiKey, 
                propertyId: configFormData.propertyId,
                connected: true,
                status: 'Ativo'
            });
            eventBus.emit('new-toast', { type: 'success', title: 'Configuração Salva', message: 'Conexão estabelecida com sucesso.' });
            setConfiguringId(null);
        } catch (error) {
            eventBus.emit('new-toast', { type: 'error', title: 'Erro', message: 'Falha ao salvar configuração.' });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        eventBus.emit('new-toast', { type: 'info', title: 'Copiado!', message: 'Chave API copiada para a área de transferência.' });
    };

    return (
        <div className="space-y-6">
            {/* Header com Ações Rápidas */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-brand-dark flex items-center gap-3">
                        <RefreshCw className="text-brand-green flex-shrink-0" size={28} /> Painel de Integrações
                    </h2>
                    <p className="text-gray-500 font-medium mt-1 text-sm md:text-base">Gerencie a conexão com PMS, POS e APIs externas.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <button 
                        onClick={() => handleSync('Todos')}
                        disabled={isSyncing}
                        className="btn-primary px-4 md:px-6 py-2 md:py-3 flex items-center justify-center gap-2 group whitespace-nowrap w-full sm:w-auto text-sm"
                    >
                        <RefreshCw size={18} className={isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                        Sincronizar Agora
                    </button>
                    <nav className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto hide-scrollbar">
                        <button 
                            onClick={() => setActiveTab('integrations')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'integrations' ? 'bg-white shadow-sm text-brand-green' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Softwares
                        </button>
                        <button 
                            onClick={() => setActiveTab('logs')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'logs' ? 'bg-white shadow-sm text-brand-green' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Logs
                        </button>
                        <button 
                            onClick={() => setActiveTab('api')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'api' ? 'bg-white shadow-sm text-brand-green' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            APIs
                        </button>
                    </nav>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Softwares Conectados */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-gray-50/50">
                            <h3 className="font-bold text-brand-dark flex items-center gap-2 text-sm sm:text-base">
                                <Cloud className="text-blue-500 flex-shrink-0" size={20} /> Softwares de Gestão (PMS/POS)
                            </h3>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100 self-start sm:self-auto">
                                {integrationSettings.filter(s => s.connected).length} Ativos
                            </span>
                        </div>
                        <div className="p-6 space-y-4">
                            {integrationSettings.map(integration => (
                                <div key={integration.id} className="flex flex-col md:flex-row items-center justify-between p-5 border border-gray-100 rounded-2xl bg-white hover:border-brand-green/30 transition-all group">
                                    <div className="flex items-center gap-5 w-full md:w-auto">
                                        <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center p-3 group-hover:scale-105 transition-transform">
                                            {integration.platform === 'Aloha Pro' ? (
                                                <Zap className="text-amber-500" size={32} />
                                            ) : (
                                                <Cloud className="text-brand-green" size={32} />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-brand-dark text-lg">{integration.platform}</h4>
                                            <p className="text-xs text-gray-500 font-medium">
                                                {integration.connected ? `Sincronizado: ${new Date(integration.lastSync || '').toLocaleString('pt-BR')}` : 'Não configurado'}
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {integration.config.syncRooms && <span className="text-[8px] font-black tracking-widest uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Quartos</span>}
                                                {integration.config.syncGuests && <span className="text-[8px] font-black tracking-widest uppercase bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">Hóspedes</span>}
                                                {integration.config.syncPOS && <span className="text-[8px] font-black tracking-widest uppercase bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">PDV</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 md:mt-0 w-full md:w-auto justify-end">
                                        <div className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest w-full sm:w-auto ${integration.connected ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            {integration.connected ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                            {integration.status}
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setConfiguringId(integration.id);
                                                setConfigFormData({ 
                                                    apiKey: integration.apiKey || '', 
                                                    propertyId: integration.propertyId || '' 
                                                });
                                            }}
                                            className="px-6 py-2 rounded-xl text-xs font-bold border border-gray-200 hover:bg-gray-50 text-gray-700 transition-all"
                                        >
                                            {integration.connected ? 'Editar' : 'Configurar'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Modal de Configuração */}
                    <AnimatePresence>
                        {configuringId && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`bg-white rounded-[32px] shadow-2xl w-full ${selectedIntegration?.platform === 'Aloha Pro' ? 'max-w-2xl' : 'max-w-md'} overflow-hidden border border-white/20 transition-all duration-300`}
                                >
                                    <div className="bg-brand-dark p-8 pb-12 relative overflow-hidden text-white">
                                        <div className="absolute top-0 right-0 p-8 opacity-10">
                                            <Settings size={120} />
                                        </div>
                                        <div className="relative z-10">
                                            <h3 className="text-2xl font-black uppercase tracking-tight">Configurar Conexão</h3>
                                            <p className="text-gray-400 text-sm font-medium mt-1">{selectedIntegration?.platform}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="p-8 -mt-6 bg-white rounded-t-[32px] relative z-20 space-y-6 max-h-[85vh] overflow-y-auto">
                                        {selectedIntegration?.platform === 'Aloha Pro' && (
                                            <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-100 space-y-4">
                                                <h4 className="font-bold text-amber-800 text-xs uppercase tracking-wider flex items-center gap-2">
                                                    <Zap size={15} className="text-amber-500 fill-amber-500 animate-pulse" /> Sincronização por Webhook via IA (Zapier / n8n / Make)
                                                </h4>
                                                <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                                                    Como o Aloha Pro não possui uma API pública, você pode automatizar a criação de reservas encaminhando as notificações recebidas por e-mail ou alertas de reservas (Airbnb, Booking.com, Expedia, etc) via Zapier, Make ou n8n para nosso endpoint seguro de Inteligência Artificial:
                                                </p>
                                                <div className="space-y-3 mt-2">
                                                    <div>
                                                        <label className="block text-[9px] font-black uppercase text-amber-700 tracking-wider mb-1">URL do Webhook (Método POST)</label>
                                                        <div className="flex gap-2">
                                                            <div className="flex-1 bg-white px-3 py-2 rounded-xl border border-gray-100 text-[10px] font-mono select-all text-gray-700 break-all leading-normal">
                                                                {window.location.origin}/api/webhooks/aloha-pro
                                                            </div>
                                                            <button 
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/aloha-pro`);
                                                                    alert("URL copiada com sucesso!");
                                                                }}
                                                                className="px-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors"
                                                                title="Copiar URL"
                                                            >
                                                                <Copy size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] font-black uppercase text-amber-700 tracking-wider mb-1">Chave Secreta do Webhook (Header: x-aloha-secret)</label>
                                                        <div className="flex gap-2">
                                                            <div className="flex-1 bg-white px-3 py-2 rounded-xl border border-gray-100 text-[10px] font-mono select-all text-gray-700">
                                                                aloha_pro_sec_3218739a8
                                                            </div>
                                                            <button 
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText("aloha_pro_sec_3218739a8");
                                                                    alert("Chave copiada com sucesso!");
                                                                }}
                                                                className="px-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors"
                                                                title="Copiar Chave Secreta"
                                                            >
                                                                <Copy size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-amber-800/90 leading-relaxed font-bold bg-amber-100/30 p-2.5 rounded-lg border border-amber-200/50">
                                                    💡 <strong>Como Funciona:</strong> Conecte sua caixa de e-mails ou Aloha Pro ao Zapier/n8n. Envie o assunto no campo <code>"subject"</code> e o corpo do e-mail no campo <code>"content"</code> do POST. A nossa IA processará o e-mail para decodificar datas, hóspedes, valores e canais, criando a reserva no sistema!
                                                </p>

                                                {/* n8n Configuration Helper */}
                                                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-150 space-y-3 mt-3">
                                                    <h5 className="font-extrabold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                                        <Code size={14} className="text-brand-green" /> 🛠️ Configuração Pronta para o n8n
                                                    </h5>
                                                    <p className="text-[11px] text-gray-650 leading-relaxed">
                                                        Siga este passo a passo simples no seu <strong>n8n</strong> para receber e integrar e-mails do <strong>Airbnb, Booking.com, Expedia e Reservas Diretas</strong> automaticamente:
                                                    </p>
                                                    <div className="text-[11px] space-y-2.5 text-gray-700 bg-white p-3.5 rounded-xl border border-gray-100">
                                                        <div className="flex gap-2">
                                                            <span className="flex-shrink-0 w-5 h-5 bg-brand-green/10 text-brand-green font-bold text-[10px] rounded-full flex items-center justify-center">1</span>
                                                            <div>
                                                                <strong>Gatilho (Trigger):</strong> Use o nó <code>Gmail Trigger</code> (ou <code>Email Read (IMAP)</code>) configurado para filtrar e-mails recebidos com termos como "reserva", "reserva confirmada", "booking", "airbnb" ou "expedia".
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <span className="flex-shrink-0 w-5 h-5 bg-brand-green/10 text-brand-green font-bold text-[10px] rounded-full flex items-center justify-center">2</span>
                                                            <div>
                                                                <strong>Ação (HTTP Request):</strong> Adicione um nó do tipo <code>HTTP Request</code> no n8n.
                                                            </div>
                                                        </div>
                                                        <div className="pl-7 space-y-1.5 text-[10px] text-gray-600 font-mono">
                                                            <div>• <strong>Method:</strong> POST</div>
                                                            <div>• <strong>URL:</strong> <span className="text-brand-green">{window.location.origin}/api/webhooks/aloha-pro</span></div>
                                                            <div>• <strong>Authentication:</strong> None (Autenticação manual via Header)</div>
                                                            <div>• <strong>Headers:</strong></div>
                                                            <div className="pl-4">
                                                                - <code>Content-Type</code>: <code>application/json</code><br />
                                                                - <code>x-aloha-secret</code>: <code>aloha_pro_sec_3218739a8</code>
                                                            </div>
                                                            <div>• <strong>Body Content Type:</strong> JSON</div>
                                                            <div>• <strong>Specify Body:</strong> Using Fields Below (ou JSON)</div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <span className="flex-shrink-0 w-5 h-5 bg-brand-green/10 text-brand-green font-bold text-[10px] rounded-full flex items-center justify-center">3</span>
                                                            <div>
                                                                <strong>Corpo da Requisição (Body JSON):</strong> configure os campos para mapear os dados dinâmicos do e-mail recebido:
                                                            </div>
                                                        </div>
                                                        <div className="pl-7">
                                                            <pre className="bg-gray-950 text-emerald-400 p-2.5 rounded-lg text-[9px] font-mono overflow-x-auto">
{`{
  "subject": "={{ $json.subject }}",
  "content": "={{ $json.text || $json.textPlain || $json.html || $json.body }}"
}`}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] text-rose-700/90 leading-relaxed font-bold bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                                                        ⚠️ <strong>Atenção sobre o link de Testes (Preview):</strong> No ambiente temporário de desenvolvimento do AI Studio (URLs iniciadas com <code>ais-pre-</code> ou <code>ais-dev-</code>), existe um bloqueio de segurança que exige cookies de login no iFrame. Por isso, ao testar diretamente pelo n8n, você receberá um erro de redirecionamento (302). <strong>Isso é normal no ambiente de testes e sumirá por completo no link final de produção publicado!</strong> Você pode usar o simulador abaixo para testar imediatamente.
                                                    </p>
                                                </div>

                                                <div className="border-t border-amber-200/50 pt-4 mt-2 space-y-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowSimulator(!showSimulator);
                                                            if (!simulatedContent) {
                                                                setSimulatedContent(simulatedTemplates.airbnb);
                                                            }
                                                        }}
                                                        className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-650 active:bg-amber-750 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm shadow-amber-500/10 transition-all hover:scale-[1.01]"
                                                    >
                                                        <Zap size={14} className="fill-white animate-bounce" />
                                                        {showSimulator ? 'Ocultar Simulador de Webhook' : '🧪 Executar Teste Rápido (Simulador de Webhook)'}
                                                    </button>

                                                    {showSimulator && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="bg-white p-4 rounded-2xl border border-gray-100 space-y-4 text-left"
                                                        >
                                                            <div>
                                                                <label className="block text-[10px] font-black uppercase text-amber-700 tracking-wider mb-2">1. Selecione um Template:</label>
                                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSimulatedContent(simulatedTemplates.airbnb);
                                                                            setSimulationResult(null);
                                                                        }}
                                                                        className="py-1.5 px-2 text-[10px] font-bold border border-gray-150 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                                                                    >
                                                                        Airbnb
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSimulatedContent(simulatedTemplates.booking);
                                                                            setSimulationResult(null);
                                                                        }}
                                                                        className="py-1.5 px-2 text-[10px] font-bold border border-gray-150 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                                                                    >
                                                                        Booking.com
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSimulatedContent(simulatedTemplates.direto);
                                                                            setSimulationResult(null);
                                                                        }}
                                                                        className="py-1.5 px-2 text-[10px] font-bold border border-gray-150 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                                                                    >
                                                                        Direto (Site)
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSimulatedContent((simulatedTemplates as any).plataforma_propria);
                                                                            setSimulationResult(null);
                                                                        }}
                                                                        className="py-1.5 px-2 text-[10px] font-bold border bg-emerald-50 border-emerald-150 rounded-lg hover:bg-emerald-100/50 text-emerald-800 transition-colors"
                                                                    >
                                                                        Plataforma Própria
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label className="block text-[10px] font-black uppercase text-amber-700 tracking-wider mb-2">2. Texto ou E-mail da Reserva:</label>
                                                                <textarea
                                                                    value={simulatedContent}
                                                                    onChange={(e) => setSimulatedContent(e.target.value)}
                                                                    rows={5}
                                                                    placeholder="Cole aqui o e-mail ou texto da reserva..."
                                                                    className="w-full p-3 bg-gray-50 border border-gray-150 rounded-xl outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 text-xs font-mono text-gray-700 resize-none leading-relaxed"
                                                                />
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={handleRunSimulation}
                                                                disabled={isSimulating}
                                                                className="w-full py-3 px-4 rounded-xl bg-brand-green text-white font-black uppercase tracking-wider text-[11px] flex items-center justify-center gap-2 hover:shadow-lg disabled:bg-gray-300 disabled:shadow-none hover:shadow-brand-green/15 transition-all hover:scale-[1.01]"
                                                            >
                                                                {isSimulating ? (
                                                                    <>
                                                                        <RefreshCw size={14} className="animate-spin" />
                                                                        Processando Webhook com IA/Fallback...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle2 size={14} />
                                                                        Disparar Envio do Webhook
                                                                    </>
                                                                )}
                                                            </button>

                                                            {simulationResult && (
                                                                <motion.div 
                                                                    initial={{ opacity: 0, scale: 0.98 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    className="p-3 bg-green-50 border border-green-150 rounded-xl text-xs space-y-2 text-green-800 font-medium"
                                                                >
                                                                    <div className="flex items-center gap-1.5 font-bold">
                                                                        <CheckCircle2 size={14} className="text-brand-green" /> 
                                                                        <span>Reserva Sincronizada com Sucesso!</span>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] bg-white/80 p-2.5 rounded-lg border border-green-100 text-gray-700">
                                                                        <div><strong>Hóspede:</strong> {simulationResult.parsedData?.guestName || 'Sincronizado'}</div>
                                                                        <div><strong>Canal:</strong> {simulationResult.parsedData?.otaSource}</div>
                                                                        <div><strong>Entrada:</strong> {simulationResult.parsedData?.checkIn}</div>
                                                                        <div><strong>Saída:</strong> {simulationResult.parsedData?.checkOut}</div>
                                                                        <div><strong>Preço Total:</strong> R$ {simulationResult.parsedData?.totalPrice?.toFixed(2)}</div>
                                                                        <div><strong>Quarto Alocado ID:</strong> {simulationResult.parsedData?.assignedRoomId}</div>
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-500 font-bold block text-center leading-tight">
                                                                        💡 O banco de dados obteve a reserva e os logs de sincronização em tempo real!
                                                                    </p>
                                                                </motion.div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Chave de API / Token</label>
                                                <div className="relative">
                                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                    <input 
                                                        type="password"
                                                        value={configFormData.apiKey}
                                                        onChange={(e) => setConfigFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                                                        placeholder="Cole sua chave aqui..."
                                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all font-mono text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">ID da Propriedade / Estabelecimento</label>
                                                <div className="relative">
                                                    <Cloud className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                    <input 
                                                        type="text"
                                                        value={configFormData.propertyId}
                                                        onChange={(e) => setConfigFormData(prev => ({ ...prev, propertyId: e.target.value }))}
                                                        placeholder="ID fornecido pelo Aloha Pro"
                                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all font-bold text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-3 pt-2">
                                            <button 
                                                onClick={() => setConfiguringId(null)}
                                                className="flex-1 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all font-sans"
                                            >
                                                Cancelar
                                            </button>
                                            <button 
                                                onClick={handleSaveConfig}
                                                className="flex-1 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white bg-brand-green hover:shadow-xl hover:shadow-brand-green/20 transition-all font-sans"
                                            >
                                                Salvar e Conectar
                                            </button>
                                        </div>
                                        
                                        <p className="text-[10px] text-gray-400 text-center font-medium leading-relaxed">
                                            Sua chave é armazenada de forma segura e criptografada. <br />
                                            Consulte a <a href="#" className="text-brand-green hover:underline">documentação do {selectedIntegration?.platform}</a>.
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Mapeamento de Cobrança */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-gray-50/50">
                            <h3 className="font-bold text-brand-dark flex items-center gap-2 text-sm sm:text-base">
                                <Receipt className="text-brand-green flex-shrink-0" size={20} /> Mapeamento de Cobrança
                            </h3>
                            <button className="text-brand-green hover:bg-brand-green/10 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 w-full sm:w-auto transition-all">
                                <Plus size={16} /> Adicionar
                            </button>
                        </div>
                        <div className="p-4 sm:p-6 overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-50 uppercase text-[10px] font-black tracking-[0.2em] text-gray-400">
                                        <th className="text-left pb-4 font-black">Item no App (Forest House Beach)</th>
                                        <th className="w-12"></th>
                                        <th className="text-left pb-4 font-black">Item no PMS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {integrationBillingMappings.map(mapping => (
                                        <tr key={mapping.id} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-brand-sand rounded-xl flex items-center justify-center text-brand-dark">
                                                        <Zap size={16} />
                                                    </div>
                                                    <span className="font-bold text-gray-700">{mapping.appItemName}</span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <ArrowRight className="text-gray-300 mx-auto" size={18} />
                                            </td>
                                            <td>
                                                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 font-bold text-gray-600 flex items-center justify-between">
                                                    {mapping.pmsItemName}
                                                    <span className="w-2 h-2 rounded-full bg-brand-green"></span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar com Logs e API Keys */}
                <div className="space-y-6">
                    {/* Log de Sincronização */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-brand-dark flex items-center gap-2">
                                <History size={20} className="text-brand-green" /> Logs de Sincronização
                            </h3>
                        </div>
                        <div className="flex-grow overflow-y-auto p-6 space-y-4">
                            {integrationSyncLogs.map(log => (
                                <div key={log.id} className="flex gap-4 group">
                                    <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                        log.status === 'Success' ? 'bg-green-50 text-green-600' : 
                                        log.status === 'Error' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                        {log.status === 'Success' ? <CheckCircle2 size={18} /> : 
                                         log.status === 'Error' ? <AlertCircle size={18} /> : <RefreshCw size={18} className="animate-spin-slow" />}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold text-gray-800 text-sm">{log.action}</p>
                                            <span className="text-[10px] text-gray-400 font-bold">{new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{log.details}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">{log.platform}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100">
                             <button className="w-full text-brand-green font-black uppercase tracking-widest text-[10px] hover:underline transition-all">Ver Histórico Completo</button>
                        </div>
                    </div>

                    {/* API Keys */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-brand-dark flex items-center gap-2">
                                <Key size={20} className="text-brand-green" /> Chaves de API de Terceiros
                            </h3>
                            <button onClick={() => onAddAPIKey('Nova Integração', 'Leitura/Escrita')} className="text-brand-green p-2 hover:bg-brand-green/10 rounded-full transition-all">
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {externalApiKeys.map(apiKey => (
                                <div key={apiKey.id} className="p-4 border border-gray-100 rounded-2xl bg-gray-50 group hover:border-brand-green/30 transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-sm">{apiKey.name}</h4>
                                            <p className="text-[10px] text-gray-400 font-medium">Criada em {new Date(apiKey.createdAt).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                        <span className="text-[8px] font-black uppercase tracking-widest bg-white border border-gray-100 px-2 py-0.5 rounded text-gray-500">
                                            {apiKey.scope}
                                        </span>
                                    </div>
                                    <div className="relative group/key">
                                        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 font-mono text-[11px] text-gray-500 flex items-center justify-between">
                                            <span className="truncate flex-1">{apiKey.key}</span>
                                            <button 
                                                onClick={() => copyToClipboard(apiKey.key)}
                                                className="ml-3 text-gray-300 hover:text-brand-green transition-colors"
                                                title="Copiar Chave"
                                            >
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Developer Links */}
                    <div className="bg-brand-dark text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <Code size={120} />
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-xl font-black uppercase tracking-tight mb-4">Documentação Técnica</h4>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6">Acesse nossas APIs para construir integrações personalizadas e estender as capacidades do Forest House Beach.</p>
                            <div className="space-y-3">
                                <a href="#" className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-brand-green hover:text-white transition-colors">
                                    API para Desenvolvedores <ExternalLink size={14} />
                                </a>
                                <a href="#" className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-brand-green hover:text-white transition-colors">
                                    Status da Plataforma <CheckCircle2 size={14} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntegrationsView;
