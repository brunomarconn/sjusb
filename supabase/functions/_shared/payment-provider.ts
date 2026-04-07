// ─────────────────────────────────────────────────────────────
// Interfaz desacoplada de pasarela de pago
// Implementar para MercadoPago, Stripe, etc.
// El resto de la app no depende de ninguna implementación concreta.
// ─────────────────────────────────────────────────────────────

export interface ItemPago {
  titulo: string;
  descripcion?: string;
  monto: number;        // En ARS (sin centavos multiplicados)
  cantidad?: number;    // Default 1
}

export interface CrearPagoInput {
  ordenId: string;
  item: ItemPago;
  clienteEmail?: string;
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
  webhookUrl: string;
}

export interface ResultadoPago {
  linkPago: string;      // URL donde el cliente paga
  preferenciaId: string; // ID interno de la preferencia en el proveedor
  metadata?: Record<string, unknown>;
}

export type EstadoPago = 'approved' | 'pending' | 'rejected' | 'cancelled' | 'refunded';

export interface PagoWebhook {
  tipo: string;
  pagoId: string;
  estado: EstadoPago;
  monto: number;
  referenciaExterna?: string;  // Debe coincidir con ordenId
  metadata?: Record<string, unknown>;
}

/** Contrato que debe cumplir cualquier pasarela de pago */
export interface PaymentProvider {
  /** Genera una preferencia/intención de pago y devuelve el link */
  crearPago(input: CrearPagoInput): Promise<ResultadoPago>;

  /** Procesa el body del webhook y extrae la información del pago */
  procesarWebhook(payload: unknown): Promise<PagoWebhook>;

  /** Consulta el estado actual de un pago por su ID */
  obtenerPago(pagoId: string): Promise<PagoWebhook>;
}

// ─────────────────────────────────────────────────────────────
// Factory: retorna el proveedor correcto según el modo
// ─────────────────────────────────────────────────────────────
export async function getPaymentProvider(): Promise<PaymentProvider> {
  const mode = Deno.env.get('PAYMENT_MODE') || 'mock';
  const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000';

  if (mode === 'mercadopago') {
    const token = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!token) throw new Error('Falta MERCADOPAGO_ACCESS_TOKEN');
    const { MercadoPagoProvider } = await import('./providers/mercadopago.ts');
    return new MercadoPagoProvider(token);
  }

  // Por defecto: mock (para desarrollo y testing)
  const { MockProvider } = await import('./providers/mock.ts');
  return new MockProvider(appUrl);
}
