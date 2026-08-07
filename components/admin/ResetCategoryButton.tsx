import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { resetDb } from '../../services/apiService';
import { DBState } from '../../types';

interface Props {
    category: keyof DBState;
    label?: string;
}

export const ResetCategoryButton: React.FC<Props> = ({ category, label = 'Resetar Dados' }) => {
    const [isResetting, setIsResetting] = useState(false);

    const handleReset = async () => {
        setIsResetting(true);
        await resetDb(category);
        setIsResetting(false);
    };

    return (
        <button
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            title={`Resetar dados da categoria: ${category}`}
        >
            <RefreshCw size={16} className={isResetting ? "animate-spin" : ""} />
            <span>{isResetting ? 'Resetando...' : label}</span>
        </button>
    );
};
