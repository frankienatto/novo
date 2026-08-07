
import React from 'react';
import { X as XIcon } from 'lucide-react';

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode, size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' }> = ({ isOpen, onClose, title, children, size = 'lg' }) => {
    if (!isOpen) return null;
    
    const sizeClasses = {
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 transition-opacity duration-300" 
            onClick={onClose} 
            aria-modal="true" 
            role="dialog"
        >
            <div 
                className={`bg-white rounded-2xl shadow-xl w-full relative flex flex-col max-h-[90vh] ${sizeClasses[size]}`} 
                onClick={e => e.stopPropagation()}
            >
                 <div className="flex-shrink-0 p-4 sm:p-6 flex justify-between items-center border-b">
                    <h2 className="text-xl sm:text-2xl font-bold text-brand-dark">{title}</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600" 
                        aria-label="Fechar modal"
                    >
                        <XIcon size={24} />
                    </button>
                </div>
                <div className="p-4 sm:p-6 flex-grow overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
