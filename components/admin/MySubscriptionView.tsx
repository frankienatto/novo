import React, { useState, useMemo } from 'react';
import { DBState, SubscriptionPlan } from '../../types';
import { Section } from './shared';
import { CreditCard, CheckCircle, ArrowUpCircle, Star, FileText, Loader2 } from 'lucide-react';

interface MySubscriptionViewProps {
    db: DBState;
    onChangeSubscriptionPlan: (propertyId: string, newPlanId: string) => Promise<void>;
}

const MySubscriptionView: React.FC<MySubscriptionViewProps> = ({ db, onChangeSubscriptionPlan }) => {
    const [activeTab, setActiveTab] = useState<'plan' | 'billing'>('plan');
    const [isLoading, setIsLoading] = useState<string | null>(null);
    
    const activeProperty = useMemo(() => db.properties.find(p => p.id === db.currentPropertyId)!, [db.properties, db.currentPropertyId]);
    const currentPlan = useMemo(() => db.subscriptionPlans.find(p => p.id === activeProperty.planId)!, [db.subscriptionPlans, activeProperty.planId]);
    const otherPlans = useMemo(() => db.subscriptionPlans.filter(p => p.id !== activeProperty.planId), [db.subscriptionPlans, activeProperty.planId]);

    const handlePlanChange = async (newPlanId: string) => {
        setIsLoading(newPlanId);
        await onChangeSubscriptionPlan(activeProperty.id, newPlanId);
        setIsLoading(null);
    };

    // Dummy data for billing history
    const billingHistory = [
        { id: 'INV001', date: '01/07/2024', plan: 'Profissional', amount: 599.00, status: 'Pago' },
        { id: 'INV002', date: '01/06/2024', plan: 'Profissional', amount: 599.00, status: 'Pago' },
        { id: 'INV003', date: '01/05/2024', plan: 'Básico', amount: 299.00, status: 'Pago' },
    ];

    const PlanCard: React.FC<{ plan: SubscriptionPlan, isCurrent?: boolean }> = ({ plan, isCurrent = false }) => {
        const isUpgrade = !isCurrent && plan.price > (currentPlan.price || 0);
        
        return (
            <div className={`p-6 rounded-lg border-2 flex flex-col ${isCurrent ? 'border-brand-green bg-green-50' : 'bg-white'}`}>
                <h3 className="text-xl font-bold text-brand-dark">{plan.name}</h3>
                <p className="text-3xl font-extrabold text-brand-dark my-4">R$ {plan.price}<span className="text-sm font-normal text-gray-500">/mês</span></p>
                <p className="text-sm text-gray-600 mb-4 flex-grow">{plan.description}</p>
                <ul className="space-y-2 text-sm mb-6">
                    {plan.features.slice(0, 5).map(feature => (
                        <li key={feature} className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-brand-green" />
                            <span>{feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </li>
                    ))}
                    {plan.features.length > 5 && <li className="text-gray-500">e mais...</li>}
                </ul>
                
                {isCurrent ? (
                    <div className="mt-auto text-center font-bold text-brand-green border-2 border-brand-green py-2 rounded-lg">
                        Seu Plano Atual
                    </div>
                ) : (
                    <button 
                        onClick={() => handlePlanChange(plan.id)}
                        disabled={!!isLoading}
                        className={`mt-auto font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${isUpgrade ? 'bg-brand-green text-white hover:bg-brand-green-dark' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                    >
                        {isLoading === plan.id ? <Loader2 className="animate-spin" /> : (isUpgrade ? <><ArrowUpCircle size={18}/> Fazer Upgrade</> : 'Fazer Downgrade')}
                    </button>
                )}
            </div>
        );
    };

    const PlanTab = () => (
        <div>
            <h2 className="text-2xl font-bold text-brand-dark mb-6">Compare os Planos</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PlanCard plan={currentPlan} isCurrent={true} />
                {otherPlans.map(plan => <PlanCard key={plan.id} plan={plan} />)}
            </div>
        </div>
    );
    
    const BillingTab = () => (
         <div>
            <h2 className="text-2xl font-bold text-brand-dark mb-6">Histórico de Faturamento</h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                 <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plano</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {billingHistory.map((invoice) => (
                        <tr key={invoice.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.plan}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className="font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">
                                    {invoice.status}
                                </span>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <Section title="Minha Assinatura" icon={CreditCard}>
            <div className="flex border-b mb-6">
                <button onClick={() => setActiveTab('plan')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'plan' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500'}`}>Meu Plano</button>
                <button onClick={() => setActiveTab('billing')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'billing' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500'}`}>Faturamento</button>
            </div>
            
            {activeTab === 'plan' && <PlanTab />}
            {activeTab === 'billing' && <BillingTab />}

        </Section>
    );
};

export default MySubscriptionView;