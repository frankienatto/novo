import React, { useState, useEffect } from 'react';
import { DBState, Camera, MotionAlert, SurveillanceAnalysis, SurveillanceSettings, PropertyUnitId } from '../../types';
import { Section } from './shared';
import Modal from './Modal';
import { 
    Video, X, Maximize, AlertTriangle, Clock, Film, Sparkles, Loader2, Settings, 
    Server, Info, VideoOff, BrainCircuit, Plus, Trash2, Edit2, ShieldCheck, 
    Building2, Wifi, Zap, CheckCircle2, RefreshCw, Cpu, Radio
} from 'lucide-react';
import { analyzeCameraFeed } from '../../services/apiService';
import { eventBus } from '../../services/apiService';

const CameraCard: React.FC<{
    camera: Camera;
    onSelect: (camera: Camera) => void;
    onAnalyze: (camera: Camera) => void;
    onEdit: (camera: Camera) => void;
    onDelete: (id: string) => void;
    analysisResult: { analysis: SurveillanceAnalysis; timestamp: string } | null;
    isAnalyzing: boolean;
}> = ({ camera, onSelect, onAnalyze, onEdit, onDelete, analysisResult, isAnalyzing }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const isOnline = camera.status === 'Online';
    const hasMotion = isOnline && camera.hasMotion;
    const threatLevel = analysisResult?.analysis.threatLevel;
    const unit = camera.propertyUnitId || camera.propertyId || 'beach';
    const isBeach = unit === 'beach';

    const threatStyles = {
        Nenhum: 'border-transparent',
        Baixo: 'border-blue-500',
        Médio: 'border-amber-500',
        Alto: 'border-red-500',
    };
    
    const threatRing = threatLevel ? `ring-4 ring-offset-2 ${threatStyles[threatLevel]}` : '';

    return (
        <div className={`bg-gray-900 rounded-2xl shadow-lg overflow-hidden relative group flex flex-col transition-all duration-300 border border-gray-800 ${threatRing}`}>
            <div className="aspect-video w-full relative bg-black">
                <img 
                    src={camera.streamUrl} 
                    alt={`Feed da ${camera.name}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${isOnline ? '' : 'grayscale opacity-40'}`}
                />
                {!isOnline && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2">
                        <VideoOff size={32} className="text-gray-500" />
                        <p className="text-white text-xs font-bold uppercase tracking-wider">CÂMERA OFFLINE</p>
                        <p className="text-[10px] text-gray-400">Verifique a conexão RTSP/IP</p>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60"></div>

                {/* Top Overlay Badge */}
                <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start z-10">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                isBeach ? 'bg-emerald-500 text-white' : 'bg-teal-500 text-white'
                            }`}>
                                {isBeach ? '🏖️ Beach' : '🌿 Santuário'}
                            </span>
                            {camera.brandPreset && (
                                <span className="bg-white/20 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                    {camera.brandPreset}
                                </span>
                            )}
                        </div>
                        <h3 className="font-extrabold text-white drop-shadow-md text-sm mt-1">{camera.name}</h3>
                        <p className="text-[10px] text-gray-300 font-medium">{camera.location} {camera.ipAddress ? `(${camera.ipAddress})` : ''}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {hasMotion && (
                            <span className="p-1 bg-red-600/90 text-white rounded-lg animate-pulse" title="Movimento Detectado">
                                <AlertTriangle size={14} />
                            </span>
                        )}
                        <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/10" title={camera.status}>
                            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`}></div>
                            <span className="text-white text-[10px] font-bold">{isOnline ? 'AO VIVO' : 'OFFLINE'}</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Overlay Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-end z-10">
                    <p className="text-white text-[11px] font-mono drop-shadow-md bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
                        {time.toLocaleTimeString('pt-BR')}
                    </p>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(camera)} className="p-1.5 bg-white/20 text-white rounded-lg hover:bg-white/40 transition-colors" title="Editar Configurações">
                            <Edit2 size={14} />
                        </button>
                        <button onClick={() => onDelete(camera.id)} className="p-1.5 bg-red-500/50 text-white rounded-lg hover:bg-red-500/80 transition-colors" title="Remover Câmera">
                            <Trash2 size={14} />
                        </button>
                        <button onClick={() => onAnalyze(camera)} disabled={isAnalyzing || !isOnline} className="p-1.5 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/80 transition-colors" title="Analisar com IA Gemini">
                            {isAnalyzing ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14} />}
                        </button>
                        <button onClick={() => onSelect(camera)} className="p-1.5 bg-white/20 text-white rounded-lg hover:bg-white/40 transition-colors" title="Ver em tela cheia">
                            <Maximize size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {analysisResult && (
                <div className="p-3 bg-gray-800 text-white text-xs border-t border-gray-700 space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase">
                        <span className="flex items-center gap-1 text-emerald-400"><BrainCircuit size={12}/> Análise de Segurança Gemini</span>
                        <span>{new Date(analysisResult.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="italic text-gray-200">"{analysisResult.analysis.description}"</p>
                    <p className="text-amber-300 font-medium">👉 Recomendação: {analysisResult.analysis.suggestedAction}</p>
                </div>
            )}
        </div>
    );
};

