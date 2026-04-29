// ─────────────────────────────────────────────────────────────
// Edge Function: eliminar-prestador
// POST /functions/v1/eliminar-prestador
// Elimina un prestador y datos relacionados. Solo admin.
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../_shared/supabase-admin.ts';
import {
  corsPreflightResponse,
  okResponse,
  errorResponse,
  validarAdminSecret,
} from '../_shared/cors.ts';

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return error instanceof Error ? error.message : 'Error inesperado';
}

function isMissingTableError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes('could not find the table') || message.includes('does not exist');
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  if (!validarAdminSecret(req)) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const { prestador_id } = await req.json();
    const prestadorId = String(prestador_id || '').trim();

    if (!prestadorId) return errorResponse('prestador_id es requerido');

    const supabase = getSupabaseAdmin();

    const { data: prestador, error: prestadorError } = await supabase
      .from('prestadores')
      .select('id')
      .eq('id', prestadorId)
      .maybeSingle();

    if (prestadorError) throw prestadorError;
    if (!prestador) return errorResponse('Prestador no encontrado', 404);

    const { data: ordenes } = await supabase
      .from('ordenes')
      .select('id')
      .eq('prestador_id', prestadorId);

    const ordenIds = (ordenes || []).map((orden) => orden.id).filter(Boolean);

    const relatedDeletes = [
      supabase.from('valoraciones').delete().eq('prestador_id', prestadorId),
      supabase.from('reservas').delete().eq('prestador_id', prestadorId),
      supabase.from('disponibilidad_prestadores').delete().eq('prestador_id', prestadorId),
      supabase.from('conversaciones').delete().eq('prestador_id', prestadorId),
    ];

    for (const operation of relatedDeletes) {
      const { error } = await operation;
      if (error && !isMissingTableError(error)) throw error;
    }

    if (ordenIds.length > 0) {
      const { error: eventosError } = await supabase
        .from('orden_eventos')
        .delete()
        .in('orden_id', ordenIds);
      if (eventosError && !isMissingTableError(eventosError)) throw eventosError;

      const { error: ordenesError } = await supabase
        .from('ordenes')
        .delete()
        .eq('prestador_id', prestadorId);
      if (ordenesError && !isMissingTableError(ordenesError)) throw ordenesError;
    }

    const { data: eliminado, error: deleteError } = await supabase
      .from('prestadores')
      .delete()
      .eq('id', prestadorId)
      .select('id')
      .maybeSingle();

    if (deleteError) throw deleteError;
    if (!eliminado) return errorResponse('No se pudo eliminar el prestador', 409);

    return okResponse({ ok: true, prestador_id: prestadorId });
  } catch (err) {
    console.error('[eliminar-prestador]', err);
    return errorResponse('Error al eliminar prestador', 500, getErrorMessage(err));
  }
});
