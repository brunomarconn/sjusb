import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardAdminApi, type ReporteBarrio } from '../../api/dashboardAdminApi';

export default function ReportesAdmin() {
  const [reporte, setReporte] = useState<ReporteBarrio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const data = await dashboardAdminApi.obtenerReporteBarrio();
      setReporte(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar el reporte');
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

  if (error || !reporte) {
    return <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>;
  }

  const datosGrafico = reporte.top_categorias.map((c) => ({ categoria: c.categoria, contactos: c.cantidad }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Reporte para la administración del barrio</h2>
        <p className="text-gray-400 text-sm mt-1 max-w-2xl">
          MrServicios ayuda a ordenar la búsqueda de prestadores, reducir consultas repetidas en grupos y mejorar
          la trazabilidad y reputación de quienes ingresan al barrio. Este resumen no incluye datos privados de vecinos.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{reporte.leads_totales}</p>
          <p className="text-gray-500 text-xs mt-1">Contactos generados</p>
        </div>
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{reporte.prestadores_activos}</p>
          <p className="text-gray-500 text-xs mt-1">Prestadores activos</p>
        </div>
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{reporte.prestadores_verificados}</p>
          <p className="text-gray-500 text-xs mt-1">Prestadores verificados</p>
        </div>
      </div>

      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5">
        <h3 className="text-white font-semibold text-sm mb-4">Servicios más buscados</h3>
        {datosGrafico.length === 0 ? (
          <p className="text-gray-500 text-sm">Todavía no hay suficientes datos.</p>
        ) : (
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={datosGrafico} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                <YAxis type="category" dataKey="categoria" stroke="#9ca3af" fontSize={12} width={140} />
                <Tooltip contentStyle={{ background: '#16213e', border: '1px solid #e2b04033', borderRadius: 8, color: '#fff' }} />
                <Bar dataKey="contactos" fill="#e2b040" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-3">Prestadores mejor valorados</h3>
          {reporte.prestadores_mejor_valorados.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin reseñas todavía.</p>
          ) : (
            <div className="space-y-2">
              {reporte.prestadores_mejor_valorados.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{p.nombre} {p.apellido} <span className="text-gray-500 capitalize">· {p.categoria}</span></span>
                  <span className="text-[#e2b040] font-semibold flex items-center gap-1">
                    <i className="ri-star-fill text-xs" />{p.average_rating.toFixed(1)} ({p.review_count})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-3">Quejas / reclamos recientes</h3>
          {reporte.quejas_recientes.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin quejas registradas.</p>
          ) : (
            <div className="space-y-2">
              {reporte.quejas_recientes.map((q) => (
                <div key={q.id} className="text-sm">
                  <p className="text-gray-300">
                    {q.prestadores ? `${q.prestadores.nombre} ${q.prestadores.apellido}` : 'Prestador'} — <span className="text-gray-500">{q.tipo}</span>
                  </p>
                  {q.reason && <p className="text-gray-500 text-xs">{q.reason}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
