
import React, { useState } from 'react';
import { Booking, Guest, Page } from '../types';
import SignaturePad from './SignaturePad';
import { ArrowLeft, Check, UploadCloud, UserCircle, Hash, Mail, Phone } from 'lucide-react';

interface OnlineCheckinViewProps {
    booking: Booking;
    guest: Guest;
    onCheckinSubmit: (bookingId: string, idPhotoUrl: string, signatureUrl: string) => Promise<void>;
    setPage: (page: Page) => void;
}

const OnlineCheckinView: React.FC<OnlineCheckinViewProps> = ({ booking, guest, onCheckinSubmit, setPage }) => {
    const [idPhoto, setIdPhoto] = useState<File | null>(null);
    const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);
    const [signature, setSignature] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!booking || !guest) {
        return <div className="text-center p-10">Carregando dados do check-in...</div>;
    }

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIdPhoto(file);
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setIdPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveSignature = (dataUrl: string) => {
        setSignature(dataUrl);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!idPhotoPreview || !signature) {
            alert('Por favor, envie a foto do seu documento e forneça sua assinatura.');
            return;
        }
        setIsSubmitting(true);
        await onCheckinSubmit(booking.id, idPhotoPreview, signature);
        setIsSubmitting(false);
    };

    return (
        <div className="container mx-auto p-4 sm:p-8">
            <div className="max-w-3xl mx-auto">
                <button onClick={() => setPage('guestPortal')} className="flex items-center gap-2 text-brand-secondary hover:text-brand-dark mb-6">
                    <ArrowLeft size={20} />
                    Voltar para Minhas Reservas
                </button>
    
                <h1 className="text-4xl font-extrabold text-brand-dark mb-4">Check-in Online</h1>
                <p className="text-lg text-gray-600 mb-8">Agilize sua chegada! Confirme seus dados, envie seu documento e assine digitalmente.</p>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Step 1: Confirm Details */}
                     <div className="bg-white p-8 rounded-2xl shadow-lg">
                        <h2 className="text-2xl font-bold text-brand-dark mb-4">Confirme seus Dados</h2>
                        <div className="space-y-2 text-gray-700">
                           <div className="flex items-center gap-3"><UserCircle className="text-brand-secondary" /><span>{guest.fullName}</span></div>
                           <div className="flex items-center gap-3"><Mail className="text-brand-secondary" /><span>{guest.email}</span></div>
                           <div className="flex items-center gap-3"><Phone className="text-brand-secondary" /><span>{guest.phone}</span></div>
                        </div>
                    </div>
                    
                    {/* Step 2: ID Upload */}
                    <div className="bg-white p-8 rounded-2xl shadow-lg">
                        <h2 className="text-2xl font-bold text-brand-dark mb-4">1. Foto do Documento</h2>
                        <p className="text-gray-600 mb-4">Envie uma foto nítida de um documento com foto (RG ou CNH).</p>
                        <input type="file" id="photo-upload" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                        <label htmlFor="photo-upload" className="cursor-pointer w-full border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center hover:border-brand-green hover:bg-green-50 transition-colors">
                            <UploadCloud className="text-gray-400 mb-2" size={48} />
                            <span className="font-semibold text-brand-green">Clique para enviar um arquivo</span>
                            <span className="text-sm text-gray-500">PNG, JPG, etc.</span>
                        </label>
                        {idPhotoPreview && (
                            <div className="mt-4 text-center">
                                <p className="font-semibold text-gray-700 mb-2">Pré-visualização:</p>
                                <img src={idPhotoPreview} alt="Preview do documento" className="max-w-xs mx-auto rounded-lg shadow-md" />
                            </div>
                        )}
                    </div>

                    {/* Step 3: Signature */}
                     <div className="bg-white p-8 rounded-2xl shadow-lg">
                        <h2 className="text-2xl font-bold text-brand-dark mb-4">2. Assinatura Digital</h2>
                        <p className="text-gray-600 mb-4">Use o mouse ou o dedo para assinar no campo abaixo.</p>
                        <SignaturePad onSave={handleSaveSignature} />
                        {signature && (
                             <div className="mt-4 text-green-600 flex items-center gap-2">
                                <Check size={20} />
                                <p className="font-semibold">Assinatura salva com sucesso!</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Step 4: Submit */}
                    <button type="submit" disabled={!idPhotoPreview || !signature || isSubmitting} className="w-full bg-brand-green text-white font-bold py-4 rounded-lg text-xl hover:bg-brand-green-dark transition-all flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isSubmitting ? 'Enviando...' : 'Finalizar Check-in'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OnlineCheckinView;
