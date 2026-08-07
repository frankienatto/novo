import React, { useState, useMemo, useEffect } from 'react';
import { Room, RoomStatus, DBState, AddOn, RatePlan, BookingRestriction, PropertyInfo, ThemeSettings, Booking, Guest } from '../types';
import { ArrowLeft, Bed, Calendar, Users, Wallet, CreditCard, Lock, Loader2, CheckCircle, Plus, Minus, AlertTriangle } from 'lucide-react';

interface GuestData {
    fullName: string;
    email: string;
    phone: string;
    cpf: string;
}

interface BookingData {
    roomId: number;
    checkIn: string;
    checkOut: string;
    numGuests: number;
    ratePlanId: string;
    addOnIds: string[];
    totalPrice: number;
}

interface BookingWidgetViewProps {
    db: DBState;
    onBookingCreate: (data: { booking: BookingData, guest?: GuestData, paymentDetails?: any }) => Promise<any>;
}

const WidgetThemeStyles: React.FC<{ themeSettings?: ThemeSettings }> = ({ themeSettings }) => {
    if (!themeSettings) return null;
    const { publicSite } = themeSettings;
    const styles = `
        body {
             background-color: ${publicSite.backgroundColor};
             color: ${publicSite.textColor};
        }
        :root {
            --widget-primary: ${publicSite.primaryColor};
            --widget-bg: ${publicSite.backgroundColor};
            --widget-text: ${publicSite.textColor};
            --widget-card-bg: ${publicSite.cardBackgroundColor};
            --widget-card-radius: ${publicSite.cardBorderRadius};
            --widget-button-radius: ${publicSite.buttonBorderRadius};
        }
        .input-base-widget {
          @apply w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[var(--widget-primary)]/50 focus:border-[var(--widget-primary)] transition-shadow duration-200 text-gray-800;
        }
    `;
    return <style>{styles}</style>;
};


