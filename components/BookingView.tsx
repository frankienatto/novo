import React, { useState, useMemo, useEffect } from 'react';
import { Room, RoomStatus, Guest, Booking, Page, DBState, AddOn, RatePlan, BookingRestriction, PropertyInfo, PaymentDetails, PackageDeal, PromoCode } from '../types';
import SignaturePad from './SignaturePad';
import { ArrowLeft, Bed, Calendar, Hash, Mail, Phone, User, Users, Wallet, CreditCard, Lock, Loader2, CheckCircle, Plus, Minus, AlertTriangle, FileText, QrCode, Ticket, Check } from 'lucide-react';

import { PaymentModal } from './admin/PaymentModal';

interface GuestData {
    fullName: string;
    email: string;
    phone: string;
    cpf: string;
    password?: string;
}

interface BookingData {
    roomId: number;
    checkIn: string;
    checkOut: string;
    numGuests: number;
    ratePlanId: string;
    addOnIds: string[];
    promoCode?: string;
    packageDealId?: string;
    totalPrice: number;
}


interface BookingViewProps {
    setPage: (page: Page, params?: any) => void;
    initialParams?: { roomId?: number };
    db: DBState;
    onBookingCreate: (data: { booking: BookingData, guest?: GuestData, paymentDetails?: any }) => Promise<{booking: Booking, guest?: Guest}>;
    onAcknowledgeRules: (bookingId: string, signatureUrl: string) => Promise<void>;
    currentUser: Guest | null;
}

const parseDateUTC = (dateString: string): Date | null => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
};

