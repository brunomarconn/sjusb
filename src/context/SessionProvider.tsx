// ─────────────────────────────────────────────────────────────
// Estado compartido de las tres sesiones (cliente/prestador/admin).
// Un solo Provider en la raíz de la app para que iniciar sesión
// como cliente (que internamente cierra la de prestador, y
// viceversa — ver utils/session.ts) se refleje al instante en
// todos los componentes, incluido AppHeader.
//
// Los hooks públicos (useClienteSession, usePrestadorSession,
// useAdminSession) viven en sus propios archivos y solo leen
// la porción de este contexto que les corresponde.
// ─────────────────────────────────────────────────────────────
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import * as session from '../utils/session';

export interface SessionState {
  clienteDni: string | null;
  reservados: string[];
  dniPrestador: string | null;
  prestadorId: string | null;
  adminOk: boolean;
}

export interface SessionActions {
  loginCliente: (dni: string) => void;
  logoutCliente: () => void;
  marcarReservado: (prestadorId: string) => void;
  loginPrestador: (dni: string) => void;
  setPrestadorId: (id: string) => void;
  logoutPrestador: () => void;
  loginAdmin: () => void;
  logoutAdmin: () => void;
}

type SessionContextValue = SessionState & SessionActions;

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(() => ({
    clienteDni: session.getClienteDni(),
    reservados: session.getReservados(),
    dniPrestador: session.getDniPrestador(),
    prestadorId: session.getPrestadorId(),
    adminOk: session.getAdminOk(),
  }));

  const loginCliente = useCallback((dni: string) => {
    session.setClienteDni(dni);
    setState(s => ({ ...s, clienteDni: dni, dniPrestador: null, prestadorId: null }));
  }, []);

  const logoutCliente = useCallback(() => {
    session.clearClienteDni();
    setState(s => ({ ...s, clienteDni: null }));
  }, []);

  const marcarReservado = useCallback((prestadorId: string) => {
    session.addReservado(prestadorId);
    setState(s => ({ ...s, reservados: session.getReservados() }));
  }, []);

  const loginPrestador = useCallback((dni: string) => {
    session.setDniPrestador(dni);
    setState(s => ({ ...s, dniPrestador: dni, clienteDni: null }));
  }, []);

  const setPrestadorId = useCallback((id: string) => {
    session.setPrestadorId(id);
    setState(s => ({ ...s, prestadorId: id }));
  }, []);

  const logoutPrestador = useCallback(() => {
    session.clearPrestadorSession();
    setState(s => ({ ...s, dniPrestador: null, prestadorId: null }));
  }, []);

  const loginAdmin = useCallback(() => {
    session.setAdminOk();
    setState(s => ({ ...s, adminOk: true }));
  }, []);

  const logoutAdmin = useCallback(() => {
    session.clearAdminOk();
    setState(s => ({ ...s, adminOk: false }));
  }, []);

  return (
    <SessionContext.Provider
      value={{
        ...state,
        loginCliente,
        logoutCliente,
        marcarReservado,
        loginPrestador,
        setPrestadorId,
        logoutPrestador,
        loginAdmin,
        logoutAdmin,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSessionContext debe usarse dentro de SessionProvider');
  return ctx;
}
