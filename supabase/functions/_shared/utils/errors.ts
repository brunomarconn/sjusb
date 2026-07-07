// ─────────────────────────────────────────────────────────────
// Helpers para inspeccionar errores de Postgres/Supabase
// ─────────────────────────────────────────────────────────────

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof (error as Record<string, unknown>).message === 'string') {
    return (error as { message: string }).message;
  }
  return error instanceof Error ? error.message : 'Error inesperado';
}

/** true si el error es "la tabla no existe" (features opcionales aún no migradas) */
export function isMissingTableError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes('could not find the table') || message.includes('does not exist');
}
