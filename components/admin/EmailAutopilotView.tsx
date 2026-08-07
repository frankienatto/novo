import React, { useState, useEffect, useMemo } from 'react';
import { Section } from './shared';
import { DBState, EmailTemplate, EmailCampaign, AutomatedEmail, AutomationTrigger, CampaignAudience, Guest } from '../../types';
import { Mail, PlusCircle, Send, Edit, Trash2, Save, Loader2, Power, Settings, Eye, Sparkles, BarChart2, GitCompareArrows, Trophy } from 'lucide-react';
import Modal from './Modal';
import { generateEmailContent } from '../../services/geminiService';
import { eventBus } from '../../services/apiService';

// --- Helper Functions & Components ---

const renderPreview = (body: string, guest: Guest, db: DBState) => {
    const guestName = (guest.fullName || 'Hóspede').split(' ')[0];
    const hostelName = 'Forest Beach House';
    const checkInStr = new Date().toLocaleDateString();
    const checkOutStr = new Date(Date.now() + 3 * 86400000).toLocaleDateString();
    const guestPointsStr = String(guest.points || 0);
    const loyaltyLevelName = db.loyaltyLevels.sort((a, b) => b.minPoints - a.minPoints).find(l => (guest.points || 0) >= l.minPoints)?.name || 'Iniciante';

    let previewBody = body
        .replace(/{{guestName}}/g, guestName)
        .replace(/{{hostelName}}/g, hostelName)
        .replace(/{{checkIn}}/g, checkInStr)
        .replace(/{{checkOut}}/g, checkOutStr)
        .replace(/{{guestPoints}}/g, guestPointsStr)
        .replace(/{{guestLoyaltyLevel}}/g, loyaltyLevelName);

    // Simple conditional logic handler
    previewBody = previewBody.replace(/{{#if interest='(.*?)'}}(.*?){{\/if}}/g, (match, interest, content) => {
        return (guest.interests || []).includes(interest) ? content : '';
    });
    
    return previewBody;
};


const triggerInfo: Record<AutomationTrigger, { title: string; description: string }> = {
    BOOKING_CONFIRMED: { title: 'Confirmação de Reserva', description: 'Enviado imediatamente após a confirmação de uma nova reserva.' },
    PRE_ARRIVAL: { title: 'Pré-Chegada', description: 'Enviado dias antes do check-in para preparar o hóspede.' },
    POST_STAY: { title: 'Pós-Estadia', description: 'Enviado após o check-out para pedir feedback.' },
    GUEST_BIRTHDAY: { title: 'Aniversário do Hóspede', description: 'Enviado dias antes do aniversário do hóspede.' },
    GUEST_LEVEL_UP: { title: 'Hóspede Subiu de Nível', description: 'Enviado quando um hóspede atinge um novo nível de fidelidade.' },
};

interface EmailAutopilotViewProps {
    db: DBState;
    onSaveTemplate: (template: Omit<EmailTemplate, 'id'> | EmailTemplate) => Promise<void>;
    onDeleteTemplate: (templateId: string) => Promise<void>;
    onSaveCampaign: (campaign: Omit<EmailCampaign, 'id'> | EmailCampaign) => Promise<void>;
    onSendCampaign: (campaignId: string) => Promise<void>;
    onSaveAutomations: (automations: AutomatedEmail[]) => Promise<void>;
}

const EmailAutopilotView: React.FC<EmailAutopilotViewProps> = ({ db, onSaveTemplate, onDeleteTemplate, onSaveCampaign, onSendCampaign, onSaveAutomations }) => {
    const [activeTab, setActiveTab] = useState<'automations' | 'campaigns' | 'templates'>('automations');
    const [isSaving, setIsSaving] = useState(false);
    
    // Template State
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Omit<EmailTemplate, 'id'> | EmailTemplate | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [aiObjective, setAiObjective] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Campaign State
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Omit<EmailCampaign, 'id'> | EmailCampaign | null>(null);
    const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null);
    
    // Automations State
    const [automations, setAutomations] = useState<AutomatedEmail[]>([]);
    const [hasAutomationChanges, setHasAutomationChanges] = useState(false);

    useEffect(() => {
        setAutomations(db.automatedEmails || []);
        setHasAutomationChanges(false);
    }, [db.automatedEmails, activeTab]);

    useEffect(() => {
        setHasAutomationChanges(JSON.stringify(automations) !== JSON.stringify(db.automatedEmails));
    }, [automations, db.automatedEmails]);


    const handleOpenTemplateModal = (template: EmailTemplate | null) => {
        setEditingTemplate(template || { name: '', subject: '', body: '' });
        setIsTemplateModalOpen(true);
    };
    
    const handleSaveTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTemplate) return;
        setIsSaving(true);
        await onSaveTemplate(editingTemplate);
        setIsSaving(false);
        setIsTemplateModalOpen(false);
    };

     const handleGenerateContent = async () => {
        if (!aiObjective.trim() || !editingTemplate) return;
        setIsGenerating(true);
        const result = await generateEmailContent(aiObjective, db.properties[0]);
        if(result) {
            setEditingTemplate(prev => prev ? {...prev, subject: result.subject, body: result.body} : null);
        }
        setIsGenerating(false);
    };

    const TemplatesTab = () => (
        <>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                <p className="text-sm text-gray-600">Crie e gerencie os modelos de email para suas comunicações.</p>
                <button onClick={() => handleOpenTemplateModal(null)} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto flex-shrink-0"><PlusCircle size={18}/> Novo Template</button>
            </div>
            <div className="space-y-3">
                {db.emailTemplates.map(template => (
                    <div key={template.id} className="bg-white p-3 rounded-lg border flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                            <p className="font-semibold">{template.name}</p>
                            <p className="text-sm text-gray-500 mt-1 sm:mt-0">{template.subject}</p>
                        </div>
                        <div className="flex gap-2 self-end sm:self-auto">
                            <button onClick={() => { setEditingTemplate(template); setIsPreviewOpen(true); }} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><Eye size={16}/></button>
                            <button onClick={() => handleOpenTemplateModal(template)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Edit size={16}/></button>
                            <button onClick={() => onDeleteTemplate(template.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
    
    const CampaignsTab = () => (
        <>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                <p className="text-sm text-gray-600">Envie campanhas de email para segmentos específicos de hóspedes.</p>
                <button onClick={() => { setEditingCampaign({name: '', subject: '', templateId: db.emailTemplates[0]?.id || '', audience: 'Todos os Hóspedes', status: 'Rascunho'}); setIsCampaignModalOpen(true); }} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 flex-shrink-0"><PlusCircle size={18}/> Nova Campanha</button>
            </div>
             <div className="space-y-3">
                {db.emailCampaigns.map(campaign => (
                    <div key={campaign.id} className="bg-white p-3 rounded-lg border">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div>
                                <p className="font-semibold">{campaign.name}</p>
                                <p className="text-sm text-gray-500 mt-1 sm:mt-0">{campaign.subject}</p>
                            </div>
                            <div className="flex gap-2 self-end sm:self-auto">
                                {campaign.status === 'Rascunho' && (
                                    <button onClick={() => { if(confirm(`Enviar campanha "${campaign.name}"?`)) { setSendingCampaignId(campaign.id); onSendCampaign(campaign.id).finally(() => setSendingCampaignId(null)); } }} className="btn-secondary text-sm flex items-center gap-1.5" disabled={sendingCampaignId === campaign.id}>
                                        {sendingCampaignId === campaign.id ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>} Enviar
                                    </button>
                                )}
                                <button onClick={() => { setEditingCampaign(campaign); setIsCampaignModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Edit size={16}/></button>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2 pt-2 border-t flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                             <span>Público: {campaign.audience}</span>
                             {campaign.status === 'Enviada' && campaign.performance ? (
                                <div className="flex flex-wrap gap-2 sm:gap-4 mt-2 sm:mt-0">
                                     <span>Enviada em: {new Date(campaign.sentAt!).toLocaleDateString()}</span>
                                     <span>Envios: {campaign.performance.sent}</span>
                                     <span>Aberturas: {campaign.performance.opens}%</span>
                                     <span>Cliques: {campaign.performance.clicks}%</span>
                                </div>
                             ) : (
                                <span className="font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">Rascunho</span>
                             )}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );

    const AutomationsTab = () => {
        const handleAutomationChange = (trigger: AutomationTrigger, field: keyof AutomatedEmail, value: any) => {
            setAutomations(prev => prev.map(auto => auto.trigger === trigger ? {...auto, [field]: value} : auto));
        };
        
        const handlePromoteWinner = (trigger: AutomationTrigger, winner: 'A' | 'B') => {
            setAutomations(prev => prev.map(auto => {
                if (auto.trigger === trigger) {
                    const winnerTemplateId = winner === 'A' ? auto.templateAId : auto.templateBId;
                    if (!winnerTemplateId) return auto; // Should not happen
                    
                    return {
                        ...auto,
                        templateAId: winnerTemplateId,
                        templateBId: null,
                        performance: undefined, // Reset performance
                    };
                }
                return auto;
            }));
             eventBus.emit('new-toast', { type: 'success', title: 'Teste A/B Finalizado', message: `Template ${winner} promovido para a automação!` });
        };
        
        const automationMap = useMemo(() => automations.reduce((acc, curr) => {
            acc[curr.trigger] = curr;
            return acc;
        }, {} as Record<AutomationTrigger, AutomatedEmail>), [automations]);
        
        return (
            <>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                    <p className="text-sm text-gray-600">Configure emails automáticos para momentos chave da jornada do hóspede.</p>
                    {hasAutomationChanges && (
                         <button onClick={() => { setIsSaving(true); onSaveAutomations(automations).finally(() => setIsSaving(false)); }} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
                            {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Salvar Alterações
                         </button>
                    )}
                </div>
                <div className="space-y-4">
                    {Object.entries(triggerInfo).map(([trigger, info]) => {
                        const automation = automationMap[trigger as AutomationTrigger];
                        if (!automation) return null;
                        const perfA = automation.performance?.templateA;
                        const perfB = automation.performance?.templateB;
                        const openRateA = perfA && perfA.sent > 0 ? ((perfA.opens / perfA.sent) * 100).toFixed(1) : 0;
                        const clickRateA = perfA && perfA.opens > 0 ? ((perfA.clicks / perfA.opens) * 100).toFixed(1) : 0;
                        const openRateB = perfB && perfB.sent > 0 ? ((perfB.opens / perfB.sent) * 100).toFixed(1) : 0;
                        const clickRateB = perfB && perfB.opens > 0 ? ((perfB.clicks / perfB.opens) * 100).toFixed(1) : 0;
                        
                        return (
                             <div key={trigger} className="bg-white p-4 rounded-lg border">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-lg text-brand-dark">{info.title}</h4>
                                        <p className="text-xs text-gray-500">{info.description}</p>
                                    </div>
                                     <div onClick={() => handleAutomationChange(trigger as AutomationTrigger, 'isActive', !automation.isActive)} className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${automation.isActive ? 'bg-brand-green' : 'bg-gray-300'}`}>
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${automation.isActive ? 'translate-x-6' : ''}`} />
                                    </div>
                                </div>
                                 <div className={`mt-4 pt-4 border-t space-y-4 ${!automation.isActive ? 'opacity-50 pointer-events-none' : ''}`}>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold">Gatilho</label>
                                            <p className="text-sm p-2 bg-gray-100 rounded-md mt-1">{info.title}</p>
                                        </div>
                                         <div>
                                            <label className="text-sm font-semibold">Atraso no Envio (dias)</label>
                                            <input type="number" value={automation.delayDays} onChange={(e) => handleAutomationChange(trigger as AutomationTrigger, 'delayDays', Number(e.target.value))} className="input-base mt-1" />
                                         </div>
                                    </div>
                                    
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold flex items-center gap-2">Template A {perfA && `(${perfA.sent} envios)`}</label>
                                            <select value={automation.templateAId} onChange={(e) => handleAutomationChange(trigger as AutomationTrigger, 'templateAId', e.target.value)} className="input-base mt-1">
                                                {db.emailTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                             {perfA && <p className="text-xs mt-1">Abertura: {openRateA}% / Cliques: {clickRateA}%</p>}
                                        </div>
                                         <div>
                                            {automation.templateBId ? (
                                                <>
                                                    <label className="text-sm font-semibold flex items-center gap-2">Template B {perfB && `(${perfB.sent} envios)`}</label>
                                                    <select value={automation.templateBId} onChange={(e) => handleAutomationChange(trigger as AutomationTrigger, 'templateBId', e.target.value)} className="input-base mt-1">
                                                        {db.emailTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                    </select>
                                                    {perfB && <p className="text-xs mt-1">Abertura: {openRateB}% / Cliques: {clickRateB}%</p>}
                                                </>
                                            ) : (
                                                 <button onClick={() => handleAutomationChange(trigger as AutomationTrigger, 'templateBId', db.emailTemplates[1]?.id || db.emailTemplates[0]?.id)} className="w-full h-full flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed rounded-lg hover:border-brand-green">
                                                    <GitCompareArrows size={20} className="text-gray-400"/>
                                                    <span className="text-sm font-semibold text-gray-600 mt-1">Adicionar Teste A/B</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                     {automation.templateBId && (
                                        <div className="flex justify-end gap-2 text-sm">
                                            <button onClick={() => handlePromoteWinner(trigger as AutomationTrigger, 'A')} className="font-semibold text-blue-600 hover:underline">Promover A</button>
                                            <span>|</span>
                                            <button onClick={() => handlePromoteWinner(trigger as AutomationTrigger, 'B')} className="font-semibold text-blue-600 hover:underline">Promover B</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </>
        );
    };

    return (
        <Section title="Autopilot de Email" icon={Mail}>
            <div className="flex border-b mb-6 overflow-x-auto hide-scrollbar sm:flex-wrap">
                 <button onClick={() => setActiveTab('automations')} className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap flex-shrink-0 ${activeTab === 'automations' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500'}`}><Settings size={16}/> Automações</button>
                 <button onClick={() => setActiveTab('campaigns')} className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap flex-shrink-0 ${activeTab === 'campaigns' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500'}`}><BarChart2 size={16}/> Campanhas</button>
                 <button onClick={() => setActiveTab('templates')} className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap flex-shrink-0 ${activeTab === 'templates' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500'}`}><Edit size={16}/> Templates</button>
            </div>

            {activeTab === 'templates' && <TemplatesTab />}
            {activeTab === 'campaigns' && <CampaignsTab />}
            {activeTab === 'automations' && <AutomationsTab />}

            <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title={editingTemplate && 'id' in editingTemplate ? "Editar Template" : "Novo Template"} size="2xl">
                {editingTemplate && (
                    <form onSubmit={handleSaveTemplate} className="space-y-4">
                         <div className="bg-gray-50 p-3 rounded-lg border">
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Sparkles size={16} className="text-purple-500"/> Gerador de Conteúdo IA</h4>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input type="text" value={aiObjective} onChange={e => setAiObjective(e.target.value)} placeholder="Objetivo do email (ex: 'promover fogueira de sábado')" className="input-base flex-grow w-full"/>
                                <button type="button" onClick={handleGenerateContent} disabled={isGenerating} className="btn-secondary w-full sm:w-auto flex justify-center items-center flex-shrink-0">
                                    {isGenerating ? <Loader2 className="animate-spin" /> : 'Gerar'}
                                </button>
                            </div>
                        </div>
                        <div><label>Nome do Template</label><input name="name" value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} className="input-base" required/></div>
                        <div><label>Assunto do Email</label><input name="subject" value={editingTemplate.subject} onChange={e => setEditingTemplate({...editingTemplate, subject: e.target.value})} className="input-base" required/></div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label>Corpo do Email (HTML)</label>
                                <div className="group relative">
                                    <button type="button" className="text-sm font-semibold text-brand-green">Inserir Placeholder</button>
                                    <div className="absolute right-0 bottom-full mb-2 w-60 bg-white border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity p-2 text-xs z-10">
                                        <p><strong>Padrão:</strong> {`{{guestName}}`}, {`{{hostelName}}`}</p>
                                        <p><strong>Fidelidade:</strong> {`{{guestPoints}}`}, {`{{guestLoyaltyLevel}}`}</p>
                                        <p className="mt-2 pt-2 border-t"><strong>Lógica Condicional:</strong><br/> {`{{#if interest='surf'}}`}Texto para surfistas{`{{/if}}`}</p>
                                    </div>
                                </div>
                            </div>
                            <textarea name="body" value={editingTemplate.body} onChange={e => setEditingTemplate({...editingTemplate, body: e.target.value})} className="input-base font-mono" rows={10}/>
                        </div>
                        <div className="flex justify-between items-center">
                            <button type="button" onClick={() => setIsPreviewOpen(true)} className="btn-secondary">Pré-visualizar</button>
                            <div className="flex gap-2"><button type="button" onClick={() => setIsTemplateModalOpen(false)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">{isSaving ? <Loader2 className="animate-spin"/> : 'Salvar'}</button></div>
                        </div>
                    </form>
                )}
            </Modal>
            
            <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title="Pré-visualização do Email">
                {editingTemplate && db.guests[0] && (
                    <div>
                        <div className="p-2 bg-gray-100 rounded-md"><strong>Assunto:</strong> {renderPreview(editingTemplate.subject, db.guests[0], db)}</div>
                        <div className="mt-4 border rounded-md p-4" dangerouslySetInnerHTML={{ __html: renderPreview(editingTemplate.body, db.guests[0], db) }}></div>
                    </div>
                )}
            </Modal>

             <Modal isOpen={isCampaignModalOpen} onClose={() => setIsCampaignModalOpen(false)} title={editingCampaign && 'id' in editingCampaign ? "Editar Campanha" : "Nova Campanha"}>
                {editingCampaign && (
                    <form onSubmit={(e) => { e.preventDefault(); setIsSaving(true); onSaveCampaign(editingCampaign).finally(() => {setIsSaving(false); setIsCampaignModalOpen(false);}); }} className="space-y-4">
                        <div><label>Nome da Campanha</label><input value={editingCampaign.name} onChange={e => setEditingCampaign({...editingCampaign, name: e.target.value})} className="input-base" required/></div>
                        <div><label>Assunto</label><input value={editingCampaign.subject} onChange={e => setEditingCampaign({...editingCampaign, subject: e.target.value})} className="input-base" required/></div>
                        <div><label>Template</label><select value={editingCampaign.templateId} onChange={e => setEditingCampaign({...editingCampaign, templateId: e.target.value})} className="input-base"><option disabled value="">Selecione um template</option>{db.emailTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                        <div><label>Público</label><select value={editingCampaign.audience} onChange={e => setEditingCampaign({...editingCampaign, audience: e.target.value as CampaignAudience})} className="input-base"><option>Todos os Hóspedes</option><option>Hóspedes Atuais</option><option>Hóspedes Anteriores</option></select></div>
                         <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsCampaignModalOpen(false)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">{isSaving ? <Loader2 className="animate-spin"/> : 'Salvar'}</button></div>
                    </form>
                )}
            </Modal>
        </Section>
    );
};

export default EmailAutopilotView;