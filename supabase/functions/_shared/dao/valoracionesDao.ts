// ─────────────────────────────────────────────────────────────
// Acceso a datos: tabla valoraciones
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function insertar(db: SupabaseClient, input: {
  prestador_id: string;
  nombre_cliente: string;
  puntuacion: number;
  comentario: string;
}) {
  const { error } = await db.from('valoraciones').insert([{
    prestador_id: input.prestador_id,
    cliente_email: 'admin@mrsservicios.com',
    nombre_cliente: input.nombre_cliente,
    puntuacion: input.puntuacion,
    comentario: input.comentario,
  }]);
  if (error) throw error;
}

export async function eliminarPorPrestador(db: SupabaseClient, prestadorId: string) {
  return db.from('valoraciones').delete().eq('prestador_id', prestadorId);
}
