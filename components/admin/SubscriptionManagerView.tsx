import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PropertyInfo, DBState, SubscriptionPlan, AdminSection } from '../../types';
import { Section } from './shared';
import Modal from './Modal';
import { TrendingUp, Users, DollarSign, BarChart2, Edit, Save, PlusCircle, Trash2, Loader2, Badge, Check, ShieldCheck, BadgeCheck, BadgeAlert, BadgeX } from 'lucide-react';

const allAdminSectionsForCheckboxes: { id: AdminSection; label: string }[] = [
    // Operações
    { id: 'dashboard', label: 'Dashboard' }, { id: 'calendar', label: 'Calendário' }, { id: 'rooms', label: 'Quartos' },
    { id: 'bookings', label: 'Reservas' }, { id: 'guests', label: 'Hóspedes' }, { id: 'housekeeping', label: 'Governança' },
    { id: 'pos', label: 'Ponto de Venda' }, { id: 'omni_channel', label: 'Atendimento' },
    // Gestão
    { id: 'staff', label: 'Equipe' }, { id: 'projects', label: 'Projetos' }, { id: 'financial_manager', label: 'Financeiro' },
    { id: 'inventory', label: 'Estoque' }, { id: 'shopping_list', label: 'Lista de Compras' }, { id: 'reports', label: 'Relatórios' },
    { id: 'internal_chat', label: 'Chat Interno' }, { id: 'rate_manager', label: 'Gerenciador de Tarifas' },
    { id: 'channel_manager', label: 'Channel Manager' },
    // Marketing
    { id: 'social_media', label: 'Mídias Sociais' }, { id: 'ad_campaign_manager', label: 'Anúncios' },
    // Módulos IA
    { id: 'synapse_agent', label: 'SYNAPSE Agent' }, { id: 'management_center', label: 'Comando Central' },
    { id: 'ai_strategy_consultant', label: 'Consultor IA' }, { id: 'team_manager_ai', label: 'Gestor de Equipe IA' },
    { id: 'creative_studio', label: 'Estúdio Criativo' },
    { id: 'ai_marketing_lab', label: 'Lab de Marketing IA' }, { id: 'ai_engagement_agent', label: 'Agente de Engajamento' },
    { id: 'marketing_orchestrator', label: 'Orquestrador de Mkt' }, { id: 'guest_journey_ai', label: 'Jornada do Cliente IA' },
    // Configurações
    { id: 'property_settings', label: 'Configurações da Propriedade' }, { id: 'my_subscription', label: 'Minha Assinatura' },
];

const KPICard: React.FC<{ title: string, value: string | number, icon: React.ElementType, prefix?: string, suffix?: string }> = ({ title, value, icon: Icon, prefix = '', suffix = '' }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center border">
        <div className="bg-brand-green/10 p-3 rounded-full mr-4"><Icon className="text-brand-green" size={24} /></div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{prefix}{value}{suffix}</p>
        </div>
    </div>
);

interface SubscriptionManagerViewProps {
    db: DBState;
    onUpdateProperty: (propertyData: PropertyInfo) => Promise<void>;
    onSaveSubscriptionPlan: (plan: Omit<SubscriptionPlan, 'id'> | SubscriptionPlan) => Promise<void>;
    onDeleteSubscriptionPlan: (planId: string) => Promise<void>;
}

