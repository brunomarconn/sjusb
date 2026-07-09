// ─────────────────────────────────────────────────────────────
// API pública de reseñas
// ─────────────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

async function apiFetch<T>(body: unknown): Promise<T> {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/crear-resena`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error ?? `Error ${resp.status}`);
  return data as T;
}

export interface ContextoResena {
  prestador_nombre?: string;
  prestador_apellido?: string;
  prestador_categoria?: string;
  vecino_nombre: string;
  ya_enviada: boolean;
}

export const resenasApi = {
  async obtenerContexto(reviewToken: string): Promise<ContextoResena> {
    return apiFetch({ action: 'obtener', review_token: reviewToken });
  },

  async crearResena(reviewToken: string, rating: number, comment?: string): Promise<{ ok: true }> {
    return apiFetch({ action: 'crear', review_token: reviewToken, rating, comment });
  },

  /** "Valorar" desde el listado público, sin un trabajo/token puntual en mano. */
  async crearResenaManual(input: {
    prestador_id: string;
    nombre_cliente: string;
    cliente_email?: string;
    rating: number;
    comment?: string;
  }): Promise<{ ok: true }> {
    return apiFetch({ action: 'crear_manual', ...input });
  },
};
