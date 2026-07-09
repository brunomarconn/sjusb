// ─────────────────────────────────────────────────────────────
// API pública de configuración del barrio (solo lectura, vía la
// vista v_config_publica — nunca expone la tabla base).
// ─────────────────────────────────────────────────────────────
import { supabase } from '../lib/supabase';
import type { ConfigPublica } from '../types/configBarrio';

export const configPublicaApi = {
  async obtener(): Promise<ConfigPublica | null> {
    const { data, error } = await supabase.from('v_config_publica').select('*').single();
    if (error) return null;
    return data as ConfigPublica;
  },
};
