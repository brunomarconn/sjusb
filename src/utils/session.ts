// ─────────────────────────────────────────────────────────────
// Único punto de acceso a localStorage/sessionStorage para las
// tres sesiones de la app (cliente, prestador, admin).
// Nada fuera de este archivo y de src/context/*SessionContext.tsx
// debería llamar a localStorage/sessionStorage directamente.
// ─────────────────────────────────────────────────────────────

const KEYS = {
  clienteDni: 'mservicios_cliente_dni',
  prestadorId: 'mservicios_prestador_id',
  dniPrestador: 'dniPrestador',
  reservados: 'mservicios_reservados',
  pendingChat: 'mservicios_pending_chat',
  adminOk: 'mservicios_admin_ok',
} as const;

// ── Cliente ──────────────────────────────────────────────────

export function getClienteDni(): string | null {
  return localStorage.getItem(KEYS.clienteDni);
}

/** Iniciar sesión como cliente cierra cualquier sesión de prestador activa */
export function setClienteDni(dni: string): void {
  localStorage.removeItem(KEYS.dniPrestador);
  localStorage.removeItem(KEYS.prestadorId);
  localStorage.setItem(KEYS.clienteDni, dni);
}

export function clearClienteDni(): void {
  localStorage.removeItem(KEYS.clienteDni);
}

// ── Prestador ────────────────────────────────────────────────

export function getDniPrestador(): string | null {
  return localStorage.getItem(KEYS.dniPrestador);
}

export function getPrestadorId(): string | null {
  return localStorage.getItem(KEYS.prestadorId);
}

/** Iniciar sesión como prestador cierra cualquier sesión de cliente activa */
export function setDniPrestador(dni: string): void {
  localStorage.removeItem(KEYS.clienteDni);
  localStorage.setItem(KEYS.dniPrestador, dni);
}

export function setPrestadorId(id: string): void {
  localStorage.setItem(KEYS.prestadorId, id);
}

export function clearPrestadorSession(): void {
  localStorage.removeItem(KEYS.dniPrestador);
  localStorage.removeItem(KEYS.prestadorId);
}

// ── Reservados (habilita "Valorar" para clientes) ─────────────

export function getReservados(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.reservados) || '[]');
  } catch {
    return [];
  }
}

export function addReservado(prestadorId: string): void {
  const reservados = getReservados();
  if (!reservados.includes(prestadorId)) {
    reservados.push(prestadorId);
    localStorage.setItem(KEYS.reservados, JSON.stringify(reservados));
  }
}

export function yaReservo(prestadorId: string): boolean {
  return getReservados().includes(prestadorId);
}

// ── Chat pendiente (redirección post-login desde /prestadores) ─

export function getPendingChat(): string | null {
  return localStorage.getItem(KEYS.pendingChat);
}

export function clearPendingChat(): void {
  localStorage.removeItem(KEYS.pendingChat);
}

// ── Admin (sessionStorage — acotado a la pestaña) ─────────────

export function getAdminOk(): boolean {
  return sessionStorage.getItem(KEYS.adminOk) === '1';
}

export function setAdminOk(): void {
  sessionStorage.setItem(KEYS.adminOk, '1');
}

export function clearAdminOk(): void {
  sessionStorage.removeItem(KEYS.adminOk);
}
