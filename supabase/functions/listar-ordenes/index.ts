// ─────────────────────────────────────────────────────────────
// Edge Function: listar-ordenes
// GET /functions/v1/listar-ordenes
// Lista órdenes con filtros opcionales.
//
// Query params:
//   estado        → filtrar por estado (ej. draft, payment_pending…)
//   prestador_id  → filtrar por prestador
//   cliente_dni   → filtrar por DNI de cliente
//   page          → página (default: 1)
//   limit         → registros por página (default: 20, max: 100)
//
// Acceso:
//   - Admin (x-admin-secret): ve todas las órdenes
//   - Cliente (x-cliente-dni): solo sus órdenes
//   - Prestador (x-prestador-id): solo sus órdenes
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../_shared/supabase-admin.ts';
import {
  corsPreflightResponse,
  okResponse,
  errorResponse,
  validarAdminSecret,
} from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const url = new URL(req.url);
    const supabase = getSupabaseAdmin();

    // ── Control de acceso ──────────────────────────────────
    const esAdmin = validarAdminSecret(req);
    const clienteDni = req.headers.get('x-cliente-dni');
    const prestadorId = req.headers.get('x-prestador-id');

    if (!esAdmin && !clienteDni && !prestadorId) {
      return errorResponse('Se requiere autenticación', 401);
    }

    // ── Parámetros de paginación ───────────────────────────
    const page  = Math.max(1, parseInt(url.searchParams.get('page')  || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const from  = (page - 1) * limit;
    const to    = from + limit - 1;

    // ── Construir query ────────────────────────────────────
    let query = supabase
      .from('ordenes')
      .select(`
        id,
        estado,
        titulo,
        descripcion,
        cliente_dni,
        prestador_id,
        monto_bruto,
        monto_prestador,
        monto_comision,
        pago_link,
        paid_at,
        servicio_completado_at,
        liberado_at,
        creado_at,
        prestadores (
          id,
          nombre,
          apellido,
          categoria
        )
      `, { count: 'exact' })
      .order('creado_at', { ascending: false })
      .range(from, to);

    // ── Filtros opcionales (solo admin puede forzar filtros externos) ──
    const estadoParam      = url.searchParams.get('estado');
    const prestadorParam   = url.searchParams.get('prestador_id');
    const clienteDniParam  = url.searchParams.get('cliente_dni');

    if (estadoParam) query = query.eq('estado', estadoParam);

    if (esAdmin) {
      // Admin: puede filtrar por cualquier prestador o cliente
      if (prestadorParam)  query = query.eq('prestador_id', prestadorParam);
      if (clienteDniParam) query = query.eq('cliente_dni', clienteDniParam);
    } else if (clienteDni) {
      // Cliente: solo sus órdenes
      query = query.eq('cliente_dni', clienteDni);
    } else if (prestadorId) {
      // Prestador: solo sus órdenes
      query = query.eq('prestador_id', prestadorId);
    }

    const { data: ordenes, error, count } = await query;

    if (error) throw error;

    return okResponse({
      ordenes: ordenes ?? [],
      total: count ?? 0,
      page,
      limit,
      totalPaginas: Math.ceil((count ?? 0) / limit),
    });
  } catch (err) {
    console.error('[listar-ordenes]', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
