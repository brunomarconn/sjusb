// ─────────────────────────────────────────────────────────────
// Plantillas HTML de los emails transaccionales (presentación,
// no lógica de negocio) — usadas por reservaNotificacionService
// y comisionService a través de clients/resendClient.ts
// ─────────────────────────────────────────────────────────────

export function nuevaReservaHtml(params: {
  nombre: string;
  apellido: string;
  telefono: string;
  dia: string;
  turno: string;
  prestadorNombre?: string;
  prestadorApellido?: string;
  prestadorCategoria?: string;
}): string {
  const { nombre, apellido, telefono, dia, turno, prestadorNombre, prestadorApellido, prestadorCategoria } = params;
  const diaFormateado = new Date(dia + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1a2e;color:#fff;padding:32px;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#e2b040;margin:0;">MrServicios</h1>
        <p style="color:#9ca3af;margin:4px 0;">Nueva reserva recibida</p>
      </div>

      <div style="background:#16213e;border:1px solid #e2b040;border-radius:8px;padding:20px;margin-bottom:16px;">
        <h2 style="color:#e2b040;margin:0 0 12px;">Cliente</h2>
        <p style="margin:6px 0;"><strong>Nombre:</strong> ${nombre} ${apellido}</p>
        <p style="margin:6px 0;"><strong>Teléfono:</strong> ${telefono}</p>
      </div>

      <div style="background:#16213e;border:1px solid #e2b040;border-radius:8px;padding:20px;margin-bottom:16px;">
        <h2 style="color:#e2b040;margin:0 0 12px;">Reserva</h2>
        <p style="margin:6px 0;"><strong>Prestador:</strong> ${prestadorNombre ?? '-'} ${prestadorApellido ?? ''}</p>
        <p style="margin:6px 0;"><strong>Servicio:</strong> ${prestadorCategoria ?? '-'}</p>
        <p style="margin:6px 0;"><strong>Fecha:</strong> ${diaFormateado}</p>
        <p style="margin:6px 0;"><strong>Turno:</strong> ${turno === 'mañana' ? '🌅 Mañana' : '🌆 Tarde'}</p>
      </div>

      <div style="background:#e2b040;border-radius:8px;padding:16px;text-align:center;">
        <p style="color:#1a1a2e;font-weight:bold;margin:0;">
          💰 Recordá cobrar los $3.000 por este trabajo una vez realizado.
        </p>
      </div>

      <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:20px;">
        ${new Date().toLocaleString('es-AR')}
      </p>
    </div>
  `;
}

export function cobroComisionHtml(params: {
  nombrePrestador: string;
  telefonoPrestador: string;
  categoria?: string;
  clienteNombre: string;
  clienteApellido: string;
  clienteTelefono: string;
  diaFormateado: string;
  turnoLabel: string;
  zona?: string;
  descripcionTrabajo?: string;
  montoComision: number;
  linkPago: string;
  mensajeWA: string;
}): string {
  const {
    nombrePrestador, telefonoPrestador, categoria,
    clienteNombre, clienteApellido, clienteTelefono,
    diaFormateado, turnoLabel, zona, descripcionTrabajo,
    montoComision, linkPago, mensajeWA,
  } = params;

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1a2e;color:#fff;padding:32px;border-radius:12px;">
      <h1 style="color:#e2b040;margin:0 0 8px;">MrServicios</h1>
      <p style="color:#9ca3af;margin:0 0 24px;">Comisión generada automáticamente</p>

      <div style="background:#16213e;border:1px solid #e2b040;border-radius:8px;padding:20px;margin-bottom:16px;">
        <h2 style="color:#e2b040;margin:0 0 12px;">Prestador</h2>
        <p style="margin:4px 0;"><strong>Nombre:</strong> ${nombrePrestador}</p>
        <p style="margin:4px 0;"><strong>Teléfono:</strong> ${telefonoPrestador}</p>
        <p style="margin:4px 0;"><strong>Servicio:</strong> ${categoria ?? '-'}</p>
      </div>

      <div style="background:#16213e;border:1px solid #e2b040;border-radius:8px;padding:20px;margin-bottom:16px;">
        <h2 style="color:#e2b040;margin:0 0 12px;">Reserva</h2>
        <p style="margin:4px 0;"><strong>Cliente:</strong> ${clienteNombre} ${clienteApellido}</p>
        <p style="margin:4px 0;"><strong>Teléfono cliente:</strong> ${clienteTelefono}</p>
        <p style="margin:4px 0;"><strong>Fecha:</strong> ${diaFormateado}</p>
        <p style="margin:4px 0;"><strong>Turno:</strong> ${turnoLabel}</p>
        ${zona ? `<p style="margin:4px 0;"><strong>Zona:</strong> ${zona}</p>` : ''}
        ${descripcionTrabajo ? `<p style="margin:4px 0;"><strong>Trabajo:</strong> ${descripcionTrabajo}</p>` : ''}
      </div>

      <div style="background:#16213e;border:1px solid #e2b040;border-radius:8px;padding:20px;margin-bottom:16px;">
        <h2 style="color:#e2b040;margin:0 0 12px;">Comisión</h2>
        <p style="margin:4px 0;font-size:24px;font-weight:bold;color:#e2b040;">$${montoComision.toLocaleString('es-AR')}</p>
        <p style="margin:8px 0;">
          <a href="${linkPago}" style="background:#e2b040;color:#1a1a2e;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Cobrar ahora
          </a>
        </p>
      </div>

      <div style="background:#0f2d0f;border:1px solid #4ade80;border-radius:8px;padding:20px;">
        <h3 style="color:#4ade80;margin:0 0 8px;">Mensaje para copiar y enviar por WhatsApp</h3>
        <p style="color:#d1fae5;font-size:13px;line-height:1.6;white-space:pre-line;">${mensajeWA}</p>
      </div>
    </div>
  `;
}
