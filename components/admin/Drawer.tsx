import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'md' | 'lg' | 'xl';
}

const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);
    
    const sizeClasses = {
        md: 'w-full max-w-md',
        lg: 'w-full max-w-lg',
        xl: 'w-full max-w-2xl',
    };

    return (
        <div
            className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            aria-modal="true"
            role="dialog"
        >
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60"
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div
                className={`fixed top-0 right-0 h-full bg-white shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${sizeClasses[size]} ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <header className="flex-shrink-0 p-4 sm:p-6 flex justify-between items-center border-b bg-gray-50">
                    <h2 className="text-xl sm:text-2xl font-bold text-brand-dark">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
                        aria-label="Fechar painel"
                    >
                        <X size={24} />
                    </button>
                </header>
                <main className="p-4 sm:p-6 flex-grow overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Drawer;
