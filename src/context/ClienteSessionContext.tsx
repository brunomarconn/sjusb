// ─────────────────────────────────────────────────────────────
// Sesión de cliente (DNI). Reemplaza las lecturas directas de
// localStorage esparcidas por usuarios/mi-cuenta/pagar/puntos/chat.
// ─────────────────────────────────────────────────────────────
import * as session from '../utils/session';
import { useSessionContext } from './SessionProvider';

export function useClienteSession() {
  const ctx = useSessionContext();
  return {
    dni: ctx.clienteDni,
    token: ctx.clienteToken,
    login: ctx.loginCliente,
    logout: ctx.logoutCliente,
    reservados: ctx.reservados,
    marcarReservado: ctx.marcarReservado,
    yaReservo: (prestadorId: string) => ctx.reservados.includes(prestadorId),
    getPendingChat: session.getPendingChat,
    clearPendingChat: session.clearPendingChat,
  };
}
