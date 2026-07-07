// ─────────────────────────────────────────────────────────────
// Lógica de negocio: registro y login de clientes/prestadores
// (auth-registro, auth-login)
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as clientesDao from '../dao/clientesDao.ts';
import * as prestadoresDao from '../dao/prestadoresDao.ts';
import { hashPassword, verifyPassword, esHashBcrypt } from '../security/passwordHasher.ts';
import { emitirToken } from '../security/jwt.ts';
import type { RegistroClienteInput, LoginInput } from '../dto/auth.dto.ts';

export class ValidacionError extends Error {}
export class ConflictoError extends Error {}
export class CredencialesInvalidasError extends Error {}

export async function registrarCliente(db: SupabaseClient, input: RegistroClienteInput) {
  const dni = input.dni?.trim() ?? '';
  const nombre = input.nombre?.trim() ?? '';
  const apellido = input.apellido?.trim() ?? '';
  const telefono = (input.telefono ?? '').replace(/\D/g, '');

  if (!/^\d{7,8}$/.test(dni)) throw new ValidacionError('El DNI debe tener 7 u 8 dígitos numéricos');
  if (!nombre) throw new ValidacionError('nombre es requerido');
  if (!apellido) throw new ValidacionError('apellido es requerido');
  if (telefono.length < 10) throw new ValidacionError('Ingresá un número de teléfono válido');

  const existente = await clientesDao.obtenerPorDni(db, dni);
  if (existente) throw new ConflictoError('Este DNI ya está registrado');

  const hash = await hashPassword(dni);
  await clientesDao.insertar(db, {
    nombre,
    apellido,
    dni,
    telefono,
    password: hash,
    puntos: 0,
    tiene_promocion: false,
  });

  const token = await emitirToken({ sub: dni, rol: 'cliente' });
  return { token, dni };
}

/**
 * Verifica una contraseña contra el valor guardado. Si el valor guardado
 * todavía es texto plano legacy (cuentas creadas antes de este cambio) y
 * coincide, lo rehashea con bcrypt en el momento (lazy rehash). Lanza
 * CredencialesInvalidasError si no coincide en ningún caso.
 */
async function verificarYRehashear(
  db: SupabaseClient,
  stored: string,
  provided: string,
  dni: string,
  rol: 'cliente' | 'prestador',
  prestadorId?: string
): Promise<void> {
  if (esHashBcrypt(stored)) {
    const ok = await verifyPassword(provided, stored);
    if (!ok) throw new CredencialesInvalidasError('Credenciales inválidas');
    return;
  }

  if (stored !== provided) throw new CredencialesInvalidasError('Credenciales inválidas');

  const nuevoHash = await hashPassword(provided);
  if (rol === 'cliente') {
    await clientesDao.actualizarPassword(db, dni, nuevoHash);
  } else {
    await prestadoresDao.actualizarPassword(db, prestadorId!, nuevoHash);
  }
}

export async function login(db: SupabaseClient, input: LoginInput) {
  const dni = input.dni?.trim() ?? '';
  const password = input.password ?? '';
  if (!dni) throw new ValidacionError('dni es requerido');
  if (input.rol !== 'cliente' && input.rol !== 'prestador') throw new ValidacionError('rol inválido');

  if (input.rol === 'cliente') {
    const cliente = await clientesDao.obtenerPorDni(db, dni);
    if (!cliente) throw new CredencialesInvalidasError('DNI no registrado');
    await verificarYRehashear(db, cliente.password, password, dni, 'cliente');
    const token = await emitirToken({ sub: dni, rol: 'cliente' });
    return { token, dni, puntos: cliente.puntos, tiene_promocion: cliente.tiene_promocion };
  }

  const prestador = await prestadoresDao.obtenerPorDniConPassword(db, dni);
  if (!prestador) throw new CredencialesInvalidasError('DNI no encontrado');
  await verificarYRehashear(db, prestador.password, password, dni, 'prestador', prestador.id);
  const token = await emitirToken({ sub: dni, rol: 'prestador', prestador_id: prestador.id });
  return { token, dni, prestador_id: prestador.id };
}
