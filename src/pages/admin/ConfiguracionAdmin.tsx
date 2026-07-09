import { useState, useEffect, useCallback } from 'react';
import { configBarrioApi } from '../../api/configBarrioApi';
import type { ConfigBarrio, OfficialStatus, BusinessPhase, RankingWeights } from '../../types/configBarrio';
import { OFFICIAL_STATUS_LABELS, BUSINESS_PHASE_LABELS } from '../../types/configBarrio';

const RANKING_WEIGHT_LABELS: Record<keyof RankingWeights, string> = {
  verified: 'Verificado',
  featured: 'Destacado',
  rating_ge_4_5: 'Rating ≥ 4.5',
  reviews_gt_5: 'Más de 5 reseñas',
  regular_updates: 'Actualiza estados con regularidad',
  active_membership: 'Membresía activa',
  recent_warning: 'Advertencia reciente (30 días)',
  suspended: 'Suspendido',
  membership_overdue: 'Membresía vencida (fuera de fase 0)',
  stale_jobs: 'Varios trabajos sin actualizar',
};

export default function ConfiguracionAdmin() {
  const [config, setConfig] = useState<ConfigBarrio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [guardado, setGuardado] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const data = await configBarrioApi.obtener();
      setConfig(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar la configuración');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  function set<K extends keyof ConfigBarrio>(key: K, value: ConfigBarrio[K]) {
    setConfig((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  function setWeight(key: keyof RankingWeights, value: number) {
    setConfig((prev) => prev ? { ...prev, ranking_weights: { ...prev.ranking_weights, [key]: value } } : prev);
  }

  async function guardar() {
    if (!config) return;
    setGuardando(true);
    setGuardado(false);
    try {
      const actualizado = await configBarrioApi.actualizar(config);
      setConfig(actualizado);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2500);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-16">
        <i className="ri-loader-4-line animate-spin text-3xl text-[#e2b040]" />
      </div>
    );
  }

  if (error || !config) {
    return <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>;
  }

  const inputClass = 'w-full bg-[#16213e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#e2b040]/50';
  const labelClass = 'block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5';

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">Configuración del barrio</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Mientras el estado sea "Independiente", el sitio público no debe decir "oficial".
          </p>
        </div>
      </div>

      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nombre del barrio</label>
            <input value={config.neighborhood_name} onChange={(e) => set('neighborhood_name', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Ciudad</label>
            <input value={config.city} onChange={(e) => set('city', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Estado de oficialidad</label>
            <select value={config.official_status} onChange={(e) => set('official_status', e.target.value as OfficialStatus)} className={inputClass}>
              {Object.entries(OFFICIAL_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Fase actual del negocio</label>
            <select value={config.current_business_phase} onChange={(e) => set('current_business_phase', e.target.value as BusinessPhase)} className={inputClass}>
              {Object.entries(BUSINESS_PHASE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Leads gratis antes de membresía</label>
            <input type="number" value={config.free_lead_threshold} onChange={(e) => set('free_lead_threshold', Number(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Precio mensual sugerido</label>
            <input type="number" value={config.default_monthly_price} onChange={(e) => set('default_monthly_price', Number(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Precio destacado (opcional)</label>
            <input type="number" value={config.featured_price ?? ''} onChange={(e) => set('featured_price', e.target.value ? Number(e.target.value) : null)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Fee de reactivación (opcional)</label>
            <input type="number" value={config.reactivation_fee ?? ''} onChange={(e) => set('reactivation_fee', e.target.value ? Number(e.target.value) : null)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>WhatsApp de MrServicios</label>
            <input value={config.whatsapp_business_number ?? ''} onChange={(e) => set('whatsapp_business_number', e.target.value)} className={inputClass} placeholder="Ej: 5493511234567" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
          {([
            ['enable_close_code', 'Código de cierre (feature futura)'],
            ['enable_membership_payments', 'Pagos de membresía'],
            ['enable_featured_providers', 'Prestadores destacados'],
            ['enable_public_reviews', 'Reseñas públicas'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config[key]}
                onChange={(e) => set(key, e.target.checked)}
                className="w-4 h-4 accent-[#e2b040]"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5">
        <h3 className="text-white font-semibold text-sm mb-1">Pesos del ranking</h3>
        <p className="text-gray-500 text-xs mb-4">Puntos que suma o resta cada factor al calcular el orden de aparición.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {(Object.keys(config.ranking_weights) as (keyof RankingWeights)[]).map((key) => (
            <div key={key} className="flex items-center justify-between gap-3 bg-[#16213e] rounded-lg px-3 py-2">
              <span className="text-gray-300 text-xs">{RANKING_WEIGHT_LABELS[key]}</span>
              <input
                type="number"
                value={config.ranking_weights[key]}
                onChange={(e) => setWeight(key, Number(e.target.value))}
                className="w-20 bg-[#1a1a2e] border border-white/10 rounded px-2 py-1 text-white text-sm text-right focus:outline-none focus:border-[#e2b040]/50"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={guardar}
          disabled={guardando}
          className="px-6 py-3 bg-[#e2b040] text-[#1a1a2e] rounded-xl font-bold hover:bg-[#f0d080] transition-colors cursor-pointer disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {guardado && <span className="text-green-400 text-sm flex items-center gap-1"><i className="ri-check-line" />Guardado</span>}
      </div>
    </div>
  );
}
