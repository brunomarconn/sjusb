// ─────────────────────────────────────────────────────────────
// Plantillas HTML de los emails transaccionales (presentación,
// no lógica de negocio) — usadas por leadNotificacionService
// a través de clients/resendClient.ts
// ─────────────────────────────────────────────────────────────

export function nuevoLeadHtml(params: {
  vecinoNombre: string;
  vecinoTelefono: string;
  prestadorNombre?: string;
  prestadorApellido?: string;
  prestadorCategoria?: string;
  servicioDescripcion?: string;
}): string {
  const { vecinoNombre, vecinoTelefono, prestadorNombre, prestadorApellido, prestadorCategoria, servicioDescripcion } = params;

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1a2e;color:#fff;padding:32px;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#e2b040;margin:0;">MrServicios</h1>
        <p style="color:#9ca3af;margin:4px 0;">Nuevo contacto (lead)</p>
      </div>

      <div style="background:#16213e;border:1px solid #e2b040;border-radius:8px;padding:20px;margin-bottom:16px;">
        <h2 style="color:#e2b040;margin:0 0 12px;">Vecino</h2>
        <p style="margin:6px 0;"><strong>Nombre:</strong> ${vecinoNombre}</p>
        <p style="margin:6px 0;"><strong>Teléfono:</strong> ${vecinoTelefono}</p>
        ${servicioDescripcion ? `<p style="margin:6px 0;"><strong>Detalle:</strong> ${servicioDescripcion}</p>` : ''}
      </div>

      <div style="background:#16213e;border:1px solid #e2b040;border-radius:8px;padding:20px;margin-bottom:16px;">
        <h2 style="color:#e2b040;margin:0 0 12px;">Prestador contactado</h2>
        <p style="margin:6px 0;"><strong>Nombre:</strong> ${prestadorNombre ?? '-'} ${prestadorApellido ?? ''}</p>
        <p style="margin:6px 0;"><strong>Servicio:</strong> ${prestadorCategoria ?? '-'}</p>
      </div>

      <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:20px;">
        ${new Date().toLocaleString('es-AR')}
      </p>
    </div>
  `;
}