const BookingWidgetView: React.FC<BookingWidgetViewProps> = ({ db, onBookingCreate }) => {
    const [propertyId, setPropertyId] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('propertyId');
        setPropertyId(id);
    }, []);

    const activeProperty = useMemo(() => {
        if (!propertyId) return db.properties[0];
        return db.properties.find(p => p.id === propertyId) || db.properties[0];
    }, [propertyId, db.properties]);

    const [step, setStep] = useState(1);
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
    const [selectedRatePlanId, setSelectedRatePlanId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
    const [formData, setFormData] = useState({ checkIn: '', checkOut: '', guests: 1, fullName: '', email: '', phone: '', cpf: '' });
    const [validationError, setValidationError] = useState<string | null>(null);

    const availableRooms = useMemo(() => db.rooms.filter(r => r.status === RoomStatus.AVAILABLE || r.status === RoomStatus.CLEANING), [db.rooms]);
    const selectedRoom = useMemo(() => db.rooms.find(r => r.id === selectedRoomId), [selectedRoomId, db.rooms]);

    useEffect(() => {
        if (selectedRoom && !selectedRatePlanId) {
            const defaultPlan = db.ratePlans.find(rp => rp.isDefault);
            if (defaultPlan) setSelectedRatePlanId(defaultPlan.id);
        }
    }, [selectedRoom, selectedRatePlanId, db.ratePlans]);

    useEffect(() => {
        setValidationError(null);
        if (!formData.checkIn || !formData.checkOut) return;
        const start = new Date(formData.checkIn);
        const end = new Date(formData.checkOut);
        if (end <= start) {
            setValidationError("A data de check-out deve ser posterior à de check-in.");
            return;
        }
        
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (const restriction of db.bookingRestrictions) {
                const restrictionStart = new Date(restriction.startDate);
                const restrictionEnd = new Date(restriction.endDate);

                if (start <= restrictionEnd && end >= restrictionStart) {
                    if (restriction.type === 'minStay') {
                        const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
                        if (nights < restriction.value) {
                            throw new Error(`Estadia mínima de ${restriction.value} noites para este período.`);
                        }
                    }
                    if (restriction.type === 'minAdvance') {
                        const advanceDays = Math.ceil((start.getTime() - today.getTime()) / (1000 * 3600 * 24));
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSelectRoom = (roomId: number) => { setSelectedRoomId(roomId); setStep(2); };
    const handleSubmitDetails = (e: React.FormEvent) => { e.preventDefault(); if (!validationError) setStep(3); };
    const handleAddOnsSubmit = (e: React.FormEvent) => { e.preventDefault(); setStep(4); }
    
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
            totalPrice: totalPrice
        };
        const guestData: GuestData = { fullName: formData.fullName, email: formData.email, phone: formData.phone, cpf: formData.cpf };

        try {
            await new Promise(res => setTimeout(res, 1500));
            await onBookingCreate({ booking: bookingData, guest: guestData });
            setStep(5);
        } catch (error: any) {
            setValidationError(error.message || "Erro ao criar reserva.");
            setStep(2);
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
        if (plan.modifierType === 'percentage') price *= (1 + plan.priceModifier / 100);
        else price += (plan.priceModifier * nights);
        return price;
    };

    const addOnsTotal = useMemo(() => Array.from(selectedAddOns).reduce((total, id) => total + (db.addOns.find(a => a.id === id)?.price || 0), 0), [selectedAddOns, db.addOns]);
    
    const totalPrice = useMemo(() => {
        const ratePlan = db.ratePlans.find(rp => rp.id === selectedRatePlanId);
        if (!selectedRoom || !ratePlan) return 0;
        return calculatePriceForPlan(selectedRoom, ratePlan, nights) + addOnsTotal;
    }, [selectedRoom, nights, addOnsTotal, selectedRatePlanId, db.ratePlans]);

    const toggleAddOn = (id: string) => setSelectedAddOns(prev => { const newSet = new Set(prev); if(newSet.has(id)) newSet.delete(id); else newSet.add(id); return newSet; });

    if (!activeProperty) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-gray-500" size={48} /></div>;
    }

    const renderStepContent = () => {
        // This is a simplified render logic, similar to BookingView.tsx
        switch(step) {
             case 1:
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-[var(--widget-text)]">Selecione uma Acomodação</h2>
                        {availableRooms.map(room => (
                            <div key={room.id} className="bg-[var(--widget-card-bg)] p-4 rounded-lg flex justify-between items-center" style={{borderRadius: 'var(--widget-card-radius)'}}>
                                <div>
                                    <h3 className="font-bold">{room.name}</h3>
                                    <p className="text-sm">A partir de R${room.basePrice}/noite</p>
                                </div>
                                <button onClick={() => handleSelectRoom(room.id)} className="bg-[var(--widget-primary)] text-white font-bold py-2 px-4" style={{borderRadius: 'var(--widget-button-radius)'}}>Selecionar</button>
                            </div>
                        ))}
                    </div>
                );
            case 5:
                return (
                     <div className="text-center bg-[var(--widget-card-bg)] p-8 rounded-lg">
                         <CheckCircle className="mx-auto text-[var(--widget-primary)] mb-4" size={64}/>
                         <h2 className="text-3xl font-bold text-[var(--widget-primary)] mb-4">Reserva Confirmada!</h2>
                         <p className="mb-6">Obrigado, {formData.fullName}! Enviamos todos os detalhes para o seu email.</p>
                     </div>
                );
            default: // Steps 2, 3, 4
                return (
                    <div className="bg-[var(--widget-card-bg)] p-6 rounded-lg">
                        <h2 className="text-2xl font-bold text-center mb-4">Finalize sua Reserva</h2>
                        <form onSubmit={handlePayment} className="space-y-4">
                            <p>Resumo: {selectedRoom?.name} por {nights} noites.</p>
                             <div><label>Nome Completo</label><input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="input-base-widget" required/></div>
                             <div><label>Email</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} className="input-base-widget" required/></div>
                            {/* Simplified form for widget */}
                            <button type="submit" disabled={isProcessing} className="w-full bg-[var(--widget-primary)] text-white font-bold py-3 rounded-lg text-lg flex items-center justify-center">
                               {isProcessing ? <Loader2 className="animate-spin" /> : `Pagar R$${totalPrice.toFixed(2)}`}
                            </button>
                        </form>
                    </div>
                )
        }
    }


    return (
        <>
            <WidgetThemeStyles themeSettings={db.themeSettings} />
            <div className="min-h-screen font-sans">
                <header className="p-4 flex justify-center items-center gap-4 bg-[var(--widget-card-bg)] shadow-md">
                    <img src={db.themeSettings.adminPanel.logoUrl} alt="Logo" style={{ height: db.themeSettings.publicSite.logoHeight }} />
                    <h1 className="text-xl font-bold text-[var(--widget-text)]">{activeProperty.name}</h1>
                </header>
                <div className="container mx-auto p-4 sm:p-6">
                    <div className="max-w-2xl mx-auto">
                        {step > 1 && step < 5 && <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-[var(--widget-text)] opacity-70 hover:opacity-100 mb-6"><ArrowLeft size={20} /> Voltar</button>}
                        {renderStepContent()}
                    </div>
                </div>
            </div>
        </>
    );
};

export default BookingWidgetView;