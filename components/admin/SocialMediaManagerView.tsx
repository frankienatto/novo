import React, { useState, useMemo, useEffect } from 'react';
import { Section } from './shared';
import { generatePostTextAndHashtags, generateWeeklyContentPlan } from '../../services/geminiService';
import { Loader2, Sparkles, Instagram, Facebook, Twitter, PenSquare, Calendar, Lightbulb, CalendarPlus, X, Trash2, Edit, ImageIcon, Save, ImagePlus, UploadCloud, Video, Clapperboard, PlusCircle, Link as LinkIcon, CheckCircle } from 'lucide-react';
import { DBState, ScheduledPost, AdPlatformString, AdCampaign, MediaAsset, BriefingAction, WeeklyPostSuggestion } from '../../types';
import Modal from './Modal';

interface SocialMediaManagerViewProps {
    db: DBState;
    onAddPost: (postData: Omit<ScheduledPost, 'id'>) => Promise<void>;
    onUpdatePost: (postId: string, updates: Partial<ScheduledPost>) => Promise<void>;
    onDeletePost: (postId: string) => Promise<void>;
    onAddMediaAsset: (assetData: Omit<MediaAsset, 'id' | 'createdAt'>) => Promise<void>;
    onDeleteMediaAsset: (assetId: string) => Promise<void>;
    initialAction: BriefingAction | null;
    onActionConsumed: () => void;
}

