

import React, { useState, useEffect, useRef } from 'react';
import { Section } from './shared';
import { MarketingMixPlan, CampaignPhase, AdminSection, CampaignContext, AdCampaign, AdPlatform } from '../../types';
import { Loader2, Sparkles, Workflow, Lightbulb, DollarSign, Target, Calendar, BarChart2, Zap, CheckCircle, ArrowRight, Palette, Terminal, Check } from 'lucide-react';

interface MarketingOrchestratorViewProps {
    campaignContext: CampaignContext | null;
    onRunMarketingOrchestration: (objective: string, budget: number, period: string) => Promise<void>;
    // These are kept for potential future use or manual overrides, but the main flow is now automated.
    onGenerateCampaignsFromPlan: (phase: CampaignPhase, plan: MarketingMixPlan, budget: number) => Promise<void>;
    onGenerateCreativesForPhase: (phase: CampaignPhase) => Promise<void>;
    setActiveSection: (section: AdminSection) => void;
}

const MarketingOrchestratorView: React.FC<MarketingOrchestratorViewProps> = ({ campaignContext, onRunMarketingOrchestration, onGenerateCampaignsFromPlan, onGenerateCreativesForPhase, setActiveSection }) => {
    const [objective, setObjective] = useState('');
    const [budget, setBudget] = useState(5000);
    const [period, setPeriod] = useState('próximos 30 dias');
    const logRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [campaignContext?.log]);

    const handleSubmit = () => {
        if (!objective.trim() || !budget || !period.trim()) {
            alert("Por favor, preencha todos os campos.");
            return;
        }
        onRunMarketingOrchestration(objective, budget, period);
    };

    const renderInitialForm = () => (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Defina seu Objetivo de Marketing</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo Principal</label>
                    <textarea value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Ex: Lotar o hostel na baixa temporada em setembro, focando em nômades digitais europeus." className="input-base" rows={4}/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento Total (R$)</label>
                    <input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="input-base"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Período da Campanha</label>
                    <input type="text" value={period} onChange={(e) => setPeriod(e.target.value)} className="input-base"/>
                </div>
                <button onClick={handleSubmit} className="w-full bg-brand-dark text-white font-bold py-3 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2">
                    <Sparkles size={18} /> Gerar Campanha Completa
                </button>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl border flex flex-col items-center justify-center text-center text-gray-500">
                <Workflow size={48} className="text-gray-300 mb-4"/>
                <p className="font-semibold">Sua estratégia de marketing completa aparecerá aqui.</p>
                <p className="text-sm">Insira seu objetivo e deixe a IA fazer o trabalho pesado.</p>
            </div>
        </div>
    );
    
    const renderInProgressView = (context: CampaignContext) => (
        <div className="space-y-4">
             <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin text-blue-600" size={24}/>
                    <h3 className="text-xl font-bold text-blue-800">Orquestração em Andamento...</h3>
                </div>
                <p className="text-blue-700 text-sm mt-1">A IA está trabalhando para criar sua campanha completa. Você pode acompanhar o progresso abaixo.</p>
            </div>
            <div ref={logRef} className="bg-gray-800 text-white font-mono text-xs p-4 rounded-lg h-80 overflow-y-auto">
                {context.log.map((entry, i) => (
                    <p key={i} className="flex gap-2">
                        <span className="text-gray-500">{new Date(entry.timestamp).toLocaleTimeString()}:</span>
                        <span className="text-green-400 flex-1">{entry.message}</span>
                    </p>
                ))}
            </div>
        </div>
    );
    
    const renderCompleteView = (context: CampaignContext) => (
        <div className="space-y-4 text-center">
            <div className="p-6 bg-green-50 border-l-4 border-green-500 rounded-r-lg text-left">
                <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-600" size={32}/>
                     <div>
                        <h3 className="text-2xl font-bold text-green-800">Campanha Pronta para Revisão!</h3>
                        <p className="text-green-700">A IA concluiu a criação do plano, campanhas e criativos.</p>
                    </div>
                </div>
            </div>

            <div className="pt-4">
                 <button 
                    onClick={() => setActiveSection('ad_campaign_manager')} 
                    className="bg-brand-green text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-brand-green-dark inline-flex items-center gap-3 transition-transform hover:scale-105"
                 >
                    Revisar Todas as Campanhas <ArrowRight/>
                </button>
            </div>

            <details className="text-left pt-4">
                <summary className="cursor-pointer text-gray-600 font-semibold hover:text-brand-dark">Ver log de execução</summary>
                <div ref={logRef} className="mt-2 bg-gray-800 text-white font-mono text-xs p-4 rounded-lg h-60 overflow-y-auto">
                     {context.log.map((entry, i) => (
                        <p key={i} className="flex gap-2">
                            <span className="text-gray-500">{new Date(entry.timestamp).toLocaleTimeString()}:</span>
                            <span className="text-green-400 flex-1">{entry.message}</span>
                        </p>
                    ))}
                </div>
            </details>
        </div>
    );
    
    const renderError = (error: string) => (
         <div className="text-center py-20 bg-red-50 p-6 rounded-lg">
            <p className="font-bold text-red-700">Ocorreu um erro</p>
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={() => onRunMarketingOrchestration(objective, budget, period)} className="mt-4 bg-red-600 text-white font-semibold py-2 px-4 rounded-lg">
                Tentar Novamente
            </button>
         </div>
    );
    
    return (
        <Section title="Central de Campanhas IA" icon={Workflow}>
            {(() => {
                if (!campaignContext || campaignContext.status === 'idle') {
                    return renderInitialForm();
                }
                switch (campaignContext.status) {
                    case 'planning':
                    case 'generating':
                        return renderInProgressView(campaignContext);
                    case 'complete':
                        return renderCompleteView(campaignContext);
                    case 'error':
                        return renderError(campaignContext.error || 'Ocorreu um erro desconhecido.');
                    default:
                        return renderInitialForm();
                }
            })()}
        </Section>
    );
};

export default MarketingOrchestratorView;