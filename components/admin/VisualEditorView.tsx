import React, { useState, useMemo } from 'react';
import { Section } from './shared';
import { SiteContent, DBState, ChatConversation, ChatMessage, ThemeSettings, PropertyInfo, Facility, PropertyEvent, LocalGuideTip, PaymentGatewaySettings } from '../../types';
import PublicView from '../PublicView';
import { Save, Loader2, Image as ImageIcon, Text, Brush, PanelsTopLeft, Sidebar, CaseUpper, SwatchBook, ImagePlus, Home, Users, CheckCircle, Moon, Star, Bell, PlusCircle, Trash2, LayoutGrid, Rows, Waves, Leaf, Sun, Wifi, Wind, Tv, UtensilsCrossed, WashingMachine, Library, Sparkles, Building, MenuSquare, Info, Link as LinkIcon, Edit, X, Facebook, Instagram, CreditCard, Bot, FileText, Globe, Percent, Settings, Twitter, AlertTriangle } from 'lucide-react';
import { themePresets } from '../../database';
import Modal from './Modal';


interface VisualEditorViewProps {
    db: DBState;
    chatData: { conversations: ChatConversation[]; messages: ChatMessage[] };
    onSaveSiteContent: (content: SiteContent) => Promise<void>;
    onSaveThemeSettings: (settings: ThemeSettings) => Promise<void>;
    onUpdateProperty: (info: PropertyInfo) => Promise<void>;
    onSavePropertyEvents: (events: PropertyEvent[]) => Promise<void>;
    onSaveLocalGuideTips: (tips: LocalGuideTip[]) => Promise<void>;
    onSaveFacilities: (facilities: Facility[]) => Promise<void>;
    onSavePaymentGatewaySettings: (settings: PaymentGatewaySettings) => Promise<void>;
}

const allIcons: { [key: string]: React.ElementType } = { Wifi, Sun, Wind, Tv, UtensilsCrossed, WashingMachine, Library, Sparkles, Waves, Leaf, Users, Home, Building, CheckCircle };
const iconNames = Object.keys(allIcons);

