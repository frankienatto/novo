import React, { useState } from 'react';
import { PropertyInfo, DBState, SubscriptionPlan } from '../../types';
import { Section } from './shared';
import Modal from './Modal';
import { Building, PlusCircle, Edit, Loader2, Save, Trash2, Badge } from 'lucide-react';

interface SaaSAdminViewProps {
    db: DBState;
    onAddProperty: (propertyData: Omit<PropertyInfo, 'id'>) => Promise<void>;
    onUpdateProperty: (propertyData: PropertyInfo) => Promise<void>;
}

const SaaSAdminView: React.FC<SaaSAdminViewProps> = ({ db, onAddProperty, onUpdateProperty }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState<Omit<PropertyInfo, 'id'> | PropertyInfo | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleOpenModal = (property: PropertyInfo | null = null) => {
        setEditingProperty(property || {
            name: '',
            address: '',
            cnpj: '',
            phone: '',
            email: '',
            checkInTime: '14:00',
            checkOutTime: '11:00',
            wifiNetwork: '',
            wifiPass: '',
            rules: [],
            planId: db.subscriptionPlans[0]?.id || '', // Default to the first plan
            subscriptionStatus: 'Ativa',
            paymentGatewaySettings: {
                stripe: { connected: false, publicKey: '', secretKey: '' },
                mercadoPago: { connected: false, publicKey: '', accessToken: '' },
                paypal: { connected: false, email: '' },
            },
            currency: 'BRL',
            localTaxRate: 0,
            policies: {
                cancellation: '',
                payment: '',
                pets: '',
            },
            hostelVibe: '',
            socialLinks: {},
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProperty(null);
    };

    const handleSaveProperty = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProperty) return;

        setIsSaving(true);
        try {
            if ('id' in editingProperty) {
                await onUpdateProperty(editingProperty);
            } else {
                await onAddProperty(editingProperty as Omit<PropertyInfo, 'id'>);
            }
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save property", error);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!editingProperty) return;
        setEditingProperty({ ...editingProperty, [e.target.name]: e.target.value });
    };

    return (
        <Section title="Gerenciamento de Clientes SaaS" icon={Building} actions={
            <button onClick={() => handleOpenModal(null)} className="bg-brand-green text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-brand-green-dark flex items-center gap-2">
                <PlusCircle size={18} /> Adicionar Propriedade
            </button>
        }>
            <p className="text-sm text-gray-600 mb-6">
                Gerencie todas as propriedades (seus clientes) cadastradas na plataforma.
            </p>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                 <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome da Propriedade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plano de Assinatura</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email de Contato</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {db.properties.map((property) => {
                            const plan = db.subscriptionPlans.find(p => p.id === property.planId);
                            return (
                                <tr key={property.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{property.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1 w-fit">
                                            <Badge size={14}/> {plan?.name || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{property.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => handleOpenModal(property)} className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                                            <Edit size={14}/> Editar
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingProperty && 'id' in editingProperty ? 'Editar Propriedade' : 'Adicionar Propriedade'} size="xl">
                {editingProperty && (
                    <form onSubmit={handleSaveProperty} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label>Nome:</label><input name="name" value={editingProperty.name} onChange={handleInputChange} className="input-base" required /></div>
                            <div>
                                <label>Plano de Assinatura:</label>
                                <select name="planId" value={editingProperty.planId} onChange={handleInputChange} className="input-base" required>
                                    {db.subscriptionPlans.map(plan => (
                                        <option key={plan.id} value={plan.id}>{plan.name} (R$ {plan.price}/mês)</option>
                                    ))}
                                </select>
                            </div>
                             <div>
                                <label>Status da Assinatura:</label>
                                <select name="subscriptionStatus" value={editingProperty.subscriptionStatus} onChange={handleInputChange} className="input-base" required>
                                    <option value="Ativa">Ativa</option>
                                    <option value="Atrasada">Atrasada</option>
                                    <option value="Cancelada">Cancelada</option>
                                </select>
                            </div>
                            <div><label>Email:</label><input type="email" name="email" value={editingProperty.email} onChange={handleInputChange} className="input-base" required /></div>
                            <div><label>Telefone:</label><input name="phone" value={editingProperty.phone} onChange={handleInputChange} className="input-base" /></div>
                            <div><label>CNPJ:</label><input name="cnpj" value={editingProperty.cnpj} onChange={handleInputChange} className="input-base" /></div>
                            <div className="md:col-span-3"><label>Endereço:</label><input name="address" value={editingProperty.address} onChange={handleInputChange} className="input-base" /></div>
                            <div><label>Horário Check-in:</label><input type="time" name="checkInTime" value={editingProperty.checkInTime} onChange={handleInputChange} className="input-base" /></div>
                            <div><label>Horário Check-out:</label><input type="time" name="checkOutTime" value={editingProperty.checkOutTime} onChange={handleInputChange} className="input-base" /></div>
                            <div><label>Rede Wi-Fi:</label><input name="wifiNetwork" value={editingProperty.wifiNetwork} onChange={handleInputChange} className="input-base" /></div>
                            <div className="md:col-span-2"><label>Senha Wi-Fi:</label><input name="wifiPass" value={editingProperty.wifiPass} onChange={handleInputChange} className="input-base" /></div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={handleCloseModal} className="bg-gray-200 py-2 px-4 rounded-lg">Cancelar</button>
                            <button type="submit" className="bg-brand-green text-white py-2 px-4 rounded-lg flex items-center gap-2">
                                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={16}/>} Salvar
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </Section>
    );
};

export default SaaSAdminView;