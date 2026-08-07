

import React, { useState } from 'react';
import { Section } from './shared';
import { generateMarketingMixPlan } from '../../services/geminiService';
import { MarketingMixPlan, CampaignPhase, AdminSection } from '../../types';
import { Loader2, Sparkles, Workflow, Lightbulb, DollarSign, Target, Calendar, BarChart2, Zap, CheckCircle } from 'lucide-react';

interface MarketingMixAIViewProps {
    onGenerateCampaignsFromPlan: (phase: CampaignPhase, plan: MarketingMixPlan, budget: number) => Promise<void>;
    setActiveSection: (section: AdminSection) => void;
}

const MarketingMixAIView: React.FC<MarketingMixAIViewProps> = ({ onGenerateCampaignsFromPlan, setActiveSection }) => {
    const [objective, setObjective] = useState('');
    const [budget, setBudget] = useState(5000);
    const [period, setPeriod] = useState('próximos 30 dias');
    const [isLoading, setIsLoading] = useState(false);
    const [plan, setPlan] = useState<MarketingMixPlan | null>(null);
    const [isGeneratingCampaigns, setIsGeneratingCampaigns] = useState<string | null>(null);
    const [generatedPhases, setGeneratedPhases] = useState<Set<string>>(new Set());

    const handleGeneratePlan = async () => {
        if (!objective.trim() || !budget || !period.trim()) {
            alert("Por favor, preencha todos os campos.");
            return;
        }
        setIsLoading(true);
        setPlan(null);
        setGeneratedPhases(new Set());
        const result = await generateMarketingMixPlan(objective, budget, period);
        setPlan(result);
        setIsLoading(false);
    };
    
    const handleGenerateCampaignsClick = async (phase: CampaignPhase) => {
        if (!plan) return;
        setIsGeneratingCampaigns(phase.phaseName);
        await onGenerateCampaignsFromPlan(phase, plan, budget);
        setGeneratedPhases(prev => new Set(prev).add(phase.phaseName));
        setIsGeneratingCampaigns(null);
    }

    const BudgetSplitBar = ({ budgetSplit }: { budgetSplit: MarketingMixPlan['budgetSplit'] }) => {
        const colors: { [key: string]: string } = {
            'Meta Ads': 'bg-blue-500',
            'Google Ads': 'bg-green-500',
            'TikTok Ads': 'bg-black',
            'X Ads': 'bg-sky-500',
        };
        return (
            <div className="flex w-full h-4 rounded-full overflow-hidden bg-gray-200 my-2">
                {budgetSplit.map(item => (
                    <div
                        key={item.platform}
                        className={`${colors[item.platform] || 'bg-gray-400'}`}
                        style={{ width: `${item.percentage}%` }}
                        title={`${item.platform}: ${item.percentage}%`}
                    />
                ))}
            </div>
        );
    };

    return (
        <Section title="Planejador de Marketing Mix IA" icon={Workflow}>
            {!plan ? (
                // Initial form view
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">Defina sua Campanha</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo de Negócio</label>
                            <textarea
                                value={objective}
                                onChange={(e) => setObjective(e.target.value)}
                                placeholder="Ex: Lotar o hostel na baixa temporada em setembro."
                                className="w-full p-2 border border-gray-300 rounded-md"
                                rows={4}
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento Total (R$)</label>
                            <input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(Number(e.target.value))}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
                            <input
                                type="text"
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                placeholder="Ex: próximos 30 dias"
                                className="w-full p-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <button onClick={handleGeneratePlan} disabled={isLoading} className="w-full bg-brand-dark text-white font-bold py-3 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 flex items-center justify-center gap-2">
                            {isLoading ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Gerar Plano de Marketing</>}
                        </button>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-2xl border flex items-center justify-center">
                        {isLoading ? (
                            <div className="text-center">
                                <Loader2 className="animate-spin text-brand-green mx-auto" size={48} />
                                <p className="mt-4 text-gray-600">Criando seu plano estratégico...</p>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500">
                                <p>Seu plano de marketing estratégico aparecerá aqui.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // Step-by-step guided view
                <div className="space-y-8">
                    {/* Step 1 */}
                    <div className="p-6 bg-green-50 border border-green-200 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="text-green-500" size={32} />
                            <div>
                                <h3 className="text-xl font-bold text-green-800">Passo 1: Plano Estratégico Concluído!</h3>
                                <p className="text-green-700">A IA analisou seus objetivos e criou o plano abaixo.</p>
                            </div>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                             <div className="bg-blue-500 text-white w-8 h-8 flex items-center justify-center rounded-full font-bold text-lg">2</div>
                             <h3 className="text-xl font-bold text-blue-800">Passo 2: Criar Estrutura das Campanhas</h3>
                        </div>
                        <p className="text-blue-700 mb-4">Para cada fase do plano, clique para que a IA crie as campanhas, conjuntos de anúncios e públicos no Gerenciador de Anúncios.</p>
                        
                        <div className="space-y-4">
                            {plan.phases.map((phase, index) => (
                                <div key={index} className="bg-white p-4 rounded-lg border-l-4 border-blue-300">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                        <div>
                                            <h4 className="font-bold">{phase.phaseName} <span className="text-xs font-normal text-gray-500">({phase.duration})</span></h4>
                                            <p className="text-sm text-gray-600 mb-1"><strong>Objetivo:</strong> {phase.objective}</p>
                                        </div>
                                        <div className="mt-2 sm:mt-0 flex-shrink-0">
                                            {generatedPhases.has(phase.phaseName) ? (
                                                <button 
                                                    onClick={() => setActiveSection('ad_campaign_manager')}
                                                    className="bg-green-600 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-green-700 flex items-center gap-2"
                                                >
                                                    <CheckCircle size={16} /> Ver Campanhas no Gerenciador
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleGenerateCampaignsClick(phase)}
                                                    disabled={isGeneratingCampaigns === phase.phaseName}
                                                    className="bg-blue-500 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 flex items-center gap-2 disabled:bg-gray-400"
                                                >
                                                    {isGeneratingCampaigns === phase.phaseName ? <Loader2 size={16} className="animate-spin" /> : <><Zap size={16} /> Gerar Campanhas</>}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                     {/* Step 3 */}
                    <div className="p-6 bg-gray-100 border border-gray-200 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-500 text-white w-8 h-8 flex items-center justify-center rounded-full font-bold text-lg">3</div>
                            <h3 className="text-xl font-bold text-gray-800">Passo 3: Gerenciar e Ativar</h3>
                        </div>
                        <p className="text-gray-700 mt-2 ml-11">Após gerar as campanhas, vá para o <button onClick={() => setActiveSection('ad_campaign_manager')} className="font-bold text-brand-green hover:underline">Gerenciador de Campanhas</button> para adicionar os criativos (imagens/vídeos) e ativar suas campanhas.</p>
                    </div>

                    <details className="mt-6">
                        <summary className="cursor-pointer text-gray-600 font-semibold hover:text-brand-dark">Ver detalhes do plano estratégico...</summary>
                        <div className="mt-4 space-y-6 animate-fade-in">
                            <div>
                                <h3 className="text-xl font-bold text-brand-dark mb-2 flex items-center gap-2"><Lightbulb className="text-brand-green" /> Visão Estratégica</h3>
                                <p className="text-gray-700 italic">"{plan.strategicVision}"</p>
                            </div>
                            
                             <div>
                                <h3 className="text-xl font-bold text-brand-dark mb-2 flex items-center gap-2"><DollarSign className="text-brand-green" /> Divisão de Orçamento</h3>
                                <BudgetSplitBar budgetSplit={plan.budgetSplit} />
                                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                                    {plan.budgetSplit.map(item => (
                                        <div key={item.platform} className="text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${ {
                                                        'Meta Ads': 'bg-blue-500', 'Google Ads': 'bg-green-500', 'TikTok Ads': 'bg-black', 'X Ads': 'bg-sky-500',
                                                    }[item.platform] || 'bg-gray-400'
                                                }`}></div>
                                                <span className="font-semibold">{item.platform}:</span>
                                                <span className="text-gray-600">{item.percentage}%</span>
                                                <span className="font-bold"> (R$ {item.amount.toLocaleString('pt-BR')})</span>
                                            </div>
                                             <p className="text-xs text-gray-500 pl-4 italic" title={item.justification}>{item.justification}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </details>
                </div>
            )}
        </Section>
    );
};

export default MarketingMixAIView;