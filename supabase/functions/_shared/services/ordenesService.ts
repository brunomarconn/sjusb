// ─────────────────────────────────────────────────────────────
// Lógica de negocio: órdenes (crear-orden, completar-servicio)
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as ordenesDao from '../dao/ordenesDao.ts';
import * as ordenEventosDao from '../dao/ordenEventosDao.ts';
import * as prestadoresDao from '../dao/prestadoresDao.ts';
import { validarTransicion } from '../domain/ordenEstado.ts';
import { COMISION_ORDEN_DEFAULT } from '../domain/comision.ts';
import type { CompletarServicioInput, CrearOrdenInput } from '../dto/ordenes.dto.ts';

export class ValidacionError extends Error {}
export class PrestadorNoEncontradoError extends Error {}
export class OrdenNoEncontradaError extends Error {}
export class TransicionInvalidaError extends Error {}

export async function crearOrden(db: SupabaseClient, input: CrearOrdenInput) {
  const clienteDni = input.cliente_dni?.trim();
  const prestadorId = input.prestador_id?.trim();
  const titulo = input.titulo?.trim();
  const porcentajeComision = input.porcentaje_comision ?? COMISION_ORDEN_DEFAULT;

  if (!clienteDni) throw new ValidacionError('cliente_dni es requerido');
  if (!prestadorId) throw new ValidacionError('prestador_id es requerido');
  if (!titulo) throw new ValidacionError('titulo es requerido');
  if (!input.monto_bruto || Number(input.monto_bruto) <= 0) {
    throw new ValidacionError('monto_bruto debe ser mayor a 0');
  }
  if (porcentajeComision < 0 || porcentajeComision > 100) {
    throw new ValidacionError('porcentaje_comision debe estar entre 0 y 100');
  }

  const prestador = await prestadoresDao.obtenerResumen(db, prestadorId);
  if (!prestador) throw new PrestadorNoEncontradoError('Prestador no encontrado');

  const bruto = parseFloat(String(input.monto_bruto));
  const comision = Math.round(bruto * (porcentajeComision / 100) * 100) / 100;
  const paraPrestador = Math.round((bruto - comision) * 100) / 100;

  const orden = await ordenesDao.insertar(db, {
    cliente_dni: clienteDni,
    cliente_email: input.cliente_email?.trim().toLowerCase() || null,
    prestador_id: prestadorId,
    titulo,
    descripcion: input.descripcion?.trim() || null,
    monto_bruto: bruto,
    monto_prestador: paraPrestador,
    monto_comision: comision,
    porcentaje_comision: porcentajeComision,
    estado: 'draft',
    pago_proveedor: Deno.env.get('PAYMENT_MODE') === 'mock' ? 'mock' : 'mercadopago',
  });

  await ordenEventosDao.registrar(db, {
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

  return orden;
}

export async function completarServicio(db: SupabaseClient, input: CompletarServicioInput) {
  if (!input.orden_id) throw new ValidacionError('orden_id es requerido');

  const { data: orden, error } = await ordenesDao.obtenerParaCompletar(db, input.orden_id);
  if (error || !orden) throw new OrdenNoEncontradaError('Orden no encontrada');

  try {
    validarTransicion(orden.estado, 'service_completed');
  } catch (e) {
    throw new TransicionInvalidaError(String(e));
  }

  const ahora = new Date().toISOString();
  const ordenActualizada = await ordenesDao.actualizarEstado(db, orden.id, {
    estado: 'service_completed',
    servicio_completado_at: ahora,
  });

  await ordenEventosDao.registrar(db, {
    ordenId: orden.id,
    tipo: 'servicio_completado',
    estadoAnterior: orden.estado,
    estadoNuevo: 'service_completed',
    datos: {
      ...(input.nota ? { nota: input.nota } : {}),
      completado_at: ahora,
    },
    creadoPor: 'admin',
  });

  return ordenActualizada;
}
