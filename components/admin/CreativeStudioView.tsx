import React, { useState, useRef, useEffect } from 'react';
import { Section } from './shared';
import { generateImage, generateVideo, generateCaptionForImage } from '../../services/geminiService';
import { eventBus } from '../../services/apiService';
import { AdPlatformString, ScheduledPost, BrandIdentity, DBState, MediaAsset, CampaignIdea, BriefingAction, AdminSection } from '../../types';
import { Loader2, Palette, Image as ImageIcon, Video, Sparkles, Download, Clapperboard, FolderSearch, BarChart, X, CalendarPlus, Save, Bot, Lightbulb, Brain, Camera, Trash2, Edit, UploadCloud, PenSquare, Type, Paintbrush, Plus, Square, Circle, Music, AudioLines } from 'lucide-react';
import Modal from './Modal';

type CreativeTab = 'identity' | 'ideas' | 'library';

interface CreativeStudioProps {
    db: DBState;
    onAddScheduledPost: (postData: Omit<ScheduledPost, 'id'>) => Promise<void>;
    onAddMediaAsset: (assetData: Omit<MediaAsset, 'id' | 'createdAt'>) => Promise<void>;
    onSaveBrandIdentity: (identity: BrandIdentity) => Promise<void>;
    onGenerateCampaignIdeas: (goal: string) => Promise<void>;
    onRemixMediaAsset: (assetId: string, prompt: string) => Promise<void>;
    onNavigateWithAction: (section: AdminSection, action: BriefingAction) => void;
    onGenerateAndSaveVideoAsset: (prompt: string) => Promise<void>;
}

const fonts = ['Poppins', 'Kalam', 'Kollektif', 'Roboto', 'Lato', 'Montserrat', 'Oswald', 'Playfair Display', 'Lobster', 'Pacifico'];
const icons = ['★', '♥', '♦', '☀️', '🎵', '✈️', '☕️', '😊', '👍', '🎉', '🔥', '✅'];


// --- Image Editor Types ---
interface ShadowProps {
    shadowBlur: number;
    shadowColor: string;
    shadowOffsetX: number;
    shadowOffsetY: number;
}

interface BaseElement extends ShadowProps {
    id: string;
    x: number;
    y: number;
    isDragging: boolean;
    dragOffsetX: number;
    dragOffsetY: number;
}

interface TextElement extends BaseElement {
    type: 'text' | 'icon';
    text: string;
    font: string;
    size: number;
    color: string; // Text color
    backgroundColor: string;
    padding: number;
}

interface ShapeElement extends BaseElement {
    type: 'rect' | 'circle';
    width: number;
    height: number;
    color: string; // Fill color
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
}

type CanvasElement = TextElement | ShapeElement;

const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
};

