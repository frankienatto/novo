import React, { useState } from 'react';
import { DBState, RatePlan, BookingRestriction, DynamicPriceSuggestion, PromoCode, PackageDeal, RoomType, AddOn, MarketInsight, AIPackageSuggestion } from '../../types';
import { Section } from './shared';
import Modal from './Modal';
import { Tag, PlusCircle, Edit, Trash2, Loader2, Save, Ban, Sparkles, Zap, CheckCircle, Ticket, Package as PackageIcon, ArrowRight, Info, TrendingUp, Calendar, MapPin, Globe, Search } from 'lucide-react';

interface RateManagerViewProps {
    db: DBState;
    onSaveRatePlan: (plan: Omit<RatePlan, 'id'> | RatePlan) => Promise<void>;
    onDeleteRatePlan: (planId: string) => Promise<void>;
    onSaveBookingRestriction: (restriction: Omit<BookingRestriction, 'id'> | BookingRestriction) => Promise<void>;
    onDeleteBookingRestriction: (restrictionId: string) => Promise<void>;
    onGetMarketInsights: (location: string, period: string) => Promise<MarketInsight[]>;
    onGetAIPackageSuggestions: (location: string, insights: MarketInsight[], hostelVibe: string) => Promise<AIPackageSuggestion[]>;
    onGetDynamicPriceSuggestions: (period: string, marketInsights: MarketInsight[]) => Promise<DynamicPriceSuggestion[] | null>;
    onApplyDynamicPriceSuggestions: (suggestions: { roomId: number; newPrice: number }[]) => Promise<void>;
    onSavePromoCode: (promoCode: Omit<PromoCode, 'id'> | PromoCode) => Promise<void>;
    onDeletePromoCode: (promoCodeId: string) => Promise<void>;
    onSavePackageDeal: (packageDeal: Omit<PackageDeal, 'id'> | PackageDeal) => Promise<void>;
    onDeletePackageDeal: (packageDealId: string) => Promise<void>;
}