const GatewayCard: React.FC<{
    gateway: 'stripe' | 'mercadoPago' | 'paypal';
    name: string;
    icon: React.ElementType;
    settings: any;
    children: React.ReactNode;
    onToggle: (gateway: 'stripe' | 'mercadoPago' | 'paypal', connected: boolean) => void;
    onTest: (gateway: 'stripe' | 'mercadoPago' | 'paypal') => void;
    status: 'idle' | 'testing' | 'success' | 'error';
}> = ({ gateway, name, icon: Icon, settings, children, onToggle, onTest, status }) => {
    return (
        <details className="bg-white p-3 rounded-lg border group" open={settings.connected}>
            <summary className="font-semibold cursor-pointer flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="flex items-center gap-2">
                    <Icon size={20} className="text-gray-600" /> {name}
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${settings.connected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {settings.connected ? 'Conectado' : 'Desconectado'}
                    </span>
                    <div onClick={(e) => { e.preventDefault(); onToggle(gateway, !settings.connected); }} className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${settings.connected ? 'bg-brand-green' : 'bg-gray-300'}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${settings.connected ? 'translate-x-4' : ''}`} />
                    </div>
                </div>
            </summary>
            {settings.connected && (
                <div className="space-y-3 pt-4 mt-3 border-t">
                    {children}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3">
                        {status === 'testing' && <Loader2 size={16} className="animate-spin text-gray-500" />}
                        {status === 'success' && <span className="text-sm font-semibold text-green-600 flex items-center gap-1"><CheckCircle size={14}/> Teste bem-sucedido!</span>}
                        {status === 'error' && <span className="text-sm font-semibold text-red-600 flex items-center gap-1"><AlertTriangle size={14}/> Falha na conexão</span>}
                        <button onClick={() => onTest(gateway)} disabled={status === 'testing'} className="btn-secondary text-sm w-full sm:w-auto">
                            {status === 'testing' ? 'Testando...' : 'Testar Conexão'}
                        </button>
                    </div>
                </div>
            )}
        </details>
    );
};


export const VisualEditorView: React.FC<VisualEditorViewProps> = (props) => {
    const { db, onSaveThemeSettings, onUpdateProperty, onSavePropertyEvents, onSaveLocalGuideTips, onSavePaymentGatewaySettings, onSaveSiteContent, onSaveFacilities } = props;

    type Tab = 'info' | 'policies' | 'personalization' | 'cms' | 'connections';
    const [activeTab, setActiveTab] = useState<Tab>('info');
    const [isSaving, setIsSaving] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});

    const activeProperty = useMemo(() => db.properties.find(p => p.id === db.currentPropertyId)!, [db.properties, db.currentPropertyId]);

    // States for each section
    const [propertyInfo, setPropertyInfo] = useState<PropertyInfo>(activeProperty);
    const [themeSettings, setThemeSettings] = useState<ThemeSettings>(db.themeSettings);
    const [siteContent, setSiteContent] = useState<SiteContent>(db.siteContent);
    const [facilities, setFacilities] = useState<Facility[]>(db.siteContent.facilities);
    const [events, setEvents] = useState<PropertyEvent[]>(db.propertyEvents);
    const [tips, setTips] = useState<LocalGuideTip[]>(db.localGuideTips);
    
    const handleTestConnection = (gateway: 'stripe' | 'mercadoPago' | 'paypal') => {
        setConnectionStatus(prev => ({ ...prev, [gateway]: 'testing' }));
        setTimeout(() => {
            // Simulate API call result
            const success = Math.random() > 0.2; // 80% chance of success
            setConnectionStatus(prev => ({ ...prev, [gateway]: success ? 'success' : 'error' }));
             setTimeout(() => {
                setConnectionStatus(prev => ({ ...prev, [gateway]: 'idle' }));
            }, 3000); // Reset after 3 seconds
        }, 2000);
    };


    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            const updatedSiteContent = { ...siteContent, facilities };
            const updatedPropertyInfo = { ...propertyInfo };

            await Promise.all([
                onUpdateProperty(updatedPropertyInfo),
                onSaveThemeSettings(themeSettings),
                onSaveSiteContent(updatedSiteContent),
                onSaveFacilities(facilities),
                onSavePropertyEvents(events),
                onSaveLocalGuideTips(tips),
                onSavePaymentGatewaySettings(propertyInfo.paymentGatewaySettings) // Save gateway settings
            ]);
            alert("Alterações salvas com sucesso!");
        } catch (error) {
            console.error(error);
            alert("Ocorreu um erro ao salvar as alterações.");
        } finally {
            setIsSaving(false);
        }
    };
    

    // --- Change Handlers ---
    const handlePropertyInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'rules') {
            setPropertyInfo({ ...propertyInfo, rules: value.split('\n') });
        } else if (name.startsWith('policies.')) {
            const policyKey = name.split('.')[1] as keyof PropertyInfo['policies'];
            setPropertyInfo(prev => ({ ...prev, policies: { ...prev.policies, [policyKey]: value } }));
        } else if (name.startsWith('socialLinks.')) {
            const socialKey = name.split('.')[1] as keyof PropertyInfo['socialLinks'];
            setPropertyInfo(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, [socialKey]: value } }));
        }
        else {
            setPropertyInfo({ ...propertyInfo, [name]: name === 'localTaxRate' ? parseFloat(value) : value });
        }
    };
    
    const handleThemeChange = (area: keyof ThemeSettings, field: string, value: string) => {
        setThemeSettings(prev => ({ ...prev, [area]: { ...prev[area], [field]: value } }));
    };

    const handleGatewayChange = (gateway: 'stripe' | 'mercadoPago' | 'paypal', field: string, value: string | boolean) => {
        setPropertyInfo(prev => ({
            ...prev,
            paymentGatewaySettings: {
                ...prev.paymentGatewaySettings,
                [gateway]: { ...prev.paymentGatewaySettings[gateway], [field]: value }
            }
        }))
    }
    
     const handleContentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const keys = name.split('.');
        setSiteContent(prev => {
            const newContent = JSON.parse(JSON.stringify(prev));
            let current = newContent;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newContent;
        });
    };
    
    const handleWhyUsItemChange = (index: number, field: string, value: string) => {
        setSiteContent(prev => {
            const newItems = [...prev.whyUs.items];
            newItems[index] = { ...newItems[index], [field]: value };
            return { ...prev, whyUs: { ...prev.whyUs, items: newItems } };
        });
    };

    const addWhyUsItem = () => {
        setSiteContent(prev => ({
            ...prev,
            whyUs: {
                ...prev.whyUs,
                items: [...prev.whyUs.items, { icon: 'Sparkles', title: 'Novo Item', text: 'Descrição.' }]
            }
        }));
    };

    const removeWhyUsItem = (index: number) => {
        if (confirm('Tem certeza que deseja remover este item?')) {
            setSiteContent(prev => ({
                ...prev,
                whyUs: {
                    ...prev.whyUs,
                    items: prev.whyUs.items.filter((_, i) => i !== index)
                }
            }));
        }
    };

    const handleCmsChange = (index: number, field: keyof Facility, value: any) => {
        const newList = [...facilities];
        newList[index] = { ...newList[index], [field]: value };
        setFacilities(newList);
    };

    const handleCmsAdd = () => {
        const newItem: Facility = { id: `FAC${Date.now()}`, name: 'Nova Facilidade', icon: 'Sun', description: 'Descrição curta.', imageUrl: '', longDescription: 'Descrição detalhada.' };
        setFacilities([...facilities, newItem]);
    };

    const handleCmsDelete = (id: string) => {
        if (confirm("Tem certeza?")) setFacilities(facilities.filter(item => item.id !== id));
    };
    
     const handleListChange = (list: 'events' | 'tips', index: number, field: string, value: string) => {
        if(list === 'events') {
            const newEvents = [...events];
            (newEvents[index] as any)[field] = value;
            setEvents(newEvents);
        } else {
             const newTips = [...tips];
            (newTips[index] as any)[field] = value;
            setTips(newTips);
        }
    };

    const handleListAdd = (list: 'events' | 'tips') => {
        if(list === 'events') {
            const newItem: PropertyEvent = { id: `EVT${Date.now()}`, title: 'Novo Evento', description: '', date: '', time: '', imageUrl: '', icon: 'Calendar' };
            setEvents([...events, newItem]);
        } else {
            const newItem: LocalGuideTip = { id: `TIP${Date.now()}`, category: 'Restaurantes', title: 'Nova Dica', description: '', imageUrl: '', icon: 'MapPin' };
            setTips([...tips, newItem]);
        }
    };

    const handleListDelete = (list: 'events' | 'tips', id: string) => {
        if(confirm('Tem certeza?')) {
            if(list === 'events') setEvents(events.filter(i => i.id !== id));
            else setTips(tips.filter(i => i.id !== id));
        }
    };

    const renderInfoTab = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label>Nome da Propriedade</label><input name="name" value={propertyInfo.name} onChange={handlePropertyInfoChange} className="input-base"/></div>
                <div><label>Email de Contato</label><input type="email" name="email" value={propertyInfo.email} onChange={handlePropertyInfoChange} className="input-base"/></div>
                <div><label>Telefone</label><input name="phone" value={propertyInfo.phone} onChange={handlePropertyInfoChange} className="input-base"/></div>
                <div><label>CNPJ</label><input name="cnpj" value={propertyInfo.cnpj} onChange={handlePropertyInfoChange} className="input-base"/></div>
                <div className="md:col-span-2"><label>Endereço</label><input name="address" value={propertyInfo.address} onChange={handlePropertyInfoChange} className="input-base"/></div>
            </div>
        </div>
    );
    
    const renderPoliciesTab = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label>Horário de Check-in</label><input type="time" name="checkInTime" value={propertyInfo.checkInTime} onChange={handlePropertyInfoChange} className="input-base"/></div>
                <div><label>Horário de Check-out</label><input type="time" name="checkOutTime" value={propertyInfo.checkOutTime} onChange={handlePropertyInfoChange} className="input-base"/></div>
            </div>
             <div><label>Política de Cancelamento</label><textarea name="policies.cancellation" value={propertyInfo.policies.cancellation} onChange={handlePropertyInfoChange} className="input-base" rows={3}/></div>
             <div><label>Política de Pagamento</label><textarea name="policies.payment" value={propertyInfo.policies.payment} onChange={handlePropertyInfoChange} className="input-base" rows={3}/></div>
             <div><label>Política de Pets</label><textarea name="policies.pets" value={propertyInfo.policies.pets} onChange={handlePropertyInfoChange} className="input-base" rows={2}/></div>
             <div><label>Outras Regras da Casa (uma por linha)</label><textarea name="rules" value={propertyInfo.rules.join('\n')} onChange={handlePropertyInfoChange} className="input-base" rows={5}/></div>
        </div>
    );
    
    const renderPersonalizationTab = () => (
         <div className="space-y-4">
            <div>
                <label className="font-semibold flex items-center gap-2">Vibe do Hostel (Para IA) <Bot size={16} className="text-gray-500"/></label>
                <p className="text-xs text-gray-500 mb-1">Descreva a personalidade do seu hostel. A IA usará isso para ajustar o tom da comunicação.</p>
                <textarea name="hostelVibe" value={propertyInfo.hostelVibe} onChange={handlePropertyInfoChange} className="input-base" rows={4} placeholder="Ex: Jovem, festeiro, focado em surf e música..."/>
            </div>
            <details className="bg-white p-3 rounded-lg border" open>
                <summary className="font-semibold cursor-pointer">Site Público</summary>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-3">
                    <div><label className="text-xs">Cor Primária</label><input type="color" value={themeSettings.publicSite.primaryColor} onChange={e => handleThemeChange('publicSite', 'primaryColor', e.target.value)} className="w-full h-10 p-1 border rounded-md"/></div>
                    <div><label className="text-xs">Cor do Fundo</label><input type="color" value={themeSettings.publicSite.backgroundColor} onChange={e => handleThemeChange('publicSite', 'backgroundColor', e.target.value)} className="w-full h-10 p-1 border rounded-md"/></div>
                    <div><label className="text-xs">Cor do Texto</label><input type="color" value={themeSettings.publicSite.textColor} onChange={e => handleThemeChange('publicSite', 'textColor', e.target.value)} className="w-full h-10 p-1 border rounded-md"/></div>
                    <div><label className="text-xs">Cor dos Cards</label><input type="color" value={themeSettings.publicSite.cardBackgroundColor} onChange={e => handleThemeChange('publicSite', 'cardBackgroundColor', e.target.value)} className="w-full h-10 p-1 border rounded-md"/></div>
                    <div className="col-span-2"><label className="text-xs">URL do Logo</label><input value={themeSettings.publicSite.logoUrl} onChange={e => handleThemeChange('publicSite', 'logoUrl', e.target.value)} className="input-base"/></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                    <div>
                        <label className="text-xs">Bordas dos Cards: {themeSettings.publicSite.cardBorderRadius}</label>
                        <input type="range" min="0" max="32" value={parseInt(themeSettings.publicSite.cardBorderRadius)} onChange={e => handleThemeChange('publicSite', 'cardBorderRadius', `${e.target.value}px`)} className="w-full"/>
                    </div>
                    <div>
                        <label className="text-xs">Bordas dos Botões: {themeSettings.publicSite.buttonBorderRadius}</label>
                        <input type="range" min="0" max="32" value={parseInt(themeSettings.publicSite.buttonBorderRadius)} onChange={e => handleThemeChange('publicSite', 'buttonBorderRadius', `${e.target.value}px`)} className="w-full"/>
                    </div>
                </div>
            </details>
             <details className="bg-white p-3 rounded-lg border">
                <summary className="font-semibold cursor-pointer">Painel Administrativo</summary>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-3">
                    <div><label className="text-xs">Cor Primária</label><input type="color" value={themeSettings.adminPanel.primaryColor} onChange={e => handleThemeChange('adminPanel', 'primaryColor', e.target.value)} className="w-full h-10 p-1 border rounded-md"/></div>
                    <div><label className="text-xs">Cor da Sidebar</label><input type="color" value={themeSettings.adminPanel.sidebarColor} onChange={e => handleThemeChange('adminPanel', 'sidebarColor', e.target.value)} className="w-full h-10 p-1 border rounded-md"/></div>
                    <div><label className="text-xs">Cor do Fundo</label><input type="color" value={themeSettings.adminPanel.backgroundColor} onChange={e => handleThemeChange('adminPanel', 'backgroundColor', e.target.value)} className="w-full h-10 p-1 border rounded-md"/></div>
                    <div><label className="text-xs">Cor do Texto</label><input type="color" value={themeSettings.adminPanel.textColor} onChange={e => handleThemeChange('adminPanel', 'textColor', e.target.value)} className="w-full h-10 p-1 border rounded-md"/></div>
                    <div><label className="text-xs">Cor Texto Menu</label><input type="color" value={themeSettings.adminPanel.menuTextColor} onChange={e => handleThemeChange('adminPanel', 'menuTextColor', e.target.value)} className="w-full h-10 p-1 border rounded-md"/></div>
                    <div className="col-span-2 md:col-span-1"><label className="text-xs">URL do Logo (Sidebar)</label><input value={themeSettings.adminPanel.logoUrl} onChange={e => handleThemeChange('adminPanel', 'logoUrl', e.target.value)} className="input-base"/></div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                    <div>
                        <label className="text-xs">Bordas dos Cards: {themeSettings.adminPanel.cardBorderRadius}</label>
                        <input type="range" min="0" max="32" value={parseInt(themeSettings.adminPanel.cardBorderRadius)} onChange={e => handleThemeChange('adminPanel', 'cardBorderRadius', `${e.target.value}px`)} className="w-full"/>
                    </div>
                    <div>
                        <label className="text-xs">Bordas dos Botões: {themeSettings.adminPanel.buttonBorderRadius}</label>
                        <input type="range" min="0" max="32" value={parseInt(themeSettings.adminPanel.buttonBorderRadius)} onChange={e => handleThemeChange('adminPanel', 'buttonBorderRadius', `${e.target.value}px`)} className="w-full"/>
                    </div>
                </div>
            </details>
             <details className="bg-white p-3 rounded-lg border">
                <summary className="font-semibold cursor-pointer">Portal do Hóspede</summary>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3">
                    <div><label className="text-xs">Cor Primária</label><input type="color" value={themeSettings.guestPortal.primaryColor} onChange={e => handleThemeChange('guestPortal', 'primaryColor', e.target.value)} className="w-full h-10 p-1 border rounded-md"/></div>
                    <div><label className="text-xs">Cor do Fundo</label><input type="color" value={themeSettings.guestPortal.backgroundColor} onChange={e => handleThemeChange('guestPortal', 'backgroundColor', e.target.value)} className="w-full h-10 p-1 border rounded-md"/></div>
                    <div><label className="text-xs">Cor dos Cards</label><input type="color" value={themeSettings.guestPortal.cardColor} onChange={e => handleThemeChange('guestPortal', 'cardColor', e.target.value)} className="w-full h-10 p-1 border rounded-md"/></div>
                    <div><label className="text-xs">Cor do Texto</label><input type="color" value={themeSettings.guestPortal.textColor} onChange={e => handleThemeChange('guestPortal', 'textColor', e.target.value)} className="w-full h-10 p-1 border rounded-md"/></div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                    <div>
                        <label className="text-xs">Bordas dos Cards: {themeSettings.guestPortal.cardBorderRadius}</label>
                        <input type="range" min="0" max="32" value={parseInt(themeSettings.guestPortal.cardBorderRadius)} onChange={e => handleThemeChange('guestPortal', 'cardBorderRadius', `${e.target.value}px`)} className="w-full"/>
                    </div>
                    <div>
                        <label className="text-xs">Bordas dos Botões: {themeSettings.guestPortal.buttonBorderRadius}</label>
                        <input type="range" min="0" max="32" value={parseInt(themeSettings.guestPortal.buttonBorderRadius)} onChange={e => handleThemeChange('guestPortal', 'buttonBorderRadius', `${e.target.value}px`)} className="w-full"/>
                    </div>
                </div>
            </details>
        </div>
    );
    
    const renderCmsTab = () => (
        <div className="space-y-6">
             <details className="bg-white p-3 rounded-lg border" open>
                <summary className="font-semibold cursor-pointer">Seção "Por que nos amar?"</summary>
                <div className="space-y-3 pt-4">
                    <input name="whyUs.title" value={siteContent.whyUs.title} onChange={handleContentChange} className="input-base font-bold"/>
                    <textarea name="whyUs.subtitle" value={siteContent.whyUs.subtitle} onChange={handleContentChange} className="input-base" rows={2}/>
                    {siteContent.whyUs.items.map((item, index) => (
                        <div key={index} className="pl-4 border-l-2 ml-1 space-y-2 py-2 relative">
                             <button type="button" onClick={() => removeWhyUsItem(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><Trash2 size={14}/></button>
                             <div className="grid grid-cols-2 gap-4">
                                <input value={item.title} onChange={e => handleWhyUsItemChange(index, 'title', e.target.value)} className="input-base"/>
                                <select value={item.icon} onChange={e => handleWhyUsItemChange(index, 'icon', e.target.value)} className="input-base">
                                    {iconNames.map(iconName => <option key={iconName} value={iconName}>{iconName}</option>)}
                                </select>
                            </div>
                            <textarea value={item.text} onChange={e => handleWhyUsItemChange(index, 'text', e.target.value)} className="input-base" rows={2}/>
                        </div>
                    ))}
                     <button type="button" onClick={addWhyUsItem} className="text-sm text-brand-green font-semibold mt-2 flex items-center gap-2 hover:underline"><PlusCircle size={16} /> Adicionar Item</button>
                </div>
            </details>
            <details className="bg-white p-3 rounded-lg border">
                <summary className="font-semibold cursor-pointer">Facilidades</summary>
                <div className="space-y-4 pt-4">
                    {facilities.map((fac, index) => (
                        <div key={fac.id} className="p-3 bg-gray-50 rounded-md border space-y-2">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                <p className="font-semibold text-gray-800">Item: {fac.name}</p>
                                <button onClick={() => handleCmsDelete(fac.id)} className="self-end sm:self-auto"><Trash2 size={16} className="text-red-500 hover:text-red-700"/></button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div><label className="text-xs">Nome</label><input value={fac.name} onChange={e => handleCmsChange(index, 'name', e.target.value)} className="input-base"/></div>
                                <div><label className="text-xs">Ícone</label><select value={fac.icon} onChange={e => handleCmsChange(index, 'icon', e.target.value)} className="input-base w-auto">{iconNames.map(name => <option key={name} value={name}>{name}</option>)}</select></div>
                            </div>
                            <div><label className="text-xs">URL da Imagem</label><input value={fac.imageUrl} onChange={e => handleCmsChange(index, 'imageUrl', e.target.value)} placeholder="https://..." className="input-base"/></div>
                            <div><label className="text-xs">Descrição Curta</label><textarea value={fac.description} onChange={e => handleCmsChange(index, 'description', e.target.value)} className="input-base" rows={2}/></div>
                            <div><label className="text-xs">Descrição Detalhada</label><textarea value={fac.longDescription} onChange={e => handleCmsChange(index, 'longDescription', e.target.value)} className="input-base" rows={3}/></div>
                        </div>
                    ))}
                     <button onClick={handleCmsAdd} className="text-sm text-brand-green font-semibold mt-4 flex items-center gap-2 hover:underline"><PlusCircle size={16} /> Adicionar Facilidade</button>
                </div>
            </details>
        </div>
    );
    
    const renderConnectionsTab = () => (
        <div className="space-y-6">
            <div>
                <h3 className="font-semibold mb-2">Links de Redes Sociais</h3>
                <div className="space-y-2">
                    <div className="flex items-center gap-2"><Instagram size={16}/><input name="socialLinks.instagram" value={propertyInfo.socialLinks?.instagram || ''} onChange={handlePropertyInfoChange} className="input-base" placeholder="https://instagram.com/seu_hostel"/></div>
                    <div className="flex items-center gap-2"><Facebook size={16}/><input name="socialLinks.facebook" value={propertyInfo.socialLinks?.facebook || ''} onChange={handlePropertyInfoChange} className="input-base" placeholder="https://facebook.com/seu_hostel"/></div>
                    <div className="flex items-center gap-2"><Twitter size={16}/><input name="socialLinks.twitter" value={propertyInfo.socialLinks?.twitter || ''} onChange={handlePropertyInfoChange} className="input-base" placeholder="https://twitter.com/seu_hostel"/></div>
                </div>
            </div>
            <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Gateways de Pagamento</h3>
                <p className="text-xs text-gray-500 mb-4">Conecte seus provedores para aceitar pagamentos online no site e no PDV.</p>
                <div className="space-y-4">
                    <GatewayCard gateway="paypal" name="PayPal" icon={CreditCard} settings={propertyInfo.paymentGatewaySettings.paypal} onToggle={(g, v) => handleGatewayChange(g, 'connected', v)} onTest={handleTestConnection} status={connectionStatus.paypal || 'idle'}>
                        <div><label className="text-sm font-medium">Email da Conta PayPal</label><input value={propertyInfo.paymentGatewaySettings.paypal.email} onChange={e => handleGatewayChange('paypal', 'email', e.target.value)} className="input-base mt-1"/></div>
                    </GatewayCard>
                    <GatewayCard gateway="stripe" name="Stripe" icon={CreditCard} settings={propertyInfo.paymentGatewaySettings.stripe} onToggle={(g, v) => handleGatewayChange(g, 'connected', v)} onTest={handleTestConnection} status={connectionStatus.stripe || 'idle'}>
                        <div><label className="text-sm font-medium">Chave Pública (Publishable Key)</label><input value={propertyInfo.paymentGatewaySettings.stripe.publicKey} onChange={e => handleGatewayChange('stripe', 'publicKey', e.target.value)} className="input-base mt-1"/></div>
                        <div><label className="text-sm font-medium">Chave Secreta (Secret Key)</label><input type="password" value={propertyInfo.paymentGatewaySettings.stripe.secretKey} onChange={e => handleGatewayChange('stripe', 'secretKey', e.target.value)} className="input-base mt-1"/></div>
                    </GatewayCard>
                    <GatewayCard gateway="mercadoPago" name="Mercado Pago" icon={CreditCard} settings={propertyInfo.paymentGatewaySettings.mercadoPago} onToggle={(g, v) => handleGatewayChange(g, 'connected', v)} onTest={handleTestConnection} status={connectionStatus.mercadoPago || 'idle'}>
                         <div><label className="text-sm font-medium">Chave Pública (Public Key)</label><input value={propertyInfo.paymentGatewaySettings.mercadoPago.publicKey} onChange={e => handleGatewayChange('mercadoPago', 'publicKey', e.target.value)} className="input-base mt-1"/></div>
                        <div><label className="text-sm font-medium">Token de Acesso (Access Token)</label><input type="password" value={propertyInfo.paymentGatewaySettings.mercadoPago.accessToken} onChange={e => handleGatewayChange('mercadoPago', 'accessToken', e.target.value)} className="input-base mt-1"/></div>
                    </GatewayCard>
                </div>
            </div>
        </div>
    );

    // Create a temporary DB state for the preview that reflects the user's edits
    const previewDbState = useMemo(() => ({
        ...db,
        siteContent: { ...siteContent, facilities },
        themeSettings,
        propertyEvents: events,
        localGuideTips: tips,
        properties: db.properties.map(p => p.id === db.currentPropertyId ? propertyInfo : p)
    }), [db, siteContent, facilities, themeSettings, events, tips, propertyInfo]);

    const tabs: { id: Tab, label: string, icon: React.ElementType }[] = [
        { id: 'info', label: 'Geral', icon: Info },
        { id: 'policies', label: 'Políticas', icon: FileText },
        { id: 'personalization', label: 'Personalização', icon: Brush },
        { id: 'cms', label: 'Conteúdo', icon: MenuSquare },
        { id: 'connections', label: 'Conexões', icon: LinkIcon },
    ];
    
    return (
        <Section title="Configurações da Propriedade" icon={Settings}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[80vh]">
                <div className="lg:col-span-1 bg-gray-50 p-4 rounded-xl border overflow-y-auto">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 sticky top-0 bg-gray-50 py-2 z-10">
                        <h3 className="text-lg font-bold">Editor de Configurações</h3>
                        <button onClick={handleSaveAll} disabled={isSaving} className="bg-brand-green text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto">
                            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={16} />} Salvar Alterações
                        </button>
                    </div>
                    <div className="flex border-b mb-4 overflow-x-auto hide-scrollbar sm:flex-wrap">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-3 py-2 text-sm font-semibold flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === tab.id ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500 hover:text-brand-dark'}`}>
                                <tab.icon size={16}/> {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="p-2">
                        {activeTab === 'info' && renderInfoTab()}
                        {activeTab === 'policies' && renderPoliciesTab()}
                        {activeTab === 'personalization' && renderPersonalizationTab()}
                        {activeTab === 'cms' && renderCmsTab()}
                        {activeTab === 'connections' && renderConnectionsTab()}
                    </div>
                </div>

                <div className="lg:col-span-1 bg-white rounded-xl border p-2">
                     <h3 className="text-center font-semibold text-gray-500 text-sm p-2">Pré-visualização do Site Público</h3>
                    <div className="w-full h-full overflow-hidden relative">
                         <div className="w-full h-full absolute inset-0 transform scale-[0.9] origin-top-left overflow-y-auto rounded-lg border">
                             <PublicView 
                                db={previewDbState}
                                setPage={() => {}}
                                chatData={props.chatData}
                                onStartChat={async () => ({} as any)}
                                onSendMessage={async () => ({} as any)}
                            />
                         </div>
                    </div>
                </div>
            </div>
        </Section>
    );
};