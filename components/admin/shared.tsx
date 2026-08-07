import React from 'react';

export const Section: React.FC<{ title: string, icon: React.ElementType, children: React.ReactNode, actions?: React.ReactNode }> = ({ title, icon: Icon, children, actions }) => (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg" style={{ borderRadius: 'var(--admin-card-radius, 16px)' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6">
            <div className="flex items-center space-x-3">
                <Icon className="text-brand-green flex-shrink-0" size={28} />
                <h2 className="text-xl md:text-2xl font-bold text-brand-dark leading-tight">{title}</h2>
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
        {children}
    </div>
);

export const Tooltip: React.FC<{ content: string, children: React.ReactNode }> = ({ content, children }) => {
    return (
        <div className="relative group flex items-center">
            {children}
            <div 
                className="absolute left-full ml-4 w-64 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg
                           opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 pointer-events-none"
                role="tooltip"
            >
                {content}
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
            </div>
        </div>
    );
};