const useCanvasEditor = (canvasRef: React.RefObject<HTMLCanvasElement>, image?: HTMLImageElement | null) => {
    const [elements, setElements] = useState<CanvasElement[]>([]);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

    const getCtx = () => canvasRef.current?.getContext('2d');

    const draw = () => {
        const canvas = canvasRef.current;
        const ctx = getCtx();
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if(image) ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        elements.forEach(el => {
            ctx.save();
            ctx.shadowColor = el.shadowColor;
            ctx.shadowBlur = el.shadowBlur;
            ctx.shadowOffsetX = el.shadowOffsetX;
            ctx.shadowOffsetY = el.shadowOffsetY;

            if (el.type === 'rect' || el.type === 'circle') {
                const shape = el as ShapeElement;
                drawRoundedRect(ctx, shape.x, shape.y, shape.width, shape.height, shape.type === 'rect' ? shape.borderRadius : shape.width / 2);
                if (shape.borderWidth > 0) {
                    ctx.strokeStyle = shape.borderColor;
                    ctx.lineWidth = shape.borderWidth;
                    ctx.stroke();
                }
                ctx.fillStyle = shape.color;
                ctx.fill();
            } else {
                const textEl = el as TextElement;
                ctx.font = `${textEl.size}px ${textEl.font}`;
                ctx.textBaseline = 'top';
                const metrics = ctx.measureText(textEl.text);
                const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
                if (textEl.backgroundColor !== 'transparent') {
                    ctx.fillStyle = textEl.backgroundColor;
                    ctx.fillRect(textEl.x - textEl.padding, textEl.y - textEl.padding, metrics.width + textEl.padding * 2, height + textEl.padding * 2);
                }
                ctx.fillStyle = textEl.color;
                ctx.fillText(textEl.text, textEl.x, textEl.y);
            }
            ctx.restore();
        });
        
        const selected = elements.find(e => e.id === selectedElementId);
        if (selected) {
            ctx.strokeStyle = '#3B82F6';
            ctx.lineWidth = 2;
            let x, y, w, h;
            if (selected.type === 'rect' || selected.type === 'circle') {
                x = selected.x; y = selected.y; w = (selected as ShapeElement).width; h = (selected as ShapeElement).height;
            } else {
                const textEl = selected as TextElement;
                ctx.font = `${textEl.size}px ${textEl.font}`;
                const metrics = ctx.measureText(textEl.text);
                x = textEl.x; y = textEl.y; w = metrics.width; h = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
            }
            ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
        }
    };

    useEffect(draw, [image, elements, selectedElementId]);

    const getMousePos = (e: React.MouseEvent | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    };
    
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getMousePos(e);
        if (!pos) return;
        
        setSelectedElementId(null);
        let found = false;
        
        for (let i = elements.length - 1; i >= 0; i--) {
            const el = elements[i];
            let x, y, w, h;
            if(el.type === 'rect' || el.type === 'circle'){
                x = el.x; y = el.y; w = (el as ShapeElement).width; h = (el as ShapeElement).height;
            } else {
                 const ctx = getCtx()!;
                 ctx.font = `${(el as TextElement).size}px ${(el as TextElement).font}`;
                 const metrics = ctx.measureText((el as TextElement).text);
                 x = el.x; y = el.y; w = metrics.width; h = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
            }
            
            if (pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h) {
                setSelectedElementId(el.id);
                 setElements(prev => prev.map(elem => {
                    if (elem.id !== el.id) return elem;
                    const updatedElem = { ...elem, isDragging: true, dragOffsetX: pos.x - elem.x, dragOffsetY: pos.y - elem.y };
                    return updatedElem as CanvasElement;
                }));
                found = true;
                break;
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setElements(prev => prev.map(el => {
            if (!el.isDragging) return el;
            const pos = getMousePos(e);
            if (!pos) return el;
            return { ...el, x: pos.x - el.dragOffsetX, y: pos.y - el.dragOffsetY } as CanvasElement;
        }));
    };

    const handleMouseUp = () => {
        setElements(prev => prev.map(el => ({ ...el, isDragging: false } as CanvasElement)));
    };
    
    const addElement = (element: CanvasElement) => {
        setElements(prev => [...prev, element]);
        setSelectedElementId(element.id);
    };

    const updateSelectedElement = (props: Partial<CanvasElement>) => {
        setElements(prev => prev.map(el => (el.id !== selectedElementId) ? el : { ...el, ...props } as CanvasElement));
    };

    const deleteSelectedElement = () => {
        if (!selectedElementId) return;
        setElements(prev => prev.filter(el => el.id !== selectedElementId));
        setSelectedElementId(null);
    };

    return {
        elements, setElements, selectedElement: selectedElementId ? elements.find(e => e.id === selectedElementId) : null,
        setSelectedElementId, draw, handleMouseDown, handleMouseMove, handleMouseUp,
        addElement, updateSelectedElement, deleteSelectedElement,
    };
};


const ImageEditorModal: React.FC<{
    isOpen: boolean;
    image: HTMLImageElement | null;
    onClose: () => void;
    onSave: (imageDataUrl: string) => void;
}> = ({ isOpen, image, onClose, onSave }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editorTab, setEditorTab] = useState<'text' | 'elements'>('text');
    
    const { elements, setElements, selectedElement, setSelectedElementId, handleMouseDown, handleMouseMove, handleMouseUp, addElement, updateSelectedElement, deleteSelectedElement } = useCanvasEditor(canvasRef, image);

    useEffect(() => {
        if (!isOpen) {
            setElements([]);
            setSelectedElementId(null);
            setEditorTab('text');
        }
    }, [isOpen, setElements, setSelectedElementId]);

    const handleAddText = (text: string = 'Texto Editável', size: number = 40) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const newText: TextElement = {
            id: `text_${Date.now()}`, type: text.length > 1 ? 'text' : 'icon', text, size,
            x: canvas.width / 2 - 100, y: canvas.height / 2 - 20,
            font: 'Poppins', color: '#FFFFFF', isDragging: false, dragOffsetX: 0, dragOffsetY: 0,
            backgroundColor: 'transparent', padding: 10,
            shadowBlur: 0, shadowColor: '#000000', shadowOffsetX: 0, shadowOffsetY: 0,
        };
        addElement(newText);
    };

    const handleAddShape = (type: 'rect' | 'circle') => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const newShape: ShapeElement = {
            id: `shape_${Date.now()}`, type,
            x: canvas.width / 2 - 50, y: canvas.height / 2 - 50,
            width: 100, height: 100, color: '#3B82F6',
            isDragging: false, dragOffsetX: 0, dragOffsetY: 0,
            borderRadius: 0, borderWidth: 0, borderColor: '#000000',
            shadowBlur: 0, shadowColor: '#000000', shadowOffsetX: 0, shadowOffsetY: 0,
        };
        addElement(newShape);
    };

    const handleSaveImage = () => {
        setIsSaving(true);
        setSelectedElementId(null);
        setTimeout(() => {
            const canvas = canvasRef.current;
            if (canvas) onSave(canvas.toDataURL('image/png'));
            setIsSaving(false);
        }, 100);
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editor de Imagem" size="4xl">
            <div className="flex flex-col md:flex-row gap-4">
                <canvas ref={canvasRef} width={512} height={512} className="border rounded-md w-full md:w-auto aspect-square bg-gray-200 cursor-move" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}/>
                <div className="space-y-4 flex-grow flex flex-col">
                    <div className="flex border-b">
                        <button onClick={() => setEditorTab('text')} className={`px-4 py-2 text-sm font-semibold ${editorTab === 'text' ? 'border-b-2 border-brand-green text-brand-dark' : 'text-gray-500'}`}>Texto & Ícones</button>
                        <button onClick={() => setEditorTab('elements')} className={`px-4 py-2 text-sm font-semibold ${editorTab === 'elements' ? 'border-b-2 border-brand-green text-brand-dark' : 'text-gray-500'}`}>Elementos</button>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                        {editorTab === 'text' && (
                            <>
                                <button onClick={() => handleAddText()} className="w-full btn-secondary text-sm">Adicionar Texto</button>
                                <div className="grid grid-cols-4 gap-2">
                                    {icons.map(icon => <button key={icon} onClick={() => handleAddText(icon, 60)} className="p-2 bg-gray-100 rounded-md text-2xl hover:bg-gray-200">{icon}</button>)}
                                </div>
                            </>
                        )}
                         {editorTab === 'elements' && (
                            <div className="space-y-2">
                                <button onClick={() => handleAddShape('rect')} className="w-full btn-secondary text-sm flex items-center justify-center gap-2"><Square size={14}/> Adicionar Retângulo</button>
                                <button onClick={() => handleAddShape('circle')} className="w-full btn-secondary text-sm flex items-center justify-center gap-2"><Circle size={14}/> Adicionar Círculo</button>
                            </div>
                        )}
                    </div>

                    {selectedElement && (
                        <div className="pt-4 border-t space-y-3 overflow-y-auto max-h-64 pr-2">
                            <h4 className="font-semibold text-sm">Editar Elemento</h4>
                             {(selectedElement.type === 'text' || selectedElement.type === 'icon') && (
                                <details className="bg-gray-50 rounded-md p-2 border" open>
                                    <summary className="text-xs font-semibold cursor-pointer">Conteúdo</summary>
                                    <textarea
                                        value={(selectedElement as TextElement).text}
                                        onChange={e => updateSelectedElement({ text: e.target.value })}
                                        className="w-full p-1 border rounded-md mt-2 text-sm"
                                        rows={2}
                                    />
                                </details>
                             )}
                            <details className="bg-gray-50 rounded-md p-2 border" open>
                                <summary className="text-xs font-semibold cursor-pointer">Preenchimento</summary>
                                <div className="pt-2"><input type="color" value={selectedElement.color} onChange={e => updateSelectedElement({ color: e.target.value })} className="w-full h-8 p-1 border rounded-md"/></div>
                            </details>

                             {(selectedElement.type === 'text' || selectedElement.type === 'icon') && (
                                <>
                                    <details className="bg-gray-50 rounded-md p-2 border">
                                        <summary className="text-xs font-semibold cursor-pointer">Fonte</summary>
                                        <div className="pt-2 space-y-2">
                                            <select value={(selectedElement as TextElement).font} onChange={e => updateSelectedElement({ font: e.target.value })} className="input-base text-sm">{fonts.map(f => <option key={f} value={f}>{f}</option>)}</select>
                                            <div><label className="text-xs">Tamanho</label><input type="range" min="10" max="150" value={(selectedElement as TextElement).size} onChange={e => updateSelectedElement({ size: Number(e.target.value) })} className="w-full"/></div>
                                        </div>
                                    </details>
                                    <details className="bg-gray-50 rounded-md p-2 border">
                                        <summary className="text-xs font-semibold cursor-pointer">Fundo do Texto</summary>
                                        <div className="pt-2 space-y-2">
                                            <input type="color" value={(selectedElement as TextElement).backgroundColor} onChange={e => updateSelectedElement({ backgroundColor: e.target.value })} className="w-full h-8 p-1 border rounded-md"/>
                                            <button onClick={() => updateSelectedElement({ backgroundColor: 'transparent' })} className="text-xs hover:underline">Tornar Transparente</button>
                                            <div><label className="text-xs">Preenchimento</label><input type="range" min="0" max="50" value={(selectedElement as TextElement).padding} onChange={e => updateSelectedElement({ padding: Number(e.target.value) })} className="w-full"/></div>
                                        </div>
                                    </details>
                                </>
                             )}
                              {(selectedElement.type === 'rect' || selectedElement.type === 'circle') && (
                                <details className="bg-gray-50 rounded-md p-2 border">
                                    <summary className="text-xs font-semibold cursor-pointer">Borda</summary>
                                    <div className="pt-2 space-y-2">
                                        <div><label className="text-xs">Largura</label><input type="range" min="0" max="20" value={(selectedElement as ShapeElement).borderWidth} onChange={e => updateSelectedElement({ borderWidth: Number(e.target.value) })} className="w-full"/></div>
                                        <div><label className="text-xs">Cor</label><input type="color" value={(selectedElement as ShapeElement).borderColor} onChange={e => updateSelectedElement({ borderColor: e.target.value })} className="w-full h-8 p-1 border rounded-md"/></div>
                                        {(selectedElement.type === 'rect') && (<div><label className="text-xs">Raio</label><input type="range" min="0" max="100" value={(selectedElement as ShapeElement).borderRadius} onChange={e => updateSelectedElement({ borderRadius: Number(e.target.value) })} className="w-full"/></div>)}
                                    </div>
                                </details>
                              )}

                             <details className="bg-gray-50 rounded-md p-2 border">
                                <summary className="text-xs font-semibold cursor-pointer">Sombra</summary>
                                <div className="pt-2 space-y-2">
                                    <div><label className="text-xs">Cor</label><input type="color" value={selectedElement.shadowColor} onChange={e => updateSelectedElement({ shadowColor: e.target.value })} className="w-full h-8 p-1 border rounded-md"/></div>
                                    <div><label className="text-xs">Desfoque</label><input type="range" min="0" max="50" value={selectedElement.shadowBlur} onChange={e => updateSelectedElement({ shadowBlur: Number(e.target.value) })} className="w-full"/></div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className="text-xs">Offset X</label><input type="range" min="-25" max="25" value={selectedElement.shadowOffsetX} onChange={e => updateSelectedElement({ shadowOffsetX: Number(e.target.value) })} className="w-full"/></div>
                                        <div><label className="text-xs">Offset Y</label><input type="range" min="-25" max="25" value={selectedElement.shadowOffsetY} onChange={e => updateSelectedElement({ shadowOffsetY: Number(e.target.value) })} className="w-full"/></div>
                                    </div>
                                </div>
                            </details>
                            
                            <button onClick={deleteSelectedElement} className="w-full btn-secondary bg-red-100 text-red-700 text-sm flex items-center justify-center gap-2"><Trash2 size={14}/> Excluir Elemento</button>
                        </div>
                    )}

                    <div className="mt-auto pt-4 border-t">
                        <button onClick={handleSaveImage} disabled={isSaving} className="w-full btn-primary flex items-center justify-center gap-2">
                            {isSaving ? <Loader2 className="animate-spin" /> : 'Salvar na Biblioteca'}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const CreativeStudio: React.FC<CreativeStudioProps> = (props) => {
    const { db, onAddScheduledPost, onAddMediaAsset, onSaveBrandIdentity, onGenerateCampaignIdeas, onRemixMediaAsset, onNavigateWithAction, onGenerateAndSaveVideoAsset } = props;

    const [activeTab, setActiveTab] = useState<CreativeTab>('ideas');
    const [brandIdentity, setBrandIdentity] = useState<BrandIdentity>(db.brandIdentity);
    const [isSavingIdentity, setIsSavingIdentity] = useState(false);
    const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
    const [campaignGoal, setCampaignGoal] = useState('');
    const [remixPrompts, setRemixPrompts] = useState<Record<string, string>>({});
    const [isRemixingId, setIsRemixingId] = useState<string | null>(null);
    
    const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
    const [editingImage, setEditingImage] = useState<HTMLImageElement | null>(null);

    const [isVideoEditorOpen, setIsVideoEditorOpen] = useState(false);
    const [editingScript, setEditingScript] = useState<CampaignIdea['videoScript'] | null>(null);
    const [editingVideo, setEditingVideo] = useState<MediaAsset | null>(null);
    const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);
    const [videoPrompt, setVideoPrompt] = useState('');
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    
    // Schedule Modal State
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [schedulePostData, setSchedulePostData] = useState<Partial<ScheduledPost>>({});

    const handleSaveIdentity = async () => {
        setIsSavingIdentity(true);
        await onSaveBrandIdentity(brandIdentity);
        setIsSavingIdentity(false);
        eventBus.emit('new-toast', { type: 'success', title: 'Identidade Salva', message: 'A identidade da sua marca foi atualizada.' });
    };

    const handleGenerateIdeas = async () => {
        if (!campaignGoal.trim()) return;
        setIsGeneratingIdeas(true);
        await onGenerateCampaignIdeas(campaignGoal);
        setIsGeneratingIdeas(false);
    };

    const handleGenerateVideo = async () => {
        if (!videoPrompt.trim()) return;
        setIsGeneratingVideo(true);
        await onGenerateAndSaveVideoAsset(videoPrompt);
        setIsGeneratingVideo(false);
        setVideoPrompt('');
    };
    
     const handleRemix = async (asset: MediaAsset) => {
        const prompt = remixPrompts[asset.id] || '';
        if (!prompt.trim()) {
            eventBus.emit('new-toast', { type: 'error', title: 'Prompt Vazio', message: 'Por favor, descreva o que você quer mudar.' });
            return;
        }
        setIsRemixingId(asset.id);
        await onRemixMediaAsset(asset.id, prompt);
        setRemixPrompts(prev => ({...prev, [asset.id]: ''}));
        setIsRemixingId(null);
        setActiveTab('library');
    };
    
    const handleOpenImageEditor = (imageUrl: string) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            setEditingImage(img);
            setIsImageEditorOpen(true);
        };
        img.src = imageUrl.startsWith('data:') ? imageUrl : `https://cors-anywhere.herokuapp.com/${imageUrl}`;
    };

    const handleSaveEditedImage = async (imageDataUrl: string) => {
        await onAddMediaAsset({ type: 'image', url: imageDataUrl, prompt: 'Imagem Editada' });
        setIsImageEditorOpen(false);
        setActiveTab('library');
        eventBus.emit('new-toast', { type: 'success', title: 'Imagem Salva!', message: 'Sua imagem editada foi salva na biblioteca.' });
    };

    const handleOpenVideoEditor = (script: CampaignIdea['videoScript'] | null, assetToEdit: MediaAsset | null = null) => {
        setEditingScript(script);
        setEditingVideo(assetToEdit);
        setIsVideoEditorOpen(true);
    };

    const handleGenerateImageFromPrompt = async (prompt: string, title: string) => {
        setGeneratingImageId(prompt);
        const imageB64 = await generateImage(prompt, '1:1', db.brandIdentity);
        if (imageB64) {
            await onAddMediaAsset({
                type: 'image',
                url: `data:image/png;base64,${imageB64}`,
                prompt: title,
            });
            eventBus.emit('new-toast', { type: 'success', title: 'Imagem Gerada!', message: 'A imagem foi salva na sua biblioteca.' });
            setActiveTab('library');
        } else {
             eventBus.emit('new-toast', { type: 'error', title: 'Falha na Geração', message: 'Não foi possível gerar a imagem.' });
        }
        setGeneratingImageId(null);
    };
    
    const handleOpenScheduleModal = (postData: Partial<ScheduledPost>) => {
        setSchedulePostData({
            status: 'Draft',
            scheduledAt: new Date().toISOString().substring(0, 16),
            ...postData
        });
        setIsScheduleModalOpen(true);
    };

    const handleScheduleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onAddScheduledPost(schedulePostData as Omit<ScheduledPost, 'id'>);
        setIsScheduleModalOpen(false);
        eventBus.emit('new-toast', { type: 'success', title: 'Post Agendado', message: `Post para ${schedulePostData.platform} agendado.` });
    };

    const VideoEditorModal: React.FC<{
        isOpen: boolean;
        onClose: () => void;
        script: CampaignIdea['videoScript'] | null;
        initialAsset: MediaAsset | null;
        onSave: (assetData: Omit<MediaAsset, 'id' | 'createdAt'>) => Promise<void>;
    }> = ({ isOpen, onClose, script, initialAsset, onSave }) => {
        const [clips, setClips] = useState<{ id: string, url: string, prompt: string }[]>([]);
        const [isGenerating, setIsGenerating] = useState(false);
        const [isRendering, setIsRendering] = useState(false);
        const [renderProgress, setRenderProgress] = useState(0);
        const videoRef = useRef<HTMLVideoElement>(null);
        
        const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
        const [editorTab, setEditorTab] = useState<'text' | 'elements' | 'audio'>('text');
        const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
    
        const { elements, setElements, selectedElement, setSelectedElementId, handleMouseDown, handleMouseMove, handleMouseUp, addElement, updateSelectedElement, deleteSelectedElement } = useCanvasEditor(overlayCanvasRef);
    
        useEffect(() => {
            if (isOpen) {
                 if (initialAsset) {
                    setClips([{ id: initialAsset.id, url: initialAsset.url, prompt: initialAsset.prompt || 'Clip existente' }]);
                } else if (script) {
                    const generateInitialClips = async () => {
                        setIsGenerating(true);
                        const generatedClips = [];
                        for (const scene of script.scenes) {
                            const url = await generateVideo(scene.description);
                            if(url) generatedClips.push({ id: `clip_${scene.scene}`, url, prompt: scene.description });
                        }
                        setClips(generatedClips);
                        setIsGenerating(false);
                    };
                    generateInitialClips();
                }
            } else {
                setClips([]);
                setElements([]);
                setSelectedElementId(null);
                setSelectedAudio(null);
                setEditorTab('text');
            }
        }, [isOpen, script, initialAsset, setElements, setSelectedElementId]);

        const handleAddText = (text: string = 'Texto Editável', size: number = 80) => {
            const canvas = overlayCanvasRef.current;
            if (!canvas) return;
            const newText: TextElement = {
                id: `text_${Date.now()}`, type: text.length > 1 ? 'text' : 'icon', text, size,
                x: canvas.width / 2 - 200, y: canvas.height / 2 - 40,
                font: 'Poppins', color: '#FFFFFF', isDragging: false, dragOffsetX: 0, dragOffsetY: 0,
                backgroundColor: 'transparent', padding: 10,
                shadowBlur: 5, shadowColor: '#000000', shadowOffsetX: 2, shadowOffsetY: 2,
            };
            addElement(newText);
        };
    
        const handleAddShape = (type: 'rect' | 'circle') => {
            const canvas = overlayCanvasRef.current;
            if (!canvas) return;
            const newShape: ShapeElement = {
                id: `shape_${Date.now()}`, type,
                x: canvas.width / 2 - 100, y: canvas.height / 2 - 100,
                width: 200, height: 200, color: '#3B82F680',
                isDragging: false, dragOffsetX: 0, dragOffsetY: 0,
                borderRadius: 0, borderWidth: 0, borderColor: '#000000',
                shadowBlur: 0, shadowColor: '#000000', shadowOffsetX: 0, shadowOffsetY: 0,
            };
            addElement(newShape);
        };
        
        const handleRender = () => {
            setIsRendering(true);
            setRenderProgress(0);
            const interval = setInterval(() => {
                setRenderProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                         const prompt = initialAsset ? `Vídeo Editado: ${initialAsset.prompt}` : script?.title || 'Vídeo Criado';
                         onSave({ type: 'video', url: clips[0]?.url, prompt });
                        setIsRendering(false);
                        return 100;
                    }
                    return prev + 10;
                });
            }, 300);
        };
        
        const audioTracks = ['Animada', 'Chill', 'Épica', 'Festa', 'Acústica'];
        
        return (
            <Modal isOpen={isOpen} onClose={onClose} title={`Editor de Reel: ${script?.title || initialAsset?.prompt}`} size="5xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[70vh]">
                    <div className="lg:col-span-2 bg-black rounded-lg flex items-center justify-center relative">
                         {isGenerating && <Loader2 className="animate-spin text-white" size={48} />}
                         {!isGenerating && clips.length > 0 && <video ref={videoRef} src={clips[0].url} controls autoPlay muted loop className="max-h-full rounded-lg"/>}
                         <canvas 
                            ref={overlayCanvasRef} 
                            width={1080} 
                            height={1920} 
                            className="absolute inset-0 w-full h-full cursor-move"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        />
                         {isRendering && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                                <Loader2 className="animate-spin" size={32}/>
                                <p className="mt-2">Renderizando... {renderProgress}%</p>
                                <div className="w-1/2 bg-gray-600 rounded-full h-2.5 mt-2"><div className="bg-brand-green h-2.5 rounded-full" style={{width: `${renderProgress}%`}}></div></div>
                            </div>
                         )}
                    </div>
                    <div className="space-y-4 flex flex-col">
                        <div className="flex border-b">
                            <button onClick={() => setEditorTab('text')} className={`px-4 py-2 text-sm font-semibold ${editorTab === 'text' ? 'border-b-2 border-brand-green text-brand-dark' : 'text-gray-500'}`}>Texto & Ícones</button>
                            <button onClick={() => setEditorTab('elements')} className={`px-4 py-2 text-sm font-semibold ${editorTab === 'elements' ? 'border-b-2 border-brand-green text-brand-dark' : 'text-gray-500'}`}>Elementos</button>
                            <button onClick={() => setEditorTab('audio')} className={`px-4 py-2 text-sm font-semibold ${editorTab === 'audio' ? 'border-b-2 border-brand-green text-brand-dark' : 'text-gray-500'}`}>Áudio</button>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                            {editorTab === 'text' && (
                                <>
                                    <button onClick={() => handleAddText()} className="w-full btn-secondary text-sm">Adicionar Texto</button>
                                     <div className="grid grid-cols-4 gap-2">
                                        {icons.map(icon => <button key={icon} onClick={() => handleAddText(icon, 100)} className="p-2 bg-gray-100 rounded-md text-2xl hover:bg-gray-200">{icon}</button>)}
                                    </div>
                                </>
                            )}
                             {editorTab === 'elements' && (
                                <div className="space-y-2">
                                    <button onClick={() => handleAddShape('rect')} className="w-full btn-secondary text-sm flex items-center justify-center gap-2"><Square size={14}/> Adicionar Retângulo</button>
                                    <button onClick={() => handleAddShape('circle')} className="w-full btn-secondary text-sm flex items-center justify-center gap-2"><Circle size={14}/> Adicionar Círculo</button>
                                </div>
                            )}
                             {editorTab === 'audio' && (
                                <div className="space-y-2">
                                    {audioTracks.map(track => (
                                        <button key={track} onClick={() => setSelectedAudio(track)} className={`w-full text-left p-2 rounded-md ${selectedAudio === track ? 'bg-brand-green text-white' : 'bg-gray-100'}`}>
                                            {track}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {selectedElement && (
                             <div className="pt-4 border-t space-y-3 overflow-y-auto max-h-64 pr-2">
                                <h4 className="font-semibold text-sm">Editar Elemento</h4>
                                 <details className="bg-gray-50 rounded-md p-2 border" open><summary className="text-xs font-semibold cursor-pointer">Preenchimento</summary><div className="pt-2"><input type="color" value={selectedElement.color} onChange={e => updateSelectedElement({ color: e.target.value })} className="w-full h-8 p-1 border rounded-md"/></div></details>
                                 {(selectedElement.type === 'text' || selectedElement.type === 'icon') && <details className="bg-gray-50 rounded-md p-2 border"><summary className="text-xs font-semibold cursor-pointer">Fonte</summary><div className="pt-2 space-y-2"><select value={(selectedElement as TextElement).font} onChange={e => updateSelectedElement({ font: e.target.value })} className="input-base text-sm">{fonts.map(f => <option key={f} value={f}>{f}</option>)}</select><div><label className="text-xs">Tamanho</label><input type="range" min="10" max="150" value={(selectedElement as TextElement).size} onChange={e => updateSelectedElement({ size: Number(e.target.value) })} className="w-full"/></div></div></details>}
                                 <button onClick={deleteSelectedElement} className="w-full btn-secondary bg-red-100 text-red-700 text-sm flex items-center justify-center gap-2"><Trash2 size={14}/> Excluir Elemento</button>
                             </div>
                        )}
                        <button onClick={handleRender} disabled={isRendering || isGenerating} className="w-full btn-primary mt-auto">
                            {isRendering ? 'Renderizando...' : 'Renderizar e Salvar'}
                        </button>
                    </div>
                </div>
            </Modal>
        );
    };

    const tabs: {id: CreativeTab, label: string, icon: React.ElementType}[] = [
        { id: 'identity', label: 'Identidade de Marca', icon: Paintbrush },
        { id: 'ideas', label: 'Hub de Ideias', icon: Lightbulb },
        { id: 'library', label: 'Biblioteca & Geração', icon: Brain },
    ];
    
    const renderIdentityTab = () => (
        <div className="space-y-4">
             <h3 className="font-semibold text-lg">Identidade Visual da Marca (Usado pela IA)</h3>
             <div>
                <label className="text-sm font-medium text-gray-700">Palavras-chave da "Vibe"</label>
                <input value={brandIdentity.vibeKeywords} onChange={e => setBrandIdentity({...brandIdentity, vibeKeywords: e.target.value})} className="input-base" placeholder="Ex: jovem, descontraído, praia, natureza"/>
             </div>
             <div>
                <label className="text-sm font-medium text-gray-700">Público-alvo</label>
                <textarea value={brandIdentity.targetAudience} onChange={e => setBrandIdentity({...brandIdentity, targetAudience: e.target.value})} className="input-base" rows={3} placeholder="Ex: Mochileiros de 20 a 35 anos..."/>
             </div>
             <button onClick={handleSaveIdentity} disabled={isSavingIdentity} className="btn-primary flex items-center gap-2">
                {isSavingIdentity ? <Loader2 className="animate-spin"/> : <Save size={16}/>} Salvar Identidade
             </button>
        </div>
    );
    
    const renderIdeasTab = () => (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg">Gerador de Campanhas Criativas</h3>
            <div className="flex flex-col sm:flex-row gap-2">
                <input value={campaignGoal} onChange={e => setCampaignGoal(e.target.value)} className="input-base flex-grow w-full" placeholder="Objetivo da campanha (ex: Promover o feriado...)"/>
                <button onClick={handleGenerateIdeas} disabled={isGeneratingIdeas} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto flex-shrink-0">
                    {isGeneratingIdeas ? <Loader2 className="animate-spin"/> : <Sparkles size={16}/>} Gerar Ideias
                </button>
            </div>
            {isGeneratingIdeas && db.campaignIdeas.length === 0 && <div className="text-center p-10"><Loader2 className="animate-spin text-brand-green"/></div>}
            {db.campaignIdeas.map((idea, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border space-y-4">
                    <h4 className="font-bold">Resultado para: "{idea.goal}"</h4>
                    <div>
                        <h5 className="font-semibold text-sm mb-2">Imagens:</h5>
                        {idea.imagePrompts.map((p, i) => (
                           <div key={i} className="bg-gray-100 p-2 text-xs my-1 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <span><strong>{p.title}:</strong> {p.prompt}</span>
                                <button onClick={() => handleGenerateImageFromPrompt(p.prompt, p.title)} disabled={!!generatingImageId} className="w-full sm:w-auto bg-blue-500 text-white text-xs font-bold py-1.5 px-3 rounded-md hover:bg-blue-600 flex items-center justify-center gap-1 flex-shrink-0">
                                    {generatingImageId === p.prompt ? <Loader2 size={12} className="animate-spin"/> : <ImageIcon size={12}/>} Gerar Imagem
                                </button>
                            </div>
                        ))}
                    </div>
                    <div>
                        <h5 className="font-semibold text-sm mb-2">Vídeo:</h5>
                        <div className="bg-gray-100 p-2 rounded text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <span><strong>{idea.videoScript.title}:</strong> {idea.videoScript.scenes.map(s => `Cena ${s.scene}: ${s.description}`).join(' | ')}</span>
                            <button onClick={() => handleOpenVideoEditor(idea.videoScript, null)} className="w-full sm:w-auto bg-blue-500 text-white text-xs font-bold py-1.5 px-3 rounded-md hover:bg-blue-600 flex-shrink-0 text-center">Criar Reel</button>
                        </div>
                    </div>
                    <div>
                        <h5 className="font-semibold text-sm mb-2">Legendas:</h5>
                         {idea.captions.map((c, i) => (
                            <div key={i} className="bg-gray-100 p-2 text-xs my-1 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <span><strong>{c.platform}:</strong> {c.text}</span>
                                <button onClick={() => handleOpenScheduleModal({ content: c.text, platform: c.platform })} className="w-full sm:w-auto bg-blue-500 text-white text-xs font-bold py-1.5 px-3 rounded-md hover:bg-blue-600 flex-shrink-0 text-center">
                                    Agendar Post
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
    
    const renderLibraryTab = () => {
        const images = db.mediaLibrary.filter(m => m.type === 'image');
        const videos = db.mediaLibrary.filter(m => m.type === 'video');

        return (
            <div className="space-y-8">
                <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><Video size={20}/> Gerador de Vídeo com VEO</h3>
                    <div className="bg-white p-4 rounded-lg border space-y-3">
                        <textarea
                            value={videoPrompt}
                            onChange={e => setVideoPrompt(e.target.value)}
                            placeholder="Descreva o vídeo que você quer criar. Ex: 'Um drone sobrevoando a praia de Canasvieiras ao nascer do sol, com surfistas na água.'"
                            className="input-base"
                            rows={3}
                            disabled={isGeneratingVideo}
                        />
                        <button 
                            onClick={handleGenerateVideo}
                            disabled={isGeneratingVideo || !videoPrompt.trim()}
                            className="w-full btn-primary flex items-center justify-center gap-2"
                        >
                            {isGeneratingVideo ? <Loader2 className="animate-spin"/> : <Sparkles size={16}/>}
                            {isGeneratingVideo ? 'Gerando vídeo... (pode levar alguns minutos)' : 'Gerar Vídeo'}
                        </button>
                    </div>
                </div>
                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-lg">Biblioteca de Imagens</h3>
                        <p className="text-sm text-gray-600">Selecione uma imagem, descreva o que quer alterar e a IA irá gerar uma nova versão. Você também pode editar manualmente.</p>
                        {images.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                                {images.map(asset => (
                                    <div key={asset.id} className="bg-white p-2 rounded-lg border">
                                        <img src={asset.url} alt={asset.prompt} className="w-full aspect-square object-cover rounded-md"/>
                                        <input 
                                            value={remixPrompts[asset.id] || ''}
                                            onChange={e => setRemixPrompts(prev => ({ ...prev, [asset.id]: e.target.value }))}
                                            placeholder="Ex: 'Adicione um pôr do sol'" 
                                            className="input-base text-xs mt-2"
                                        />
                                        <div className="flex gap-1 mt-1">
                                            <button onClick={() => handleRemix(asset)} disabled={!!isRemixingId} className="w-full btn-secondary text-xs flex items-center justify-center">
                                                {isRemixingId === asset.id ? <Loader2 className="animate-spin h-4 w-4"/> : 'Remixar'}
                                            </button>
                                            <button onClick={() => handleOpenImageEditor(asset.url)} className="w-full btn-secondary text-xs">
                                                Editar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">Nenhuma imagem na biblioteca.</p>
                        )}
                    </div>
                    
                    <div className="pt-6 border-t">
                        <h3 className="font-semibold text-lg">Biblioteca de Vídeos</h3>
                        {videos.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                                {videos.map(asset => (
                                    <div key={asset.id} className="bg-white p-2 rounded-lg border">
                                        <video src={asset.url} className="w-full aspect-square object-cover rounded-md bg-black" />
                                        <p className="text-xs text-gray-600 truncate mt-2">{asset.prompt || 'Vídeo'}</p>
                                         <input 
                                            value={remixPrompts[asset.id] || ''}
                                            onChange={e => setRemixPrompts(prev => ({ ...prev, [asset.id]: e.target.value }))}
                                            placeholder="Ex: 'Mude para um dia chuvoso'" 
                                            className="input-base text-xs mt-2"
                                        />
                                        <div className="flex gap-1 mt-1">
                                            <button onClick={() => handleRemix(asset)} disabled={!!isRemixingId} className="w-full btn-secondary text-xs flex items-center justify-center">
                                                 {isRemixingId === asset.id ? <Loader2 className="animate-spin h-4 w-4"/> : 'Remixar'}
                                            </button>
                                             <button onClick={() => handleOpenVideoEditor(null, asset)} className="w-full btn-secondary text-xs">
                                                Editar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">Nenhum vídeo na biblioteca.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };


    return (
        <Section title="Estúdio de Conteúdo e Criativo" icon={Palette}>
            <div className="flex border-b mb-6 overflow-x-auto hide-scrollbar sm:flex-wrap">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500 hover:text-gray-700'}`}>
                       <tab.icon size={16}/> {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border">
                {activeTab === 'identity' && renderIdentityTab()}
                {activeTab === 'ideas' && renderIdeasTab()}
                {activeTab === 'library' && renderLibraryTab()}
            </div>

            <ImageEditorModal isOpen={isImageEditorOpen} image={editingImage} onClose={() => setIsImageEditorOpen(false)} onSave={handleSaveEditedImage} />
            <VideoEditorModal 
                isOpen={isVideoEditorOpen}
                onClose={() => setIsVideoEditorOpen(false)}
                script={editingScript}
                initialAsset={editingVideo}
                onSave={async (assetData) => {
                    await onAddMediaAsset(assetData);
                    setIsVideoEditorOpen(false);
                    setActiveTab('library');
                    eventBus.emit('new-toast', { type: 'success', title: 'Vídeo Salvo!', message: 'Seu vídeo foi salvo na biblioteca de mídia.' });
                }}
            />
            
            <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title="Agendar Post">
                <form onSubmit={handleScheduleSubmit} className="space-y-4">
                    <textarea value={schedulePostData.content || ''} onChange={(e) => setSchedulePostData(p => ({...p, content: e.target.value}))} className="input-base" rows={4}/>
                    <select value={schedulePostData.platform} onChange={(e) => setSchedulePostData(p => ({...p, platform: e.target.value as AdPlatformString}))} className="input-base">
                        <option>Instagram</option><option>Facebook</option><option>X</option><option>TikTok</option>
                    </select>
                    <input type="datetime-local" value={schedulePostData.scheduledAt?.substring(0, 16)} onChange={(e) => setSchedulePostData(p => ({...p, scheduledAt: e.target.value}))} className="input-base"/>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-primary">Agendar</button>
                    </div>
                </form>
            </Modal>
        </Section>
    );
};

export default CreativeStudio;