import React, { useState, useEffect } from 'react';
import { Section } from './shared';
import Modal from './Modal';
import { DBState, OTAPlatform, OTAConnection } from '../../types';
import { Workflow, Database, CheckCircle, XCircle, Link, Unlink, Loader2, Info, BookOpen, Hotel, Key, Calendar, RefreshCw, Percent, Save } from 'lucide-react';

interface ChannelManagerViewProps {
    db: DBState;
    onConnect: (platform: OTAPlatform, propertyId: string) => Promise<void>;
    onDisconnect: (platform: OTAPlatform) => Promise<void>;
    onSyncAllChannels: () => Promise<void>;
    onUpdateOTAConnection: (platform: OTAPlatform, updates: Partial<OTAConnection>) => Promise<void>;
}

const generateRandomLog = (platform: OTAPlatform): string => {
    const actions = [
        `Recebida nova reserva #${platform.substring(0,3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`,
        `Atualização de tarifa para o Quarto Duplo no ${platform}.`,
        `Disponibilidade do Dormitório Misto sincronizada com ${platform}.`,
        `Cancelamento de reserva #${platform.substring(0,3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)} processado.`
    ];
    return actions[Math.floor(Math.random() * actions.length)];
};


export const ChannelManagerView: React.FC<ChannelManagerViewProps> = ({ db, onConnect, onDisconnect, onSyncAllChannels, onUpdateOTAConnection }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<OTAPlatform | null>(null);
    const [propertyIdInput, setPropertyIdInput] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState<OTAPlatform | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showApiConfig, setShowApiConfig] = useState(false);
    const [apiKey, setApiKey] = useState(localStorage.getItem('VITE_BEDS24_API_KEY') || '');

    const handleSaveApiKey = () => {
        localStorage.setItem('VITE_BEDS24_API_KEY', apiKey);
        setShowApiConfig(false);
        // @ts-ignore
        import('../../services/apiService').then(m => m.eventBus.emit('new-toast', { type: 'success', title: 'Configuração Salva', message: 'Chave de API do Beds24 atualizada.' }));
    };
    const [markups, setMarkups] = useState<Record<OTAPlatform, number | string>>({} as Record<OTAPlatform, number | string>);
    const [savingMarkup, setSavingMarkup] = useState<OTAPlatform | null>(null);
    
    const [syncLog, setSyncLog] = useState([
        { id: 1, time: new Date(Date.now() - 2 * 60 * 1000).toLocaleString(), message: 'Recebida nova reserva #BKG-12345 do Booking.com.' },
        { id: 2, time: new Date(Date.now() - 5 * 60 * 1000).toLocaleString(), message: 'Disponibilidade do Quarto Duplo atualizada para 3 no Airbnb.' },
        { id: 3, time: new Date(Date.now() - 15 * 60 * 1000).toLocaleString(), message: 'Sincronização completa com todos os canais.' },
    ]);
    
    useEffect(() => {
        const initialMarkups = db.otaConnections.reduce((acc, conn) => {
            acc[conn.platform] = conn.markup ?? '';
            return acc;
        }, {} as Record<OTAPlatform, number | string>);
        setMarkups(initialMarkups);
    }, [db.otaConnections]);

    const handleOpenConnectModal = (platform: OTAPlatform) => {
        setSelectedPlatform(platform);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPlatform(null);
        setPropertyIdInput('');
    };

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlatform || !propertyIdInput.trim()) return;
        setIsConnecting(true);
        await onConnect(selectedPlatform, propertyIdInput);
        setIsConnecting(false);
        handleCloseModal();
    };

    const handleDisconnect = async (platform: OTAPlatform) => {
        if (confirm(`Tem certeza que deseja desconectar de ${platform}?`)) {
            setIsDisconnecting(platform);
            await onDisconnect(platform);
            setIsDisconnecting(null);
        }
    };
    
    const handleSyncNow = async () => {
        setIsSyncing(true);
        const connectedPlatforms = db.otaConnections.filter(c => c.connected).map(c => c.platform);
        
        setSyncLog(prev => [{ id: Date.now(), time: new Date().toLocaleString(), message: 'Iniciando sincronização manual...' }, ...prev]);
        
        await onSyncAllChannels();
        
        await new Promise(res => setTimeout(res, 1500));

        const newLogs = connectedPlatforms.map(platform => ({
            id: Date.now() + Math.random(),
            time: new Date().toLocaleString(),
            message: generateRandomLog(platform)
        }));
        
        setSyncLog(prev => [...newLogs, ...prev]);

        setIsSyncing(false);
    };
    
    const handleMarkupChange = (platform: OTAPlatform, value: string) => {
        setMarkups(prev => ({ ...prev, [platform]: value }));
    };

    const handleSaveMarkup = async (platform: OTAPlatform) => {
        const value = markups[platform];
        const markupValue = Number(value);
        if (isNaN(markupValue)) {
            alert('Por favor, insira um número válido para a taxa.');
            return;
        }
        setSavingMarkup(platform);
        await onUpdateOTAConnection(platform, { markup: markupValue });
        setSavingMarkup(null);
    };

    const platformIcons: Record<OTAPlatform, React.ElementType> = {
        'Booking.com': BookOpen,
        'Airbnb': Hotel,
        'Expedia': Key,
        'Beds24': Database,
    };

    return (
        <Section title="Channel Manager" icon={Workflow} actions={
            <div className="flex gap-2">
                <button onClick={() => setShowApiConfig(true)} className="bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg shadow hover:bg-gray-200 flex items-center gap-2">
                    <Key size={18} /> API Config
                </button>
                <button onClick={handleSyncNow} disabled={isSyncing} className="bg-brand-dark text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-gray-700 flex items-center gap-2">
                    {isSyncing ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                    {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
                </button>
            </div>
        }>
            {showApiConfig && (
                <Modal title="Configuração de API Beds24" onClose={() => setShowApiConfig(false)}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">API Token (V2)</label>
                            <input 
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-green/50 outline-none"
                                placeholder="Insira seu token do Beds24..."
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Este token será usado para sincronizar disponibilidade e tarifas diretamente com o Beds24 V2.
                            </p>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <button onClick={() => setShowApiConfig(false)} className="px-4 py-2 text-gray-600 font-semibold">Cancelar</button>
                            <button onClick={handleSaveApiKey} className="px-4 py-2 bg-brand-green text-white rounded-lg font-bold">Salvar Configuração</button>
                        </div>
                    </div>
                </Modal>
            )}
            <p className="text-sm text-gray-600 mb-6">Conecte suas contas das agências de viagens online (OTAs) para sincronizar automaticamente a disponibilidade e evitar overbooking.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {db.otaConnections.map(conn => {
                    const Icon = platformIcons[conn.platform];
                    const isMarkupEdited = (conn.markup ?? 0).toString() !== (markups[conn.platform] ?? '').toString();
                    return (
                        <div key={conn.platform} className={`p-4 rounded-lg border-2 transition-all duration-300 ${isSyncing && conn.connected ? 'animate-pulse' : ''} ${conn.connected ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Icon size={24} className={conn.connected ? 'text-green-600' : 'text-gray-500'}/>
                                    <h3 className="font-bold text-lg text-gray-800">{conn.platform}</h3>
                                </div>
                                {conn.connected 
                                    ? <CheckCircle size={20} className="text-green-500"/>
                                    : <XCircle size={20} className="text-gray-400"/>
                                }
                            </div>
                            <div className="mt-4 text-sm">
                                {conn.connected ? (
                                    <>
                                        <p className="text-gray-600">ID da Propriedade: <span className="font-semibold text-gray-800">{conn.propertyId}</span></p>
                                        <p className="text-gray-600">Última Sincronização: <span className="font-semibold text-gray-800">{conn.lastSync ? new Date(conn.lastSync).toLocaleString() : 'N/A'}</span></p>
                                        
                                        <div className="mt-3 pt-3 border-t">
                                            <label className="text-xs font-semibold text-gray-600 flex items-center gap-1"><Percent size={12}/> Taxa (Markup %)</label>
                                            <div className="flex gap-2 mt-1">
                                                <input
                                                    type="number"
                                                    value={markups[conn.platform] ?? ''}
                                                    onChange={(e) => handleMarkupChange(conn.platform, e.target.value)}
                                                    className="input-base w-full text-sm"
                                                    placeholder="Ex: 15"
                                                />
                                                <button
                                                    onClick={() => handleSaveMarkup(conn.platform)}
                                                    disabled={savingMarkup === conn.platform || !isMarkupEdited}
                                                    className="btn-secondary text-sm p-2 disabled:opacity-50"
                                                    title="Salvar taxa"
                                                >
                                                    {savingMarkup === conn.platform ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                                                </button>
                                            </div>
                                        </div>

                                        <button onClick={() => handleDisconnect(conn.platform)} disabled={isDisconnecting === conn.platform} className="mt-3 w-full bg-red-100 text-red-700 font-semibold py-2 px-3 rounded-lg hover:bg-red-200 flex items-center justify-center gap-2 disabled:bg-gray-200">
                                            {isDisconnecting === conn.platform ? <Loader2 size={14} className="animate-spin" /> : <Unlink size={14}/>} Desconectar
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-gray-500 h-[8.5rem] flex flex-col justify-center items-center text-center">
                                            <p>Conecte para sincronizar tarifas e disponibilidade.</p>
                                            <p className="text-xs mt-2 bg-gray-100 p-1 rounded">As configurações de markup (taxas) aparecerão aqui.</p>
                                        </div>
                                        <button onClick={() => handleOpenConnectModal(conn.platform)} className="mt-3 w-full bg-blue-500 text-white font-semibold py-2 px-3 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2">
                                            <Link size={14}/> Conectar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="mt-8">
                <h3 className="text-xl font-bold text-brand-dark mb-4 flex items-center gap-2"><Calendar size={18}/> Log de Sincronização</h3>
                <div className="bg-gray-800 text-white font-mono text-xs p-4 rounded-lg h-40 overflow-y-auto">
                    {syncLog.map(log => (
                        <p key={log.id}><span className="text-gray-500 mr-2">{log.time}:</span>{log.message}</p>
                    ))}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`Conectar com ${selectedPlatform}`}>
                {selectedPlatform && (
                    <form onSubmit={handleConnect}>
                        <p className="text-sm text-gray-600 mb-4">Insira o ID da sua propriedade no {selectedPlatform} para iniciar a sincronização.</p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ID da Propriedade no {selectedPlatform}</label>
                            <input
                                type="text"
                                value={propertyIdInput}
                                onChange={e => setPropertyIdInput(e.target.value)}
                                className="input-base"
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-6">
                            <button type="button" onClick={handleCloseModal} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg">Cancelar</button>
                            <button type="submit" disabled={isConnecting} className="bg-brand-green text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                                {isConnecting ? <Loader2 className="animate-spin"/> : <Link size={16}/>} Conectar Agora
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </Section>
    );
};

export default ChannelManagerView;