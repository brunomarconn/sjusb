// ─────────────────────────────────────────────────────────────
// API de autenticación: registro/login de cliente y prestador,
// perfil de cliente. Todas las llamadas van a Edge Functions.
// ─────────────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

function fnUrl(name: string): string {
  return `${SUPABASE_URL}/functions/v1/${name}`;
}

async function apiFetch<T>(url: string, options: RequestInit): Promise<T> {
  const resp = await fetch(url, options);
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error ?? `Error ${resp.status}`);
  return data as T;
}

export const authApi = {
  async registrarCliente(input: {
    nombre: string;
    apellido: string;
    dni: string;
    telefono: string;
  }): Promise<{ token: string; dni: string }> {
    return apiFetch(fnUrl('auth-registro'), {
      method: 'POST',
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  },

  async loginCliente(dni: string): Promise<{ token: string; dni: string; puntos: number; tiene_promocion: boolean }> {
    return apiFetch(fnUrl('auth-login'), {
      method: 'POST',
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ rol: 'cliente', dni, password: dni }),
    });
  },

  async loginPrestador(dni: string): Promise<{ token: string; dni: string; prestador_id: string }> {
    return apiFetch(fnUrl('auth-login'), {
      method: 'POST',
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ rol: 'prestador', dni, password: dni }),
    });
  },

  async obtenerPerfilCliente(token: string): Promise<{ dni: string; puntos: number; tiene_promocion: boolean }> {
    return apiFetch(fnUrl('obtener-perfil-cliente'), {
      method: 'GET',
      headers: { apikey: ANON_KEY, authorization: `Bearer ${token}` },
    });
  },
};
