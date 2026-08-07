import React, { useState, useEffect, useMemo } from 'react';
import { Section } from './shared';
import { getLatestNewsWithGoogleSearch, generatePostFromReview } from '../../services/geminiService';
import { eventBus } from '../../services/apiService';
import { DBState, BusinessDiagnosis, ProfitabilityOpportunity, ExpansionSimulation, Review, AdPlatformString, ScheduledPost, BriefingAction, RoomType, AdPlatform, CampaignGoal } from '../../types';
import Modal from './Modal';
import { Loader2, Sparkles, BarChart, TrendingUp, AlertTriangle, Lightbulb, Package, Truck, BrainCircuit, LineChart, Target, HelpCircle, Star, ThumbsUp, ThumbsDown, Check, X, CheckCircle, PenSquare, Zap, Globe, Search, ShieldCheck } from 'lucide-react';
import { ExecutiveHealthScoreCard } from '../../src/modules/executive/ExecutiveHealthScoreCard';
import { HealthScoreBreakdown } from '../../src/types/executiveTypes';
import { useExecutiveKernel } from '../../src/core/hooks/useExecutiveKernel';
import { useSynapsePlatform } from '../../src/contexts/SynapsePlatformContext';

interface AIStrategyConsultantViewProps {
    db: DBState;
    onApproveReview: (reviewId: string) => Promise<void>;
    onRejectReview: (reviewId: string) => Promise<void>;
    onAddScheduledPost: (postData: Omit<ScheduledPost, 'id'>) => Promise<void>;
    initialAction: BriefingAction | null;
    onActionConsumed: () => void;
    onApplyPriceSuggestion: (roomType: RoomType, newPrice: number) => Promise<void>;
    onNavigateWithAction: (section: any, action: BriefingAction) => void;
    onCreateCampaignFromOpportunity: (opportunity: any) => Promise<void>;
    
    // Props for static data
    diagnosisResult: BusinessDiagnosis | null;
    profitabilityResult: ProfitabilityOpportunity | null;
    simulationResult: ExpansionSimulation | null;
    onGenerateDiagnosis: () => Promise<void>;
    onGenerateProfitabilityPlan: () => Promise<void>;
    onSimulateExpansion: (query: string) => Promise<void>;
}

