import React, { useState, useMemo } from 'react';
import { Section } from './shared';
import { generateAdCampaign, generateDeepCampaignOptimization, analyzeAdCreative, spyOnCompetitor, detectCampaignAnomalies } from '../../services/geminiService';
import { AdCampaign, AdPlatform, CampaignGoal, DBState, AdSet, PlatformConnection, Ad, CustomAudience, MediaAsset, AutomationRule, BriefingAction } from '../../types';
import { Loader2, Sparkles, Megaphone, Target, Bot, Lightbulb, BarChart2, Pointer, Presentation, DollarSign, Copy, PlayCircle, PenLine, Coins, ImageIcon, UsersRound, Cog, Link, Unlink, Layers, ChevronDown, ChevronRight, CheckCircle, PlusCircle, Facebook, BrainCircuit, Binoculars, Siren, ThumbsUp, ThumbsDown, Wand2, UploadCloud, Save, Twitter, PauseCircle, Palette, Trash2 } from 'lucide-react';
import Modal from './Modal';


const KPICard: React.FC<{ title: string, value: string, icon: React.ElementType, change?: string, changeType?: 'increase' | 'decrease' }> = ({ title, value, icon: Icon, change, changeType }) => (
    <div className="bg-gray-50 p-4 rounded-lg flex items-center">
        <div className="bg-brand-green/10 p-3 rounded-full mr-4"><Icon className="text-brand-green" size={24} /></div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <div className="flex items-baseline gap-2">
                 <p className="text-2xl font-bold text-gray-800">{value}</p>
                 {change && (
                     <span className={`text-xs font-semibold flex items-center ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                        {change}
                     </span>
                 )}
            </div>
        </div>
    </div>
);

interface Opportunity {
    title: string;
    description: string;
    source: 'Estratégia' | 'Criativo' | 'Mercado';
    actionText: string;
    payload: {
        objective: string;
        context: string;
        platform: AdPlatform;
    };
}

interface AdCampaignManagerViewProps {
    db: DBState;
    onConnectPlatform: (platform: AdPlatform) => Promise<void>;
    onApplyABTest: (adSetId: string, newCopy: { headline: string; description: string; }) => Promise<void>;
    onApplyRule: (campaignId: string, rule: { condition: string; action: string; }) => Promise<void>;
    onDeleteRule: (campaignId: string, ruleId: string) => Promise<void>;
    onCreateAudience: (audience: Omit<CustomAudience, 'id'>) => Promise<void>;
    onUpdateAd: (campaignId: string, adSetId: string, adId: string, updates: Partial<Ad>) => Promise<void>;
    onChangeAdCampaignStatus: (campaignId: string, newStatus: AdCampaign['status']) => Promise<void>;
    onCreatePersonaFromAudience: (audience: CustomAudience) => Promise<void>;
    onCreateCampaignFromOpportunity: (opportunity: Opportunity) => Promise<void>;
    onAddAdCampaign: (campaignData: any) => Promise<void>;
    initialAction: BriefingAction | null;
    onActionConsumed: () => void;
}

export const AdCampaignManagerView: React.FC<AdCampaignManagerViewProps> = (props) => {
    const { db, onConnectPlatform, onApplyABTest, onApplyRule, onDeleteRule, onCreateAudience, onUpdateAd, onChangeAdCampaignStatus, onCreatePersonaFromAudience, onCreateCampaignFromOpportunity, initialAction, onActionConsumed } = props;
    const [activeTab, setActiveTab] = useState<'management' | 'creator' | 'advanced' | 'audiences' | 'connections'>('management');
    
    // Management State
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(db.adCampaigns[0]?.id || null);
    const [selectedAdSetId, setSelectedAdSetId] = useState<string | null>(db.adCampaigns[0]?.adSets[0]?.id || null);
    const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set([db.adCampaigns[0]?.id]));
    const [isCreatingFromOpp, setIsCreatingFromOpp] = useState<string | null>(null);
    const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
    const [editingAd, setEditingAd] = useState<Ad | null>(null);


    // Creator State
    const [creatorPlatform, setCreatorPlatform] = useState<AdPlatform>('Meta Ads');
    const [creatorGoal, setCreatorGoal] = useState<CampaignGoal>('Aumentar Reservas');
    const [creatorContext, setCreatorContext] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [creationResult, setCreationResult] = useState<any | null>(null);

    // Optimizer State
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizationResult, setOptimizationResult] = useState<any | null>(null);

    // Connections state
    const [isConnecting, setIsConnecting] = useState<AdPlatform | null>(null);
    
    // Advanced Analysis State
    const [creativeImage, setCreativeImage] = useState<{file: File, base64: string, mimeType: string} | null>(null);
    const [isAnalyzingCreative, setIsAnalyzingCreative] = useState(false);
    const [creativeResult, setCreativeResult] = useState<any | null>(null);
    const [competitorName, setCompetitorName] = useState('');
    const [isSpying, setIsSpying] = useState(false);
    const [spyResult, setSpyResult] = useState<any | null>(null);
    const [isDetectingAnomalies, setIsDetectingAnomalies] = useState(false);
    const [anomalyResult, setAnomalyResult] = useState<any | null>(null);
    
    // Audiences state
    const [creatingPersonaId, setCreatingPersonaId] = useState<string | null>(null);
    
     // Hardcoded opportunities for demonstration
    const opportunities: Opportunity[] = [
        {
            title: "Promover 'Pacote Nômade Digital'",
            description: "O Consultor Estratégico sugeriu um novo pacote para nômades. Crie uma campanha para divulgá-lo.",
            source: 'Estratégia',
            actionText: 'Criar Campanha de Pacote',
            payload: {
                objective: 'Promover Oferta',
                context: "Campanha para o 'Pacote Nômade Digital', focada em trabalho remoto, longa estadia e comunidade. Público: jovens profissionais da Europa e América do Norte.",
                platform: 'Meta Ads',
            }
        },
        {
            title: "Usar Criativo de 'Fogueira'",
            description: "A imagem 'Noite de Fogueira' foi adicionada à sua biblioteca. Ela tem potencial para uma campanha de engajamento.",
            source: 'Criativo',
            actionText: 'Criar Campanha de Engajamento',
            payload: {
                objective: 'Consciência de Marca',
                context: "Campanha de engajamento usando a imagem da fogueira. Foco em criar uma sensação de comunidade e pertencimento.",
                platform: 'Meta Ads',
            }
        }
    ];


    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copiado para a área de transferência!');
    };
    
    const handleConnect = async (platform: AdPlatform) => {
        setIsConnecting(platform);
        await onConnectPlatform(platform);
        setIsConnecting(null);
    }
    
     const toggleExpandCampaign = (campaignId: string) => {
        setExpandedCampaigns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(campaignId)) {
                newSet.delete(campaignId);
            } else {
                newSet.add(campaignId);
            }
            return newSet;
        });
    };
    
    const handleSelectAdSet = (campaignId: string, adSetId: string) => {
        setSelectedCampaignId(campaignId);
        setSelectedAdSetId(adSetId);
        setOptimizationResult(null); // Clear previous results
    };
    
    const handleCreateCampaign = async () => {
        setIsCreating(true);
        setCreationResult(null);
        const result = await generateAdCampaign(creatorPlatform, creatorGoal, creatorContext);
        setCreationResult(result);
        setIsCreating(false);
    };

    const handleCreateFromOpportunity = async (opportunity: Opportunity) => {
        setIsCreatingFromOpp(opportunity.title);
        await onCreateCampaignFromOpportunity(opportunity);
        setIsCreatingFromOpp(null);
    }
    
    const selectedCampaign = useMemo(() => {
        if (!selectedCampaignId) return null;
        return db.adCampaigns.find(c => c.id === selectedCampaignId) || null;
    }, [db.adCampaigns, selectedCampaignId]);

    const selectedAdSet = useMemo(() => {
        return selectedCampaign?.adSets.find(as => as.id === selectedAdSetId) || null;
    }, [selectedCampaign, selectedAdSetId]);
    
    const handleOptimizeAdSet = async () => {
        if (!selectedAdSet || !selectedCampaign) return;
        setIsOptimizing(true);
        setOptimizationResult(null);
        
        const campaignForOptimizer: AdCampaign = { ...selectedCampaign, adSets: [selectedAdSet] };
        
        const result = await generateDeepCampaignOptimization(campaignForOptimizer);
        setOptimizationResult(result);
        setIsOptimizing(false);
    };
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setCreativeImage({
                    file,
                    base64: (reader.result as string).split(',')[1],
                    mimeType: file.type
                });
                setCreativeResult(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyzeCreative = async () => {
        if (!creativeImage) return;
        setIsAnalyzingCreative(true);
        setCreativeResult(null);
        const result = await analyzeAdCreative(creativeImage.base64, creativeImage.mimeType);
        setCreativeResult(result);
        setIsAnalyzingCreative(false);
    };

    const handleSpyOnCompetitor = async () => {
        if (!competitorName.trim()) return;
        setIsSpying(true);
        setSpyResult(null);
        const result = await spyOnCompetitor(competitorName);
        setSpyResult(result);
        setIsSpying(false);
    };

    const handleDetectAnomalies = async () => {
        setIsDetectingAnomalies(true);
        setAnomalyResult(null);
        const activeCampaigns = db.adCampaigns.filter(c => c.status === 'Ativa');
        const result = await detectCampaignAnomalies(activeCampaigns);
        setAnomalyResult(result);
        setIsDetectingAnomalies(false);
    };

    const handleCreatePersona = async (audience: CustomAudience) => {
        setCreatingPersonaId(audience.id);
        await onCreatePersonaFromAudience(audience);
        setCreatingPersonaId(null);
    }
    
    const handleOpenLibraryModal = (ad: Ad) => {
        setEditingAd(ad);
        setIsLibraryModalOpen(true);
    };

    const handleSelectMedia = async (asset: MediaAsset) => {
        if (editingAd && selectedCampaignId && selectedAdSetId) {
            await onUpdateAd(selectedCampaignId, selectedAdSetId, editingAd.id, { mediaAssetId: asset.id, creativeUrl: asset.url });
        }
        setIsLibraryModalOpen(false);
        setEditingAd(null);
    };

    const platformIcons: { [key in AdPlatform]: React.ElementType } = {
        'Meta Ads': Facebook,
        'Google Ads': Megaphone,
        'TikTok Ads': Bot,
        'X Ads': Twitter,
    };
    
    const OpportunityHub = () => {
        const sourceIcons = {
            'Estratégia': { icon: Lightbulb, color: 'text-yellow-500' },
            'Criativo': { icon: Palette, color: 'text-blue-500' },
            'Mercado': { icon: Binoculars, color: 'text-purple-500' }
        };

        return (
            <div className="mb-8 p-4 bg-gray-50 rounded-2xl border">
                <h3 className="text-xl font-bold text-brand-dark mb-4 flex items-center gap-2"><Sparkles className="text-brand-green"/> Hub de Oportunidades da IA</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {opportunities.map(opp => {
                        const SourceIcon = sourceIcons[opp.source].icon;
                        const color = sourceIcons[opp.source].color;
                        return (
                             <div key={opp.title} className="bg-white p-4 rounded-lg border">
                                <h4 className="font-bold text-gray-800 flex items-center gap-2"><SourceIcon size={16} className={color}/> {opp.title}</h4>
                                <p className="text-sm text-gray-600 my-2">{opp.description}</p>
                                <button onClick={() => handleCreateFromOpportunity(opp)} disabled={!!isCreatingFromOpp} className="w-full bg-brand-dark text-white font-semibold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-gray-700 disabled:bg-gray-400">
                                     {isCreatingFromOpp === opp.title ? <Loader2 className="animate-spin"/> : <>{opp.actionText}</>}
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    };
    
    const renderConnectionsView = () => (
         <div>
            <p className="text-gray-600 text-sm mb-6">Conecte suas contas de anúncios para gerenciar suas campanhas diretamente daqui.</p>
            <div className="space-y-4">
                {db.platformConnections.map((conn: PlatformConnection) => (
                    <div key={conn.platform} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                             <span className={`p-2 rounded-full ${conn.platform === 'Meta Ads' ? 'bg-blue-100' : 'bg-green-100'}`}>
                                {React.createElement(platformIcons[conn.platform], { className: conn.platform === 'Meta Ads' ? 'text-blue-600' : 'text-green-600' })}
                            </span>
                            <div>
                                <p className="font-bold text-gray-800">{conn.platform}</p>
                                {conn.connected && conn.accountName && <p className="text-xs text-gray-500">Conta: {conn.accountName} ({conn.accountId})</p>}
                            </div>
                        </div>
                        <button
                            onClick={() => handleConnect(conn.platform)}
                            disabled={isConnecting === conn.platform}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors ${conn.connected ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-brand-green text-white hover:bg-brand-green-dark'}`}
                        >
                            {isConnecting === conn.platform ? <Loader2 size={16} className="animate-spin" /> : conn.connected ? <><Unlink size={16}/> Desconectar</> : <><Link size={16}/> Conectar</>}
                        </button>
                    </div>
                ))}
            </div>
         </div>
    );

    const renderAudiencesView = () => (
        <div>
            <p className="text-gray-600 text-sm mb-6">Aqui estão os públicos que você salvou a partir das sugestões da IA.</p>
            <div className="space-y-3">
                {db.customAudiences.length > 0 ? db.customAudiences.map(audience => (
                    <div key={audience.id} className="bg-gray-50 p-4 rounded-lg border">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-gray-800">{audience.name}</h4>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">{audience.platform}</span>
                        </div>
                        <p className="text-sm text-gray-600">{audience.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Tipo: {audience.type}</p>
                        <div className="mt-3 pt-3 border-t">
                            <button
                                onClick={() => handleCreatePersona(audience)}
                                disabled={creatingPersonaId === audience.id}
                                className="text-sm font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-wait"
                            >
                                {creatingPersonaId === audience.id ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Bot size={16} />
                                )}
                                {creatingPersonaId === audience.id ? 'Criando Persona...' : 'Criar Persona para Agente'}
                            </button>
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-gray-500 py-10">Nenhum público salvo ainda. Use o Otimizador IA para descobrir e salvar novos públicos.</p>
                )}
            </div>
        </div>
    );
    
    const renderManagementView = () => (
        <div>
            <OpportunityHub />
            <div className="flex h-[75vh] bg-gray-50 rounded-lg border overflow-hidden">
                <aside className="w-1/3 border-r flex flex-col">
                    <div className="p-4 border-b"><h3 className="font-bold text-gray-800">Campanhas</h3></div>
                    <div className="overflow-y-auto">
                        {db.adCampaigns.map(campaign => (
                            <div key={campaign.id} className="border-b">
                                <button onClick={() => toggleExpandCampaign(campaign.id)} className="w-full text-left p-3 hover:bg-gray-100 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className={campaign.status === 'Ativa' ? 'text-green-500' : 'text-gray-400'}><PlayCircle size={16}/></span>
                                        <p className="font-semibold text-sm">{campaign.name}</p>
                                    </div>
                                    {expandedCampaigns.has(campaign.id) ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                                </button>
                                {expandedCampaigns.has(campaign.id) && (
                                    <div className="pl-6 bg-gray-50">
                                        {campaign.adSets.map(adSet => (
                                            <button key={adSet.id} onClick={() => handleSelectAdSet(campaign.id, adSet.id)} className={`w-full text-left p-2 text-sm border-l-2 hover:bg-gray-100 ${selectedAdSetId === adSet.id ? 'border-brand-green bg-green-50' : 'border-transparent'}`}>
                                                {adSet.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>

                <main className="w-2/3 flex flex-col overflow-y-auto">
                    {selectedAdSet && selectedCampaign ? (
                        <>
                        <div className="p-4 border-b">
                             <h3 className="text-lg font-bold text-brand-dark">{selectedAdSet.name}</h3>
                             <p className="text-xs text-gray-500">{selectedCampaign?.name}</p>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <KPICard title="Impressões" value={selectedAdSet.kpis.impressions.toLocaleString()} icon={Presentation} />
                                <KPICard title="Cliques" value={selectedAdSet.kpis.clicks.toLocaleString()} icon={Pointer} />
                                <KPICard title="Custo" value={selectedAdSet.kpis.cost.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} icon={Coins} />
                                <KPICard title="Conversões" value={selectedAdSet.kpis.conversions.toLocaleString()} icon={CheckCircle} />
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Anúncios</h4>
                                <div className="space-y-2">
                                    {selectedAdSet.ads.map(ad => (
                                        <div key={ad.id} className="bg-white p-3 rounded-lg border">
                                            <div className="flex gap-4 items-center">
                                                {!ad.creativeUrl ? (
                                                    <button onClick={() => handleOpenLibraryModal(ad)} className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md flex flex-col items-center justify-center text-gray-400 hover:bg-gray-200 border-2 border-dashed">
                                                        <ImageIcon size={24} />
                                                        <span className="text-xs mt-1">Criativo</span>
                                                    </button>
                                                ) : (
                                                    <img src={ad.creativeUrl} alt="Creative" className="w-16 h-16 object-cover rounded-md flex-shrink-0 bg-gray-200" />
                                                )}
                                                <div className="flex-grow">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-sm font-semibold">{ad.name}</p>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleOpenLibraryModal(ad)} className="text-blue-600 hover:text-blue-800" title="Editar Criativo"><Palette size={16}/></button>
                                                            <button onClick={() => onUpdateAd(selectedCampaign!.id, selectedAdSet!.id, ad.id, { status: ad.status === 'Ativa' ? 'Pausada' : 'Ativa' })} className={ad.status === 'Ativa' ? 'text-yellow-600' : 'text-green-600'} title={ad.status === 'Ativa' ? 'Pausar' : 'Ativar'}>
                                                                {ad.status === 'Ativa' ? <PauseCircle size={16}/> : <PlayCircle size={16}/>}
                                                            </button>
                                                                <button onClick={() => {}} className="text-red-600 hover:text-red-800" title="Excluir"><Trash2 size={16}/></button>
                                                        </div>
                                                    </div>
                                                        <p className="text-xs text-gray-500 mt-1"><strong>Título:</strong> {ad.copy.headline} | <strong>Descrição:</strong> {ad.copy.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                             <div className="pt-4 border-t">
                                <h4 className="font-semibold mb-2 flex items-center gap-1.5"><Sparkles size={16} className="text-purple-500"/> Otimizador IA</h4>
                                {optimizationResult ? (
                                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-xs space-y-4">
                                        <div>
                                            <h5 className="font-bold mb-1">Sugestões de Teste A/B (Novas Copies)</h5>
                                            {optimizationResult.copyOptimization.newHeadlines.map((headline: string, index: number) => {
                                                const description = optimizationResult.copyOptimization.newDescriptions[index];
                                                return(
                                                <div key={index} className="flex justify-between items-center bg-white p-2 rounded mt-1">
                                                    <div>
                                                        <p><strong>{headline}</strong></p>
                                                        <p className="text-gray-500">{description}</p>
                                                    </div>
                                                    <button onClick={() => onApplyABTest(selectedAdSet.id, { headline, description })} className="bg-green-600 text-white text-xs font-semibold py-1 px-2 rounded flex items-center gap-1 hover:bg-green-700">
                                                        <CheckCircle size={12}/> Aplicar
                                                    </button>
                                                </div>
                                            )})}
                                        </div>
                                         <div>
                                            <h5 className="font-bold mb-1">Sugestões de Novos Públicos</h5>
                                            {optimizationResult.audienceDiscovery.nicheInterests.map((interest: string, index: number) => (
                                                <div key={index} className="flex justify-between items-center bg-white p-2 rounded mt-1">
                                                    <p><strong>Interesse:</strong> {interest}</p>
                                                    <button onClick={() => onCreateAudience({ name: `Público - ${interest}`, platform: selectedCampaign.platform, type: 'Interests', description: `Pessoas com interesse em ${interest}` })} className="bg-green-600 text-white text-xs font-semibold py-1 px-2 rounded flex items-center gap-1 hover:bg-green-700">
                                                        <CheckCircle size={12}/> Salvar
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div>
                                            <h5 className="font-bold mb-1">Sugestões de Regras de Automação</h5>
                                            {optimizationResult.automatedRules.map((rule: { ruleCondition: string, ruleAction: string }, index: number) => (
                                                <div key={index} className="flex justify-between items-center bg-white p-2 rounded mt-1">
                                                    <p><strong>Se:</strong> {rule.ruleCondition} <br/> <strong>Então:</strong> {rule.ruleAction}</p>
                                                    <button onClick={() => onApplyRule(selectedCampaign.id, { condition: rule.ruleCondition, action: rule.ruleAction })} className="bg-green-600 text-white text-xs font-semibold py-1 px-2 rounded flex items-center gap-1 hover:bg-green-700">
                                                        <CheckCircle size={12}/> Aplicar
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                     <button onClick={handleOptimizeAdSet} disabled={isOptimizing} className="w-full bg-purple-600 text-white font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2">
                                        {isOptimizing ? <Loader2 className="animate-spin"/> : 'Otimizar este Conjunto de Anúncios'}
                                    </button>
                                )}
                            </div>
                             {selectedCampaign.rules.length > 0 && (
                                <div className="pt-4 border-t">
                                    <h4 className="font-semibold mb-2">Regras de Automação Ativas</h4>
                                    <div className="space-y-2">
                                        {selectedCampaign.rules.map((rule: AutomationRule) => (
                                            <div key={rule.id} className="bg-white p-2 rounded-lg border flex justify-between items-center text-xs">
                                                <p><strong>Se:</strong> {rule.condition} <br/> <strong>Então:</strong> {rule.action}</p>
                                                <button onClick={() => onDeleteRule(selectedCampaign.id, rule.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={14}/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        </>
                    ) : (
                        <div className="flex-grow flex items-center justify-center text-gray-500">
                            <p>Selecione um conjunto de anúncios para ver os detalhes.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
    
    const renderCreatorView = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Gerador de Campanhas IA</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plataforma</label>
                    <select value={creatorPlatform} onChange={e => setCreatorPlatform(e.target.value as AdPlatform)} className="input-base">
                        <option>Meta Ads</option>
                        <option>Google Ads</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo</label>
                    <select value={creatorGoal} onChange={e => setCreatorGoal(e.target.value as CampaignGoal)} className="input-base">
                        <option>Aumentar Reservas</option>
                        <option>Promover Oferta</option>
                        <option>Consciência de Marca</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contexto Adicional</label>
                    <textarea value={creatorContext} onChange={e => setCreatorContext(e.target.value)} placeholder="Ex: Foco em casais para o Dia dos Namorados." className="input-base" rows={4}/>
                </div>
                <button onClick={handleCreateCampaign} disabled={isCreating} className="w-full bg-brand-dark text-white font-bold py-3 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 flex items-center justify-center gap-2">
                    {isCreating ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Gerar Campanha</>}
                </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
                {isCreating && <div className="text-center p-10"><Loader2 className="animate-spin mx-auto text-brand-green" size={24}/></div>}
                {creationResult && (
                    <div className="space-y-3 text-sm">
                        <h4 className="font-bold">Campanha Sugerida: "{creationResult.campaignName}"</h4>
                        <div><strong>Títulos:</strong> {creationResult.adCopy.headlines.join(' | ')}</div>
                        <div><strong>Segmentação:</strong> {creationResult.targeting.interests?.join(', ') || creationResult.targeting.keywords.join(', ')}</div>
                        <div><strong>Criativo:</strong> <span className="italic">"{creationResult.creativeSuggestion}"</span></div>
                        <div><strong>Orçamento Diário:</strong> R$ {creationResult.budget.dailyAmount} - <span className="italic">"{creationResult.budget.justification}"</span></div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderAdvancedView = () => (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg border">
                 <h3 className="font-semibold mb-2">Análise de Criativo</h3>
                 <div className="flex gap-2 items-center">
                    <input type="file" id="creative-upload" onChange={handleImageUpload} className="hidden"/>
                    <label htmlFor="creative-upload" className="flex-grow bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg border cursor-pointer hover:bg-gray-200 flex items-center justify-center gap-2"><UploadCloud size={16}/> Enviar Imagem</label>
                    <button onClick={handleAnalyzeCreative} disabled={isAnalyzingCreative || !creativeImage} className="btn-primary flex items-center gap-2"><Sparkles size={16}/> Analisar</button>
                 </div>
                 {isAnalyzingCreative && <Loader2 className="animate-spin mx-auto mt-2"/>}
                 {creativeResult && <div className="mt-2 text-sm"><strong>Pontos Fortes:</strong> {creativeResult.strengths.join(', ')}</div>}
            </div>
            {/* Other advanced tools would go here */}
        </div>
    );

    const tabs = [
        { id: 'management', name: 'Gerenciamento', icon: BarChart2 },
        { id: 'creator', name: 'Criador IA', icon: Sparkles },
        { id: 'advanced', name: 'Análise Avançada', icon: BrainCircuit },
        { id: 'audiences', name: 'Públicos', icon: UsersRound },
        { id: 'connections', name: 'Conexões', icon: Link },
    ];
    
    return (
        <Section title="Gerenciador de Campanhas" icon={Megaphone}>
            <div className="flex border-b mb-6 overflow-x-auto">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors flex-shrink-0 ${activeTab === tab.id ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500 hover:text-brand-dark'}`}>
                        <tab.icon size={16} /> {tab.name}
                    </button>
                ))}
            </div>
            {activeTab === 'management' && renderManagementView()}
            {activeTab === 'creator' && renderCreatorView()}
            {activeTab === 'advanced' && renderAdvancedView()}
            {activeTab === 'audiences' && renderAudiencesView()}
            {activeTab === 'connections' && renderConnectionsView()}

            <Modal isOpen={isLibraryModalOpen} onClose={() => setIsLibraryModalOpen(false)} title="Selecionar da Biblioteca de Mídia">
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto">
                    {db.mediaLibrary.filter(asset => asset.type === 'image').map(asset => (
                        <button key={asset.id} onClick={() => handleSelectMedia(asset)} className="aspect-square relative group">
                            <img src={asset.url} alt={asset.prompt} className="w-full h-full object-cover rounded-lg"/>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                                <CheckCircle size={32} className="text-white"/>
                            </div>
                        </button>
                    ))}
                </div>
            </Modal>
        </Section>
    );
};
