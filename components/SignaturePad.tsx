
import React, { useRef, useEffect } from 'react';
import { Eraser, Save } from 'lucide-react';

interface SignaturePadProps {
    onSave: (dataUrl: string) => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const resizeCanvas = () => {
             const ratio = Math.max(window.devicePixelRatio || 1, 1);
             canvas.width = canvas.offsetWidth * ratio;
             canvas.height = canvas.offsetHeight * ratio;
             canvas.getContext('2d')?.scale(ratio, ratio);
        };
        
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    const getPosition = (e: MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        if (e instanceof MouseEvent) {
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        return null;
    }

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const pos = getPosition(e.nativeEvent);
        if (!pos) return;

        isDrawing.current = true;
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.beginPath();
        ctx?.moveTo(pos.x, pos.y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing.current) return;

        const pos = getPosition(e.nativeEvent);
        if (!pos) return;

        const ctx = canvasRef.current?.getContext('2d');
        ctx?.lineTo(pos.x, pos.y);
        ctx?.stroke();
    };

    const stopDrawing = () => {
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.closePath();
        isDrawing.current = false;
    };
    
    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };
    
    const handleSave = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            onSave(dataUrl);
        }
    };

    return (
        <div className="w-full">
            <canvas
                ref={canvasRef}
                className="w-full h-48 bg-gray-100 border border-gray-300 rounded-lg cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
            <div className="flex justify-end items-center gap-2 mt-2">
                <button type="button" onClick={clearCanvas} className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 font-semibold py-2 px-3 rounded-md hover:bg-red-50 transition-colors">
                    <Eraser size={16} />
                    Limpar
                </button>
                 <button type="button" onClick={handleSave} className="flex items-center gap-2 text-sm text-white bg-brand-green font-semibold py-2 px-3 rounded-md hover:bg-brand-green-dark transition-colors">
                    <Save size={16} />
                    Salvar Assinatura
                </button>
            </div>
        </div>
    );
};

export default SignaturePad;
