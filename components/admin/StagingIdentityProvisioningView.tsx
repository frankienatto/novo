import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { canonicalRequest } from '../../services/canonicalPmsRuntime';

type ApiEnvelope<T> = { success: boolean; data: T };
type ProvisioningStatus = { enabled: boolean; configured: boolean };
type ProvisionedIdentity = { status: 'created' | 'already_provisioned'; kind: 'staff' | 'guest'; guestId?: string };
type ProvisioningResult = { staff: ProvisionedIdentity; guest: ProvisionedIdentity };

/** Staging-only operator tool. It sends no identity coordinates from the browser. */
export const StagingIdentityProvisioningView: React.FC = () => {
  const [status, setStatus] = useState<ProvisioningStatus | null>(null);
  const [result, setResult] = useState<ProvisioningResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    canonicalRequest<ApiEnvelope<ProvisioningStatus>>('/api/staging/identities/status')
      .then(response => { if (active) setStatus(response.data); })
      .catch(() => { if (active) setStatus({ enabled: false, configured: false }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const provision = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await canonicalRequest<ApiEnvelope<ProvisioningResult>>('/api/staging/identities/test-accounts', { method: 'POST' });
      setResult(response.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível concluir o provisionamento controlado.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto mt-8 max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="staging-identities-title">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-1 shrink-0 text-brand-primary" aria-hidden="true" />
        <div>
          <h2 id="staging-identities-title" className="text-xl font-bold text-brand-dark">Identidades de teste do staging</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">Esta ferramenta só funciona quando a configuração temporária de staging está ativa. Ela cria o vínculo canônico de uma conta Staff e de uma conta Hóspede sem expor senhas, tokens ou identificadores no navegador.</p>
        </div>
      </div>

      {loading && <p className="mt-6 flex items-center gap-2 text-sm text-gray-600"><Loader2 className="animate-spin" size={16} /> Verificando configuração…</p>}
      {!loading && !status?.enabled && <p className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">A ferramenta está desativada. Nenhuma identidade pode ser provisionada neste ambiente.</p>}
      {!loading && status?.enabled && !status.configured && <p className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">A configuração controlada das identidades de teste está incompleta. Solicite ao operador do ambiente que complete as variáveis de staging e faça um novo deploy de configuração.</p>}
      {!loading && status?.enabled && status.configured && !result && (
        <button type="button" onClick={provision} disabled={submitting} className="btn-primary mt-6 inline-flex min-h-11 items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60">
          {submitting && <Loader2 className="animate-spin" size={17} />}
          Provisionar Staff e Hóspede de teste
        </button>
      )}
      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {result && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-950">
          <p className="flex items-center gap-2 font-semibold"><CheckCircle2 size={18} /> Provisionamento canônico concluído</p>
          <p className="mt-2">Staff: {result.staff.status === 'created' ? 'criado' : 'já provisionado'} · Hóspede: {result.guest.status === 'created' ? 'vinculado' : 'já vinculado'}.</p>
          <p className="mt-2 text-emerald-800">Desative a flag temporária no próximo deploy de configuração.</p>
        </div>
      )}
    </section>
  );
};
