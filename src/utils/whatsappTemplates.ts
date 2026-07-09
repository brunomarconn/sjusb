// ─────────────────────────────────────────────────────────────
// Plantillas de WhatsApp (verbatim de modeloActualizado.md §Mensajes)
// y helper para armar el link de wa.me. No hay WhatsApp Business API
// en el proyecto: estas plantillas se usan para botones de "copiar
// mensaje" / "abrir WhatsApp", no para envíos automáticos server-side.
// ─────────────────────────────────────────────────────────────

/** Normaliza un teléfono argentino y arma el link de wa.me con mensaje prearmado. */
export function buildWaUrl(phone: string, message: string): string {
  const soloDigitos = (phone || '').replace(/\D/g, '');
  return `https://wa.me/549${soloDigitos}?text=${encodeURIComponent(message)}`;
}

// a) Avisar al prestador que recibió una solicitud
export function mensajeNuevoContacto(vars: { nombre: string; servicio: string; link: string }): string {
  return `📩 ¡Nuevo contacto en MrServicios! ${vars.nombre}, vecino/a de San Isidro, busca ${vars.servicio}. Te va a escribir por acá. Podés ver los datos y marcar el estado del trabajo acá 👉 ${vars.link}`;
}

// b) Mandarle el link para actualizar estado
export function mensajeLinkActualizarEstado(vars: { link: string }): string {
  return `Para llevar el control de este trabajo (y sumar reputación), marcá el estado con un toque 👉 ${vars.link}. Te lleva menos de un minuto 🙌`;
}

// c) Recordatorio amable de actualizar estado
export function mensajeRecordatorioEstado(vars: { nombre: string; vecino: string; link: string }): string {
  return `Hola ${vars.nombre} 👋 Vimos que tenés un trabajo con ${vars.vecino} sin actualizar. Cuando puedas, marcá cómo va acá 👉 ${vars.link}. Tener el perfil al día te ayuda a aparecer más arriba y recibir más contactos 📈`;
}

// d) Pedir confirmación al cliente (= reseña)
export function mensajePedidoResena(vars: { nombre: string; prestador: string; link: string }): string {
  return `¡Hola ${vars.nombre}! 😊 ¿Cómo te fue con ${vars.prestador}? Dejá tu opinión en 10 segundos y ayudá a otros vecinos a elegir mejor 👉 ${vars.link} ⭐⭐⭐⭐⭐`;
}

// e) Recordatorio suave de reseña
export function mensajeRecordatorioResena(vars: { nombre: string; prestador: string; link: string }): string {
  return `Hola ${vars.nombre} 👋 Si tuviste un rato, tu reseña sobre ${vars.prestador} le sirve un montón al resto del barrio 🙏 ${vars.link}. ¡Gracias!`;
}

// f) Cobro de membresía
export function mensajeCobroMembresia(vars: { nombre: string; n: number; monto: string; linkMercadoPago: string }): string {
  return `Hola ${vars.nombre} 🙌 Este mes MrServicios te acercó ${vars.n} contactos de San Isidro. Para seguir activo y visible, tu cuota es ${vars.monto}. Pagás en un toque acá 👉 ${vars.linkMercadoPago}. ¡Gracias por ser parte!`;
}

// g) Advertencia al prestador
export function mensajeAdvertencia(vars: { nombre: string }): string {
  return `Hola ${vars.nombre}. Notamos que hace varios contactos que no actualizás el estado ni sumás reseñas. Eso hace que aparezcas más abajo y te lleguen menos clientes. Mantené tu perfil al día para seguir bien rankeado 💪 Cualquier duda, escribinos.`;
}