export const BookingView: React.FC<BookingViewProps> = ({ setPage, initialParams, db, onBookingCreate, onAcknowledgeRules, currentUser }) => {
    const [step, setStep] = useState(1); // 1: Select Package/Date, 2: Select Room, 3: AddOns, 4: Payment, 5: Signature, 6: Confirmation
    const [selectedPackageDealId, setSelectedPackageDealId] = useState<string | null>(null);
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(initialParams?.roomId || null);
    const [selectedRatePlanId, setSelectedRatePlanId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
    const [formData, setFormData] = useState({
        checkIn: '',
        checkOut: '',
        guests: 1,
        fullName: currentUser?.fullName || '',
        email: currentUser?.email || '',
        phone: currentUser?.phone || '',
        cpf: currentUser?.cpf || '',
        password: '',
    });
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
    const [promoError, setPromoError] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');
    const [cardDetails, setCardDetails] = useState({ number: '', holderName: '', expiry: '', cvc: '' });
    const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);


    const activeProperty = useMemo(() => db.properties.find(p => p.id === db.currentPropertyId)!, [db.properties, db.currentPropertyId]);
    const activePackages = useMemo(() => db.packageDeals.filter(p => p.isActive && new Date(p.validTo) >= new Date()), [db.packageDeals]);
    
    const availableRooms = useMemo(() => {
        let rooms = db.rooms.filter(r => r.status === RoomStatus.AVAILABLE || r.status === RoomStatus.CLEANING);
        const selectedPackage = db.packageDeals.find(p => p.id === selectedPackageDealId);
        if (selectedPackage) {
            rooms = rooms.filter(r => r.type === selectedPackage.includedRoomType);
        }
        return rooms;
    }, [db.rooms, selectedPackageDealId]);

    const selectedRoom = useMemo(() => db.rooms.find(r => r.id === selectedRoomId), [selectedRoomId, db.rooms]);
    
    useEffect(() => {
        if(selectedRoom && !selectedRatePlanId) {
            const defaultPlan = db.ratePlans.find(rp => rp.isDefault);
            if (defaultPlan) setSelectedRatePlanId(defaultPlan.id);
        }
    }, [selectedRoom, selectedRatePlanId, db.ratePlans]);
    
    useEffect(() => {
        setValidationError(null);
        if (!formData.checkIn || !formData.checkOut) return;

        try {
            const bookingStart = parseDateUTC(formData.checkIn);
            const bookingEnd = parseDateUTC(formData.checkOut);

            if (!bookingStart || !bookingEnd) return;

             if (bookingEnd <= bookingStart) {
                setValidationError("A data de check-out deve ser posterior à de check-in.");
                return;
            }

            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);

            for (const restriction of db.bookingRestrictions) {
                const restrictionStart = parseDateUTC(restriction.startDate);
                const restrictionEnd = parseDateUTC(restriction.endDate);
                if (!restrictionStart || !restrictionEnd) continue;


                if (bookingStart <= restrictionEnd && bookingEnd >= restrictionStart) {
                    if (restriction.type === 'minStay') {
                        const nights = Math.ceil((bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 3600 * 24));
                        if (nights < restriction.value) {
                            throw new Error(`Estadia mínima de ${restriction.value} noites para este período.`);
                        }
                    }
                    if (restriction.type === 'minAdvance') {
                        const advanceDays = Math.ceil((bookingStart.getTime() - today.getTime()) / (1000 * 3600 * 24));
                        if (advanceDays < restriction.value) {
                            throw new Error(`A reserva deve ser feita com ${restriction.value} dias de antecedência.`);
                        }
                    }
                }
            }
        } catch (error: any) {
            setValidationError(error.message);
        }
    }, [formData.checkIn, formData.checkOut, db.bookingRestrictions]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCardDetails({ ...cardDetails, [e.target.name]: e.target.value });
    };
    
    const handleSelectPackage = (deal: PackageDeal) => {
        setSelectedPackageDealId(deal.id);
        setSelectedAddOns(new Set(deal.includedAddOnIds));
        setFormData(prev => ({ ...prev, checkIn: '', checkOut: '' }));
        setStep(2); // Go to room selection (filtered by package type)
    };

    const handleSelectRoom = (roomId: number) => {
        setSelectedRoomId(roomId);
        setStep(3);
    };

    const handleSubmitDetails = (e: React.FormEvent) => {
        e.preventDefault();
        if (validationError) return;
        setStep(2); // Go to room selection
    };

    const handleAddOnsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(4);
    }

    const handleApplyPromoCode = () => {
        setPromoError('');
        setAppliedPromo(null);
        const code = db.promoCodes.find(pc => pc.code.toUpperCase() === promoCode.toUpperCase() && pc.isActive);
        if (!code) {
            setPromoError('Código inválido ou expirado.');
            return;
        }
        if (code.minNights && nights < code.minNights) {
            setPromoError(`É necessário um mínimo de ${code.minNights} noites.`);
            return;
        }
        setAppliedPromo(code);
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRoom || !selectedRatePlanId || validationError) return;
        
        setIsProcessing(true);
        
        const bookingData: BookingData = { 
            roomId: selectedRoom.id, 
            checkIn: formData.checkIn, 
            checkOut: formData.checkOut, 
            numGuests: Number(formData.guests), 
            ratePlanId: selectedRatePlanId, 
            addOnIds: Array.from(selectedAddOns),
            packageDealId: selectedPackageDealId || undefined,
            promoCode: appliedPromo?.code,
            totalPrice: totalPrice
        };
        
        const payload: { booking: BookingData, guest?: GuestData, paymentDetails?: any } = {
            booking: bookingData,
            paymentDetails: { method: 'Pendente', status: 'Aguardando Pagamento' }
        };

        if (!currentUser) {
            payload.guest = { fullName: formData.fullName, email: formData.email, phone: formData.phone, cpf: formData.cpf, password: formData.password };
        }

        try {
            const result = await onBookingCreate(payload);
            setCreatedBooking(result.booking);
            // Abrir o modal de pagamento real
            setIsPaymentModalOpen(true);
        } catch (error: any) {
            setValidationError(error.message || "Ocorreu um erro ao criar a reserva.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentSuccess = async (provider: 'stripe' | 'pix') => {
        if (!createdBooking) return;
        setIsPaymentModalOpen(false);
        
        if (!currentUser) {
            // Se for novo usuário, vai para assinatura
            setStep(5);
        } else {
            // Se já logado, App.tsx redireciona, mas garantimos aqui também
            setPage('preArrivalPortal');
        }
    };

    const handleSignatureSubmit = async (signatureDataUrl: string) => {
        if (!createdBooking) return;
        setIsProcessing(true);
        try {
            await onAcknowledgeRules(createdBooking.id, signatureDataUrl);
            setStep(6);
        } catch (error) {
            alert("Ocorreu um erro ao salvar a assinatura.");
        } finally {
            setIsProcessing(false);
        }
    };

    const nights = useMemo(() => {
        if (formData.checkIn && formData.checkOut) {
            const start = new Date(formData.checkIn);
            const end = new Date(formData.checkOut);
            if (end <= start) return 0;
            return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
        }
        return 0;
    }, [formData.checkIn, formData.checkOut]);
    
     const calculatePriceForPlan = (room: Room, plan: RatePlan, nights: number) => {
        let price = room.basePrice * nights;
        if (plan.modifierType === 'percentage') {
            price *= (1 + plan.priceModifier / 100);
        } else {
            price += (plan.priceModifier * nights);
        }
        return price;
    };
    
    const addOnsTotal = useMemo(() => {
        return Array.from(selectedAddOns).reduce((total, id) => {
            const addOn = db.addOns.find(a => a.id === id);
            return total + (addOn?.price || 0);
        }, 0);
    }, [selectedAddOns, db.addOns]);
    
    const totalPrice = useMemo(() => {
        let price = 0;
        const selectedPackage = db.packageDeals.find(p => p.id === selectedPackageDealId);
        
        if (selectedPackage) {
            price = selectedPackage.priceType === 'per_night' ? selectedPackage.price * nights : selectedPackage.price;
        } else {
            const ratePlan = db.ratePlans.find(rp => rp.id === selectedRatePlanId);
            if (!selectedRoom || !ratePlan) return 0;
            price = calculatePriceForPlan(selectedRoom, ratePlan, nights);
        }

        let finalPrice = price + addOnsTotal;

        if (appliedPromo) {
            if (appliedPromo.discountType === 'percentage') {
                finalPrice *= (1 - appliedPromo.discountValue / 100);
            } else {
                finalPrice -= appliedPromo.discountValue;
            }
        }
        
        return Math.max(0, finalPrice);

    }, [selectedRoom, nights, addOnsTotal, selectedRatePlanId, db.ratePlans, selectedPackageDealId, appliedPromo]);

    const toggleAddOn = (id: string) => {
        setSelectedAddOns(prev => {
            const newSet = new Set(prev);
            if(newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };
    
    const renderContent = () => {
         switch (step) {
            case 1:
                return (
                    <div className="animate-fade-in">
                        <h1 className="text-4xl font-extrabold text-[#1a3a32] mb-3 text-center tracking-tight">Explore Nossas Experiências</h1>
                        <p className="text-center text-gray-500 mb-10 max-w-xl mx-auto">Aproveite pacotes exclusivos que preparamos para tornar sua estadia na Forest House inesquecível.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                            {activePackages.map(deal => (
                                <div key={deal.id} className="glass-card group overflow-hidden flex flex-col hover:translate-y-[-4px] transition-all duration-500 shadow-xl hover:shadow-2xl">
                                    <div className="relative h-64 overflow-hidden">
                                        <img src={deal.imageUrl} alt={deal.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <h3 className="font-bold text-2xl text-white drop-shadow-md">{deal.name}</h3>
                                        </div>
                                    </div>
                                    <div className="p-6 flex-grow flex flex-col justify-between bg-white/40">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-4 line-clamp-3">{deal.description}</p>
                                            <div className="flex items-baseline gap-1 mb-6">
                                                <span className="text-3xl font-bold text-[#1a3a32]">R$ {deal.price}</span>
                                                <span className="text-gray-500 text-sm font-medium">/{deal.priceType === 'per_night' ? 'noite' : 'total'}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleSelectPackage(deal)} className="w-full beach-gradient text-white font-bold py-4 rounded-xl shadow-lg shadow-[#2D5A27]/20 hover:shadow-xl hover:shadow-[#2D5A27]/30 transition-all transform active:scale-95">
                                            Reservar Pacote
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="relative my-12">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                            <div className="relative flex justify-center">
                                <span className="bg-[#F0F2F5] px-6 text-gray-400 font-bold tracking-widest text-xs uppercase">Ou escolha suas datas</span>
                            </div>
                        </div>

                        <div className="glass-card p-8 shadow-2xl relative overflow-hidden bg-white/60">
                            <div className="absolute top-0 left-0 w-2 h-full beach-gradient"></div>
                            <h2 className="text-2xl font-bold text-[#1a3a32] mb-6 flex items-center gap-2">
                                <Calendar className="text-[#2D5A27]" />
                                Reserva Individual
                            </h2>
                            <form onSubmit={handleSubmitDetails} className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Check-in</label>
                                    <input type="date" name="checkIn" value={formData.checkIn} onChange={handleInputChange} className="w-full bg-white/80 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27] outline-none transition-all shadow-sm" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Check-out</label>
                                    <input type="date" name="checkOut" value={formData.checkOut} onChange={handleInputChange} className="w-full bg-white/80 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#2D5A27]/20 focus:border-[#2D5A27] outline-none transition-all shadow-sm" required />
                                </div>
                                <button type="submit" className="beach-gradient text-white font-bold py-4 rounded-xl shadow-lg shadow-[#2D5A27]/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 h-[54px] transform active:scale-95">
                                    Buscar Disponibilidade
                                </button>
                            </form>
                            {validationError && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm animate-fade-in">
                                    <AlertTriangle size={18} />
                                    {validationError}
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4">
                        <h1 className="text-3xl font-extrabold text-brand-dark mb-6">Selecione uma Acomodação</h1>
                        {availableRooms.map(room => (
                            <div key={room.id} className="bg-white p-4 rounded-2xl shadow-lg flex flex-col md:flex-row gap-4 items-center">
                                <img src={room.imageUrl} alt={room.name} className="w-full md:w-48 h-40 object-cover rounded-lg"/>
                                <div className="flex-grow">
                                    <h2 className="text-xl font-bold">{room.name}</h2>
                                    <p className="text-sm text-gray-600">{room.type}</p>
                                    <div className="flex items-center gap-2 mt-2 text-sm"><Users size={16}/> Até {room.capacity} pessoas</div>
                                </div>
                                <div className="text-center md:text-right">
                                    <p className="text-2xl font-bold text-brand-green">R${room.basePrice}</p>
                                    <p className="text-sm text-gray-500">/ noite</p>
                                    <button onClick={() => handleSelectRoom(room.id)} className="mt-2 w-full md:w-auto bg-brand-green text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-green-dark">Selecionar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 3:
                return (
                    <div>
                        <h1 className="text-3xl font-extrabold text-brand-dark mb-6 text-center">Adicione Extras à sua Estadia</h1>
                        <p className="text-center text-gray-600 mb-8">Personalize sua experiência com nossos serviços adicionais.</p>
                        <form onSubmit={handleAddOnsSubmit} className="space-y-4">
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 bg-white p-4 rounded-2xl shadow-lg">
                                {db.addOns.map(addOn => (
                                    <div key={addOn.id} className={`p-4 rounded-lg border-2 cursor-pointer transition-colors flex justify-between items-center ${selectedAddOns.has(addOn.id) ? 'border-brand-green bg-green-50' : 'border-gray-200 bg-white'}`} onClick={() => toggleAddOn(addOn.id)}>
                                        <div>
                                            <h3 className="font-bold">{addOn.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="font-bold text-brand-green">R$ {addOn.price.toFixed(2)}</p>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedAddOns.has(addOn.id) ? 'bg-brand-green border-brand-green' : 'border-gray-300'}`}>
                                                {selectedAddOns.has(addOn.id) && <Check className="text-white" size={16}/>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-6">
                                <button type="submit" className="w-full bg-brand-green text-white font-bold py-3 rounded-lg text-lg hover:bg-brand-green-dark transition-transform hover:scale-105">
                                    Continuar
                                </button>
                            </div>
                        </form>
                    </div>
                );
            case 4:
                return (
                    <form onSubmit={handlePayment}>
                        <h1 className="text-3xl font-extrabold text-brand-dark mb-6">Cadastro e Pagamento</h1>
                        {validationError && <p className="text-red-500 text-center bg-red-100 p-3 rounded-lg mb-4">{validationError}</p>}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white p-6 rounded-2xl shadow-lg">
                                    <h2 className="text-xl font-bold mb-4">Seus Dados</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label>Nome Completo</label><input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="input-base" required disabled={!!currentUser}/></div>
                                        <div><label>Email</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} className="input-base" required disabled={!!currentUser}/></div>
                                        <div><label>Telefone</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="input-base" required disabled={!!currentUser}/></div>
                                        <div><label>CPF</label><input type="text" name="cpf" value={formData.cpf} onChange={handleInputChange} className="input-base" required disabled={!!currentUser}/></div>
                                        {!currentUser && <div className="md:col-span-2"><label>Crie uma Senha de Acesso (opcional)</label><input type="password" name="password" value={formData.password} onChange={handleInputChange} className="input-base" /></div>}
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-lg">
                                    <h2 className="text-xl font-bold mb-4">Pagamento</h2>
                                    <div className="p-4 bg-brand-light/20 rounded-xl border border-brand-primary/20 flex items-start gap-3">
                                        <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-brand-dark">Pagamento Seguro</p>
                                            <p className="text-sm text-gray-600 leading-relaxed">
                                                Utilizamos criptografia de ponta para processar seu pagamento via <strong>Stripe (Cartão)</strong> ou <strong>PIX</strong>.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex flex-wrap gap-4 justify-center grayscale opacity-60">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-6" />
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_Pix_Brasil.png" alt="PIX" className="h-6" />
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-6" />
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col">
                                <h2 className="text-xl font-bold mb-4">Resumo da Reserva</h2>
                                <div className="space-y-2 text-sm flex-grow">
                                    <p><strong>Quarto:</strong> {selectedRoom?.name}</p>
                                    <p><strong>Período:</strong> {nights} noites</p>
                                    <p><strong>Check-in:</strong> {new Date(formData.checkIn).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                                    <p><strong>Check-out:</strong> {new Date(formData.checkOut).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                                    <p><strong>Hóspedes:</strong> {formData.guests}</p>
                                    {selectedAddOns.size > 0 && (
                                        <div className="pt-2 border-t mt-2">
                                            <p><strong>Extras:</strong></p>
                                            <ul className="list-disc list-inside pl-2">
                                                {Array.from(selectedAddOns).map(id => <li key={id}>{db.addOns.find(a => a.id === id)?.name}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-4 border-t mt-4">
                                    <label className="font-semibold text-sm">Código Promocional</label>
                                    <div className="flex gap-2 mt-1">
                                        <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value)} className="input-base flex-grow"/>
                                        <button type="button" onClick={handleApplyPromoCode} className="btn-secondary text-sm">Aplicar</button>
                                    </div>
                                    {promoError && <p className="text-red-500 text-xs mt-1">{promoError}</p>}
                                    {appliedPromo && <p className="text-green-600 text-xs mt-1 font-semibold">Código "{appliedPromo.code}" aplicado com sucesso!</p>}
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2"><span>Total:</span><span>{totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                                <button type="submit" disabled={isProcessing || !!validationError} className="mt-6 w-full bg-brand-green text-white font-bold py-3 rounded-lg text-lg hover:bg-brand-green-dark flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed">{isProcessing ? <Loader2 className="animate-spin" /> : `Confirmar e Pagar`}</button>
                            </div>
                        </div>
                    </form>
                );
            case 5:
                return (
                    <div>
                        <h1 className="text-3xl font-extrabold text-brand-dark mb-6 text-center">Último Passo: Regras e Assinatura</h1>
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                            <div className="max-h-60 overflow-y-auto pr-2 mb-4 text-sm text-gray-600 space-y-2 border p-3 rounded-lg">
                                <p>Ao assinar, você concorda com os termos de serviço e as seguintes regras da propriedade:</p>
                                <ul className="list-disc list-inside">
                                    {activeProperty.rules.map((rule, index) => <li key={index}>{rule}</li>)}
                                </ul>
                            </div>
                            <p className="mb-2 font-semibold">Por favor, assine no campo abaixo para confirmar sua reserva e o aceite das regras:</p>
                            <SignaturePad onSave={handleSignatureSubmit} />
                            {isProcessing && (
                                <div className="mt-4 flex items-center justify-center gap-2 text-gray-600">
                                    <Loader2 className="animate-spin" />
                                    <span>Salvando sua assinatura e finalizando a reserva...</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
                        <CheckCircle className="mx-auto text-brand-green mb-4" size={64}/>
                        <h1 className="text-3xl font-extrabold text-brand-green mb-4">Reserva Confirmada!</h1>
                        <p className="text-gray-600 mb-6">Obrigado, {formData.fullName}! Criamos sua conta e enviamos uma confirmação com todos os detalhes para o seu email.</p>
                        <p className="text-gray-600">Sua aventura no {activeProperty.name} está prestes a começar.</p>
                        <button onClick={() => setPage('preArrivalPortal')} className="mt-6 w-full bg-brand-dark text-white font-bold py-3 rounded-lg text-lg hover:bg-gray-700">
                            Acessar o Portal de Pré-Chegada
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };
    
    return (
        <div className="bg-brand-light min-h-screen py-8">
            <div className="container mx-auto p-4 sm:p-0">
                <div className="max-w-4xl mx-auto">
                    {step > 1 && step < 6 && (
                        <button onClick={() => setStep(prev => prev - 1)} className="flex items-center gap-2 text-brand-secondary hover:text-brand-dark mb-6">
                            <ArrowLeft size={20} />
                            Voltar
                        </button>
                    )}
                    {renderContent()}
                </div>
            </div>

            {/* Modal de Pagamento Real */}
            <PaymentModal 
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                amount={totalPrice}
                bookingId={createdBooking?.id || ''}
                guestName={formData.fullName}
                onSuccess={handlePaymentSuccess}
            />
        </div>
    );
};