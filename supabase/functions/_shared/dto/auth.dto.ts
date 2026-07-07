// ─────────────────────────────────────────────────────────────
// DTOs para auth-registro / auth-login
// ─────────────────────────────────────────────────────────────

export interface RegistroClienteInput {
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
}

export interface LoginInput {
  rol: 'cliente' | 'prestador';
  dni: string;
  password: string;
}
