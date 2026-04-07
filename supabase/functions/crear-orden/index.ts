// ─────────────────────────────────────────────────────────────
// Edge Function: crear-orden
// POST /functions/v1/crear-orden
// Crea una orden en estado 'draft'. Solo admin.
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin, registrarEvento } from '../_shared/supabase-admin.ts';
import {
  corsPreflightResponse,
  okResponse,
  errorResponse,
  validarAdminSecret,
} from '../_shared/cors.ts';

const COMISION_DEFAULT = 15; // 15% de comisión por defecto

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  // Solo admin puede crear órdenes
  if (!validarAdminSecret(req)) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const body = await req.json();

    const {
      cliente_dni,
      cliente_email,
      prestador_id,
      titulo,
      descripcion,
      monto_bruto,
      porcentaje_comision = COMISION_DEFAULT,
    } = body;

    // ── Validaciones básicas ───────────────────────────────
    if (!cliente_dni?.trim())  return errorResponse('cliente_dni es requerido');
    if (!prestador_id?.trim()) return errorResponse('prestador_id es requerido');
    if (!titulo?.trim())       return errorResponse('titulo es requerido');
    if (!monto_bruto || Number(monto_bruto) <= 0) {
      return errorResponse('monto_bruto debe ser mayor a 0');
    }
    if (porcentaje_comision < 0 || porcentaje_comision > 100) {
      return errorResponse('porcentaje_comision debe estar entre 0 y 100');
    }

    const supabase = getSupabaseAdmin();

    // ── Verificar que el prestador existe ─────────────────
    const { data: prestador } = await supabase
      .from('prestadores')
      .select('id, nombre, apellido, categoria')
      .eq('id', prestador_id.trim())
      .maybeSingle();

    if (!prestador) return errorResponse('Prestador no encontrado', 404);

    // ── Calcular montos ────────────────────────────────────
    const bruto = parseFloat(String(monto_bruto));
    const comision = Math.round(bruto * (porcentaje_comision / 100) * 100) / 100;
    const paraPrestador = Math.round((bruto - comision) * 100) / 100;

    // ── Insertar orden ─────────────────────────────────────
    const { data: orden, error: insertError } = await supabase
      .from('ordenes')
      .insert({
        cliente_dni: cliente_dni.trim(),
        cliente_email: cliente_email?.trim().toLowerCase() || null,
        prestador_id: prestador_id.trim(),
        titulo: titulo.trim(),
        descripcion: descripcion?.trim() || null,
        monto_bruto: bruto,
        monto_prestador: paraPrestador,
        monto_comision: comision,
        porcentaje_comision,
        estado: 'draft',
        pago_proveedor: Deno.env.get('PAYMENT_MODE') === 'mock' ? 'mock' : 'mercadopago',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // ── Registrar evento ───────────────────────────────────
    await registrarEvento(supabase, {
      ordenId: orden.id,
      tipo: 'orden_creada',
      estadoNuevo: 'draft',
      datos: {
        titulo: orden.titulo,
        monto_bruto: bruto,
        monto_prestador: paraPrestador,
        monto_comision: comision,
        prestador: `${prestador.nombre} ${prestador.apellido}`,
        categoria: prestador.categoria,
      },
      creadoPor: 'admin',
    });

    return okResponse({ orden }, 201);
  } catch (err) {
    console.error('[crear-orden]', err);
    return errorResponse('Error interno al crear la orden', 500, String(err));
  }
});
