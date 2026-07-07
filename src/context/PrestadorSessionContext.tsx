// ─────────────────────────────────────────────────────────────
// Sesión de prestador (DNI + id de la fila en prestadores).
// Reemplaza las lecturas directas de localStorage en
// AppHeader/prestadores/PanelPrestador/chat.
// ─────────────────────────────────────────────────────────────
import { useSessionContext } from './SessionProvider';

export function usePrestadorSession() {
  const ctx = useSessionContext();
  return {
    dniPrestador: ctx.dniPrestador,
    prestadorId: ctx.prestadorId,
    token: ctx.prestadorToken,
    loginConDni: ctx.loginPrestador,
    setPrestadorId: ctx.setPrestadorId,
    logout: ctx.logoutPrestador,
  };
}
