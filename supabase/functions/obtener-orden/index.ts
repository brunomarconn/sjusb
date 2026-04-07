// ─────────────────────────────────────────────────────────────
// Edge Function: obtener-orden
// GET /functions/v1/obtener-orden?id=<orden_id>
// Devuelve una orden con su historial de eventos y liquidación.
// Acceso:
//   - Admin (x-admin-secret): cualquier orden
//   - Cliente: solo sus propias órdenes (x-cliente-dni header)
//   - Prestador: solo sus propias órdenes (x-prestador-id header)
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
    const ordenId = url.searchParams.get('id');
    if (!ordenId) return errorResponse('Parámetro id es requerido');

    const supabase = getSupabaseAdmin();

    // ── Obtener la orden con joins ─────────────────────────
    const { data: orden, error: fetchError } = await supabase
      .from('ordenes')
      .select(`
        *,
        prestadores (
          id,
          nombre,
          apellido,
          categoria,
          telefono
        )
      `)
      .eq('id', ordenId)
      .single();

    if (fetchError || !orden) return errorResponse('Orden no encontrada', 404);

    // ── Control de acceso ──────────────────────────────────
    const esAdmin = validarAdminSecret(req);
    const clienteDni = req.headers.get('x-cliente-dni');
    const prestadorId = req.headers.get('x-prestador-id');

    if (!esAdmin) {
      // Cliente: solo puede ver sus propias órdenes
      if (clienteDni && orden.cliente_dni !== clienteDni) {
        return errorResponse('No autorizado', 403);
      }
      // Prestador: solo puede ver sus propias órdenes
      if (prestadorId && orden.prestador_id !== prestadorId) {
        return errorResponse('No autorizado', 403);
      }
      // Sin ningún identificador válido
      if (!clienteDni && !prestadorId) {
        return errorResponse('Se requiere autenticación', 401);
      }
    }

    // ── Historial de eventos ───────────────────────────────
    const { data: eventos } = await supabase
      .from('orden_eventos')
      .select('*')
      .eq('orden_id', ordenId)
      .order('creado_at', { ascending: true });

    // ── Liquidación (si existe) ────────────────────────────
    const { data: liquidacion } = await supabase
      .from('liquidaciones')
      .select('*')
      .eq('orden_id', ordenId)
      .maybeSingle();

    return okResponse({
      orden,
      eventos: eventos ?? [],
      liquidacion: liquidacion ?? null,
    });
  } catch (err) {
    console.error('[obtener-orden]', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
