// ─────────────────────────────────────────────────────────────
// Lógica de negocio: chat (chat-enviar, chat-listar, chat-marcar-leido, chat-obtener)
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as conversacionesDao from '../dao/conversacionesDao.ts';
import * as mensajesDao from '../dao/mensajesDao.ts';
import * as ordenesDao from '../dao/ordenesDao.ts';
import * as prestadoresDao from '../dao/prestadoresDao.ts';
import type { ConversacionRow } from '../dao/conversacionesDao.ts';
import type { Identidad } from '../middlewares/auth.ts';

export class ValidacionError extends Error {}
export class NoEncontradoError extends Error {}
export class AccesoDenegadoError extends Error {}

function validarAcceso(identidad: Identidad, conv: ConversacionRow) {
  if (identidad.esAdmin) return;
  if (identidad.clienteDni && conv.cliente_dni !== identidad.clienteDni) {
    throw new AccesoDenegadoError('Acceso denegado');
  }
  if (identidad.prestadorId && conv.prestador_id !== identidad.prestadorId) {
    throw new AccesoDenegadoError('Acceso denegado');
  }
}

// ── chat-enviar ─────────────────────────────────────────────

export async function enviarMensaje(
  db: SupabaseClient,
  identidad: Identidad,
  input: { conversacion_id: string; contenido: string }
) {
  if (!input.conversacion_id) throw new ValidacionError('conversacion_id requerido');
  const contenido = input.contenido?.trim() ?? '';
  if (!contenido) throw new ValidacionError('contenido requerido');
  if (contenido.length > 2000) throw new ValidacionError('Mensaje demasiado largo (máx. 2000 caracteres)');

  const { data: conv, error } = await conversacionesDao.obtenerResumenPorId(db, input.conversacion_id);
  if (error || !conv) throw new NoEncontradoError('Conversación no encontrada');
  validarAcceso(identidad, conv);

  const senderTipo = identidad.esAdmin ? 'admin' : identidad.clienteDni ? 'cliente' : 'prestador';
  const senderId = identidad.esAdmin ? 'admin' : (identidad.clienteDni ?? identidad.prestadorId ?? 'unknown');

  const mensaje = await mensajesDao.insertar(db, {
    conversacion_id: input.conversacion_id,
    sender_tipo: senderTipo,
    sender_id: senderId,
    contenido,
    tipo: 'text',
  });

  const incrementoCliente = senderTipo !== 'cliente' ? 1 : 0;
  const incrementoPrestador = senderTipo !== 'prestador' ? 1 : 0;

  await conversacionesDao.actualizarSnapshot(db, input.conversacion_id, {
    ultimo_mensaje_at: new Date().toISOString(),
    ultimo_mensaje_contenido: contenido.slice(0, 120),
    ultimo_mensaje_sender: senderTipo,
    no_leidos_cliente: conv.no_leidos_cliente + incrementoCliente,
    no_leidos_prestador: conv.no_leidos_prestador + incrementoPrestador,
  });

  return mensaje;
}

// ── chat-listar ──────────────────────────────────────────────

export async function listarConversaciones(
  db: SupabaseClient,
  identidad: Identidad,
  filtrosAdmin: { cliente_dni?: string | null; prestador_id?: string | null }
) {
  const filtro = identidad.esAdmin
    ? { clienteDni: filtrosAdmin.cliente_dni, prestadorId: filtrosAdmin.prestador_id }
    : { clienteDni: identidad.clienteDni, prestadorId: identidad.prestadorId };

  const data = await conversacionesDao.listarPorFiltro(db, filtro);

  return data.map((conv: Record<string, unknown>) => {
    const orden = conv.ordenes as Record<string, unknown> | null;
    const prestador = conv.prestadores as Record<string, unknown> | null;

    let noLeidos = 0;
    if (identidad.esAdmin) {
      noLeidos = (conv.no_leidos_cliente as number) + (conv.no_leidos_prestador as number);
    } else if (identidad.clienteDni) {
      noLeidos = conv.no_leidos_cliente as number;
    } else if (identidad.prestadorId) {
      noLeidos = conv.no_leidos_prestador as number;
    }

    return {
      id: conv.id,
      orden_id: conv.orden_id,
      cliente_dni: conv.cliente_dni,
      prestador_id: conv.prestador_id,
      ultimo_mensaje_at: conv.ultimo_mensaje_at,
      ultimo_mensaje_contenido: conv.ultimo_mensaje_contenido,
      ultimo_mensaje_sender: conv.ultimo_mensaje_sender,
      no_leidos: noLeidos,
      created_at: conv.created_at,
      orden_titulo: orden?.titulo ?? '',
      orden_estado: orden?.estado ?? '',
      prestador_nombre: prestador?.nombre ?? '',
      prestador_apellido: prestador?.apellido ?? '',
      prestador_categoria: prestador?.categoria ?? '',
    };
  });
}

// ── chat-marcar-leido ────────────────────────────────────────

