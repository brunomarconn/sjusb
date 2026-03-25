
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Prestador {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  password: string;
  categoria: string;
  foto_url: string;
  descripcion: string;
  created_at: string;
}

export interface Valoracion {
  id: string;
  prestador_id: string;
  cliente_email: string;
  nombre_cliente: string;
  puntuacion: number;
  comentario: string;
  created_at: string;
}