export const AIStrategyConsultantView: React.FC<AIStrategyConsultantViewProps> = (props) => {
    const { 
        db, onApproveReview, onRejectReview, onAddScheduledPost, 
        initialAction, onActionConsumed, onApplyPriceSuggestion, onNavigateWithAction,
        onCreateCampaignFromOpportunity,
        diagnosisResult, profitabilityResult, simulationResult,
        onGenerateDiagnosis, onGenerateProfitabilityPlan, onSimulateExpansion
    } = props;

    const [activeTab, setActiveTab] = useState<'diagnosis' | 'profitability' | 'expansion' | 'moderation' | 'trends'>('diagnosis');

    const [isDiagnosing, setIsDiagnosing] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [simulationQuery, setSimulationQuery] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);
    const [isModerating, setIsModerating] = useState<string | null>(null);
    const [isGeneratingPost, setIsGeneratingPost] = useState<string | null>(null);
    const [scheduleModal, setScheduleModal] = useState<{isOpen: boolean; content: string; imageUrl: string} | null>(null);
    const [scheduleForm, setScheduleForm] = useState({ platform: 'Instagram' as AdPlatformString, scheduledAt: '' });
    const [applyingPriceIndex, setApplyingPriceIndex] = useState<number | null>(null);
    const [creatingCampaignDeal, setCreatingCampaignDeal] = useState<string | null>(null);

    const [confirmationModal, setConfirmationModal] = useState<{ isOpen: boolean; roomType?: RoomType; newPrice?: number; index?: number }>({ isOpen: false });
    
    // State for Trends Tab
    const [trendsQuery, setTrendsQuery] = useState('Eventos e festivais em Florianópolis no próximo fim de semana');
    const [trendsResult, setTrendsResult] = useState<{ text: string; sources: any[] } | null>(null);
    const [isSearchingTrends, setIsSearchingTrends] = useState(false);

    // Contexto de Saúde Executiva do Kernel IA Synapse
    const { health: healthScore } = useExecutiveKernel();

    const fallbackHealth: HealthScoreBreakdown = useMemo(() => {
        const occRate = db.rooms.length > 0 ? (db.rooms.filter(r => r.status === 'Ocupado').length / db.rooms.length) * 100 : 80;
        const cleanRate = db.rooms.length > 0 ? ((db.rooms.length - db.rooms.filter(r => r.status === 'Sujo').length) / db.rooms.length) * 100 : 90;
        return {
            overallScore: Math.round((occRate + cleanRate + 90 + 88 + 85 + 88 + 92 + 84 + 82) / 9),
            revenueHealth: 92,
            commercialHealth: 85,
            marketingHealth: 88,
            salesHealth: 86,
            operationalHealth: Math.round(cleanRate),
            guestExperienceHealth: 94,
            housekeepingHealth: Math.round(cleanRate),
            maintenanceHealth: 82,
        };
    }, [db]);


    const handleDiagnose = async () => {
        setIsDiagnosing(true);
        await onGenerateDiagnosis();
        setIsDiagnosing(false);
    };

    const handleOptimize = async () => {
        setIsOptimizing(true);
        await onGenerateProfitabilityPlan();
        setIsOptimizing(false);
    };
    
    const handleSimulate = async () => {
        if (!simulationQuery.trim()) return;
        setIsSimulating(true);
        await onSimulateExpansion(simulationQuery);
        setIsSimulating(false);
    };
    
    const handleSearchTrends = async () => {
        if (!trendsQuery.trim()) return;
        setIsSearchingTrends(true);
        setTrendsResult(null);
        try {
            const result = await getLatestNewsWithGoogleSearch(trendsQuery);
            setTrendsResult(result);
        } catch (error) {
            console.error("Failed to search trends:", error);
            alert("Erro ao buscar tendências. Tente novamente.");
        }
        setIsSearchingTrends(false);
    };

    useEffect(() => {
        if (initialAction) {
            switch (initialAction.type) {
                case 'MODERATE_REVIEW':
                    setActiveTab('moderation');
                    break;
                case 'OPTIMIZE_PROFITABILITY':
                    setActiveTab('profitability');
                    break;
                case 'SIMULATE_EXPANSION':
                    setActiveTab('expansion');
                    if (initialAction.payload?.suggestion) {
                        setSimulationQuery(initialAction.payload.suggestion);
                    }
                    break;
            }
            onActionConsumed();
        }
    }, [initialAction, onActionConsumed]);

    useEffect(() => {
        if (activeTab === 'diagnosis' && !diagnosisResult && !isDiagnosing) {
            handleDiagnose();
        }
        if (activeTab === 'profitability' && !profitabilityResult && !isOptimizing) {
            handleOptimize();
        }
    }, [activeTab, diagnosisResult, profitabilityResult, isDiagnosing, isOptimizing]);


    const handleGeneratePostFromReview = async (review: Review) => {
        setIsGeneratingPost(review.id);
        const result = await generatePostFromReview(review.comment, review.guestName);
        if (result) {
            handleOpenScheduleModal(result.postText, result.imageSuggestion);
        } else {
            alert('Não foi possível gerar o post. Tente novamente.');
        }
        setIsGeneratingPost(null);
    };

    const handleOpenScheduleModal = (content: string, imageUrlSuggestion: string) => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 10);
        setScheduleModal({ isOpen: true, content, imageUrl: imageUrlSuggestion });
        setScheduleForm({
            platform: 'Instagram',
            scheduledAt: now.toISOString().slice(0, 16),
        });
    };
    
     const handleScheduleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if(name === 'content') {
            setScheduleModal(prev => prev ? {...prev, content: value} : null);
        } else {
            setScheduleForm(prev => ({ ...prev, [name]: value as any }));
        }
    };

    const handleConfirmSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scheduleModal) return;
        await onAddScheduledPost({
            ...scheduleForm,
            content: scheduleModal.content,
            imageUrl: scheduleModal.imageUrl,
            status: 'Scheduled',
            scheduledAt: new Date(scheduleForm.scheduledAt).toISOString(),
        });
        setScheduleModal(null);
    };
    
    const handleApplySuggestionClick = (roomType: string, newPrice: number, index: number) => {
        setConfirmationModal({
            isOpen: true,
            roomType: roomType as RoomType,
            newPrice: newPrice,
            index: index,
        });
    };
    
    const handleConfirmApplySuggestion = async () => {
        if (confirmationModal.roomType === undefined || confirmationModal.newPrice === undefined || confirmationModal.index === undefined) return;

        const { roomType, newPrice, index } = confirmationModal;
        
        setConfirmationModal({ isOpen: false });
        setApplyingPriceIndex(index);
        try {
            await onApplyPriceSuggestion(roomType, newPrice);
        } catch (error) {
            console.error("Failed to apply price suggestion:", error);
            alert('Ocorreu um erro ao aplicar a sugestão de preço.');
        } finally {
            setApplyingPriceIndex(null);
        }
    };
    
    const handleCreateCampaignFromDeal = async (deal: any) => {
        setCreatingCampaignDeal(deal.dealName);
    
        const channel = deal.marketingSuggestion.channel;
    
        try {
            if (channel === 'Anúncio no Instagram') {
                const platform: AdPlatform = 'Meta Ads';
                const opportunityPayload = {
                    payload: {
                        platform: platform,
                        objective: 'Promover Oferta' as CampaignGoal,
                        context: `Campanha para o pacote promocional '${deal.dealName}'. Descrição: ${deal.description}. Focar nos benefícios e usar o headline: "${deal.marketingSuggestion.headline}"`
                    }
                };
                await onCreateCampaignFromOpportunity(opportunityPayload);
                const action: BriefingAction = {
                    type: 'VIEW_SECTION',
                    label: `Ver Campanhas`,
                    payload: { section: 'ad_campaign_manager' }
                };
                onNavigateWithAction('ad_campaign_manager', action);
                eventBus.emit('new-toast', { type: 'success', title: 'Campanha Criada!', message: `Rascunho da campanha "${deal.dealName}" criado. Adicione criativos e ative-a.` });
            } else if (channel === 'Post Orgânico') {
                const postContent = `${deal.marketingSuggestion.headline}. ${deal.description} ${deal.marketingSuggestion.callToAction}`;
                const postData: Omit<ScheduledPost, 'id'> = {
                    platform: 'Instagram', // Defaulting to Instagram as it's the most common
                    content: postContent,
                    status: 'Draft',
                    scheduledAt: new Date().toISOString(),
                };
                await onAddScheduledPost(postData);
                const action: BriefingAction = {
                    type: 'VIEW_SECTION',
                    label: `Ver Posts`,
                    payload: { section: 'social_media' }
                };
                onNavigateWithAction('social_media', action);
                eventBus.emit('new-toast', { type: 'success', title: 'Post Criado!', message: `Rascunho de post sobre "${deal.dealName}" criado.` });
            } else if (channel === 'Campanha de Email') {
                const action: BriefingAction = {
                    type: 'VIEW_SECTION',
                    label: `Criar Campanha de Email`,
                    payload: { section: 'email_autopilot' }
                };
                onNavigateWithAction('email_autopilot', action);
                eventBus.emit('new-toast', { type: 'info', title: 'Navegando...', message: `Vá para a aba "Campanhas" para criar seu email para "${deal.dealName}".` });
            } else {
                eventBus.emit('new-toast', { type: 'error', title: 'Canal não suportado', message: `Canal "${channel}" não suportado para criação automática.` });
            }
        } catch (error: any) {
            eventBus.emit('new-toast', { type: 'error', title: 'Erro ao criar', message: error.message });
        } finally {
            setCreatingCampaignDeal(null);
        }
    };

    const handleApprove = async (reviewId: string) => {
        setIsModerating(reviewId);
        await onApproveReview(reviewId);
        setIsModerating(null);
    };

    const handleReject = async (reviewId: string) => {
        setIsModerating(reviewId);
        await onRejectReview(reviewId);
        setIsModerating(null);
    };


    const tabs = [
        { id: 'diagnosis', label: 'Diagnóstico Semanal', icon: LineChart },
        { id: 'profitability', label: 'Otimizador de Rentabilidade', icon: Target },
        { id: 'expansion', label: 'Simulador de Expansão', icon: HelpCircle },
        { id: 'trends', label: 'Tendências Locais', icon: Globe },
        { id: 'moderation', label: 'Moderação de Avaliações', icon: Star },
    ];
    
    const ResultCard: React.FC<{title: string, icon: React.ElementType, children: React.ReactNode}> = ({title, icon: Icon, children}) => (
        <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Icon className="text-brand-green" size={18} /> {title}</h4>
            <div className="space-y-2 text-sm text-gray-700">{children}</div>
        </div>
    );

    const renderContent = () => {
        switch(activeTab) {
            case 'diagnosis':
                return (
                    <div>
                        <p className="text-gray-600 mb-4">Obtenha um diagnóstico completo da performance do seu hostel na última semana, com insights que conectam todas as áreas do seu negócio.</p>
                        <button onClick={() => handleDiagnose()} disabled={isDiagnosing} className="w-full md:w-auto bg-brand-dark text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 flex items-center justify-center gap-2">
                             {isDiagnosing ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> {diagnosisResult ? 'Gerar Novamente' : 'Gerar Diagnóstico'}</>}
                        </button>
                        {isDiagnosing && !diagnosisResult && <div className="text-center p-10"><Loader2 className="animate-spin mx-auto text-brand-green" size={32}/></div>}
                        {diagnosisResult && (
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <ResultCard title="Insights Chave" icon={Lightbulb}>
                                    {diagnosisResult.keyInsights?.map((item, i) => <div key={i}><strong>{item.insight}:</strong> {item.data}</div>)}
                                </ResultCard>
                                <ResultCard title="Correlações" icon={BarChart}>
                                    {diagnosisResult.crossModuleCorrelations?.map((item, i) => <div key={i}><strong>{item.finding}:</strong> {item.implication}</div>)}
                                </ResultCard>
                                 <ResultCard title="Alertas" icon={AlertTriangle}>
                                    {diagnosisResult.warnings?.map((item, i) => (
                                        <div key={i} className="border-l-4 border-red-400 pl-2">
                                            <strong>{item.warning}:</strong> {item.recommendation}
                                            <button
                                                onClick={() => {
                                                    setSimulationQuery(`Com base no alerta "${item.warning}", qual o impacto de ${item.recommendation.toLowerCase().replace('.', '')}?`);
                                                    setActiveTab('expansion');
                                                }}
                                                className="text-xs font-semibold text-blue-600 hover:underline ml-2"
                                            >
                                                (Simular Cenário)
                                            </button>
                                        </div>
                                    ))}
                                </ResultCard>
                            </div>
                        )}
                    </div>
                );
            case 'profitability':
                return (
                    <div>
                        <p className="text-gray-600 mb-4">Receba sugestões de precificação e pacotes promocionais baseados em dados para maximizar sua receita e ocupação.</p>
                        <button onClick={() => handleOptimize()} disabled={isOptimizing} className="w-full md:w-auto bg-brand-dark text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 flex items-center justify-center gap-2">
                             {isOptimizing ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> {profitabilityResult ? 'Otimizar Novamente' : 'Otimizar Rentabilidade'}</>}
                        </button>
                        {isOptimizing && !profitabilityResult && <div className="text-center p-10"><Loader2 className="animate-spin mx-auto text-brand-green" size={32}/></div>}
                        {profitabilityResult && (
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ResultCard title="Sugestões de Preço" icon={TrendingUp}>
                                    {profitabilityResult.pricingSuggestions?.map((item, i) => (
                                        <div key={i} className="bg-gray-50 p-3 rounded-md">
                                            <p>
                                                <strong>{item.roomType} para {item.period}:</strong>
                                                <span className="font-bold text-lg ml-2">{item.newPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                                <span className="text-xs text-gray-500">/noite (base)</span>
                                            </p>
                                            <p className="text-xs italic text-gray-600 mt-1 mb-2">"{item.reason}"</p>
                                            
                                            <div className="mt-2 pt-2 border-t border-gray-200 bg-blue-50 p-2 rounded-md">
                                                <p className="text-xs font-semibold text-blue-800">Sugestão para Fim de Semana:</p>
                                                <p className="text-xs text-blue-700">{item.weekendSuggestion}</p>
                                            </div>

                                            <div className="text-right mt-2">
                                                <button
                                                    onClick={() => handleApplySuggestionClick(item.roomType, item.newPrice, i)}
                                                    disabled={applyingPriceIndex === i}
                                                    className="bg-blue-500 text-white text-xs font-bold py-1 px-2 rounded-md hover:bg-blue-600 flex items-center gap-1 disabled:bg-gray-400"
                                                >
                                                    {applyingPriceIndex === i ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                                                    Aplicar Preço Base
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </ResultCard>
                                <ResultCard title="Ideias de Pacotes" icon={Package}>
                                    {profitabilityResult.packageDeals?.map((item, i) => (
                                        <div key={i} className="bg-gray-50 p-3 rounded-md">
                                            <strong>{item.dealName}:</strong> {item.description}
                                            <div className="mt-2 bg-blue-50 border border-blue-200 p-2 rounded-md">
                                                 <p className="text-xs text-blue-800 font-semibold">Marketing: {item.marketingSuggestion.channel}</p>
                                                 <p className="text-xs text-blue-700"><strong>Headline:</strong> "{item.marketingSuggestion.headline}"</p>
                                                 <p className="text-xs text-blue-700"><strong>CTA:</strong> "{item.marketingSuggestion.callToAction}"</p>
                                            </div>
                                             <div className="text-right mt-2">
                                                 <button
                                                    onClick={() => handleCreateCampaignFromDeal(item)}
                                                    disabled={!!creatingCampaignDeal}
                                                    className="bg-blue-500 text-white text-xs font-bold py-1 px-2 rounded-md hover:bg-blue-600 flex items-center gap-1 disabled:bg-gray-400"
                                                 >
                                                    {creatingCampaignDeal === item.dealName ? <Loader2 size={14} className="animate-spin"/> : <PenSquare size={14}/>}
                                                    {creatingCampaignDeal === item.dealName ? 'Criando...' : 'Criar Campanha'}
                                                 </button>
                                            </div>
                                        </div>
                                    ))}
                                </ResultCard>
                            </div>
                        )}
                    </div>
                );
            case 'expansion':
                 return (
                    <div>
                        <p className="text-gray-600 mb-4">Sonhe grande. Pergunte à IA sobre o impacto de grandes decisões de negócio, como reformas ou expansões.</p>
                        <div className="flex flex-col md:flex-row gap-2">
                             <textarea value={simulationQuery} onChange={e => setSimulationQuery(e.target.value)} placeholder="Ex: E se eu transformar o 'Dormitório Misto 6 Camas' em um novo 'Quarto de Casal Deluxe'?" className="w-full p-2 border border-gray-300 rounded-md" rows={2}></textarea>
                             <button onClick={handleSimulate} disabled={isSimulating || !simulationQuery} className="w-full md:w-auto bg-brand-dark text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 flex items-center justify-center gap-2">
                                {isSimulating ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Simular Cenário</>}
                            </button>
                        </div>
                        {isSimulating && <div className="text-center p-10"><Loader2 className="animate-spin mx-auto text-brand-green" size={32}/></div>}
                         {simulationResult && (
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ResultCard title="Resumo da Simulação" icon={Lightbulb}>
                                    <p className="italic">"{simulationResult.simulationSummary}"</p>
                                    <div className="grid grid-cols-2 gap-2 mt-4 font-semibold">
                                        <p>Custo Estimado: <span className="block text-brand-dark">{simulationResult.estimatedCost}</span></p>
                                        <p>Aumento na Receita: <span className="block text-brand-dark">{simulationResult.projectedRevenueIncrease}</span></p>
                                        <p>ROI Estimado: <span className="block text-brand-dark">{simulationResult.estimatedROI}</span></p>
                                    </div>
                                </ResultCard>
                                <ResultCard title="Riscos e Considerações" icon={AlertTriangle}>
                                    <ul className="list-disc list-inside space-y-1">
                                    {simulationResult.risksAndConsiderations?.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </ResultCard>
                            </div>
                        )}
                    </div>
                );
            case 'trends':
                return (
                    <div>
                        <p className="text-gray-600 mb-4">Use a Pesquisa Google integrada para obter informações atualizadas sobre eventos locais, notícias e tendências que podem impactar seu negócio.</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input value={trendsQuery} onChange={e => setTrendsQuery(e.target.value)} className="input-base flex-grow w-full" />
                            <button onClick={handleSearchTrends} disabled={isSearchingTrends} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto flex-shrink-0">
                                {isSearchingTrends ? <Loader2 className="animate-spin" /> : <Search size={16}/>} Pesquisar
                            </button>
                        </div>
                        {isSearchingTrends && <div className="text-center p-10"><Loader2 className="animate-spin text-brand-green"/></div>}
                        {trendsResult && (
                            <div className="mt-6 space-y-4">
                                <div className="bg-white p-4 rounded-lg border prose prose-sm max-w-none whitespace-pre-line">
                                    {trendsResult.text}
                                </div>
                                {trendsResult.sources && trendsResult.sources.length > 0 && (
                                    <div>
                                        <h4 className="font-bold mb-2">Fontes:</h4>
                                        <ul className="list-disc list-inside space-y-1 text-sm">
                                            {trendsResult.sources.map((source, index) => (
                                                <li key={index}>
                                                    <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{source.web.title || source.web.uri}</a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            case 'moderation':
                const pendingReviews = db.reviews.filter(r => r.status === 'Pending');
                return (
                     <div>
                        <p className="text-gray-600 mb-4">Aprove ou rejeite as avaliações enviadas pelos hóspedes. Use avaliações positivas para criar conteúdo para as mídias sociais.</p>
                         <div className="space-y-4">
                             {pendingReviews.length > 0 ? (
                                pendingReviews.map((review: Review) => (
                                    <div key={review.id} className="bg-white p-4 rounded-lg border">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-gray-800">{review.guestName}</h4>
                                                    <div className="flex items-center">{[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"} />)}</div>
                                                </div>
                                                <p className="text-sm text-gray-600 italic mt-1">"{review.comment}"</p>
                                            </div>
                                            <div className="flex gap-2 ml-2 flex-shrink-0">
                                                <button onClick={() => handleApprove(review.id)} disabled={isModerating === review.id} className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 disabled:bg-gray-200">
                                                    {isModerating === review.id ? <Loader2 size={16} className="animate-spin"/> : <ThumbsUp size={16} />}
                                                </button>
                                                <button onClick={() => handleReject(review.id)} disabled={isModerating === review.id} className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 disabled:bg-gray-200">
                                                    {isModerating === review.id ? <Loader2 size={16} className="animate-spin"/> : <ThumbsDown size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        {review.rating >= 4 && (
                                            <div className="mt-3 pt-3 border-t">
                                                <button onClick={() => handleGeneratePostFromReview(review)} disabled={isGeneratingPost === review.id} className="text-sm font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1.5 disabled:opacity-50">
                                                    {isGeneratingPost === review.id ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                                    {isGeneratingPost === review.id ? 'Gerando...' : 'Gerar Post para Mídia Social'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : <p className="text-center text-gray-500 py-10">Nenhuma avaliação pendente para moderação.</p>}
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <Section title="Consultor de Estratégia IA" icon={BrainCircuit}>
            <div className="mb-6">
                <ExecutiveHealthScoreCard
                    health={healthScore || fallbackHealth}
                />
            </div>

            <div className="flex border-b mb-6 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors flex-shrink-0 ${activeTab === tab.id ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500 hover:text-brand-dark'}`}
                    >
                        <tab.icon size={16} />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border">
                {renderContent()}
            </div>
            
             <Modal isOpen={!!scheduleModal} onClose={() => setScheduleModal(null)} title="Agendar Post de Avaliação">
                {scheduleModal && (
                    <form onSubmit={handleConfirmSchedule} className="space-y-4">
                        <textarea value={scheduleModal.content} onChange={handleScheduleFormChange} name="content" className="input-base" rows={5}/>
                        <div className="grid grid-cols-2 gap-4">
                             <select name="platform" value={scheduleForm.platform} onChange={handleScheduleFormChange} className="input-base"><option>Instagram</option><option>Facebook</option></select>
                             <input type="datetime-local" name="scheduledAt" value={scheduleForm.scheduledAt} onChange={handleScheduleFormChange} className="input-base"/>
                        </div>
                        <div className="flex justify-end gap-2"><button type="button" onClick={() => setScheduleModal(null)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">Agendar</button></div>
                    </form>
                )}
            </Modal>
             <Modal isOpen={confirmationModal.isOpen} onClose={() => setConfirmationModal({ isOpen: false })} title="Confirmar Alteração de Preço">
                <div>
                    <p>Tem certeza que deseja aplicar o preço de <strong>{(confirmationModal.newPrice || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</strong> para <strong>{confirmationModal.roomType}</strong>?</p>
                    <div className="flex justify-end gap-2 mt-4">
                        <button onClick={() => setConfirmationModal({ isOpen: false })} className="btn-secondary">Cancelar</button>
                        <button onClick={handleConfirmApplySuggestion} className="btn-primary">Confirmar</button>
                    </div>
                </div>
            </Modal>
        </Section>
    );
};