export const SocialMediaManagerView: React.FC<SocialMediaManagerViewProps> = ({ db, onAddPost, onUpdatePost, onDeletePost, onAddMediaAsset, onDeleteMediaAsset, initialAction, onActionConsumed }) => {
    const [activeTab, setActiveTab] = useState<'schedule' | 'planner' | 'library'>('schedule');
    const [scheduleModal, setScheduleModal] = useState<{
        isOpen: boolean;
        post: Partial<ScheduledPost>;
        aiTopic?: string;
        isGeneratingAi?: boolean;
        aiSuggestions?: { postText: string; hashtags: string[] } | null;
    }>({ isOpen: false, post: {} });
    const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);

    // State for AI Planner
    const [weeklyTheme, setWeeklyTheme] = useState('');
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPostSuggestion[] | null>(null);


    useEffect(() => {
        if (initialAction?.type === 'CREATE_SOCIAL_POST') {
            const payload = initialAction.payload || {};
            const postData = {
                content: payload.suggestion || payload.content || '',
                imageUrl: payload.imageUrl || undefined
            };
            handleOpenScheduleModal(postData);
            onActionConsumed();
        }
    }, [initialAction, onActionConsumed]);

    const handleGeneratePlan = async () => {
        if (!weeklyTheme.trim()) return;
        setIsGeneratingPlan(true);
        setWeeklyPlan(null);
        const result = await generateWeeklyContentPlan(weeklyTheme, db.properties[0]);
        setWeeklyPlan(result?.plan || []);
        setIsGeneratingPlan(false);
    };

    const handleOpenScheduleModal = (post: Partial<ScheduledPost>) => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 10);
        const defaultPost: Partial<ScheduledPost> = {
            platform: 'Instagram',
            status: 'Scheduled',
            scheduledAt: now.toISOString().slice(0, 16),
            ...post
        };
        setScheduleModal({
            isOpen: true,
            post: defaultPost,
            aiTopic: '',
            isGeneratingAi: false,
            aiSuggestions: null
        });
    };

    const handleScheduleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { post } = scheduleModal;
        if (!post.content || !post.scheduledAt) {
            alert("Preencha todos os campos para agendar.");
            return;
        }

        const postData: Omit<ScheduledPost, 'id'> = {
            platform: post.platform!,
            content: post.content!,
            status: 'Scheduled',
            scheduledAt: new Date(post.scheduledAt).toISOString(),
            imageUrl: post.imageUrl,
            videoUrl: post.videoUrl,
            campaignId: post.campaignId,
        };

        if ('id' in post && post.id) {
            await onUpdatePost(post.id, postData);
        } else {
            await onAddPost(postData);
        }
        setScheduleModal({ isOpen: false, post: {} });
    };

    const handleSelectMedia = (asset: MediaAsset) => {
        setScheduleModal(prev => ({ ...prev, post: { ...prev.post, imageUrl: asset.url } }));
        setIsLibraryModalOpen(false);
    };

    const handleGenerateAiContent = async () => {
        if (!scheduleModal.aiTopic?.trim() || !scheduleModal.post.platform) return;
        setScheduleModal(prev => ({ ...prev, isGeneratingAi: true, aiSuggestions: null }));
        const result = await generatePostTextAndHashtags(scheduleModal.aiTopic, scheduleModal.post.platform, db.properties[0]);
        setScheduleModal(prev => ({ ...prev, isGeneratingAi: false, aiSuggestions: result }));
    };

    const handleScheduleFromPlanner = (suggestion: WeeklyPostSuggestion) => {
        const now = new Date();
        const dayIndex = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'].indexOf(suggestion.day);
        now.setDate(now.getDate() + (dayIndex - now.getDay() + 7) % 7);
        now.setHours(18, 0, 0, 0);

        const postData: Omit<ScheduledPost, 'id'> = {
            platform: suggestion.platform,
            content: suggestion.idea,
            status: 'Draft',
            scheduledAt: now.toISOString(),
        };
        onAddPost(postData);
    };

    const renderLibraryView = () => (
        <div className="space-y-4">
            <p className="text-sm text-gray-500">Sua biblioteca de mídias. Clique em um item para agendar um post com ele.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {db.mediaLibrary.map(asset => (
                    <button key={asset.id} onClick={() => handleOpenScheduleModal({ imageUrl: asset.url, content: asset.prompt || '' })} className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square">
                        <img src={asset.url} alt={asset.prompt || 'Media asset'} className="w-full h-full object-cover"/>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 gap-2">
                           <PenSquare size={24} className="text-white"/>
                           <span className="text-white text-xs font-semibold text-center">{asset.prompt || 'Agendar'}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderPlannerView = () => (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <input
                    type="text"
                    value={weeklyTheme}
                    onChange={e => setWeeklyTheme(e.target.value)}
                    placeholder="Tema da semana (ex: Foco em relaxamento e yoga)"
                    className="input-base flex-grow w-full"
                />
                <button onClick={handleGeneratePlan} disabled={isGeneratingPlan || !weeklyTheme.trim()} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 flex-shrink-0">
                    {isGeneratingPlan ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />}
                    Gerar Plano
                </button>
            </div>
            {isGeneratingPlan && <div className="text-center p-8"><Loader2 className="animate-spin text-brand-green" /></div>}
            {weeklyPlan && (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {weeklyPlan.map((suggestion, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg border">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <h4 className="font-bold">{suggestion.day} - <span className="font-normal">{suggestion.platform}</span></h4>
                                <button onClick={() => handleScheduleFromPlanner(suggestion)} className="text-xs font-semibold bg-blue-100 text-blue-800 px-3 py-1.5 rounded-md hover:bg-blue-200 w-full sm:w-auto text-center flex-shrink-0">
                                    Agendar Rascunho
                                </button>
                            </div>
                            <p className="text-sm mt-1">{suggestion.idea}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderScheduleView = () => (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {db.scheduledPosts.map(post => (
                <div key={post.id} className="bg-white p-3 rounded-lg border flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                        <p className="font-semibold">{post.content.substring(0, 100)}...</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {post.platform} - {new Date(post.scheduledAt).toLocaleString()} - {post.status}
                        </p>
                    </div>
                    <div className="flex gap-2 justify-end self-end sm:self-auto">
                        <button onClick={() => handleOpenScheduleModal(post)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Edit size={16} /></button>
                        <button onClick={() => onDeletePost(post.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>
                    </div>
                </div>
            ))}
        </div>
    );

    const tabs = [
        { id: 'schedule', name: 'Agenda', icon: Calendar },
        { id: 'planner', name: 'Planejador IA', icon: Lightbulb },
        { id: 'library', name: 'Biblioteca', icon: ImageIcon },
    ];

    return (
        <Section title="Gerenciador de Mídias Sociais" icon={PenSquare} actions={
            <button onClick={() => handleOpenScheduleModal({})} className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto">
                <CalendarPlus size={18} /> Agendar Post
            </button>
        }>
            <div className="flex border-b mb-6 overflow-x-auto hide-scrollbar sm:flex-wrap">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === tab.id ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500 hover:text-brand-dark'}`}
                    >
                        <tab.icon size={16} /> {tab.name}
                    </button>
                ))}
            </div>

            {activeTab === 'schedule' && renderScheduleView()}
            {activeTab === 'planner' && renderPlannerView()}
            {activeTab === 'library' && renderLibraryView()}

            <Modal isOpen={scheduleModal.isOpen} onClose={() => setScheduleModal({ isOpen: false, post: {} })} title={scheduleModal.post.id ? 'Editar Post' : 'Agendar Novo Post'}>
                <form onSubmit={handleScheduleSubmit} className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg border">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Sparkles size={16} className="text-purple-500" /> Gerador de Conteúdo IA</h4>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                value={scheduleModal.aiTopic || ''}
                                onChange={e => setScheduleModal(prev => ({ ...prev, aiTopic: e.target.value }))}
                                placeholder="Tópico (ex: churrasco do hostel)"
                                className="input-base flex-grow w-full"
                            />
                            <button type="button" onClick={handleGenerateAiContent} disabled={scheduleModal.isGeneratingAi} className="btn-secondary w-full sm:w-auto flex justify-center items-center flex-shrink-0">
                                {scheduleModal.isGeneratingAi ? <Loader2 className="animate-spin" /> : 'Gerar'}
                            </button>
                        </div>
                        {scheduleModal.aiSuggestions && (
                            <div className="mt-2 text-xs bg-purple-100 p-2 rounded-md">
                                <p><strong>Sugestão:</strong> {scheduleModal.aiSuggestions.postText}</p>
                                <button type="button" onClick={() => setScheduleModal(prev => ({...prev, post: {...prev.post, content: prev.aiSuggestions?.postText}}))} className="text-blue-600 font-semibold mt-1">Usar texto</button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label>Conteúdo</label>
                        <textarea value={scheduleModal.post.content || ''} onChange={e => setScheduleModal(prev => ({ ...prev, post: { ...prev.post, content: e.target.value } }))} className="input-base" rows={5} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label>Plataforma</label>
                            <select value={scheduleModal.post.platform || 'Instagram'} onChange={e => setScheduleModal(prev => ({ ...prev, post: { ...prev.post, platform: e.target.value as AdPlatformString } }))} className="input-base">
                                <option>Instagram</option>
                                <option>Facebook</option>
                                <option>Twitter</option>
                                <option>TikTok</option>
                            </select>
                        </div>
                        <div>
                            <label>Agendar Para</label>
                            <input type="datetime-local" value={scheduleModal.post.scheduledAt?.substring(0, 16)} onChange={e => setScheduleModal(prev => ({ ...prev, post: { ...prev.post, scheduledAt: e.target.value } }))} className="input-base" required />
                        </div>
                    </div>
                    <div>
                        <label>Mídia</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input value={scheduleModal.post.imageUrl || ''} onChange={e => setScheduleModal(prev => ({ ...prev, post: { ...prev.post, imageUrl: e.target.value } }))} placeholder="URL da Imagem" className="input-base flex-grow w-full" />
                            <button type="button" onClick={() => setIsLibraryModalOpen(true)} className="btn-secondary w-full sm:w-auto flex justify-center items-center flex-shrink-0"><ImageIcon size={16} /></button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                        <button type="button" onClick={() => setScheduleModal({ isOpen: false, post: {} })} className="btn-secondary w-full sm:w-auto">Cancelar</button>
                        <button type="submit" className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"><Save size={16} /> Salvar</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isLibraryModalOpen} onClose={() => setIsLibraryModalOpen(false)} title="Selecionar Mídia">
                <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                    {db.mediaLibrary.map(asset => (
                        <button key={asset.id} onClick={() => handleSelectMedia(asset)} className="aspect-square relative group">
                            <img src={asset.url} alt={asset.prompt} className="w-full h-full object-cover rounded-md" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                <CheckCircle size={32} className="text-white"/>
                            </div>
                        </button>
                    ))}
                </div>
            </Modal>
        </Section>
    );
};
