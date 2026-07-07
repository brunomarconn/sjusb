// ─────────────────────────────────────────────────────────────
// Tokens de sesión: JWT autocontenido (HS256), expiran a las 24hs.
// Requiere la env var JWT_SECRET (igual que ADMIN_SECRET).
// ─────────────────────────────────────────────────────────────
import { create, verify, getNumericDate } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

export interface JwtClaims {
  sub: string;                     // dni
  rol: 'cliente' | 'prestador';
  prestador_id?: string;           // solo presente cuando rol === 'prestador'
  exp: number;
}

async function getKey(): Promise<CryptoKey> {
  const secret = Deno.env.get('JWT_SECRET');
  if (!secret) throw new Error('Falta JWT_SECRET');
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function emitirToken(claims: Omit<JwtClaims, 'exp'>): Promise<string> {
  const key = await getKey();
  return create(
    { alg: 'HS256', typ: 'JWT' },
    { ...claims, exp: getNumericDate(60 * 60 * 24) },
    key
  );
}

/** Devuelve los claims si el token es válido (firma + no vencido), o null si no. */
export async function verificarToken(token: string): Promise<JwtClaims | null> {
  try {
    const key = await getKey();
    return (await verify(token, key)) as JwtClaims;
  } catch {
    return null;
  }
}
