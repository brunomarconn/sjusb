// ─────────────────────────────────────────────────────────────
// Edge Function: completar-servicio
// POST /functions/v1/completar-servicio
// Marca el servicio como realizado. Solo admin.
// Transición: paid_pending_service → service_completed
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin, registrarEvento } from '../_shared/supabase-admin.ts';
import {
  corsPreflightResponse,
  okResponse,
  errorResponse,
  validarAdminSecret,
} from '../_shared/cors.ts';
import { validarTransicion } from '../_shared/state-machine.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  // Solo admin puede marcar un servicio como completado
  if (!validarAdminSecret(req)) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const { orden_id, nota } = await req.json();
    if (!orden_id) return errorResponse('orden_id es requerido');

    const supabase = getSupabaseAdmin();

    // ── Obtener la orden ───────────────────────────────────
    const { data: orden, error: fetchError } = await supabase
      .from('ordenes')
      .select('id, estado, cliente_dni, prestador_id, monto_bruto')
      .eq('id', orden_id)
      .single();

    if (fetchError || !orden) return errorResponse('Orden no encontrada', 404);

    // ── Validar transición de estado ───────────────────────
    try {
      validarTransicion(orden.estado, 'service_completed');
    } catch (e) {
      return errorResponse(String(e), 409);
    }

    // ── Actualizar estado de la orden ──────────────────────
    const ahora = new Date().toISOString();
    const { data: ordenActualizada, error: updateError } = await supabase
      .from('ordenes')
      .update({
        estado: 'service_completed',
        servicio_completado_at: ahora,
      })
      .eq('id', orden.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // ── Registrar evento ───────────────────────────────────
    await registrarEvento(supabase, {
      ordenId: orden.id,
      tipo: 'servicio_completado',
      estadoAnterior: orden.estado,
      estadoNuevo: 'service_completed',
      datos: {
        ...(nota ? { nota } : {}),
        completado_at: ahora,
      },
      creadoPor: 'admin',
    });

    return okResponse({
      mensaje: 'Servicio marcado como completado. Podés liberar los fondos.',
      orden: ordenActualizada,
    });
  } catch (err) {
    console.error('[completar-servicio]', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