const SubscriptionManagerView: React.FC<SubscriptionManagerViewProps> = ({ db, onUpdateProperty, onSaveSubscriptionPlan, onDeleteSubscriptionPlan }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'plans' | 'customers'>('dashboard');
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Omit<SubscriptionPlan, 'id'> | SubscriptionPlan | null>(null);
    const [isSavingPlan, setIsSavingPlan] = useState(false);

    const saasMetrics = useMemo(() => {
        const activeSubscriptions = db.properties.filter(p => p.subscriptionStatus === 'Ativa');
        const mrr = activeSubscriptions.reduce((sum, p) => {
            const plan = db.subscriptionPlans.find(sp => sp.id === p.planId);
            return sum + (plan?.price || 0);
        }, 0);
        const arpa = activeSubscriptions.length > 0 ? mrr / activeSubscriptions.length : 0;
        const mrrGrowth = [
            { name: 'Jan', MRR: 4000 }, { name: 'Fev', MRR: 3000 }, { name: 'Mar', MRR: 5000 },
            { name: 'Abr', MRR: 4500 }, { name: 'Mai', MRR: 6000 }, { name: 'Jun', MRR: mrr },
        ];
        return { mrr, activeSubscriptionsCount: activeSubscriptions.length, arpa, mrrGrowth };
    }, [db.properties, db.subscriptionPlans]);
    
    const handleOpenPlanModal = (plan: SubscriptionPlan | null) => {
        setEditingPlan(plan || { name: '', price: 0, description: '', features: ['dashboard'] });
        setIsPlanModalOpen(true);
    };

    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPlan) return;
        setIsSavingPlan(true);
        await onSaveSubscriptionPlan(editingPlan);
        setIsSavingPlan(false);
        setIsPlanModalOpen(false);
    };

    const handlePlanInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!editingPlan) return;
        const { name, value } = e.target;
        setEditingPlan({ ...editingPlan, [name]: name === 'price' ? Number(value) : value });
    };

    const handleFeatureToggle = (featureId: AdminSection) => {
        if (!editingPlan) return;
        const currentFeatures = editingPlan.features;
        const newFeatures = currentFeatures.includes(featureId)
            ? currentFeatures.filter(f => f !== featureId)
            : [...currentFeatures, featureId];
        setEditingPlan({ ...editingPlan, features: newFeatures });
    };

    const DashboardTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard title="Receita Mensal (MRR)" value={saasMetrics.mrr.toFixed(2)} prefix="R$ " icon={DollarSign} />
                <KPICard title="Assinaturas Ativas" value={saasMetrics.activeSubscriptionsCount} icon={Users} />
                <KPICard title="Receita Média (ARPA)" value={saasMetrics.arpa.toFixed(2)} prefix="R$ " icon={TrendingUp} />
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border h-full">
                <h3 className="text-md font-semibold text-gray-700 mb-4">Crescimento do MRR (Últimos 6 meses)</h3>
                <div style={{ width: '100%', height: '300px' }}>
                    <ResponsiveContainer>
                        <BarChart data={saasMetrics.mrrGrowth}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(val) => `R$${val / 1000}k`} />
                            <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                            <Bar dataKey="MRR" fill="#4CAF50" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
    
    const CustomersTab = () => {
        const statusConfig = {
            'Ativa': { icon: BadgeCheck, color: 'text-green-600', bg: 'bg-green-100' },
            'Atrasada': { icon: BadgeAlert, color: 'text-yellow-600', bg: 'bg-yellow-100' },
            'Cancelada': { icon: BadgeX, color: 'text-red-600', bg: 'bg-red-100' },
        };
        return (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                 <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Propriedade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plano</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contato</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {db.properties.map((property) => {
                            const plan = db.subscriptionPlans.find(p => p.id === property.planId);
                            const status = statusConfig[property.subscriptionStatus];
                            return (
                                <tr key={property.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{property.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan?.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`font-semibold px-2 py-1 rounded-full flex items-center gap-1 w-fit ${status.bg} ${status.color}`}>
                                            <status.icon size={14}/> {property.subscriptionStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{property.email}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }
    
    const PlansTab = () => (
        <div className="space-y-4">
             <div className="text-right">
                <button onClick={() => handleOpenPlanModal(null)} className="bg-brand-green text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-brand-green-dark flex items-center gap-2">
                    <PlusCircle size={18} /> Novo Plano
                </button>
            </div>
             {db.subscriptionPlans.map(plan => (
                <div key={plan.id} className="bg-white p-4 rounded-lg border">
                     <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-bold text-xl text-brand-dark">{plan.name} - <span className="text-brand-green">R$ {plan.price}/mês</span></h4>
                            <p className="text-sm text-gray-600">{plan.description}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleOpenPlanModal(plan)} className="text-blue-600 hover:text-blue-900"><Edit size={16}/></button>
                            <button onClick={() => onDeleteSubscriptionPlan(plan.id)} className="text-red-600 hover:text-red-900"><Trash2 size={16}/></button>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                        <h5 className="font-semibold text-sm mb-2">Funcionalidades Inclusas:</h5>
                        <div className="flex flex-wrap gap-2">
                            {plan.features.map(feature => (
                                <span key={feature} className="text-xs font-medium bg-gray-100 text-gray-800 px-2 py-1 rounded-full flex items-center gap-1">
                                    <Check size={12} className="text-green-600"/> {allAdminSectionsForCheckboxes.find(s => s.id === feature)?.label || feature}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
             ))}
        </div>
    );

    return (
        <Section title="Gestão de Assinaturas" icon={ShieldCheck}>
             <div className="flex overflow-x-auto border-b mb-6 hide-scrollbar flex-nowrap sm:flex-wrap">
                <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 whitespace-nowrap text-sm font-semibold ${activeTab === 'dashboard' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500'}`}>Dashboard</button>
                <button onClick={() => setActiveTab('plans')} className={`px-4 py-2 whitespace-nowrap text-sm font-semibold ${activeTab === 'plans' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500'}`}>Planos</button>
                <button onClick={() => setActiveTab('customers')} className={`px-4 py-2 whitespace-nowrap text-sm font-semibold ${activeTab === 'customers' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500'}`}>Clientes</button>
            </div>
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'plans' && <PlansTab />}
            {activeTab === 'customers' && <CustomersTab />}
            
            <Modal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} title={editingPlan && 'id' in editingPlan ? 'Editar Plano' : 'Novo Plano de Assinatura'}>
                {editingPlan && (
                    <form onSubmit={handleSavePlan} className="space-y-4">
                        <div><label>Nome do Plano:</label><input name="name" value={editingPlan.name} onChange={handlePlanInputChange} className="input-base" required /></div>
                        <div><label>Descrição:</label><textarea name="description" value={editingPlan.description} onChange={handlePlanInputChange} className="input-base" rows={2}/></div>
                        <div><label>Preço Mensal (R$):</label><input type="number" name="price" value={editingPlan.price} onChange={handlePlanInputChange} className="input-base" required /></div>
                        <div>
                            <label className="font-semibold mb-2 block">Funcionalidades Inclusas:</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                                {allAdminSectionsForCheckboxes.map(feature => (
                                    <label key={feature.id} className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={editingPlan.features.includes(feature.id)}
                                            onChange={() => handleFeatureToggle(feature.id)}
                                        />
                                        {feature.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                         <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setIsPlanModalOpen(false)} className="bg-gray-200 py-2 px-4 rounded-lg">Cancelar</button><button type="submit" className="bg-brand-green text-white py-2 px-4 rounded-lg flex items-center gap-2">{isSavingPlan ? <Loader2 className="animate-spin" /> : <Save size={16}/>} Salvar Plano</button></div>
                    </form>
                )}
            </Modal>
        </Section>
    );
};

export default SubscriptionManagerView;