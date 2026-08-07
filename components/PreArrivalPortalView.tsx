import React, { useState, useEffect, useRef } from 'react';
import { Guest, DBState, Booking, ChatMessage } from '../types';
import { User, Calendar, Plane, Bus, Car, Users, MessageSquare, ArrowRight, Loader2, LogIn, Send, Camera, RefreshCw, CheckCircle } from 'lucide-react';
import SignaturePad from './SignaturePad';

interface PreArrivalPortalViewProps {
    guest: Guest;
    db: DBState;
    onSaveTravelDetails: (bookingId: string, details: Booking['travelDetails']) => Promise<void>;
    onCheckIn: (bookingId: string) => Promise<void>;
    setPage: (page: string, params?: any) => void;
    getPreArrivalData: (guestId: string) => Promise<{ guestBooking: Booking; arrivingGuests: any[]; chatConversationId: string }>;
    onStartGuestChat: (guest1Id: string, guest1Name: string, guest2Id: string, guest2Name: string) => Promise<any>;
    onSendMessage: (conversationId: string, text: string, senderId: string, senderName: string) => Promise<ChatMessage>;
    chatMessages: ChatMessage[];
    onVerificationSubmit: (bookingId: string, selfieDataUrl: string, signatureDataUrl: string) => Promise<void>;
}

