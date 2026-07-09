import { useState, useEffect, useCallback } from 'react';
import type { Valoracion } from '../../types/resena';

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const ANON_KEY     = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET as string | undefined;

async function callAdminPrestador(action: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (!ADMIN_SECRET) throw new Error('VITE_ADMIN_SECRET no configurada');
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/admin-prestador`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      authorization: `Bearer ${ANON_KEY}`,
      'content-type': 'application/json',
      'x-admin-secret': ADMIN_SECRET,
    },
    body: JSON.stringify({ action, ...data }),
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(json?.error ?? `Error ${resp.status}`);
  return json;
}

type Tab = 'todas' | 'visibles' | 'ocultas';

export default function ResenasAdmin() {
  const [tab, setTab] = useState<Tab>('todas');
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [filtroPrestador, setFiltroPrestador] = useState('');
  const [procesando, setProcesando] = useState<Set<string>>(new Set());

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const json = await callAdminPrestador('listar_valoraciones', {});
      setValoraciones((json.valoraciones ?? []) as Valoracion[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar reseñas');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function toggleVisibilidad(v: Valoracion) {
    setProcesando((prev) => new Set(prev).add(v.id));
    try {
      await callAdminPrestador('moderar_valoracion', { id: v.id, is_visible: !v.is_visible });
      await cargar();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al moderar reseña');
    } finally {
      setProcesando((prev) => { const s = new Set(prev); s.delete(v.id); return s; });
    }
  }

  const filtradas = valoraciones
    .filter((v) => tab === 'todas' || (tab === 'visibles' ? v.is_visible : !v.is_visible))
    .filter((v) => {
      if (!filtroPrestador.trim()) return true;
      const nombre = `${v.prestadores?.nombre ?? ''} ${v.prestadores?.apellido ?? ''}`.toLowerCase();
      return nombre.includes(filtroPrestador.toLowerCase());
    });

  const promedioGeneral = valoraciones.length > 0
    ? (valoraciones.reduce((acc, v) => acc + v.puntuacion, 0) / valoraciones.length).toFixed(1)
    : '—';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">Reseñas</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {valoraciones.length} reseña{valoraciones.length !== 1 ? 's' : ''} · promedio general {promedioGeneral}
          </p>
        </div>
        <button
          onClick={cargar}
          disabled={cargando}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          <i className={`ri-refresh-line ${cargando ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-[#1a1a2e] rounded-xl p-1">
          {(['todas', 'visibles', 'ocultas'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors cursor-pointer ${
                tab === t ? 'bg-[#e2b040] text-[#1a1a2e]' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          value={filtroPrestador}
          onChange={(e) => setFiltroPrestador(e.target.value)}
          placeholder="Filtrar por prestador..."
          className="bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e2b040]/50"
        />
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-16">
          <i className="ri-loader-4-line animate-spin text-3xl text-[#e2b040]" />
        </div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-14">
          <i className="ri-star-line text-4xl text-gray-600 mb-3 block" />
          <p className="text-gray-500 text-sm">No hay reseñas para este filtro</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((v) => (
            <div key={v.id} className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-white font-semibold text-sm">{v.nombre_cliente}</p>
                  <p className="text-gray-500 text-xs">
                    {v.prestadores ? `${v.prestadores.nombre} ${v.prestadores.apellido} · ${v.prestadores.categoria}` : 'Prestador'} ·{' '}
                    {new Date(v.created_at).toLocaleDateString('es-AR')} · {v.source}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <i key={s} className={s <= v.puntuacion ? 'ri-star-fill text-[#e2b040] text-sm' : 'ri-star-line text-gray-600 text-sm'} />
                    ))}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${v.is_visible ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'}`}>
                    {v.is_visible ? 'Visible' : 'Oculta'}
                  </span>
                </div>
              </div>
              {v.comentario && <p className="text-gray-300 text-sm leading-relaxed">{v.comentario}</p>}
              <button
                onClick={() => toggleVisibilidad(v)}
                disabled={procesando.has(v.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <i className={v.is_visible ? 'ri-eye-off-line' : 'ri-eye-line'} />
                {v.is_visible ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
