import React from 'react';
import { PropertyUnitId } from '../../types';
import { Building2, ChevronDown } from 'lucide-react';

interface UnitSelectorProps {
    selectedUnit: PropertyUnitId | 'all';
    onUnitChange: (unit: PropertyUnitId | 'all') => void;
    className?: string;
}

export const UnitSelector: React.FC<UnitSelectorProps> = ({ selectedUnit, onUnitChange, className = '' }) => {
    const getUnitBadge = (unit: PropertyUnitId | 'all') => {
        switch (unit) {
            case 'beach':
                return { label: 'Beach House', emoji: '🏖️', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
            case 'sanctuary':
                return { label: 'Santuário', emoji: '🌿', bg: 'bg-teal-50 text-teal-800 border-teal-200' };
            default:
                return { label: 'Todas as Unidades', emoji: '🏢', bg: 'bg-slate-100 text-slate-800 border-slate-200' };
        }
    };

    const currentBadge = getUnitBadge(selectedUnit);

    return (
        <div className={`relative inline-flex items-center ${className}`}>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm transition-all ${currentBadge.bg}`}>
                <span className="text-sm">{currentBadge.emoji}</span>
                <select
                    value={selectedUnit}
                    onChange={(e) => onUnitChange(e.target.value as PropertyUnitId | 'all')}
                    className="bg-transparent font-bold cursor-pointer focus:outline-none focus:ring-0 pr-4 text-xs appearance-none"
                    aria-label="Selecionar Unidade do Hostel"
                >
                    <option value="all" className="bg-white text-gray-800">🏢 Todas as Unidades</option>
                    <option value="beach" className="bg-white text-gray-800">🏖️ Beach House</option>
                    <option value="sanctuary" className="bg-white text-gray-800">🌿 Santuário</option>
                </select>
                <ChevronDown size={14} className="pointer-events-none -ml-4 opacity-70" />
            </div>
        </div>
    );
};

export default UnitSelector;
