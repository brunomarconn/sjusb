// ─────────────────────────────────────────────────────────────
// Acceso a datos: tabla mensajes
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function insertar(db: SupabaseClient, data: {
  conversacion_id: string;
  sender_tipo: string;
  sender_id: string;
  contenido: string;
  tipo: string;
}) {
  const { data: mensaje, error } = await db
    .from('mensajes')
    .insert(data)
    .select('id, conversacion_id, sender_tipo, sender_id, contenido, tipo, created_at')
    .single();
  if (error) throw error;
  return mensaje;
}

export async function listarPorConversacion(db: SupabaseClient, conversacionId: string) {
  const { data, error } = await db
    .from('mensajes')
    .select('id, conversacion_id, sender_tipo, sender_id, contenido, tipo, created_at')
    .eq('conversacion_id', conversacionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
