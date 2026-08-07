
import React, { useState } from 'react';
import { Section } from './shared';
import { analyzeMarketAndSEO, spyOnCompetitorAds, generateCreativeAsset, getGrowthHacks } from '../../services/geminiService';
import { MarketAnalysis, AdSpy, CreativeAsset, GrowthHack } from '../../types';
import { Loader2, Sparkles, Search, Binoculars, Wand2, HelpCircle, BarChart2, Video, Image, FileText, Globe, AlertCircle } from 'lucide-react';

const AIMarketingLabView: React.FC = () => {
    const [activeTab, setActiveTab] = useState('marketAnalysis');
    const [error, setError] = useState<string | null>(null);

    // State for Market Analysis
    const [domain, setDomain] = useState('');
    const [isAnalyzingMarket, setIsAnalyzingMarket] = useState(false);
    const [marketResult, setMarketResult] = useState<MarketAnalysis | null>(null);

    // State for Ad Spy
    const [competitor, setCompetitor] = useState('');
    const [isSpying, setIsSpying] = useState(false);
    const [spyResult, setSpyResult] = useState<AdSpy | null>(null);

    // State for Creative Assistant
    const [assetType, setAssetType] = useState<'Imagem' | 'Vídeo'>('Imagem');
    const [creativeTopic, setCreativeTopic] = useState('');
    const [isGeneratingCreative, setIsGeneratingCreative] = useState(false);
    const [creativeResult, setCreativeResult] = useState<CreativeAsset | null>(null);

    // State for Growth Oracle
    const [question, setQuestion] = useState('');
    const [isAsking, setIsAsking] = useState(false);
    const [oracleResult, setOracleResult] = useState<{ hacks: GrowthHack[] } | null>(null);

    const withErrorHandling = async (apiCall: () => Promise<any>, setResult: (result: any) => void) => {
        setError(null);
        try {
            const result = await apiCall();
            setResult(result);
        } catch (e) {
            console.error(e);
            setError("Ocorreu um erro ao se comunicar com a IA. Verifique sua conexão ou chave de API.");
        }
    };

    const handleAnalyzeMarket = async () => {
        if (!domain.trim()) return;
        setIsAnalyzingMarket(true);
        await withErrorHandling(() => analyzeMarketAndSEO(domain), setMarketResult);
        setIsAnalyzingMarket(false);
    };

    const handleSpy = async () => {
        if (!competitor.trim()) return;
        setIsSpying(true);
        await withErrorHandling(() => spyOnCompetitorAds(competitor), setSpyResult);
        setIsSpying(false);
    };
    
    const handleGenerateCreative = async () => {
        if (!creativeTopic.trim()) return;
        setIsGeneratingCreative(true);
        await withErrorHandling(() => generateCreativeAsset(assetType, creativeTopic), setCreativeResult);
        setIsGeneratingCreative(false);
    };

    const handleAskOracle = async () => {
        if (!question.trim()) return;
        setIsAsking(true);
        await withErrorHandling(() => getGrowthHacks(question), setOracleResult);
        setIsAsking(false);
    };

    const tabs = [
        { id: 'marketAnalysis', label: 'Análise de Mercado e SEO', icon: BarChart2 },
        { id: 'adSpy', label: 'Espião de Anúncios', icon: Binoculars },
        { id: 'creativeAssistant', label: 'Assistente Criativo', icon: Wand2 },
        { id: 'growthOracle', label: 'Oráculo de Marketing', icon: HelpCircle },
    ];

    const renderContent = () => {
        return (
            <div className="space-y-4">
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                        <p className="font-bold flex items-center gap-2"><AlertCircle size={16} /> Erro na IA</p>
                        <p>{error}</p>
                    </div>
                )}
                {activeTab === 'marketAnalysis' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-gray-600 mb-4">Insira o domínio do seu hostel (ou de um concorrente) para uma análise de mercado e SEO simulada.</p>
                            <div className="flex gap-2">
                                <input type="text" value={domain} onChange={e => setDomain(e.target.value)} placeholder="ex: forestbeachhouse.com" className="w-full p-2 border border-gray-300 rounded-md" />
                                <button onClick={handleAnalyzeMarket} disabled={isAnalyzingMarket || !domain} className="bg-brand-dark text-white font-semibold p-2 px-3 rounded-lg shadow hover:bg-gray-700 disabled:bg-gray-400">
                                    {isAnalyzingMarket ? <Loader2 className="animate-spin" /> : <Search />}
                                </button>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border min-h-[200px]">
                            {isAnalyzingMarket && <div className="text-center p-10"><Loader2 className="animate-spin mx-auto text-brand-green" size={24}/></div>}
                            {!isAnalyzingMarket && !marketResult && <div className="text-center p-10 text-gray-500 text-sm">O relatório de análise aparecerá aqui.</div>}
                            {marketResult && (
                                <div className="space-y-4 text-sm">
                                    <div><h4 className="font-bold">Fontes de Tráfego:</h4><div className="flex gap-2 flex-wrap mt-1">{marketResult.trafficSources.map(s => <span key={s.source} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{s.source}: {s.percentage}%</span>)}</div></div>
                                    <div><h4 className="font-bold">Principais Palavras-chave:</h4><p className="text-gray-600">{marketResult.topKeywords.join(', ')}</p></div>
                                    <div><h4 className="font-bold">Perfil do Público:</h4><p className="text-gray-600">{marketResult.audienceProfile}</p></div>
                                    <div><h4 className="font-bold">Oportunidades de SEO:</h4><ul className="list-disc list-inside text-gray-600">{marketResult.seoOpportunities.map((opp, i) => <li key={i}>{opp}</li>)}</ul></div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'adSpy' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-gray-600 mb-4">Descubra a estratégia de anúncios simulada de seus concorrentes.</p>
                            <div className="flex gap-2">
                                <input type="text" value={competitor} onChange={e => setCompetitor(e.target.value)} placeholder="Ex: Pousada Sol e Mar" className="w-full p-2 border border-gray-300 rounded-md" />
                                <button onClick={handleSpy} disabled={isSpying || !competitor} className="bg-brand-dark text-white font-semibold p-2 px-3 rounded-lg shadow hover:bg-gray-700 disabled:bg-gray-400">
                                    {isSpying ? <Loader2 className="animate-spin" /> : <Search />}
                                </button>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border min-h-[200px]">
                             {isSpying && <div className="text-center p-10"><Loader2 className="animate-spin mx-auto text-brand-green" size={24}/></div>}
                             {!isSpying && !spyResult && <div className="text-center p-10 text-gray-500 text-sm">O relatório de espionagem aparecerá aqui.</div>}
                             {spyResult && (
                                <div className="space-y-4 text-sm">
                                    <div><h4 className="font-bold">Estratégia Provável:</h4><p className="text-gray-600 italic">"{spyResult.strategy}"</p></div>
                                    <div><h4 className="font-bold">Exemplos de Anúncios:</h4><div className="space-y-2">{spyResult.exampleAds.map((ad, i) => <div key={i} className="bg-white p-2 rounded"><strong>{ad.headline}:</strong> {ad.description}<p className="text-xs text-gray-500 mt-1"><em>Criativo: {ad.creativeDescription}</em></p></div>)}</div></div>
                                    <div><h4 className="font-bold">Contra-Estratégias:</h4><ul className="list-disc list-inside text-gray-600">{spyResult.counterStrategy.map((cs, i) => <li key={i}>{cs}</li>)}</ul></div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                 {activeTab === 'creativeAssistant' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-gray-600 mb-4">Gere ideias e conteúdo para seus criativos de imagem ou vídeo.</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Criativo</label>
                                    <div className="flex gap-2">
                                        <button onClick={() => setAssetType('Imagem')} className={`flex-1 p-2 rounded-md border text-center ${assetType === 'Imagem' ? 'bg-brand-green text-white border-brand-green' : 'bg-white'}`}><Image size={16} className="inline mr-2"/>Imagem</button>
                                        <button onClick={() => setAssetType('Vídeo')} className={`flex-1 p-2 rounded-md border text-center ${assetType === 'Vídeo' ? 'bg-brand-green text-white border-brand-green' : 'bg-white'}`}><Video size={16} className="inline mr-2"/>Vídeo</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tópico</label>
                                    <input type="text" value={creativeTopic} onChange={e => setCreativeTopic(e.target.value)} placeholder="Ex: Festa na piscina com DJ" className="w-full p-2 border border-gray-300 rounded-md" />
                                </div>
                                <button onClick={handleGenerateCreative} disabled={isGeneratingCreative || !creativeTopic} className="w-full bg-brand-dark text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-gray-700 disabled:bg-gray-400">
                                    {isGeneratingCreative ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} className="inline mr-2"/>Gerar Criativo</>}
                                </button>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border min-h-[200px]">
                            {isGeneratingCreative && <div className="text-center p-10"><Loader2 className="animate-spin mx-auto text-brand-green" size={24}/></div>}
                             {!isGeneratingCreative && !creativeResult && <div className="text-center p-10 text-gray-500 text-sm">O resultado do assistente criativo aparecerá aqui.</div>}
                             {creativeResult?.assetType === 'Imagem' && (
                                <div className="space-y-4 text-sm">
                                    <div><h4 className="font-bold">Prompt para IA de Imagem:</h4><p className="text-gray-600 bg-white p-2 rounded font-mono text-xs">{creativeResult.imagePrompt}</p></div>
                                    <div><h4 className="font-bold">Sugestões de Texto (Overlay):</h4><ul className="list-disc list-inside text-gray-600">{creativeResult.textOverlays?.map((text, i) => <li key={i}>{text}</li>)}</ul></div>
                                </div>
                            )}
                             {creativeResult?.assetType === 'Vídeo' && (
                                <div className="space-y-4 text-sm">
                                    <div><h4 className="font-bold">Roteiro do Vídeo:</h4><div className="space-y-2">{creativeResult.videoScript?.map(scene => <div key={scene.scene} className="bg-white p-2 rounded"><strong>Cena {scene.scene} ({scene.duration}):</strong> {scene.description}</div>)}</div></div>
                                    <div><h4 className="font-bold">Áudio Sugerido:</h4><p className="text-gray-600">{creativeResult.suggestedAudio}</p></div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                 {activeTab === 'growthOracle' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-gray-600 mb-4">Faça uma pergunta de marketing e receba estratégias não-convencionais de "growth hacking".</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sua Pergunta</label>
                                    <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ex: Como posso lotar o hostel em dias de semana com baixo orçamento?" className="w-full p-2 border border-gray-300 rounded-md" rows={3}></textarea>
                                </div>
                                <button onClick={handleAskOracle} disabled={isAsking || !question} className="w-full bg-brand-dark text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-gray-700 disabled:bg-gray-400">
                                    {isAsking ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} className="inline mr-2"/>Consultar Oráculo</>}
                                </button>
                            </div>
                        </div>
                         <div className="bg-gray-50 p-4 rounded-lg border min-h-[200px]">
                            {isAsking && <div className="text-center p-10"><Loader2 className="animate-spin mx-auto text-brand-green" size={24}/></div>}
                            {!isAsking && !oracleResult && <div className="text-center p-10 text-gray-500 text-sm">As táticas de growth hacking aparecerão aqui.</div>}
                            {oracleResult && (
                                <div className="space-y-4">
                                    {oracleResult.hacks.map((hack, i) => (
                                        <div key={i} className="bg-white p-3 rounded-lg border">
                                            <div className="flex justify-between items-start">
                                                 <h4 className="font-bold text-brand-dark">{hack.title}</h4>
                                                 <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${hack.difficulty === 'Fácil' ? 'bg-green-100 text-green-800' : hack.difficulty === 'Média' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{hack.difficulty}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{hack.description}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }


    return (
        <Section title="Laboratório de Marketing IA" icon={Globe}>
            <div className="flex border-b mb-6 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors flex-shrink-0 ${activeTab === tab.id ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500 hover:text-brand-dark'}`}
                    >
                        <tab.icon size={16} />
                        <span className="hidden sm:inline-block">{tab.label}</span>
                    </button>
                ))}
            </div>
            {renderContent()}
        </Section>
    )
}

export default AIMarketingLabView;