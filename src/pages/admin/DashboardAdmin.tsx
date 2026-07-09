import { useState, useEffect, useCallback } from 'react';
import { dashboardAdminApi, type KpisDashboard } from '../../api/dashboardAdminApi';

function Tile({ icon, label, value, colorClass }: { icon: string; label: string; value: string | number; colorClass?: string }) {
  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4">
      <i className={`${icon} text-xl ${colorClass ?? 'text-[#e2b040]'} mb-2 block`} />
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-gray-500 text-xs mt-0.5">{label}</p>
    </div>
  );
}

export default function DashboardAdmin() {
  const [kpis, setKpis] = useState<KpisDashboard | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const data = await dashboardAdminApi.obtenerKpis();
      setKpis(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar el dashboard');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-16">
        <i className="ri-loader-4-line animate-spin text-3xl text-[#e2b040]" />
      </div>
    );
  }

  if (error || !kpis) {
    return <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">Dashboard general</h2>
          <p className="text-gray-400 text-sm mt-0.5">Métricas clave del negocio</p>
        </div>
        <button
          onClick={cargar}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm transition-colors cursor-pointer"
        >
          <i className="ri-refresh-line" />Actualizar
        </button>
      </div>

      <div>
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Leads</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Tile icon="ri-contacts-line" label="Contactos totales" value={kpis.leads_totales} />
          <Tile icon="ri-calendar-line" label="Este mes" value={kpis.leads_mes} />
          <Tile icon="ri-sun-line" label="Hoy" value={kpis.leads_hoy} />
          <Tile icon="ri-checkbox-circle-line" label="Terminados" value={kpis.trabajos_terminados} colorClass="text-green-400" />
          <Tile icon="ri-close-circle-line" label="No avanzó" value={kpis.trabajos_no_avanzo} colorClass="text-gray-400" />
        </div>
      </div>

      <div>
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Conversión</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Tile icon="ri-phone-line" label="Tasa de contacto" value={`${kpis.tasa_contacto}%`} />
          <Tile icon="ri-file-list-3-line" label="Presupuesto enviado" value={`${kpis.tasa_presupuesto}%`} />
          <Tile icon="ri-checkbox-circle-line" label="Confirmación" value={`${kpis.tasa_confirmacion}%`} />
          <Tile icon="ri-flag-2-line" label="Finalización" value={`${kpis.tasa_finalizacion}%`} colorClass="text-green-400" />
          <Tile icon="ri-close-circle-line" label="No avanzó" value={`${kpis.tasa_no_avanzo}%`} colorClass="text-gray-400" />
        </div>
      </div>

      <div>
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Prestadores</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Tile icon="ri-user-star-line" label="Activos" value={kpis.prestadores_activos} />
          <Tile icon="ri-shield-check-line" label="Verificados" value={kpis.prestadores_verificados} colorClass="text-green-400" />
          <Tile icon="ri-trophy-line" label="Destacados" value={kpis.prestadores_destacados} />
          <Tile icon="ri-pause-circle-line" label="Suspendidos" value={kpis.prestadores_suspendidos} colorClass="text-red-400" />
        </div>
      </div>

      <div>
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Membresías y reputación</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Tile icon="ri-vip-crown-line" label="Membresías activas" value={kpis.membresias_activas} colorClass="text-green-400" />
          <Tile icon="ri-error-warning-line" label="Membresías vencidas" value={kpis.membresias_vencidas} colorClass="text-red-400" />
          <Tile icon="ri-star-line" label="Rating promedio" value={kpis.rating_promedio_barrio || '—'} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-3">Categorías más buscadas</h3>
          {kpis.top_categorias.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin datos todavía</p>
          ) : (
            <div className="space-y-2">
              {kpis.top_categorias.map((c) => (
                <div key={c.categoria} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 capitalize">{c.categoria}</span>
                  <span className="text-[#e2b040] font-semibold">{c.cantidad}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-3">Prestadores con más contactos</h3>
          {kpis.top_prestadores.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin datos todavía</p>
          ) : (
            <div className="space-y-2">
              {kpis.top_prestadores.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{p.nombre} {p.apellido}</span>
                  <span className="text-[#e2b040] font-semibold">{p.total_leads} leads</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
