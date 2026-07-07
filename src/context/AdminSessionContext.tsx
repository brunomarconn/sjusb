// ─────────────────────────────────────────────────────────────
// Sesión de admin. sessionStorage (acotada a la pestaña), separada
// a propósito de las sesiones de cliente/prestador en localStorage.
// ─────────────────────────────────────────────────────────────
import { useSessionContext } from './SessionProvider';

export function useAdminSession() {
  const ctx = useSessionContext();
  return {
    isAuthenticated: ctx.adminOk,
    login: ctx.loginAdmin,
    logout: ctx.logoutAdmin,
  };
}
