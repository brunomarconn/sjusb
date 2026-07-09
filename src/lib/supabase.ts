
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos canónicos: viven en src/types/*, re-exportados acá por compatibilidad
// con imports existentes (`import { supabase, type Prestador } from '../lib/supabase'`).
// Nota: a diferencia del tipo viejo, este NO incluye `password` — nunca debe
// seleccionarse esa columna desde el frontend.
export type { Prestador } from '../types/prestador';
export type { Valoracion } from '../types/resena';