const PreArrivalVerificationView: React.FC<{
    guest: Guest;
    booking: Booking;
    rules: string[];
    onVerificationSubmit: (bookingId: string, selfieDataUrl: string, signatureDataUrl: string) => Promise<void>;
}> = ({ guest, booking, rules, onVerificationSubmit }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [signature, setSignature] = useState<string | null>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setIsCameraReady(true);
                }
            } catch (err) {
                console.error("Error accessing camera: ", err);
                alert("Não foi possível acessar a câmera. Por favor, verifique suas permissões.");
            }
        };
        if (!imageSrc) {
            startCamera();
        }

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
        };
    }, [imageSrc]);

    const takePicture = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/png');
            setImageSrc(dataUrl);
        }
    };

    const retakePicture = () => {
        setImageSrc(null);
    };

    const handleSubmit = async () => {
        if (imageSrc && signature) {
            setIsSubmitting(true);
            await onVerificationSubmit(booking.id, imageSrc, signature);
            // The parent component will handle navigation after submission.
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-lg text-center">
                <h1 className="text-3xl font-extrabold text-brand-dark mb-2">Quase lá, {(guest.fullName || 'Hóspede').split(' ')[0]}!</h1>
                <p className="text-gray-600 mb-6">Para sua segurança e para agilizar sua chegada, precisamos de uma selfie e sua assinatura digital.</p>
                
                <div className="relative w-64 h-64 mx-auto bg-gray-200 rounded-full overflow-hidden border-4 border-gray-300 flex items-center justify-center">
                    {imageSrc ? (
                        <img src={imageSrc} alt="Sua selfie" className="w-full h-full object-cover" />
                    ) : (
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                    )}
                    {!isCameraReady && !imageSrc && <Loader2 className="animate-spin text-gray-500" />}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
                
                <div className="mt-6 space-y-3">
                    {imageSrc ? (
                        <div className="flex justify-center gap-4">
                            <button onClick={retakePicture} className="flex-1 bg-gray-200 text-gray-800 font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                                <RefreshCw size={18} /> Tirar Novamente
                            </button>
                        </div>
                    ) : (
                        <button onClick={takePicture} disabled={!isCameraReady} className="w-full bg-brand-dark text-white font-bold py-3 rounded-lg text-lg flex items-center justify-center gap-2 disabled:bg-gray-400">
                            <Camera size={20} /> Tirar Foto
                        </button>
                    )}
                </div>

                {/* Contract and Signature */}
                <div className="mt-8 pt-6 border-t text-left">
                    <h2 className="font-bold text-xl mb-2 text-brand-dark">Regras e Contrato de Hospedagem</h2>
                    <div className="max-h-32 overflow-y-auto p-3 border rounded-lg bg-gray-50 text-sm text-gray-600 space-y-1 mb-4">
                        <p>Ao assinar, você concorda com os termos de serviço e as regras da casa:</p>
                        <ul className="list-disc list-inside pl-2">
                            {rules.map((rule, i) => <li key={i}>{rule}</li>)}
                        </ul>
                    </div>
                    <SignaturePad onSave={setSignature} />
                </div>

                <div className="mt-6">
                    <button 
                        onClick={handleSubmit} 
                        disabled={!imageSrc || !signature || isSubmitting}
                        className="w-full bg-brand-green text-white font-bold py-3 rounded-lg text-lg flex items-center justify-center gap-2 disabled:bg-gray-400"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="animate-spin" /> Verificando...</>
                        ) : (
                            <><CheckCircle size={20} /> Finalizar Verificação</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};


const PreArrivalPortalView: React.FC<PreArrivalPortalViewProps> = ({ guest, db, onSaveTravelDetails, onCheckIn, setPage, getPreArrivalData, onStartGuestChat, onSendMessage, chatMessages, onVerificationSubmit }) => {
    const [preArrivalData, setPreArrivalData] = useState<{ guestBooking: Booking; arrivingGuests: any[]; chatConversationId: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [travelDetails, setTravelDetails] = useState<Booking['travelDetails']>({ transport: 'plane', arrivalDateTime: '', shareRide: false });
    const [isSaving, setIsSaving] = useState(false);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const data = await getPreArrivalData(guest.id);
                setPreArrivalData(data);
                if (data.guestBooking.travelDetails) {
                    setTravelDetails(data.guestBooking.travelDetails);
                } else {
                    // Set default arrival date to check-in day at noon
                    const checkinDate = new Date(data.guestBooking.checkIn);
                    checkinDate.setHours(12, 0);
                    const localISOString = new Date(checkinDate.getTime() - (checkinDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                    setTravelDetails(prev => ({ ...prev, arrivalDateTime: localISOString }));
                }
            } catch (error) {
                console.error("Failed to load pre-arrival data", error);
                // Handle error, maybe redirect or show a message
            }
            setIsLoading(false);
        };
        fetchData();
    }, [guest.id, getPreArrivalData]);
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, preArrivalData?.chatConversationId]);

    const handleTravelDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setTravelDetails(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleTransportChange = (transport: 'plane' | 'bus' | 'car' | 'other') => {
        setTravelDetails(prev => ({ ...prev, transport }));
    };

    const handleSaveDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!preArrivalData) return;
        setIsSaving(true);
        await onSaveTravelDetails(preArrivalData.guestBooking.id, travelDetails);
        // Refetch data to update arriving guests list
        const data = await getPreArrivalData(guest.id);
        setPreArrivalData(data);
        setIsSaving(false);
    };
    
    const handleGuestCheckin = async () => {
        if (!preArrivalData) return;
        setIsCheckingIn(true);
        try {
            await onCheckIn(preArrivalData.guestBooking.id);
        } catch (error: any) {
            alert(`Não foi possível realizar o check-in: ${error.message}`);
            setIsCheckingIn(false);
        }
    };
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!chatInput.trim() || !preArrivalData) return;
        setIsSending(true);
        await onSendMessage(preArrivalData.chatConversationId, chatInput, guest.id, guest.fullName);
        setChatInput('');
        setIsSending(false);
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" size={48} /></div>;
    }

    if (!preArrivalData) {
        // This case might happen if a guest logs in but has no future confirmed booking.
        // App.tsx should ideally handle this routing, but this is a safeguard.
        return (
             <div className="text-center p-8">
                <h2 className="text-2xl font-bold">Nenhuma reserva futura encontrada.</h2>
                <button onClick={() => setPage('home')} className="mt-4 bg-brand-green text-white font-bold py-2 px-4 rounded-lg">Voltar ao Início</button>
            </div>
        );
    }
    
    const { guestBooking, arrivingGuests, chatConversationId } = preArrivalData;
    const room = db.rooms.find(r => r.id === guestBooking.roomId);
    const activeProperty = db.properties.find(p => p.id === db.currentPropertyId);

    if (!guestBooking.selfiePhotoUrl || !guestBooking.signatureUrl) {
        return <PreArrivalVerificationView 
                    guest={guest} 
                    booking={guestBooking} 
                    rules={activeProperty?.rules || []}
                    onVerificationSubmit={onVerificationSubmit} 
                />;
    }

    return (
        <div className="bg-gray-100 min-h-screen p-4 sm:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
                    <h1 className="text-3xl font-extrabold text-brand-dark">Sua Sala de Embarque Virtual</h1>
                    <p className="text-gray-600 mt-2">Olá, {(guest.fullName || 'Hóspede').split(' ')[0]}! Prepare-se para sua aventura no {db.properties[0].name}.</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Booking and Travel Details */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                            <h2 className="font-bold text-xl mb-4 flex items-center gap-2"><Calendar size={20}/> Sua Reserva</h2>
                            <div className="space-y-2 text-sm">
                                <p><strong>Quarto:</strong> {room?.name}</p>
                                <p><strong>Check-in:</strong> {new Date(guestBooking.checkIn).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                                <p><strong>Check-out:</strong> {new Date(guestBooking.checkOut).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                             <h2 className="font-bold text-xl mb-4">Detalhes da sua Chegada</h2>
                             <form onSubmit={handleSaveDetails} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Meio de Transporte</label>
                                    <div className="flex gap-2 mt-1">
                                        <button type="button" onClick={() => handleTransportChange('plane')} className={`p-2 rounded-lg border flex-1 ${travelDetails.transport === 'plane' ? 'bg-blue-100 border-blue-500' : ''}`}><Plane/></button>
                                        <button type="button" onClick={() => handleTransportChange('bus')} className={`p-2 rounded-lg border flex-1 ${travelDetails.transport === 'bus' ? 'bg-blue-100 border-blue-500' : ''}`}><Bus/></button>
                                        <button type="button" onClick={() => handleTransportChange('car')} className={`p-2 rounded-lg border flex-1 ${travelDetails.transport === 'car' ? 'bg-blue-100 border-blue-500' : ''}`}><Car/></button>
                                    </div>
                                </div>
                                 <div><label>Data e Hora da Chegada</label><input type="datetime-local" name="arrivalDateTime" value={travelDetails.arrivalDateTime} onChange={handleTravelDetailsChange} className="input-base"/></div>
                                 {(travelDetails.transport === 'plane' || travelDetails.transport === 'bus') && <div><label>Nº do Voo / Ônibus</label><input type="text" name="flightOrBusNumber" value={travelDetails.flightOrBusNumber || ''} onChange={handleTravelDetailsChange} className="input-base"/></div>}
                                 <label className="flex items-center gap-2"><input type="checkbox" name="shareRide" checked={travelDetails.shareRide} onChange={handleTravelDetailsChange} className="h-4 w-4"/> Quero dividir carona (Uber/Táxi)</label>
                                 <button type="submit" disabled={isSaving} className="w-full bg-brand-green text-white font-bold py-2 rounded-lg">{isSaving ? <Loader2 className="animate-spin mx-auto"/> : 'Salvar Detalhes'}</button>
                             </form>
                        </div>
                    </div>
                    
                    {/* Right Column: Other Guests and Chat */}
                    <div className="lg:col-span-2 space-y-8">
                         <div className="bg-white p-6 rounded-2xl shadow-lg">
                            <h2 className="font-bold text-xl mb-4 flex items-center gap-2"><Users size={20}/> Quem Chega na Mesma Semana?</h2>
                             <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                 {arrivingGuests.map(g => (
                                    <div key={g.guestId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <img src={g.profilePictureUrl || `https://i.pravatar.cc/150?u=${g.guestId}`} alt={g.guestName} className="w-10 h-10 rounded-full"/>
                                            <div>
                                                <p className="font-semibold">{g.guestName} {g.isCurrentUser && '(Você)'}</p>
                                                {g.travelDetails && <p className="text-xs text-gray-500">Chega em {new Date(g.travelDetails.arrivalDateTime).toLocaleDateString()} às {new Date(g.travelDetails.arrivalDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>}
                                            </div>
                                        </div>
                                        {g.travelDetails?.shareRide && <span className="text-xs font-bold bg-green-200 text-green-800 px-2 py-1 rounded-full">Quer dividir carona!</span>}
                                    </div>
                                 ))}
                            </div>
                        </div>
                        
                         <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col h-[60vh]">
                             <h2 className="font-bold text-xl mb-4 flex items-center gap-2"><MessageSquare size={20}/> Chat Pré-Chegada</h2>
                             <div className="flex-grow bg-gray-100 rounded-lg p-3 space-y-3 overflow-y-auto">
                                {chatMessages.filter(m => m.conversationId === chatConversationId).map(msg => (
                                     <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === guest.id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-2 rounded-xl ${msg.senderId === guest.id ? 'bg-brand-green text-white' : 'bg-white'}`}>
                                            <p className="text-xs font-bold">{msg.senderName}</p>
                                            <p className="text-sm">{msg.text}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                             </div>
                             <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                                 <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Troque uma ideia com a galera..." className="input-base flex-grow"/>
                                 <button type="submit" disabled={isSending} className="bg-brand-green text-white p-3 rounded-lg"><Send size={18}/></button>
                             </form>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
                    <button onClick={handleGuestCheckin} disabled={isCheckingIn} className="bg-brand-dark text-white font-extrabold py-4 px-8 rounded-lg text-xl hover:bg-gray-700 transition-transform hover:scale-105 flex items-center justify-center gap-3 mx-auto disabled:bg-gray-500">
                        {isCheckingIn ? <Loader2 className="animate-spin" /> : <LogIn size={24}/>}
                        {isCheckingIn ? 'Processando Check-in...' : 'Já cheguei ao hostel! Liberar meu painel.'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PreArrivalPortalView;
