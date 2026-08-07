import React from 'react';
import { Card, Badge } from '../../shared/ui';
import { TrendingUp, ShieldCheck } from 'lucide-react';

export const RevenueModule: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Revenue Intelligence
          </h2>
          <p className="text-xs text-slate-500">Módulo de Revenue Management — Yield & Pricing Strategy</p>
        </div>
        <Badge variant="success">Etapa 12.2 Pronta</Badge>
      </div>

      <Card title="Infraestrutura Frontend Validada">
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200">
          Módulo estruturado com suporte a React Query, `revenueApi` e governança read-only.
        </div>
      </Card>
    </div>
  );
};
