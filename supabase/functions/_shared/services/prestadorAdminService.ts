// ─────────────────────────────────────────────────────────────
// Lógica de negocio: administración de prestadores (admin-prestador)
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as prestadoresDao from '../dao/prestadoresDao.ts';
import * as disponibilidadDao from '../dao/disponibilidadDao.ts';
import * as valoracionesDao from '../dao/valoracionesDao.ts';
import type {
  ActualizarPrestadorInput,
  AgregarValoracionInput,
  CambiarEstadoInput,
  CrearPrestadorInput,
  GestionarDisponibilidadInput,
} from '../dto/admin-prestador.dto.ts';

export async function crearPrestador(db: SupabaseClient, input: CrearPrestadorInput) {
  const { id } = await prestadoresDao.insertar(db, input.payload);
  // Regla de negocio: todo prestador nuevo arranca con disponibilidad default L-V mañana/tarde
  await disponibilidadDao.insertarDefault(db, id);
  return { id };
}

export async function actualizarPrestador(db: SupabaseClient, input: ActualizarPrestadorInput) {
  await prestadoresDao.actualizar(db, input.id, input.payload);
}

export async function cambiarEstado(db: SupabaseClient, input: CambiarEstadoInput) {
  await prestadoresDao.cambiarEstado(db, input.id, input.enabled);
}

export async function agregarValoracion(db: SupabaseClient, input: AgregarValoracionInput) {
  await valoracionesDao.insertar(db, {
    prestador_id: input.prestador_id,
    nombre_cliente: String(input.nombre_cliente || '').trim(),
    puntuacion: Number(input.puntuacion) || 5,
    comentario: String(input.comentario || '').trim(),
  });
}

export async function gestionarDisponibilidad(db: SupabaseClient, input: GestionarDisponibilidadInput) {
  await disponibilidadDao.reemplazarEntradas(db, input.prestador_id, input.entradas);
}
