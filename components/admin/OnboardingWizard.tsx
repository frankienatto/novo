import React, { useState } from 'react';
import { PropertyInfo, Room, RoomType, Staff, DBState } from '../../types';
import { Loader2, Sparkles, Building, Bed, CheckCircle } from 'lucide-react';
import Logo from '../Logo';

interface OnboardingWizardProps {
    currentUser: Staff;
    db: DBState;
    onPropertyInfoSave: (propertyData: PropertyInfo) => Promise<void>;
    onRoomAdd: (roomData: Omit<Room, 'id' | 'status' | 'imageUrl'>) => Promise<void>;
    onCompleteOnboarding: (staffId: string) => Promise<void>;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ currentUser, db, onPropertyInfoSave, onRoomAdd, onCompleteOnboarding }) => {
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    
    const activeProperty = db.properties.find(p => p.id === db.currentPropertyId);
    
    const [propertyInfo, setPropertyInfo] = useState<PropertyInfo>(activeProperty || {
        id: '', name: '', address: '', cnpj: '', phone: '', email: '',
        checkInTime: '14:00', checkOutTime: '11:00', wifiNetwork: '', wifiPass: '', rules: [],
        planId: db.subscriptionPlans[0]?.id || '',
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

    const [roomInfo, setRoomInfo] = useState({
        name: 'Quarto Exemplo',
        type: RoomType.PRIVATE_COUPLE,
        capacity: 2,
        basePrice: 150.00,
        amenities: ['Wi-Fi', 'Ar Condicionado']
    });

    const handlePropertyInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPropertyInfo({ ...propertyInfo, [e.target.name]: e.target.value });
    };

    const handleRoomInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setRoomInfo({ ...roomInfo, [name]: name === 'capacity' || name === 'basePrice' ? Number(value) : value });
    };

    const handleStep1Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onPropertyInfoSave(propertyInfo);
        setIsSaving(false);
        setStep(3);
    };
    
    const handleStep2Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onRoomAdd(roomInfo);
        setIsSaving(false);
        setStep(4);
    };

    const handleFinish = async () => {
        setIsSaving(true);
        await onCompleteOnboarding(currentUser.id);
        setIsSaving(false);
        // The parent component will handle the view change.
    };
    
    const steps = ['Boas-vindas', 'Informações da Propriedade', 'Primeiro Quarto', 'Conclusão'];

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="text-center">
                        <Sparkles size={48} className="mx-auto text-brand-green mb-4"/>
                        <h2 className="text-2xl font-bold text-brand-dark mb-2">Bem-vindo(a) ao Synapse Hospitality!</h2>
                        <p className="text-gray-600 mb-6">Vamos configurar sua propriedade em apenas alguns passos.</p>
                        <button onClick={() => setStep(2)} className="w-full bg-brand-green text-white font-bold py-3 rounded-lg text-lg hover:bg-brand-green-dark">Começar Configuração</button>
                    </div>
                );
            case 2:
                return (
                    <form onSubmit={handleStep1Submit} className="space-y-4">
                        <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2"><Building size={20}/> Informações da Propriedade</h2>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label>Nome da Propriedade</label><input type="text" name="name" value={propertyInfo.name} onChange={handlePropertyInfoChange} className="input-base" required /></div>
                            <div><label>Email de Contato</label><input type="email" name="email" value={propertyInfo.email} onChange={handlePropertyInfoChange} className="input-base" required /></div>
                        </div>
                        <div><label>Endereço</label><input type="text" name="address" value={propertyInfo.address} onChange={handlePropertyInfoChange} className="input-base" /></div>
                        <button type="submit" disabled={isSaving} className="w-full bg-brand-green text-white font-bold py-3 rounded-lg text-lg flex items-center justify-center">
                           {isSaving ? <Loader2 className="animate-spin" /> : 'Próximo Passo'}
                        </button>
                    </form>
                );
            case 3:
                return (
                    <form onSubmit={handleStep2Submit} className="space-y-4">
                         <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2"><Bed size={20}/> Adicionar seu Primeiro Quarto</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label>Nome do Quarto</label><input type="text" name="name" value={roomInfo.name} onChange={handleRoomInfoChange} className="input-base" required /></div>
                            <div><label>Tipo</label><select name="type" value={roomInfo.type} onChange={handleRoomInfoChange} className="input-base">{Object.values(RoomType).map(rt => <option key={rt} value={rt}>{rt}</option>)}</select></div>
                            <div><label>Capacidade</label><input type="number" name="capacity" value={roomInfo.capacity} onChange={handleRoomInfoChange} className="input-base" required /></div>
                            <div><label>Preço Diária (R$)</label><input type="number" name="basePrice" value={roomInfo.basePrice} onChange={handleRoomInfoChange} className="input-base" required /></div>
                        </div>
                        <button type="submit" disabled={isSaving} className="w-full bg-brand-green text-white font-bold py-3 rounded-lg text-lg flex items-center justify-center">
                            {isSaving ? <Loader2 className="animate-spin" /> : 'Adicionar Quarto e Finalizar'}
                        </button>
                    </form>
                );
            case 4:
                return (
                    <div className="text-center">
                        <CheckCircle size={48} className="mx-auto text-brand-green mb-4"/>
                        <h2 className="text-2xl font-bold text-brand-dark mb-2">Configuração Básica Concluída!</h2>
                        <p className="text-gray-600 mb-6">Você está pronto para começar. Explore o painel para descobrir todas as funcionalidades.</p>
                        <button onClick={handleFinish} disabled={isSaving} className="w-full bg-brand-green text-white font-bold py-3 rounded-lg text-lg flex items-center justify-center">
                            {isSaving ? <Loader2 className="animate-spin" /> : 'Ir para o Painel'}
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <Logo className="h-20 w-40 mb-8" />
            <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg">
                 <div className="w-full mb-8">
                    <div className="flex items-center">
                        {steps.map((s, i) => (
                            <React.Fragment key={s}>
                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step > i ? 'bg-brand-green text-white' : 'bg-gray-200 text-gray-500'}`}>
                                        {step > i ? <CheckCircle size={20}/> : i + 1}
                                    </div>
                                    <p className={`text-xs mt-1 text-center ${step >= i + 1 ? 'font-semibold text-brand-dark' : 'text-gray-400'}`}>{s}</p>
                                </div>
                                {i < steps.length - 1 && <div className={`flex-1 h-1 mx-2 ${step > i + 1 ? 'bg-brand-green' : 'bg-gray-200'}`}></div>}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                {renderStepContent()}
            </div>
        </div>
    );
};

export default OnboardingWizard;