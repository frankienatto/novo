import React, { useState } from 'react';
import { DBState, Camera, PropertyUnitId } from '../../types';
import { Video, Plus, Building2, Maximize, Edit2, Trash2, VideoOff, Wifi, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';
import { eventBus } from '../../services/apiService';

interface SurveillanceDashboardProps {
    db: DBState;
    selectedUnit?: PropertyUnitId | 'all';
    onAddCamera?: (camera: Omit<Camera, 'id'>) => Promise<void>;
    onUpdateCamera?: (camera: Camera) => Promise<void>;
    onDeleteCamera?: (cameraId: string) => Promise<void>;
}

export const SurveillanceDashboard: React.FC<SurveillanceDashboardProps> = ({
    db,
    selectedUnit = 'all',
    onAddCamera,
    onUpdateCamera,
    onDeleteCamera
}) => {
    const [unitFilter, setUnitFilter] = useState<PropertyUnitId | 'all'>(selectedUnit);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
    const [editingCamera, setEditingCamera] = useState<Camera | null>(null);

    // Form State
    const [camName, setCamName] = useState('');
    const [camLocation, setCamLocation] = useState('');
    const [camStreamUrl, setCamStreamUrl] = useState('');
    const [camUnit, setCamUnit] = useState<PropertyUnitId>('beach');
    const [camBrandPreset, setCamBrandPreset] = useState<'Intelbras' | 'iCSee' | 'Hikvision' | 'Dahua' | 'RTSP Custom' | 'Outro'>('Intelbras');
    const [camIp, setCamIp] = useState('192.168.1.108');
    const [isSaving, setIsSaving] = useState(false);

    // Cameras list and filtering
    const cameras = db.cameras || [];
    const filteredCameras = cameras.filter(c => {
        if (unitFilter === 'all') return true;
        const unit = c.propertyUnitId || c.propertyId || 'beach';
        return unit === unitFilter;
    });

    const onlineCount = filteredCameras.filter(c => c.status === 'Online').length;
    const offlineCount = filteredCameras.filter(c => c.status === 'Offline').length;

    const handleOpenAddModal = (cameraToEdit?: Camera) => {
        if (cameraToEdit) {
            setEditingCamera(cameraToEdit);
            setCamName(cameraToEdit.name);
            setCamLocation(cameraToEdit.location);
            setCamStreamUrl(cameraToEdit.streamUrl);
            setCamUnit((cameraToEdit.propertyUnitId || cameraToEdit.propertyId || 'beach') as PropertyUnitId);
            setCamBrandPreset(cameraToEdit.brandPreset || 'Intelbras');
            setCamIp(cameraToEdit.ipAddress || '192.168.1.108');
        } else {
            setEditingCamera(null);
            setCamName('');
            setCamLocation('Recepção');
            setCamStreamUrl('rtsp://admin:senha@192.168.1.108:554/cam/realmonitor?channel=1');
            setCamUnit(unitFilter === 'all' ? 'beach' : unitFilter);
            setCamBrandPreset('Intelbras');
            setCamIp('192.168.1.108');
        }
        setIsModalOpen(true);
    };

    const handlePresetSelection = (brand: 'Intelbras' | 'iCSee' | 'Hikvision' | 'Dahua' | 'Demo Stream') => {
        setCamBrandPreset(brand === 'Demo Stream' ? 'Outro' : brand);
        if (brand === 'Intelbras') {
            setCamStreamUrl(`rtsp://admin:senha@${camIp || '192.168.1.108'}:554/cam/realmonitor?channel=1&subtype=0`);
        } else if (brand === 'iCSee') {
            setCamStreamUrl(`rtsp://admin:senha@${camIp || '192.168.1.100'}:554/onvif1`);
        } else if (brand === 'Hikvision') {
            setCamStreamUrl(`rtsp://admin:senha@${camIp || '192.168.1.64'}:554/Streaming/Channels/101`);
        } else if (brand === 'Dahua') {
            setCamStreamUrl(`rtsp://admin:senha@${camIp || '192.168.1.108'}:554/cam/realmonitor?channel=1`);
        } else if (brand === 'Demo Stream') {
            setCamStreamUrl('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80');
        }
    };

    const handleSaveCamera = async () => {
        if (!camName || !camStreamUrl) {
            eventBus.emit('new-toast', { type: 'error', title: 'Erro', message: 'Preencha o nome e o link da câmera.' });
            return;
        }

        setIsSaving(true);
        try {
            if (editingCamera && onUpdateCamera) {
                await onUpdateCamera({
                    ...editingCamera,
                    name: camName,
                    location: camLocation,
                    streamUrl: camStreamUrl,
                    propertyUnitId: camUnit,
                    propertyId: camUnit,
                    brandPreset: camBrandPreset,
                    ipAddress: camIp
                });
            } else if (onAddCamera) {
                await onAddCamera({
                    name: camName,
                    location: camLocation,
                    streamUrl: camStreamUrl,
                    status: 'Online',
                    propertyUnitId: camUnit,
                    propertyId: camUnit,
                    brandPreset: camBrandPreset,
                    ipAddress: camIp
                });
            }
            eventBus.emit('new-toast', { 
                type: 'success', 
                title: 'Câmera Salva', 
                message: `Câmera vinculada à unidade ${camUnit === 'beach' ? 'Hostel Beach' : 'Hostel Santuário'}.` 
            });
            setIsModalOpen(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (onDeleteCamera) {
            await onDeleteCamera(id);
            eventBus.emit('new-toast', { type: 'success', title: 'Removido', message: 'Câmera desvinculada com sucesso.' });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Filter Controls */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                            <Video size={22} />
                        </span>
                        <div>
                            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Surveillance Dashboard</h2>
                            <p className="text-xs text-gray-500 font-medium">
                                Grade unificada de monitoramento IP / RTSP segmentada por unidade de hospedagem.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Unit Selector */}
                    <div className="flex items-center gap-1 bg-gray-100 p-1.5 rounded-xl">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 flex items-center gap-1">
                            <Building2 size={13} /> Unidade:
                        </span>
                        <button
                            onClick={() => setUnitFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                unitFilter === 'all'
                                    ? 'bg-brand-dark text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            🏢 Todas
                        </button>
                        <button
                            onClick={() => setUnitFilter('beach')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                unitFilter === 'beach'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-emerald-800 hover:bg-emerald-50'
                            }`}
                        >
                            🏖️ Beach ({cameras.filter(c => (c.propertyUnitId || c.propertyId || 'beach') === 'beach').length})
                        </button>
                        <button
                            onClick={() => setUnitFilter('sanctuary')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                unitFilter === 'sanctuary'
                                    ? 'bg-teal-600 text-white shadow-sm'
                                    : 'text-teal-800 hover:bg-teal-50'
                            }`}
                        >
                            🌿 Santuário ({cameras.filter(c => (c.propertyUnitId || c.propertyId || 'beach') === 'sanctuary').length})
                        </button>
                    </div>

                    <button
                        onClick={() => handleOpenAddModal()}
                        className="flex items-center gap-2 bg-brand-primary text-white px-3.5 py-2 rounded-xl hover:bg-brand-primary/90 text-xs font-bold shadow-sm transition-all"
                    >
                        <Plus size={16} />
                        <span>Adicionar Novo Link IP/RTSP</span>
                    </button>
                </div>
            </div>

            {/* Quick Status Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                        <span className="text-emerald-700 font-bold block">Câmeras Operacionais</span>
                        <span className="text-2xl font-black text-emerald-900">{onlineCount}</span>
                    </div>
                    <CheckCircle2 size={28} className="text-emerald-500 opacity-80" />
                </div>

                <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                        <span className="text-gray-600 font-bold block">Status Off-line</span>
                        <span className="text-2xl font-black text-gray-800">{offlineCount}</span>
                    </div>
                    <VideoOff size={28} className="text-gray-400" />
                </div>

                <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                        <span className="text-blue-700 font-bold block">Unidade Selecionada</span>
                        <span className="text-base font-black text-blue-900 uppercase">
                            {unitFilter === 'all' ? 'Todas (Visão Global)' : unitFilter === 'beach' ? 'Hostel Beach' : 'Hostel Santuário'}
                        </span>
                    </div>
                    <Wifi size={28} className="text-blue-500 opacity-80" />
                </div>
            </div>

            {/* Responsive Camera Grid */}
            {filteredCameras.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
                    <VideoOff size={48} className="mx-auto text-gray-300 mb-3" />
                    <h3 className="text-base font-bold text-gray-700">Nenhuma câmera cadastrada para esta unidade</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                        Cadastre o link da câmera (Intelbras, iCSee, Hikvision, RTSP) associado ao Beach House ou Santuário.
                    </p>
                    <button
                        onClick={() => handleOpenAddModal()}
                        className="mt-4 bg-brand-primary text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm"
                    >
                        Adicionar Câmera
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredCameras.map(camera => {
                        const unit = camera.propertyUnitId || camera.propertyId || 'beach';
                        const isBeach = unit === 'beach';
                        const isOnline = camera.status === 'Online';

                        return (
                            <div
                                key={camera.id}
                                className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-md flex flex-col justify-between relative group hover:border-brand-primary/50 transition-all"
                            >
                                <div className="aspect-video bg-black relative">
                                    <img
                                        src={camera.streamUrl}
                                        alt={camera.name}
                                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                                            isOnline ? '' : 'grayscale opacity-30'
                                        }`}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60"></div>

                                    {/* Badges */}
                                    <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-10">
                                        <div className="flex items-center gap-1">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                                isBeach ? 'bg-emerald-600 text-white' : 'bg-teal-600 text-white'
                                            }`}>
                                                {isBeach ? '🏖️ Beach' : '🌿 Santuário'}
                                            </span>
                                            {camera.brandPreset && (
                                                <span className="bg-black/50 backdrop-blur-md text-gray-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/10">
                                                    {camera.brandPreset}
                                                </span>
                                            )}
                                        </div>

                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                                            isOnline ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-white animate-ping' : 'bg-white'}`}></span>
                                            {isOnline ? 'AO VIVO' : 'OFF'}
                                        </span>
                                    </div>

                                    {/* Action Hover Controls */}
                                    <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            onClick={() => handleOpenAddModal(camera)}
                                            className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg transition-colors"
                                            title="Editar Câmera"
                                        >
                                            <Edit2 size={13} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(camera.id)}
                                            className="p-1.5 bg-red-600/70 hover:bg-red-600 text-white rounded-lg transition-colors"
                                            title="Excluir Câmera"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                        <button
                                            onClick={() => setSelectedCamera(camera)}
                                            className="p-1.5 bg-brand-primary text-white rounded-lg transition-colors"
                                            title="Expandir Tela Cheia"
                                        >
                                            <Maximize size={13} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-3 bg-gray-900 text-white text-xs space-y-0.5">
                                    <h4 className="font-extrabold text-sm text-gray-100 truncate">{camera.name}</h4>
                                    <p className="text-[11px] text-gray-400 flex justify-between items-center">
                                        <span>{camera.location}</span>
                                        <span className="font-mono text-[10px] text-gray-500">{camera.ipAddress || 'RTSP IP'}</span>
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Form Modal to Add/Edit Camera */}
            {isModalOpen && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={editingCamera ? 'Editar Link da Câmera' : 'Adicionar Novo Link de Câmera IP / RTSP'}
                >
                    <div className="space-y-4 text-xs">
                        <div>
                            <label className="block font-bold text-gray-800 mb-1">Unidade do Hostel *</label>
                            <select
                                value={camUnit}
                                onChange={e => setCamUnit(e.target.value as PropertyUnitId)}
                                className="input-base font-bold bg-amber-50 border-amber-300"
                            >
                                <option value="beach">🏖️ Hostel Beach</option>
                                <option value="sanctuary">🌿 Hostel Santuário</option>
                            </select>
                        </div>

                        <div>
                            <label className="block font-bold text-gray-700 mb-1">Presets Rápidos de Marca:</label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                                {(['Intelbras', 'iCSee', 'Hikvision', 'Dahua', 'Demo Stream'] as const).map(b => (
                                    <button
                                        key={b}
                                        type="button"
                                        onClick={() => handlePresetSelection(b)}
                                        className="px-2 py-1.5 rounded-lg text-[11px] font-bold border bg-gray-100 hover:bg-gray-200 text-gray-700"
                                    >
                                        {b}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Nome da Câmera *</label>
                                <input
                                    type="text"
                                    value={camName}
                                    onChange={e => setCamName(e.target.value)}
                                    className="input-base"
                                    placeholder="Ex: Recepção, Entrada, Bar"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Ambiente / Localização</label>
                                <input
                                    type="text"
                                    value={camLocation}
                                    onChange={e => setCamLocation(e.target.value)}
                                    className="input-base"
                                    placeholder="Ex: Área Externa, Cozinha"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">IP Local</label>
                                <input
                                    type="text"
                                    value={camIp}
                                    onChange={e => setCamIp(e.target.value)}
                                    className="input-base font-mono"
                                    placeholder="192.168.1.108"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block font-bold text-gray-700 mb-1">Link do Stream (RTSP/HTTP/Image) *</label>
                                <input
                                    type="text"
                                    value={camStreamUrl}
                                    onChange={e => setCamStreamUrl(e.target.value)}
                                    className="input-base font-mono text-[11px]"
                                    placeholder="rtsp://admin:senha@192.168.1.108:554/cam/realmonitor"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                                Cancelar
                            </button>
                            <button onClick={handleSaveCamera} disabled={isSaving} className="btn-primary">
                                {isSaving ? 'Salvando...' : 'Salvar Câmera'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal Fullscreen View */}
            {selectedCamera && (
                <Modal
                    isOpen={!!selectedCamera}
                    onClose={() => setSelectedCamera(null)}
                    title={`${selectedCamera.name} - ${selectedCamera.propertyUnitId === 'sanctuary' ? 'Hostel Santuário' : 'Hostel Beach'}`}
                    size="4xl"
                >
                    <div className="aspect-video bg-black rounded-2xl overflow-hidden relative">
                        <img
                            src={selectedCamera.streamUrl}
                            alt={selectedCamera.name}
                            className="w-full h-full object-contain"
                        />
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default SurveillanceDashboard;
