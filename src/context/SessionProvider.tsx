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
  clienteToken: string | null;
  reservados: string[];
  dniPrestador: string | null;
  prestadorId: string | null;
  prestadorToken: string | null;
  adminOk: boolean;
}

export interface SessionActions {
  loginCliente: (dni: string, token: string) => void;
  logoutCliente: () => void;
  marcarReservado: (prestadorId: string) => void;
  loginPrestador: (dni: string, token: string) => void;
  setPrestadorId: (id: string) => void;
  logoutPrestador: () => void;
  loginAdmin: () => void;
  logoutAdmin: () => void;
}

type SessionContextValue = SessionState & SessionActions;

const SessionContext = createContext<SessionContextValue | null>(null);

/** Sesión guardada pero con el token ya vencido: se descarta al cargar (auto-logout) */
function estadoInicial(): SessionState {
  const clienteToken = session.getClienteToken();
  const clienteVencido = session.tokenExpirado(clienteToken);
  if (clienteVencido) session.clearClienteDni();

  const prestadorToken = session.getPrestadorToken();
  const prestadorVencido = session.tokenExpirado(prestadorToken);
  if (prestadorVencido) session.clearPrestadorSession();

  return {
    clienteDni: clienteVencido ? null : session.getClienteDni(),
    clienteToken: clienteVencido ? null : clienteToken,
    reservados: session.getReservados(),
    dniPrestador: prestadorVencido ? null : session.getDniPrestador(),
    prestadorId: prestadorVencido ? null : session.getPrestadorId(),
    prestadorToken: prestadorVencido ? null : prestadorToken,
    adminOk: session.getAdminOk(),
  };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(estadoInicial);

  const loginCliente = useCallback((dni: string, token: string) => {
    session.setClienteDni(dni, token);
    setState(s => ({ ...s, clienteDni: dni, clienteToken: token, dniPrestador: null, prestadorId: null, prestadorToken: null }));
  }, []);

  const logoutCliente = useCallback(() => {
    session.clearClienteDni();
    setState(s => ({ ...s, clienteDni: null, clienteToken: null }));
  }, []);

  const marcarReservado = useCallback((prestadorId: string) => {
    session.addReservado(prestadorId);
    setState(s => ({ ...s, reservados: session.getReservados() }));
  }, []);

  const loginPrestador = useCallback((dni: string, token: string) => {
    session.setDniPrestador(dni, token);
    setState(s => ({ ...s, dniPrestador: dni, prestadorToken: token, clienteDni: null, clienteToken: null }));
  }, []);

  const setPrestadorId = useCallback((id: string) => {
    session.setPrestadorId(id);
    setState(s => ({ ...s, prestadorId: id }));
  }, []);

  const logoutPrestador = useCallback(() => {
    session.clearPrestadorSession();
    setState(s => ({ ...s, dniPrestador: null, prestadorId: null, prestadorToken: null }));
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
