

import React, { useState, useEffect } from 'react';
import { DBState, PartnerService, ServiceBooking } from '../../types';
import { Section } from './shared';
import Modal from './Modal';
import { PlusCircle, Edit, Trash2, Loader2, Save, DollarSign, Tag, Users, Percent } from 'lucide-react';

interface PartnerServicesViewProps {
    db: DBState;
    onSaveService: (service: Omit<PartnerService, 'id'> | PartnerService) => Promise<void>;
    onDeleteService: (serviceId: string) => Promise<void>;
    onUpdateBookingStatus: (bookingId: string, status: ServiceBooking['status']) => Promise<void>;
}

const PartnerServiceModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (service: Omit<PartnerService, 'id'> | PartnerService) => Promise<void>;
    service: Omit<PartnerService, 'id'> | PartnerService | null;
}> = ({ isOpen, onClose, onSave, service }) => {
    const [formData, setFormData] = useState(service);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData(service);
    }, [service]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['totalPrice', 'commissionValue'].includes(name);
        setFormData(prev => prev ? { ...prev, [name]: isNumeric ? Number(value) : value } : null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
        onClose();
    };

    if (!isOpen || !formData) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={ 'id' in formData ? 'Editar Serviço' : 'Novo Serviço de Parceiro'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label>Nome do Serviço</label><input name="name" value={formData.name} onChange={handleChange} className="input-base" required /></div>
                    <div><label>Tipo de Serviço</label><select name="type" value={formData.type} onChange={handleChange} className="input-base"><option>Passeio</option><option>Aluguel</option><option>Trilha</option><option>Outro</option></select></div>
                </div>
                <div><label>Nome do Parceiro</label><input name="partnerName" value={formData.partnerName} onChange={handleChange} className="input-base" required /></div>
                <div><label>Descrição</label><textarea name="description" value={formData.description} onChange={handleChange} className="input-base" rows={3}/></div>
                <div><label>URL da Imagem</label><input name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="input-base" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label>Preço Total (R$)</label><input type="number" step="0.01" name="totalPrice" value={formData.totalPrice} onChange={handleChange} className="input-base" required /></div>
                    <div><label>Tipo de Comissão</label><select name="commissionType" value={formData.commissionType} onChange={handleChange} className="input-base"><option value="percentage">Porcentagem (%)</option><option value="fixed">Valor Fixo (R$)</option></select></div>
                </div>
                <div><label>Valor da Comissão</label><input type="number" step="0.01" name="commissionValue" value={formData.commissionValue} onChange={handleChange} className="input-base" required /></div>
                
                <div className="flex justify-end gap-2 pt-4">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                    <button type="submit" className="btn-primary flex items-center gap-2">{isSaving ? <Loader2 className="animate-spin"/> : <Save size={16}/>} Salvar</button>
                </div>
            </form>
        </Modal>
    );
};


const PartnerServicesView: React.FC<PartnerServicesViewProps> = ({ db, onSaveService, onDeleteService, onUpdateBookingStatus }) => {
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Omit<PartnerService, 'id'> | PartnerService | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

    const handleOpenModal = (service: PartnerService | null) => {
        setEditingService(service || {
            type: 'Passeio',
            name: '',
            description: '',
            imageUrl: '',
            partnerName: '',
            totalPrice: 0,
            commissionType: 'percentage',
            commissionValue: 10,
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (serviceId: string) => {
        if (confirm('Tem certeza que deseja excluir este serviço?')) {
            await onDeleteService(serviceId);
        }
    };

    const handleStatusChange = async (bookingId: string, newStatus: ServiceBooking['status']) => {
        setUpdatingStatusId(bookingId);
        await onUpdateBookingStatus(bookingId, newStatus);
        setUpdatingStatusId(null);
    };

    return (
        <Section title="Serviços, Passeios & Transfer Inter-Hostels" icon={Users}>
            <div className="space-y-8">
                {/* Inter-Hostel Integration Notice */}
                <div className="bg-emerald-900 text-white p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-start md:items-center gap-3">
                        <div className="p-3 bg-emerald-800 rounded-xl flex-shrink-0 text-emerald-300">
                            <Users size={24} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Integração Total de Experiências & Eventos</span>
                            <h3 className="font-bold text-base text-white">Ecossistema Compartilhado Forest House (Praia & Santuário)</h3>
                            <p className="text-xs text-emerald-200/90 mt-1">
                                Todos os passeios, trilhas, jantares comunitários e transfers (distância de apenas 3km) estão disponíveis para hóspedes de ambas as unidades.
                            </p>
                        </div>
                    </div>
                    <div className="bg-emerald-950/80 px-3.5 py-2 rounded-xl border border-emerald-700/60 text-xs font-semibold text-emerald-200 whitespace-nowrap">
                        🚐 Transfer Grátis/Inter-Hostels a cada 2h
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-brand-dark">Serviços & Passeios Integrados</h3>
                        <button onClick={() => handleOpenModal(null)} className="btn-primary flex items-center gap-2"><PlusCircle size={18}/> Adicionar Serviço</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {db.partnerServices.map(service => (
                            <div key={service.id} className="bg-white p-4 rounded-lg shadow-sm border flex flex-col">
                                <img src={service.imageUrl} alt={service.name} className="w-full h-32 object-cover rounded-md mb-3" />
                                <h4 className="font-bold">{service.name}</h4>
                                <p className="text-sm text-gray-500">Parceiro: {service.partnerName}</p>
                                <p className="text-sm text-gray-700 my-2 flex-grow">{service.description}</p>
                                <div className="text-sm space-y-1 pt-2 border-t mt-2">
                                    <p className="flex justify-between"><strong>Preço:</strong> {service.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                    <p className="flex justify-between"><strong>Comissão:</strong> {service.commissionType === 'percentage' ? `${service.commissionValue}%` : service.commissionValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                </div>
                                <div className="flex justify-end gap-2 mt-3">
                                    <button onClick={() => handleOpenModal(service)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Edit size={16}/></button>
                                    <button onClick={() => handleDelete(service.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold text-brand-dark mb-4">Reservas de Serviços</h3>
                    <div className="overflow-x-auto bg-white rounded-lg shadow">
                         <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hóspede</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serviço</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Pago</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comissão</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                                {db.serviceBookings.map(booking => {
                                    const guest = db.guests.find(g => g.id === booking.guestId);
                                    const service = db.partnerServices.find(s => s.id === booking.serviceId);
                                    return (
                                        <tr key={booking.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{guest?.fullName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{service?.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(booking.serviceDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{booking.totalPricePaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">{booking.commissionEarned.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <select value={booking.status} onChange={e => handleStatusChange(booking.id, e.target.value as ServiceBooking['status'])} className="input-base p-1 text-xs" disabled={updatingStatusId === booking.id}>
                                                    <option>Solicitado</option>
                                                    <option>Confirmado</option>
                                                    <option>Realizado</option>
                                                    <option>Cancelado</option>
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })}
                             </tbody>
                         </table>
                    </div>
                </div>
            </div>

            <PartnerServiceModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={onSaveService}
                service={editingService}
            />
        </Section>
    );
};

export default PartnerServicesView;
