// ─────────────────────────────────────────────────────────────
// Lógica de negocio: KPIs y reporte del barrio (admin-dashboard)
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface TrabajoEstadoRow { estado: string }
interface CategoriaRow { categoria: string | null }
interface RatingRow { average_rating: number; review_count: number }

export async function obtenerKpis(db: SupabaseClient) {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);

  const [
    { count: leadsTotales },
    { count: leadsMes },
    { count: leadsHoy },
    { count: terminados },
    { count: noAvanzo },
    { count: prestadoresActivos },
    { count: prestadoresVerificados },
    { count: prestadoresDestacados },
    { count: prestadoresSuspendidos },
    { count: membresiasActivas },
    { count: membresiasVencidas },
    { data: trabajosPorEstado },
    { data: ratingData },
    { data: categoriasData },
    { data: topPrestadores },
  ] = await Promise.all([
    db.from('trabajos').select('id', { count: 'exact', head: true }),
    db.from('trabajos').select('id', { count: 'exact', head: true }).gte('created_at', inicioMes.toISOString()),
    db.from('trabajos').select('id', { count: 'exact', head: true }).gte('created_at', inicioHoy.toISOString()),
    db.from('trabajos').select('id', { count: 'exact', head: true }).eq('estado', 'terminado'),
    db.from('trabajos').select('id', { count: 'exact', head: true }).eq('estado', 'no_avanzo'),
    db.from('prestadores').select('id', { count: 'exact', head: true }).eq('enabled', true),
    db.from('prestadores').select('id', { count: 'exact', head: true }).eq('verification_status', 'verified'),
    db.from('prestadores').select('id', { count: 'exact', head: true }).eq('is_featured', true),
    db.from('prestadores').select('id', { count: 'exact', head: true }).eq('visibility_status', 'suspended'),
    db.from('membresias').select('id', { count: 'exact', head: true }).eq('estado', 'paid'),
    db.from('membresias').select('id', { count: 'exact', head: true }).eq('estado', 'overdue'),
    db.from('trabajos').select('estado'),
    db.from('prestadores').select('average_rating, review_count').eq('enabled', true),
    db.from('trabajos').select('categoria'),
    db.from('prestadores')
      .select('id, nombre, apellido, total_leads, average_rating, review_count')
      .eq('enabled', true)
      .order('total_leads', { ascending: false })
      .limit(5),
  ]);

  const estados = (trabajosPorEstado ?? []) as TrabajoEstadoRow[];
  const totalTrabajos = estados.length;
  const contactados = estados.filter((t) => t.estado !== 'nuevo_contacto').length;
  const presupuestados = estados.filter((t) => ['presupuesto_enviado', 'confirmado', 'terminado'].includes(t.estado)).length;
  const confirmados = estados.filter((t) => ['confirmado', 'terminado'].includes(t.estado)).length;
  const terminadosCount = estados.filter((t) => t.estado === 'terminado').length;
  const noAvanzoCount = estados.filter((t) => t.estado === 'no_avanzo').length;

  const pct = (n: number) => (totalTrabajos ? Math.round((n / totalTrabajos) * 100) : 0);

  const prestadoresConRating = ((ratingData ?? []) as RatingRow[]).filter((p) => p.review_count > 0);
  const ratingPromedioBarrio = prestadoresConRating.length
    ? Number((prestadoresConRating.reduce((acc, p) => acc + Number(p.average_rating), 0) / prestadoresConRating.length).toFixed(2))
    : 0;

  const conteoPorCategoria = new Map<string, number>();
  ((categoriasData ?? []) as CategoriaRow[]).forEach((t) => {
    if (!t.categoria) return;
    conteoPorCategoria.set(t.categoria, (conteoPorCategoria.get(t.categoria) ?? 0) + 1);
  });
  const topCategorias = [...conteoPorCategoria.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([categoria, cantidad]) => ({ categoria, cantidad }));

  return {
    leads_totales: leadsTotales ?? 0,
    leads_mes: leadsMes ?? 0,
    leads_hoy: leadsHoy ?? 0,
    trabajos_terminados: terminados ?? 0,
    trabajos_no_avanzo: noAvanzo ?? 0,
    tasa_contacto: pct(contactados),
    tasa_presupuesto: pct(presupuestados),
    tasa_confirmacion: pct(confirmados),
    tasa_finalizacion: pct(terminadosCount),
    tasa_no_avanzo: pct(noAvanzoCount),
    prestadores_activos: prestadoresActivos ?? 0,
    prestadores_verificados: prestadoresVerificados ?? 0,
    prestadores_destacados: prestadoresDestacados ?? 0,
    prestadores_suspendidos: prestadoresSuspendidos ?? 0,
    membresias_activas: membresiasActivas ?? 0,
    membresias_vencidas: membresiasVencidas ?? 0,
    rating_promedio_barrio: ratingPromedioBarrio,
    top_categorias: topCategorias,
    top_prestadores: topPrestadores ?? [],
  };
}

export async function obtenerReporteBarrio(db: SupabaseClient) {
  const kpis = await obtenerKpis(db);

  const { data: sancionesRecientes } = await db
    .from('sanciones_prestadores')
    .select('id, tipo, reason, created_at, prestadores(nombre, apellido)')
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: prestadoresMejorValorados } = await db
    .from('prestadores')
    .select('id, nombre, apellido, categoria, average_rating, review_count')
    .eq('enabled', true)
    .gt('review_count', 0)
    .order('average_rating', { ascending: false })
    .limit(10);

  return {
    ...kpis,
    quejas_recientes: sancionesRecientes ?? [],
    prestadores_mejor_valorados: prestadoresMejorValorados ?? [],
  };
}