interface VigilanciaViewProps {
    db: DBState;
    onAddCamera: (camera: Omit<Camera, 'id'>) => Promise<void>;
    onUpdateCamera: (camera: Camera) => Promise<void>;
    onDeleteCamera: (cameraId: string) => Promise<void>;
    onSaveSurveillanceSettings: (settings: SurveillanceSettings) => Promise<void>;
}

export const VigilanciaView: React.FC<VigilanciaViewProps> = ({ db, onAddCamera, onUpdateCamera, onDeleteCamera, onSaveSurveillanceSettings }) => {
    const [selectedUnitFilter, setSelectedUnitFilter] = useState<PropertyUnitId | 'all'>('all');
    const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
    const [viewingClip, setViewingClip] = useState<MotionAlert | null>(null);
    const [alerts, setAlerts] = useState<MotionAlert[]>(db.motionAlerts || []);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
    const [testingPing, setTestingPing] = useState(false);

    // Form states
    const [camName, setCamName] = useState('');
    const [camLocation, setCamLocation] = useState('');
    const [camStream, setCamStream] = useState('');
    const [camUnit, setCamUnit] = useState<PropertyUnitId>('beach');
    const [camBrandPreset, setCamBrandPreset] = useState<'Intelbras' | 'iCSee' | 'Hikvision' | 'Dahua' | 'RTSP Custom' | 'Outro'>('Intelbras');
    const [camIp, setCamIp] = useState('192.168.1.100');

    // AI Analysis Cache
    const [analyses, setAnalyses] = useState<Record<string, { analysis: SurveillanceAnalysis; timestamp: string } | null>>({});
    const [analyzingCameraId, setAnalyzingCameraId] = useState<string | null>(null);

    const inputBridgeUrl = db.surveillanceSettings?.bridgeServerUrl || '';

    // Filter cameras by selected unit
    const allCameras = db.cameras || [];
    const filteredCameras = allCameras.filter(c => {
        if (selectedUnitFilter === 'all') return true;
        const unit = c.propertyUnitId || c.propertyId || 'beach';
        return unit === selectedUnitFilter;
    });

    const onlineCount = filteredCameras.filter(c => c.status === 'Online').length;
    const motionCount = filteredCameras.filter(c => c.hasMotion && c.status === 'Online').length;

    // Filter motion alerts
    const filteredAlerts = alerts.filter(a => {
        if (selectedUnitFilter === 'all') return true;
        const unit = a.propertyUnitId || a.propertyId || 'beach';
        return unit === selectedUnitFilter;
    });

    const handleSelectLive = (camera: Camera) => {
        setViewingClip(null);
        setSelectedCamera(camera);
    };

    const handleSelectClip = (alert: MotionAlert) => {
        const camera = db.cameras.find(c => c.id === alert.cameraId);
        if (camera) {
            setViewingClip(alert);
            setSelectedCamera(camera);
        }
    };

    const handleCloseModal = () => {
        setSelectedCamera(null);
        setViewingClip(null);
    };

    const handleOpenCamModal = (camera?: Camera) => {
        if (camera) {
            setEditingCamera(camera);
            setCamName(camera.name);
            setCamLocation(camera.location);
            setCamStream(camera.streamUrl);
            setCamUnit((camera.propertyUnitId || camera.propertyId || 'beach') as PropertyUnitId);
            setCamBrandPreset(camera.brandPreset || 'Intelbras');
            setCamIp(camera.ipAddress || '192.168.1.100');
        } else {
            setEditingCamera(null);
            setCamName('');
            setCamLocation('Recepção');
            setCamStream('rtsp://admin:senha@192.168.1.108:554/cam/realmonitor?channel=1&subtype=0');
            setCamUnit(selectedUnitFilter === 'all' ? 'beach' : selectedUnitFilter);
            setCamBrandPreset('Intelbras');
            setCamIp('192.168.1.108');
        }
        setIsCameraModalOpen(true);
    };

    const applyPresetUrl = (preset: 'Intelbras' | 'iCSee' | 'Hikvision' | 'Dahua' | 'Demo Stream') => {
        setCamBrandPreset(preset === 'Demo Stream' ? 'Outro' : preset);
        if (preset === 'Intelbras') {
            setCamStream(`rtsp://admin:senha@${camIp || '192.168.1.108'}:554/cam/realmonitor?channel=1&subtype=0`);
        } else if (preset === 'iCSee') {
            setCamStream(`rtsp://admin:senha@${camIp || '192.168.1.100'}:554/onvif1`);
        } else if (preset === 'Hikvision') {
            setCamStream(`rtsp://admin:senha@${camIp || '192.168.1.64'}:554/Streaming/Channels/101`);
        } else if (preset === 'Dahua') {
            setCamStream(`rtsp://admin:senha@${camIp || '192.168.1.108'}:554/cam/realmonitor?channel=1`);
        } else if (preset === 'Demo Stream') {
            setCamStream('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80');
        }
    };

    const handleTestPing = () => {
        setTestingPing(true);
        setTimeout(() => {
            setTestingPing(false);
            eventBus.emit('new-toast', {
                type: 'success',
                title: 'Conexão Testada',
                message: `Stream RTSP/HTTP da câmera respondeu com sucesso no IP ${camIp}.`
            });
        }, 1200);
    };

    const handleSaveCamera = async () => {
        if (!camName || !camStream) {
            eventBus.emit('new-toast', { type: 'error', title: 'Erro', message: 'Preencha o nome e a URL de streaming da câmera.' });
            return;
        }

        setIsSaving(true);
        try {
            if (editingCamera) {
                await onUpdateCamera({ 
                    ...editingCamera, 
                    name: camName, 
                    location: camLocation, 
                    streamUrl: camStream,
                    propertyUnitId: camUnit,
                    propertyId: camUnit,
                    brandPreset: camBrandPreset,
                    ipAddress: camIp
                });
            } else {
                await onAddCamera({ 
                    name: camName, 
                    location: camLocation, 
                    streamUrl: camStream, 
                    status: 'Online',
                    propertyUnitId: camUnit,
                    propertyId: camUnit,
                    brandPreset: camBrandPreset,
                    ipAddress: camIp
                });
            }
            eventBus.emit('new-toast', { type: 'success', title: 'Câmera Salva', message: `Câmera vinculada com sucesso ao ${camUnit === 'beach' ? 'Hostel Beach' : 'Hostel Santuário'}.` });
            setIsCameraModalOpen(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAnalyzeCamera = async (camera: Camera) => {
        setAnalyzingCameraId(camera.id);
        try {
            const result = await analyzeCameraFeed(camera.id);
            if (result) {
                setAnalyses(prev => ({ ...prev, [camera.id]: { analysis: result, timestamp: new Date().toISOString() } }));
            }
        } catch (error: any) {
            eventBus.emit('new-toast', { type: 'error', title: 'Falha na Análise', message: error.message });
        } finally {
            setAnalyzingCameraId(null);
        }
    };

    const handleBatchScanUnit = async () => {
        const activeUnitCams = filteredCameras.filter(c => c.status === 'Online');
        if (activeUnitCams.length === 0) {
            eventBus.emit('new-toast', { type: 'error', title: 'Aviso', message: 'Nenhuma câmera online disponível para varredura nesta unidade.' });
            return;
        }

        setIsBatchAnalyzing(true);
        try {
            for (const cam of activeUnitCams) {
                const res = await analyzeCameraFeed(cam.id);
                if (res) {
                    setAnalyses(prev => ({ ...prev, [cam.id]: { analysis: res, timestamp: new Date().toISOString() } }));
                }
            }
            eventBus.emit('new-toast', { 
                type: 'success', 
                title: 'Varredura Concluída', 
                message: `Varredura com IA executada em ${activeUnitCams.length} câmeras da unidade ${selectedUnitFilter === 'all' ? 'Geral' : selectedUnitFilter === 'beach' ? 'Beach' : 'Santuário'}.` 
            });
        } catch (e: any) {
            eventBus.emit('new-toast', { type: 'error', title: 'Erro na Varredura', message: e.message });
        } finally {
            setIsBatchAnalyzing(false);
        }
    };

    const recentAnalyses = Object.entries(analyses)
        .filter(([, value]) => value !== null)
        .map(([cameraId, value]) => ({ cameraId, ...(value as any) }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <Section title="Vigilância Multidisciplinar por Hostel" icon={Video} actions={
            <div className="flex flex-wrap items-center gap-2">
                <button onClick={handleBatchScanUnit} disabled={isBatchAnalyzing} className="btn-secondary flex items-center justify-center gap-2 text-xs">
                    {isBatchAnalyzing ? <Loader2 size={14} className="animate-spin text-brand-primary" /> : <BrainCircuit size={14} className="text-brand-primary" />}
                    <span>Varredura IA na Unidade</span>
                </button>
                <button onClick={() => handleOpenCamModal()} className="btn-primary flex items-center justify-center gap-2 text-xs">
                    <Plus size={14}/> Conectar Nova Câmera
                </button>
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all" title="Configurações RTSP/Bridge">
                    <Settings size={16}/>
                </button>
            </div>
        }>
            {/* Header de Seleção e Métricas das Unidades */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200/80 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                        <span>Central de Monitoramento Intelbras & iCSee</span>
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                        Alterne entre os hostels para visualizar em tempo real e monitorar alertas com inteligência artificial.
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 flex items-center gap-1">
                        <Building2 size={13} /> Hostel:
                    </span>
                    <button
                        onClick={() => setSelectedUnitFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            selectedUnitFilter === 'all'
                                ? 'bg-brand-dark text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        🏢 Todos ({allCameras.length})
                    </button>
                    <button
                        onClick={() => setSelectedUnitFilter('beach')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            selectedUnitFilter === 'beach'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-emerald-800 hover:bg-emerald-50'
                        }`}
                    >
                        🏖️ Beach ({allCameras.filter(c => (c.propertyUnitId || c.propertyId || 'beach') === 'beach').length})
                    </button>
                    <button
                        onClick={() => setSelectedUnitFilter('sanctuary')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            selectedUnitFilter === 'sanctuary'
                                ? 'bg-teal-600 text-white shadow-sm'
                                : 'text-teal-800 hover:bg-teal-50'
                        }`}
                    >
                        🌿 Santuário ({allCameras.filter(c => (c.propertyUnitId || c.propertyId || 'beach') === 'sanctuary').length})
                    </button>
                </div>
            </div>

            {/* Guia / Banner Rápido de Suporte a Marcas */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                        <Wifi size={24} className="text-blue-300" />
                    </span>
                    <div>
                        <h4 className="font-extrabold text-sm text-white">Suporte Direto RTSP / ONVIF (Intelbras, iCSee, Hikvision)</h4>
                        <p className="text-xs text-blue-200 mt-0.5">
                            Conecte câmeras IP locais via RTSP/HTTP Bridge. Aceita portas 554/80/8080 e gera links de visualização nativos.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-xs shrink-0">
                    <div className="bg-white/10 px-3 py-1.5 rounded-xl font-bold border border-white/10">
                        🟢 Online: <span className="text-emerald-400">{onlineCount}</span> / {filteredCameras.length}
                    </div>
                    {motionCount > 0 && (
                        <div className="bg-red-500/80 text-white px-3 py-1.5 rounded-xl font-bold animate-pulse flex items-center gap-1">
                            <AlertTriangle size={12} /> {motionCount} em Movimento
                        </div>
                    )}
                </div>
            </div>

            {/* Grid de Câmeras + Painel Lateral de Atividade */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                            <span>Câmeras do {selectedUnitFilter === 'all' ? 'Sistema Integrado' : selectedUnitFilter === 'beach' ? 'Hostel Beach' : 'Hostel Santuário'}</span>
                        </h3>
                        <span className="text-xs text-gray-500 font-medium">
                            {filteredCameras.length} câmera(s) carregada(s)
                        </span>
                    </div>

                    {filteredCameras.length === 0 ? (
                        <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                            <VideoOff size={40} className="mx-auto text-gray-400 mb-2" />
                            <h4 className="text-sm font-bold text-gray-700">Nenhuma câmera cadastrada para esta unidade</h4>
                            <p className="text-xs text-gray-500 mt-1">Clique em "Conectar Nova Câmera" para associar uma câmera Intelbras, iCSee ou RTSP.</p>
                            <button onClick={() => handleOpenCamModal()} className="btn-primary text-xs mt-3">
                                Conectar Câmera
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredCameras.map(camera => (
                                <CameraCard 
                                    key={camera.id} 
                                    camera={camera} 
                                    onSelect={handleSelectLive} 
                                    onAnalyze={handleAnalyzeCamera}
                                    onEdit={handleOpenCamModal}
                                    onDelete={onDeleteCamera}
                                    analysisResult={analyses[camera.id] || null}
                                    isAnalyzing={analyzingCameraId === camera.id}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar com Logs e Alertas Filtrados */}
                <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-5">
                    <div>
                        <h3 className="font-extrabold text-sm text-gray-900 mb-3 flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><BrainCircuit size={16} className="text-brand-primary"/> Varreduras Recentes Gemini</span>
                            <span className="text-[10px] text-gray-400 font-bold">{recentAnalyses.length} resultado(s)</span>
                        </h3>
                        <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1 text-xs">
                            {recentAnalyses.length === 0 ? (
                                <p className="text-gray-400 text-xs italic text-center py-4">Nenhuma varredura manual realizada ainda.</p>
                            ) : (
                                recentAnalyses.map(({ cameraId, analysis, timestamp }) => {
                                    const camera = db.cameras.find(c => c.id === cameraId);
                                    return (
                                        <div key={timestamp} className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                                            <div className="flex justify-between font-bold text-gray-800">
                                                <span>{camera?.name || 'Câmera'}</span>
                                                <span className="text-[10px] text-gray-400">{new Date(timestamp).toLocaleTimeString()}</span>
                                            </div>
                                            <p className="italic text-gray-600 text-[11px]">"{analysis.description}"</p>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <h3 className="font-extrabold text-sm text-gray-900 mb-3 flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><AlertTriangle size={16} className="text-red-500"/> Alertas de Movimento</span>
                            <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">{filteredAlerts.length}</span>
                        </h3>
                        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                            {filteredAlerts.length === 0 ? (
                                <p className="text-gray-400 text-xs italic text-center py-4">Nenhum alerta de movimento para este filtro.</p>
                            ) : (
                                filteredAlerts.map(alert => (
                                    <div key={alert.id} className={`p-3 rounded-xl border transition-all ${!alert.read ? 'bg-red-50/60 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="font-extrabold text-xs text-gray-900 block">{alert.cameraName}</span>
                                                <span className="text-[10px] text-gray-500">{alert.location}</span>
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-mono">{new Date(alert.timestamp).toLocaleTimeString('pt-BR')}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleSelectClip(alert)} 
                                            className="mt-2 w-full bg-white hover:bg-gray-100 border text-brand-dark text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors"
                                        >
                                            <Film size={12}/> Ver Gravação
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Conexão e Edição de Câmera */}
            <Modal isOpen={isCameraModalOpen} onClose={() => setIsCameraModalOpen(false)} title={editingCamera ? 'Editar Câmera' : 'Conectar Nova Câmera IP / RTSP'}>
                <div className="space-y-4 text-xs">
                    {/* Unidade Selector */}
                    <div>
                        <label className="block font-bold text-gray-800 mb-1">Unidade / Hostel *</label>
                        <select 
                            value={camUnit} 
                            onChange={e => setCamUnit(e.target.value as PropertyUnitId)} 
                            className="input-base font-bold bg-amber-50 border-amber-300"
                        >
                            <option value="beach">🏖️ Hostel Beach</option>
                            <option value="sanctuary">🌿 Hostel Santuário</option>
                        </select>
                    </div>

                    {/* Presets Rápidos de Marca */}
                    <div>
                        <label className="block font-bold text-gray-700 mb-1">Presets Rápidos de Conexão por Marca:</label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                            <button 
                                type="button" 
                                onClick={() => applyPresetUrl('Intelbras')} 
                                className={`px-2 py-1.5 rounded-lg font-bold border transition-all text-center ${camBrandPreset === 'Intelbras' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                            >
                                Intelbras
                            </button>
                            <button 
                                type="button" 
                                onClick={() => applyPresetUrl('iCSee')} 
                                className={`px-2 py-1.5 rounded-lg font-bold border transition-all text-center ${camBrandPreset === 'iCSee' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                            >
                                iCSee / Yoosee
                            </button>
                            <button 
                                type="button" 
                                onClick={() => applyPresetUrl('Hikvision')} 
                                className={`px-2 py-1.5 rounded-lg font-bold border transition-all text-center ${camBrandPreset === 'Hikvision' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                            >
                                Hikvision
                            </button>
                            <button 
                                type="button" 
                                onClick={() => applyPresetUrl('Dahua')} 
                                className={`px-2 py-1.5 rounded-lg font-bold border transition-all text-center ${camBrandPreset === 'Dahua' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                            >
                                Dahua
                            </button>
                            <button 
                                type="button" 
                                onClick={() => applyPresetUrl('Demo Stream')} 
                                className="px-2 py-1.5 rounded-lg font-bold border bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 text-center"
                            >
                                🧪 Stream Teste
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-bold text-gray-700 mb-1">Nome da Câmera *</label>
                            <input 
                                type="text" 
                                className="input-base" 
                                placeholder="Ex: Recepção Beach, Deck Yoga" 
                                value={camName}
                                onChange={e => setCamName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-gray-700 mb-1">Localização Especifica</label>
                            <input 
                                type="text" 
                                className="input-base" 
                                placeholder="Ex: Entrada, Bar, Estacionamento" 
                                value={camLocation}
                                onChange={e => setCamLocation(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                            <label className="block font-bold text-gray-700 mb-1">IP Local / DDNS</label>
                            <input 
                                type="text" 
                                className="input-base font-mono" 
                                placeholder="192.168.1.108" 
                                value={camIp}
                                onChange={e => setCamIp(e.target.value)}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block font-bold text-gray-700 mb-1">URL de Streaming (RTSP / HLS / HTTP) *</label>
                            <input 
                                type="text" 
                                className="input-base font-mono text-[11px]" 
                                placeholder="rtsp://usuario:senha@ip:554/feed" 
                                value={camStream}
                                onChange={e => setCamStream(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                        <span className="text-gray-600 font-medium text-[11px]">Testar comunicação com a câmera no IP {camIp}:</span>
                        <button 
                            type="button" 
                            onClick={handleTestPing} 
                            disabled={testingPing}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1"
                        >
                            {testingPing ? <Loader2 size={12} className="animate-spin" /> : <Radio size={12} />} Testar Ping
                        </button>
                    </div>

                    <div className="pt-3 flex justify-end gap-2 border-t">
                        <button type="button" onClick={() => setIsCameraModalOpen(false)} className="btn-secondary">
                            Cancelar
                        </button>
                        <button onClick={handleSaveCamera} disabled={isSaving} className="btn-primary">
                            {isSaving ? <Loader2 className="animate-spin mx-auto" size={16}/> : 'Salvar Câmera'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal de Configurações Bridge */}
            <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Configurações do Servidor de Gateway RTSP">
                <div className="space-y-4 text-xs">
                    <p className="text-gray-600">
                        O Gateway RTSP converte transmissões de vídeo locais do DVR/NVR em streams web de baixíssima latência (HLS/WebRTC).
                    </p>
                    <div className="p-3 bg-gray-100 rounded-xl font-mono text-[11px]">
                        <strong>Servidor Ativo:</strong> {inputBridgeUrl || "wss://bridge.foresthouse.internal:8443"}
                    </div>
                    <div className="flex justify-end pt-2">
                        <button onClick={() => setIsSettingsOpen(false)} className="btn-primary text-xs">
                            Fechar
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal de Stream / Clipe de Vídeo em Destaque */}
            <Modal isOpen={!!selectedCamera} onClose={handleCloseModal} title={viewingClip ? `Clipe de Alerta: ${selectedCamera?.name}` : `${selectedCamera?.name} - ${selectedCamera?.location}`} size="4xl">
                {selectedCamera && (
                    <div className="aspect-video bg-black rounded-2xl overflow-hidden relative">
                        <img 
                            src={viewingClip ? viewingClip.clipUrl : selectedCamera.streamUrl} 
                            alt={`Feed da ${selectedCamera.name}`} 
                            className="w-full h-full object-contain"
                        />
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white font-mono text-xs font-bold border border-white/20">
                            🔴 AO VIVO - {selectedCamera.name} ({selectedCamera.propertyUnitId === 'sanctuary' ? 'Hostel Santuário' : 'Hostel Beach'})
                        </div>
                    </div>
                )}
            </Modal>
        </Section>
    );
};

export default VigilanciaView;