export async function marcarLeido(
  db: SupabaseClient,
  identidad: Identidad,
  conversacionId: string
) {
  if (!conversacionId) throw new ValidacionError('conversacion_id requerido');

  const { data: conv, error } = await conversacionesDao.obtenerResumenPorId(db, conversacionId);
  if (error || !conv) throw new NoEncontradoError('Conversación no encontrada');
  validarAcceso(identidad, conv);

  if (identidad.esAdmin) {
    await conversacionesDao.marcarAmbosLeidos(db, conversacionId);
  } else if (identidad.clienteDni) {
    await conversacionesDao.marcarLeidoCliente(db, conversacionId);
  } else if (identidad.prestadorId) {
    await conversacionesDao.marcarLeidoPrestador(db, conversacionId);
  }
}

// ── chat-obtener ─────────────────────────────────────────────

async function marcarLeidoSiCorresponde(db: SupabaseClient, identidad: Identidad, conv: ConversacionRow) {
  if (identidad.esAdmin) return conv;

  if (identidad.clienteDni && conv.no_leidos_cliente > 0) {
    await conversacionesDao.marcarLeidoCliente(db, conv.id);
    conv.no_leidos_cliente = 0;
  } else if (identidad.prestadorId && conv.no_leidos_prestador > 0) {
    await conversacionesDao.marcarLeidoPrestador(db, conv.id);
    conv.no_leidos_prestador = 0;
  }

  return conv;
}

async function enriquecerConversacion(db: SupabaseClient, conv: ConversacionRow) {
  if (conv.orden_id) {
    const orden = await ordenesDao.obtenerResumen(db, conv.orden_id);
    return {
      ...conv,
      orden_titulo: orden?.titulo ?? '',
      orden_estado: orden?.estado ?? '',
    };
  }

  const prestador = await prestadoresDao.obtenerResumen(db, conv.prestador_id);
  const nombrePrestador = prestador ? `${prestador.nombre} ${prestador.apellido}`.trim() : 'Prestador';

  return {
    ...conv,
    orden_titulo: `Consulta a ${nombrePrestador}`,
    orden_estado: '',
    prestador_nombre: prestador?.nombre ?? '',
    prestador_apellido: prestador?.apellido ?? '',
    prestador_categoria: prestador?.categoria ?? '',
  };
}

export async function obtenerPorConversacionId(db: SupabaseClient, identidad: Identidad, conversacionId: string) {
  const { data: conv, error } = await conversacionesDao.obtenerPorId(db, conversacionId);
  if (error || !conv) throw new NoEncontradoError('Conversación no encontrada');
  validarAcceso(identidad, conv);

  await marcarLeidoSiCorresponde(db, identidad, conv);
  const mensajes = await mensajesDao.listarPorConversacion(db, conv.id);
  const conversacion = await enriquecerConversacion(db, conv);

  return { conversacion, mensajes };
}

export async function obtenerOCrearDirecta(db: SupabaseClient, identidad: Identidad, prestadorDestinoId: string) {
  if (!identidad.clienteDni) {
    throw new AccesoDenegadoError('Solo clientes pueden iniciar una conversación directa');
  }

  const prestador = await prestadoresDao.obtenerResumen(db, prestadorDestinoId);
  if (!prestador) throw new NoEncontradoError('Prestador no encontrado');

  let conv = await conversacionesDao.obtenerDirecta(db, identidad.clienteDni, prestadorDestinoId);
  if (!conv) {
    conv = await conversacionesDao.crear(db, {
      orden_id: null,
      cliente_dni: identidad.clienteDni,
      prestador_id: prestadorDestinoId,
    });
  }

  const conversacion = await marcarLeidoSiCorresponde(db, identidad, conv);
  const nombrePrestador = `${prestador.nombre} ${prestador.apellido}`.trim();

  return {
    conversacion: {
      ...conversacion,
      orden_titulo: `Consulta a ${nombrePrestador}`,
      orden_estado: '',
      prestador_nombre: prestador.nombre,
      prestador_apellido: prestador.apellido,
      prestador_categoria: prestador.categoria ?? '',
    },
    mensajes: await mensajesDao.listarPorConversacion(db, conv.id),
  };
}

export async function obtenerOCrearPorOrden(db: SupabaseClient, identidad: Identidad, ordenId: string) {
  const { data: orden, error } = await ordenesDao.obtenerParaChat(db, ordenId);
  if (error || !orden) throw new NoEncontradoError('Orden no encontrada');

  if (!identidad.esAdmin) {
    if (identidad.clienteDni && orden.cliente_dni !== identidad.clienteDni) {
      throw new AccesoDenegadoError('Acceso denegado');
    }
    if (identidad.prestadorId && orden.prestador_id !== identidad.prestadorId) {
      throw new AccesoDenegadoError('Acceso denegado');
    }
  }

  let conv = await conversacionesDao.obtenerPorOrdenId(db, ordenId);
  if (!conv) {
    conv = await conversacionesDao.crear(db, {
      orden_id: ordenId,
      cliente_dni: orden.cliente_dni,
      prestador_id: orden.prestador_id,
    });
  }

  await marcarLeidoSiCorresponde(db, identidad, conv);
  const mensajes = await mensajesDao.listarPorConversacion(db, conv.id);

  return {
    conversacion: {
      ...conv,
      orden_titulo: orden.titulo,
      orden_estado: orden.estado,
    },
    mensajes,
  };
}