export const RateManagerView: React.FC<RateManagerViewProps> = (props) => {
    const { 
        db, onSaveRatePlan, onDeleteRatePlan, onSaveBookingRestriction, onDeleteBookingRestriction, 
        onGetMarketInsights, onGetAIPackageSuggestions, onGetDynamicPriceSuggestions, onApplyDynamicPriceSuggestions,
        onSavePromoCode, onDeletePromoCode, onSavePackageDeal, onDeletePackageDeal 
    } = props;
    
    const [activeTab, setActiveTab] = useState<'rates' | 'restrictions' | 'promocodes' | 'packages' | 'dynamic' | 'channels'>('rates');
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncingOTAs, setIsSyncingOTAs] = useState(false);

    // AI/Dynamic Pricing State
    const [dynamicPricingPeriod, setDynamicPricingPeriod] = useState('Próximo feriado/mês');
    const [marketInsights, setMarketInsights] = useState<MarketInsight[] | null>(null);
    const [priceSuggestions, setPriceSuggestions] = useState<DynamicPriceSuggestion[] | null>(null);
    const [packageSuggestions, setPackageSuggestions] = useState<AIPackageSuggestion[] | null>(null);
    const [isAnalyzingMarket, setIsAnalyzingMarket] = useState(false);
    const [isGeneratingPrices, setIsGeneratingPrices] = useState(false);
    const [isGeneratingPackages, setIsGeneratingPackages] = useState(false);

    // Modal States
    const [isRateModalOpen, setIsRateModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Omit<RatePlan, 'id'> | RatePlan | null>(null);
    const [isRestrictionModalOpen, setIsRestrictionModalOpen] = useState(false);
    const [editingRestriction, setEditingRestriction] = useState<Omit<BookingRestriction, 'id'> | BookingRestriction | null>(null);
    const [isPromoCodeModalOpen, setIsPromoCodeModalOpen] = useState(false);
    const [editingPromoCode, setEditingPromoCode] = useState<Omit<PromoCode, 'id'> | PromoCode | null>(null);
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<Omit<PackageDeal, 'id'> | PackageDeal | null>(null);

    // Handlers
    const handleOpenModal = (type: 'rate' | 'restriction' | 'promocode' | 'package', data: any | null) => {
        switch (type) {
            case 'rate': setEditingPlan(data || { name: '', description: '', priceModifier: 0, modifierType: 'fixed', isDefault: false }); setIsRateModalOpen(true); break;
            case 'restriction': setEditingRestriction(data || { name: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], type: 'minStay', value: 1 }); setIsRestrictionModalOpen(true); break;
            case 'promocode': setEditingPromoCode(data || { code: '', discountType: 'percentage', discountValue: 10, validUntil: new Date().toISOString().split('T')[0], isActive: true }); setIsPromoCodeModalOpen(true); break;
            case 'package': setEditingPackage(data || { name: '', description: '', price: 200, priceType: 'per_night', minNights: 2, validFrom: new Date().toISOString().split('T')[0], validTo: new Date().toISOString().split('T')[0], imageUrl: '', includedRoomType: RoomType.PRIVATE_COUPLE, includedAddOnIds: [], isActive: true }); setIsPackageModalOpen(true); break;
        }
    };

    const handleSave = async (type: 'rate' | 'restriction' | 'promocode' | 'package') => {
        setIsSaving(true);
        try {
            switch (type) {
                case 'rate': if (editingPlan) await onSaveRatePlan(editingPlan); break;
                case 'restriction': if (editingRestriction) await onSaveBookingRestriction(editingRestriction); break;
                case 'promocode': if (editingPromoCode) await onSavePromoCode(editingPromoCode); break;
                case 'package': if (editingPackage) await onSavePackageDeal(editingPackage); break;
            }
        } finally {
            setIsSaving(false);
            setIsRateModalOpen(false); setIsRestrictionModalOpen(false); setIsPromoCodeModalOpen(false); setIsPackageModalOpen(false);
        }
    };
    
    const handleRunFullAIAnalysis = async () => {
        setIsAnalyzingMarket(true);
        setMarketInsights(null);
        setPriceSuggestions(null);
        
        try {
            const location = db.properties[0]?.location || 'Navegantes, SC';
            const insights = await onGetMarketInsights(location, dynamicPricingPeriod);
            setMarketInsights(insights);
            
            setIsGeneratingPrices(true);
            const suggestions = await onGetDynamicPriceSuggestions(dynamicPricingPeriod, insights);
            setPriceSuggestions(suggestions);
        } finally {
            setIsAnalyzingMarket(false);
            setIsGeneratingPrices(false);
        }
    };

    const handleGeneratePackageSuggestions = async () => {
        if (!marketInsights) return;
        setIsGeneratingPackages(true);
        try {
            const suggestions = await onGetAIPackageSuggestions(
                db.properties[0]?.location || 'Navegantes, SC', 
                marketInsights, 
                db.properties[0]?.hostelVibe || 'Praia e Surf'
            );
            setPackageSuggestions(suggestions);
        } finally {
            setIsGeneratingPackages(false);
        }
    };

    const handleApplySuggestions = async () => {
        if (!priceSuggestions) return;
        setIsSaving(true);
        await onApplyDynamicPriceSuggestions(
            priceSuggestions.map(s => ({ roomId: s.roomId, newPrice: s.suggestedPrice }))
        );
        setIsSaving(false);
        setPriceSuggestions(null); 
    };

    // Tabs Content
    const handleSyncToOTAs = async () => {
        setIsSyncingOTAs(true);
        // @ts-ignore
        if (props.onSyncRatesToOTAs) {
            // @ts-ignore
            await props.onSyncRatesToOTAs();
        }
        setIsSyncingOTAs(false);
    };

    const ChannelsTab = () => {
        const platforms = [
            { id: 'Booking.com', icon: 'https://cdn-icons-png.flaticon.com/512/300/300212.png', markup: 15 },
            { id: 'Airbnb', icon: 'https://cdn-icons-png.flaticon.com/512/2111/2111320.png', markup: 3 },
            { id: 'Expedia', icon: 'https://cdn-icons-png.flaticon.com/512/25/25231.png', markup: 18 },
            { id: 'HostelWorld', icon: 'https://cdn-icons-png.flaticon.com/512/825/825590.png', markup: 12 },
        ];

        return (
            <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                    <Info className="text-blue-600 mt-1" size={20} />
                    <div>
                        <p className="text-sm font-bold text-blue-800">Sobre Markups de Canal</p>
                        <p className="text-xs text-blue-700">Estas porcentagens são adicionadas automaticamente ao seu preço base antes de serem enviadas para as plataformas. Recomendamos ajustar para cobrir as comissões de cada OTA.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {platforms.map(ota => (
                        <div key={ota.id} className="bg-white p-4 rounded-lg border flex items-center justify-between group hover:border-brand-green">
                            <div className="flex items-center gap-3">
                                <img src={ota.icon} className="w-8 h-8 object-contain" alt={ota.id} />
                                <div>
                                    <p className="font-bold text-gray-800">{ota.id}</p>
                                    <p className="text-xs text-gray-500">Transmissão em tempo real</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-400">Markup:</span>
                                <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden border">
                                    <span className="px-2 font-bold text-gray-600 text-sm">{ota.markup}%</span>
                                    <button className="p-1 hover:bg-gray-200 border-l text-gray-400"><Edit size={12} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const RatesTab = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {db.ratePlans.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-lg shadow-sm border flex flex-col">
                    <div className="flex justify-between items-start">
                        <h4 className="font-bold text-lg text-brand-dark">{p.name}</h4>
                        {p.isDefault && <span className="text-xs font-bold bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">Padrão</span>}
                    </div>
                    <p className="text-sm text-gray-600 my-2 flex-grow">{p.description}</p>
                    <div className="flex justify-between items-center mt-auto pt-2 border-t">
                        <span className={`font-bold text-lg ${p.priceModifier >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {p.modifierType === 'percentage' ? `${p.priceModifier > 0 ? '+' : ''}${p.priceModifier}%` : `${p.priceModifier > 0 ? '+' : ''} ${p.priceModifier.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                        </span>
                        <div className="space-x-2">
                            <button onClick={() => handleOpenModal('rate', p)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Edit size={16}/></button>
                            {!p.isDefault && <button onClick={() => onDeleteRatePlan(p.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><Trash2 size={16}/></button>}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
    
    const RestrictionsTab = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {db.bookingRestrictions.map(r => (
                <div key={r.id} className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-start">
                        <h4 className="font-bold text-brand-dark">{r.name}</h4>
                        <div className="space-x-1">
                            <button onClick={() => handleOpenModal('restriction', r)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Edit size={16}/></button>
                            <button onClick={() => onDeleteBookingRestriction(r.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><Trash2 size={16}/></button>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 font-semibold my-2">
                        {r.type === 'minStay' ? `Estadia Mínima: ${r.value} noites` : `Antecedência Mínima: ${r.value} dias`}
                    </p>
                    <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded-md">
                        Válido de {new Date(r.startDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} a {new Date(r.endDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                    </p>
                </div>
            ))}
        </div>
    );
    
    const PromoCodesTab = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {db.promoCodes.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-start">
                        <p className="font-mono font-bold text-lg bg-gray-100 px-3 py-1 rounded-md border text-brand-dark">{p.code}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{p.isActive ? 'Ativo' : 'Inativo'}</span>
                    </div>
                    <div className="my-3 space-y-1 text-sm">
                        <p><strong>Desconto:</strong> {p.discountType === 'percentage' ? `${p.discountValue}%` : `R$ ${p.discountValue.toFixed(2)}`}</p>
                        {p.minNights && <p><strong>Mínimo de noites:</strong> {p.minNights}</p>}
                        <p><strong>Válido até:</strong> {new Date(p.validUntil).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                    </div>
                    <div className="flex justify-end space-x-1 border-t pt-2">
                        <button onClick={() => handleOpenModal('promocode', p)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Edit size={16}/></button>
                        <button onClick={() => onDeletePromoCode(p.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><Trash2 size={16}/></button>
                    </div>
                </div>
            ))}
        </div>
    );
    
    const PackagesTab = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-100 p-4 rounded-xl border border-dashed">
                <div>
                    <h4 className="font-bold text-gray-800 flex items-center gap-2"><Sparkles size={18} className="text-brand-green"/> Sugestões de Pacotes IA</h4>
                    <p className="text-xs text-gray-500">Crie pacotes baseados em tendências de mercado e eventos locais.</p>
                </div>
                <button 
                    onClick={handleGeneratePackageSuggestions} 
                    disabled={isGeneratingPackages || !marketInsights} 
                    className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
                >
                    {isGeneratingPackages ? <Loader2 className="animate-spin" size={14}/> : <Zap size={14}/>}
                    {!marketInsights ? 'Analise o Mercado Primeiro' : 'Sugerir Pacotes'}
                </button>
            </div>

            {packageSuggestions && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {packageSuggestions.map((suggestion, idx) => (
                        <div key={idx} className="bg-brand-green/5 border border-brand-green/20 p-4 rounded-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 bg-brand-green text-white rounded-bl-xl text-[10px] font-bold">SUGESTÃO IA</div>
                            <h5 className="font-bold text-brand-dark">{suggestion.name}</h5>
                            <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                            <div className="mt-3 flex flex-wrap gap-1">
                                {suggestion.includes.map((inc, i) => <span key={i} className="text-[10px] bg-white border px-2 py-0.5 rounded-full">{inc}</span>)}
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                                <p className="font-bold text-brand-green">{suggestion.price.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                                <button className="text-[10px] font-bold text-brand-dark underline underline-offset-2 hover:text-brand-green">ADOTAR ESTE PACOTE</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {db.packageDeals.map(p => (
                    <div key={p.id} className="bg-white rounded-lg shadow-sm border flex flex-col">
                        <img src={p.imageUrl} alt={p.name} className="w-full h-40 object-cover rounded-t-lg"/>
                        <div className="p-4 flex-grow flex flex-col">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-lg text-brand-dark">{p.name}</h4>
                                <div className="flex gap-1">
                                    <button onClick={() => handleOpenModal('package', p)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Edit size={16}/></button>
                                    <button onClick={() => onDeletePackageDeal(p.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><Trash2 size={16}/></button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 my-2 flex-grow">{p.description}</p>
                            <div className="mt-auto pt-2 border-t space-y-2">
                                <div className="flex justify-between items-center">
                                    <p className="font-bold text-xl text-brand-green">
                                        {p.price.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                                        <span className="text-xs font-normal text-gray-500">/{p.priceType === 'per_night' ? 'noite' : 'total'}</span>
                                    </p>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{p.isActive ? 'Ativo' : 'Inativo'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const DynamicPricingTab = () => (
        <div className="space-y-6">
            <div className="bg-gray-800 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Globe size={120} /></div>
                <h4 className="text-xl font-bold mb-2 flex items-center gap-2"><Sparkles className="text-yellow-400"/> Synapse Revenue Orchestrator</h4>
                <p className="text-sm text-gray-300 max-w-xl">Minha análise utiliza Grounding (Pesquisa em Tempo Real) para verificar eventos em {db.properties[0].location}, feriados nacionais, clima e comportamento da concorrência.</p>
                
                <div className="mt-6 flex flex-col md:flex-row gap-3">
                    <div className="relative flex-grow">
                        <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            value={dynamicPricingPeriod} 
                            onChange={e => setDynamicPricingPeriod(e.target.value)}
                            placeholder="Período de análise (ex: Réveillon 2025)"
                            className="w-full bg-gray-700 border-gray-600 rounded-xl pl-10 py-3 text-white focus:ring-2 focus:ring-brand-green outline-none"
                        />
                    </div>
                    <button 
                        onClick={handleRunFullAIAnalysis} 
                        disabled={isAnalyzingMarket} 
                        className="bg-brand-green hover:bg-brand-green/90 text-brand-dark font-bold px-8 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isAnalyzingMarket ? <Loader2 className="animate-spin"/> : <Search size={18}/>}
                        {isAnalyzingMarket ? 'Analisando Mercado...' : 'Análise de Mercado Inteligente'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Market Insights Column */}
                <div className="lg:col-span-1 space-y-4">
                    <h5 className="font-bold text-gray-700 flex items-center gap-2"><TrendingUp size={18} className="text-blue-500" /> Insights de Mercado</h5>
                    {!marketInsights && !isAnalyzingMarket && (
                        <div className="bg-white border-2 border-dashed rounded-xl p-8 text-center text-gray-400">
                            <MapPin className="mx-auto mb-2 opacity-50" size={32} />
                            <p className="text-xs">Clique em "Análise de Mercado" para buscar dados reais da região.</p>
                        </div>
                    )}
                    {isAnalyzingMarket && (
                        <div className="space-y-3">
                            {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-xl"></div>)}
                        </div>
                    )}
                    {marketInsights && (
                        <div className="space-y-3">
                            {marketInsights.map((insight, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                            insight.impactLevel === 'Alto' ? 'bg-red-100 text-red-700' : 
                                            insight.impactLevel === 'Médio' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                        }`}>{insight.category}</span>
                                        <span className="text-[10px] font-bold text-gray-400">{insight.impactLevel} Impacto</span>
                                    </div>
                                    <h6 className="font-bold text-sm text-gray-800">{insight.title}</h6>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{insight.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Price Suggestions Column */}
                <div className="lg:col-span-2 space-y-4">
                    <h5 className="font-bold text-gray-700 flex items-center gap-2"><Zap size={18} className="text-yellow-500" /> Sugestões de Precificação Dinâmica</h5>
                    {!priceSuggestions && !isGeneratingPrices && (
                        <div className="bg-white border-2 border-dashed rounded-xl p-12 text-center text-gray-400 h-[400px] flex flex-col items-center justify-center">
                            <Sparkles className="mb-2 opacity-50" size={48} />
                            <p className="text-sm">As sugestões aparecerão aqui após a análise de mercado.</p>
                        </div>
                    )}
                    {isGeneratingPrices && (
                        <div className="space-y-4">
                            {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-xl"></div>)}
                        </div>
                    )}
                    {priceSuggestions && (
                        <div className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {priceSuggestions.map(s => (
                                     <div key={s.roomId} className="bg-white p-5 rounded-2xl border-2 border-brand-green/30 shadow-lg hover:border-brand-green transition-colors">
                                         <div className="flex justify-between items-start mb-4">
                                            <h4 className="font-bold text-gray-800">{s.roomName}</h4>
                                            <div className="bg-green-100 text-green-700 p-2 rounded-lg">
                                                <TrendingUp size={16} />
                                            </div>
                                         </div>
                                         <p className="text-xs text-gray-500 italic mb-4 leading-relaxed line-clamp-3">"{s.justification}"</p>
                                         <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                                             <div className="text-center">
                                                 <p className="text-[10px] text-gray-400 uppercase font-bold">Atual</p>
                                                 <p className="font-semibold text-gray-500 line-through text-sm">{s.currentPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                             </div>
                                             <div className="h-8 w-px bg-gray-200"></div>
                                             <div className="text-center">
                                                 <p className="text-[10px] text-brand-green uppercase font-bold">Sugerido</p>
                                                 <p className="font-black text-2xl text-brand-dark">{s.suggestedPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                             </div>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                            <div className="flex justify-end pt-4">
                                <button onClick={handleApplySuggestions} disabled={isSaving} className="bg-brand-dark text-white font-bold py-4 px-10 rounded-xl flex items-center gap-3 shadow-lg hover:shadow-brand-green/20 hover:scale-105 transition-all active:scale-95">
                                    {isSaving ? <Loader2 className="animate-spin"/> : <><CheckCircle size={20}/> Aplicar Sugestões de Lucratividade</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
    
    const tabs = [
        { id: 'rates', name: 'Planos de Tarifa', icon: Tag, content: <RatesTab />, action: () => handleOpenModal('rate', null) },
        { id: 'restrictions', name: 'Restrições', icon: Ban, content: <RestrictionsTab />, action: () => handleOpenModal('restriction', null) },
        { id: 'promocodes', name: 'Códigos Promocionais', icon: Ticket, content: <PromoCodesTab />, action: () => handleOpenModal('promocode', null) },
        { id: 'packages', name: 'Pacotes', icon: PackageIcon, content: <PackagesTab />, action: () => handleOpenModal('package', null) },
        { id: 'dynamic', name: 'Precificação Dinâmica IA', icon: Sparkles, content: <DynamicPricingTab />, action: null },
        { id: 'channels', name: 'Canais (OTAs)', icon: Zap, content: <ChannelsTab />, action: null },
    ];
    const activeTabData = tabs.find(t => t.id === activeTab)!;

    return (
        <Section title="Tarifas e Vendas Diretas" icon={Tag} actions={
            <div className="flex gap-2">
                <button onClick={handleSyncToOTAs} disabled={isSyncingOTAs} className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-orange-600 flex items-center gap-2 transition-all">
                    {isSyncingOTAs ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                    {isSyncingOTAs ? 'Sincronizando...' : 'Sync OTAs'}
                </button>
                {activeTabData.action && (
                    <button onClick={activeTabData.action} className="btn-primary flex items-center gap-2">
                        <PlusCircle size={18} /> Novo
                    </button>
                )}
            </div>
        }>
            <div className="flex border-b mb-6 overflow-x-auto no-scrollbar">{tabs.map(t => <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold flex-shrink-0 ${activeTab === t.id ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500'}`}><t.icon size={16}/> {t.name}</button>)}</div>
            <div className="bg-gray-50 p-6 rounded-2xl border">
                {activeTabData.content}
            </div>
            
            <Modal isOpen={isRateModalOpen} onClose={() => setIsRateModalOpen(false)} title="Plano de Tarifa">
                {editingPlan && <form onSubmit={(e) => { e.preventDefault(); handleSave('rate'); }} className="space-y-4">
                    <input name="name" value={editingPlan.name} onChange={e => setEditingPlan({...editingPlan, name: e.target.value})} className="input-base" placeholder="Nome do Plano"/>
                    <textarea name="description" value={editingPlan.description} onChange={e => setEditingPlan({...editingPlan, description: e.target.value})} className="input-base" placeholder="Descrição"/>
                    <div className="grid grid-cols-2 gap-4">
                        <select name="modifierType" value={editingPlan.modifierType} onChange={e => setEditingPlan({...editingPlan, modifierType: e.target.value as any})} className="input-base"><option value="percentage">%</option><option value="fixed">R$</option></select>
                        <input type="number" step="0.01" name="priceModifier" value={editingPlan.priceModifier} onChange={e => setEditingPlan({...editingPlan, priceModifier: Number(e.target.value)})} className="input-base" />
                    </div>
                    <label className="flex items-center gap-2"><input type="checkbox" name="isDefault" checked={editingPlan.isDefault} onChange={e => setEditingPlan({...editingPlan, isDefault: e.target.checked})} /> Plano Padrão</label>
                    <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsRateModalOpen(false)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin"/> : 'Salvar'}</button></div>
                </form>}
            </Modal>
            
            <Modal isOpen={isRestrictionModalOpen} onClose={() => setIsRestrictionModalOpen(false)} title="Restrição de Reserva">
                {editingRestriction && <form onSubmit={(e) => { e.preventDefault(); handleSave('restriction'); }} className="space-y-4">
                    <input name="name" value={editingRestriction.name} onChange={e => setEditingRestriction({...editingRestriction, name: e.target.value})} className="input-base" placeholder="Nome da Restrição"/>
                     <div className="grid grid-cols-2 gap-4">
                        <input type="date" name="startDate" value={editingRestriction.startDate} onChange={e => setEditingRestriction({...editingRestriction, startDate: e.target.value})} className="input-base"/>
                        <input type="date" name="endDate" value={editingRestriction.endDate} onChange={e => setEditingRestriction({...editingRestriction, endDate: e.target.value})} className="input-base"/>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <select name="type" value={editingRestriction.type} onChange={e => setEditingRestriction({...editingRestriction, type: e.target.value as any})} className="input-base"><option value="minStay">Estadia Mínima</option><option value="minAdvance">Antecedência Mínima</option></select>
                        <input type="number" name="value" value={editingRestriction.value} onChange={e => setEditingRestriction({...editingRestriction, value: Number(e.target.value)})} className="input-base" />
                    </div>
                    <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsRestrictionModalOpen(false)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin"/> : 'Salvar'}</button></div>
                </form>}
            </Modal>

            <Modal isOpen={isPromoCodeModalOpen} onClose={() => setIsPromoCodeModalOpen(false)} title="Código Promocional">
                {editingPromoCode && <form onSubmit={(e) => { e.preventDefault(); handleSave('promocode'); }} className="space-y-4">
                    <input name="code" value={editingPromoCode.code} onChange={e => setEditingPromoCode({...editingPromoCode, code: e.target.value.toUpperCase()})} className="input-base" placeholder="CÓDIGO"/>
                    <div className="grid grid-cols-2 gap-4">
                        <select name="discountType" value={editingPromoCode.discountType} onChange={e => setEditingPromoCode({...editingPromoCode, discountType: e.target.value as any})} className="input-base"><option value="percentage">%</option><option value="fixed">R$</option></select>
                        <input type="number" name="discountValue" value={editingPromoCode.discountValue} onChange={e => setEditingPromoCode({...editingPromoCode, discountValue: Number(e.target.value)})} className="input-base" />
                    </div>
                     <input type="date" name="validUntil" value={editingPromoCode.validUntil} onChange={e => setEditingPromoCode({...editingPromoCode, validUntil: e.target.value})} className="input-base"/>
                     <input type="number" name="minNights" value={editingPromoCode.minNights || ''} onChange={e => setEditingPromoCode({...editingPromoCode, minNights: Number(e.target.value) || undefined })} className="input-base" placeholder="Noites mínimas (opcional)"/>
                    <label className="flex items-center gap-2"><input type="checkbox" name="isActive" checked={editingPromoCode.isActive} onChange={e => setEditingPromoCode({...editingPromoCode, isActive: e.target.checked})} /> Ativo</label>
                    <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsPromoCodeModalOpen(false)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin"/> : 'Salvar'}</button></div>
                </form>}
            </Modal>

             <Modal isOpen={isPackageModalOpen} onClose={() => setIsPackageModalOpen(false)} title="Pacote de Oferta">
                {editingPackage && <form onSubmit={(e) => { e.preventDefault(); handleSave('package'); }} className="space-y-4">
                    <input name="name" value={editingPackage.name} onChange={e => setEditingPackage({...editingPackage, name: e.target.value})} className="input-base" placeholder="Nome do Pacote"/>
                    <textarea name="description" value={editingPackage.description} onChange={e => setEditingPackage({...editingPackage, description: e.target.value})} className="input-base" placeholder="Descrição"/>
                     <input name="imageUrl" value={editingPackage.imageUrl} onChange={e => setEditingPackage({...editingPackage, imageUrl: e.target.value})} className="input-base" placeholder="URL da Imagem"/>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" step="0.01" name="price" value={editingPackage.price} onChange={e => setEditingPackage({...editingPackage, price: Number(e.target.value)})} className="input-base" placeholder="Preço"/>
                        <select name="priceType" value={editingPackage.priceType} onChange={e => setEditingPackage({...editingPackage, priceType: e.target.value as any})} className="input-base"><option value="per_night">/ noite</option><option value="total_stay">/ estadia total</option></select>
                    </div>
                     <input type="number" name="minNights" value={editingPackage.minNights} onChange={e => setEditingPackage({...editingPackage, minNights: Number(e.target.value)})} className="input-base" placeholder="Noites mínimas"/>
                    <select name="includedRoomType" value={editingPackage.includedRoomType} onChange={e => setEditingPackage({...editingPackage, includedRoomType: e.target.value as any})} className="input-base">{Object.values(RoomType).map(rt => <option key={rt} value={rt}>{rt}</option>)}</select>
                    <div>
                        <label>Add-ons Inclusos:</label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                        {db.addOns.map((addOn: AddOn) => (
                            <label key={addOn.id} className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={editingPackage.includedAddOnIds.includes(addOn.id)} onChange={e => {
                                    const newAddOnIds = e.target.checked ? [...editingPackage.includedAddOnIds, addOn.id] : editingPackage.includedAddOnIds.filter(id => id !== addOn.id);
                                    setEditingPackage({...editingPackage, includedAddOnIds: newAddOnIds});
                                }}/>
                                {addOn.name}
                            </label>
                        ))}
                        </div>
                    </div>
                    <label className="flex items-center gap-2"><input type="checkbox" name="isActive" checked={editingPackage.isActive} onChange={e => setEditingPackage({...editingPackage, isActive: e.target.checked})} /> Ativo</label>
                    <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsPackageModalOpen(false)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin"/> : 'Salvar'}</button></div>
                </form>}
            </Modal>
        </Section>
    );
};