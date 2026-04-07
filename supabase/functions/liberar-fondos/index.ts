// ─────────────────────────────────────────────────────────────
// Edge Function: liberar-fondos
// POST /functions/v1/liberar-fondos
// Libera los fondos al prestador. Solo admin.
// Transición: service_completed → released
// Crea un registro en la tabla `liquidaciones`.
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

  // Solo admin puede liberar fondos
  if (!validarAdminSecret(req)) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const { orden_id, metodo_transferencia, referencia_transferencia, nota } = await req.json();
    if (!orden_id) return errorResponse('orden_id es requerido');

    const supabase = getSupabaseAdmin();

    // ── Obtener la orden completa ─────────────────────────
    const { data: orden, error: fetchError } = await supabase
      .from('ordenes')
      .select(`
        id,
        estado,
        cliente_dni,
        prestador_id,
        monto_bruto,
        monto_prestador,
        monto_comision,
        porcentaje_comision,
        pago_referencia_externa,
        pago_metadata
      `)
      .eq('id', orden_id)
      .single();

    if (fetchError || !orden) return errorResponse('Orden no encontrada', 404);

    // ── Validar transición de estado ───────────────────────
    try {
      validarTransicion(orden.estado, 'released');
    } catch (e) {
      return errorResponse(String(e), 409);
    }

    // ── Verificar que no existe liquidación previa ─────────
    const { data: liquidacionExistente } = await supabase
      .from('liquidaciones')
      .select('id')
      .eq('orden_id', orden.id)
      .maybeSingle();

    if (liquidacionExistente) {
      return errorResponse('Ya existe una liquidación para esta orden', 409);
    }

    const ahora = new Date().toISOString();

    // ── Crear registro de liquidación ──────────────────────
    const { data: liquidacion, error: liquidacionError } = await supabase
      .from('liquidaciones')
      .insert({
        orden_id: orden.id,
        prestador_id: orden.prestador_id,
        monto_bruto: orden.monto_bruto,
        monto_prestador: orden.monto_prestador,
        monto_comision: orden.monto_comision,
        porcentaje_comision: orden.porcentaje_comision,
        metodo_transferencia: metodo_transferencia ?? null,
        referencia_transferencia: referencia_transferencia ?? null,
        nota: nota ?? null,
        liberado_at: ahora,
      })
      .select()
      .single();

    if (liquidacionError) throw liquidacionError;

    // ── Actualizar estado de la orden ──────────────────────
    const { data: ordenActualizada, error: updateError } = await supabase
      .from('ordenes')
      .update({
        estado: 'released',
        liberado_at: ahora,
      })
      .eq('id', orden.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // ── Registrar evento ───────────────────────────────────
    await registrarEvento(supabase, {
      ordenId: orden.id,
      tipo: 'fondos_liberados',
      estadoAnterior: orden.estado,
      estadoNuevo: 'released',
      datos: {
        liquidacion_id: liquidacion.id,
        monto_prestador: orden.monto_prestador,
        monto_comision: orden.monto_comision,
        ...(metodo_transferencia ? { metodo_transferencia } : {}),
        ...(referencia_transferencia ? { referencia_transferencia } : {}),
        ...(nota ? { nota } : {}),
        liberado_at: ahora,
      },
      creadoPor: 'admin',
    });

    // ─────────────────────────────────────────────────────
    // 🎯 HOOK FUTURO — Sistema de Puntos
    // Cuando los fondos se liberan (servicio 100% confirmado),
    // se acreditan puntos al cliente.
    // Descomentar cuando se implemente:
    //
    // await acreditarPuntosCliente(supabase, {
    //   clienteDni: orden.cliente_dni,
    //   ordenId: orden.id,
    //   evento: 'servicio_completado',
    //   monto: orden.monto_bruto,
    // });
    // ─────────────────────────────────────────────────────

    return okResponse({
      mensaje: 'Fondos liberados exitosamente.',
      orden: ordenActualizada,
      liquidacion,
    });
  } catch (err) {
    console.error('[liberar-fondos]', err);
    return errorResponse('Error interno', 500, String(err));
  }
});
